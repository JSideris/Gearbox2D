import Example from "../engine-wrapper.js";
import gearbox, { NAV_MODE, NAV_STATUS } from "gearbox2d";
import type { Body, Nav, World } from "gearbox2d";

// ---------------------------------------------------------------------------------------------------------
// Nav Arena: many bots planning with the native nav grid (World.createNav + one batched findPaths per tick).
// Walls and sliding gates are tracked from the physics world; drifting crates are fed in as moving obstacles;
// bots dodge each other with a batched queryRadius neighbour pass.
// ---------------------------------------------------------------------------------------------------------

const W = 32; // arena size (world units)
const H = 20;
const CELL = 0.25;
const CLUSTER = 16; // HPA cluster size in cells (4 x 4 units)
const BOT_R = 0.3;
const CLEARANCE = 0.4; // bot radius + margin: walls are inflated by this on the grid
const BOT_SPEED = 2.4;
const BUDGET = 6000; // A* node expansions per tick, shared by every queued request
const MIN_SLICE = 150;
const CRATE_SIZE = 0.8;
const CRATE_R = (CRATE_SIZE / 2) * Math.SQRT2; // disc fed to the nav for a crate
const NEIGHBOUR_R = 2.2;

const CAT_WALL = 1;
const CAT_GATE = 2;
const CAT_CRATE = 4;
const CAT_BOT = 8;

const BOT_COLORS = [
	"#22d3ee",
	"#f472b6",
	"#a3e635",
	"#facc15",
	"#fb923c",
	"#c084fc",
	"#34d399",
	"#f87171",
	"#60a5fa",
	"#e879f9",
	"#fde047",
	"#4ade80",
	"#38bdf8",
	"#fda4af",
];

type Vec = { x: number; y: number };
type Bot = {
	body: Body;
	color: string;
	goal: Vec;
	path: Vec[];
	idx: number;
	reqId: number;
	waiting: boolean;
	sinceReplan: number;
	replanEvery: number;
	bestDist: number;
	sinceProgress: number;
	stuckCount: number;
	sinceArrival: number;
	arrivals: number;
	heading: number;
};
type Crate = { body: Body; wander: number };
type Gate = {
	body: Body;
	x: number;
	closedY: number;
	openY: number;
	y: number;
	w: number;
	h: number;
	open: boolean;
	timer: number;
};
type WallRect = { x: number; y: number; w: number; h: number; angle: number };
type Pillar = { x: number; y: number; r: number };

/** Live state, exported so scripts/nav-arena-smoke.mjs can check the simulation headlessly. */
export const navArenaState = {
	seed: 0,
	nav: null as Nav | null,
	bots: [] as Bot[],
	crates: [] as Crate[],
	gates: [] as Gate[],
	walls: [] as WallRect[],
	pillars: [] as Pillar[],
	free: [] as number[], // cells of the largest connected free region (spawns and goals come from here)
	reqToBot: new Map<number, Bot>(),
	nextReq: 1,
	tick: 0,
	// stats
	totalArrivals: 0,
	totalReplans: 0,
	totalNoPath: 0,
	batchMs: 0, // smoothed ms per findPaths call
	batchMaxMs: 0, // worst in the current second
	lastSecond: { replans: 0, maxMs: 0, nodes: 0, ticks: 0, corridor: 0, grid: 0 },
	shown: { replans: 0, maxMs: 0, nodes: 0, corridor: 0, grid: 0 },
	view: { grid: false, clusters: false, paths: true },
	dom: null as null | { overlay: HTMLCanvasElement; hud: HTMLDivElement; stats: HTMLDivElement },
	cellImage: null as null | { canvas: HTMLCanvasElement; version: number },
};
const S = navArenaState;

// Seeded RNG so a layout can be reproduced (set (globalThis as any).NAV_ARENA_SEED before init).
let rngState = 1;
const rand = () => {
	rngState = (rngState * 1664525 + 1013904223) >>> 0;
	return rngState / 4294967296;
};
const range = (a: number, b: number) => a + (b - a) * rand();

const cellCenter = (nav: Nav, i: number): Vec => ({
	x: nav.bounds.minX + ((i % nav.cols) + 0.5) * nav.cell,
	y: nav.bounds.minY + (Math.floor(i / nav.cols) + 0.5) * nav.cell,
});

function addWall(world: World, x: number, y: number, w: number, h: number, angle = 0) {
	S.walls.push({ x, y, w, h, angle });
	world.createBody({
		type: gearbox.bodyTypes.FIXED_OBJECT,
		x,
		y,
		r: angle,
		color: "#475569",
		shape: gearbox.shapes.BOX,
		width: w,
		height: h,
		categoryBits: CAT_WALL,
	});
}

function addPillar(world: World, x: number, y: number, r: number) {
	S.pillars.push({ x, y, r });
	world.createBody({
		type: gearbox.bodyTypes.FIXED_OBJECT,
		x,
		y,
		color: "#64748b",
		shape: gearbox.shapes.CIRCLE,
		radius: r,
		categoryBits: CAT_WALL,
	});
}

// A braided recursive-backtracker maze in the top-left room.
function buildMaze(world: World, ox: number, oy: number, cols: number, rows: number, size: number) {
	const t = 0.2;
	const right = new Array(cols * rows).fill(true); // wall on the east side of cell
	const down = new Array(cols * rows).fill(true); // wall on the south side of cell
	const seen = new Array(cols * rows).fill(false);
	const stack = [0];
	seen[0] = true;
	while (stack.length) {
		const c = stack[stack.length - 1];
		const cx = c % cols,
			cy = Math.floor(c / cols);
		const opts: number[] = [];
		if (cx > 0 && !seen[c - 1]) opts.push(c - 1);
		if (cx < cols - 1 && !seen[c + 1]) opts.push(c + 1);
		if (cy > 0 && !seen[c - cols]) opts.push(c - cols);
		if (cy < rows - 1 && !seen[c + cols]) opts.push(c + cols);
		if (!opts.length) {
			stack.pop();
			continue;
		}
		const n = opts[Math.floor(rand() * opts.length)];
		if (n === c + 1) right[c] = false;
		else if (n === c - 1) right[n] = false;
		else if (n === c + cols) down[c] = false;
		else down[n] = false;
		seen[n] = true;
		stack.push(n);
	}
	// braid: knock out a few extra walls so there are loops (and more than one way through)
	for (let k = 0; k < 4; k++) {
		const c = Math.floor(rand() * cols * rows);
		if (c % cols < cols - 1) right[c] = false;
		else if (Math.floor(c / cols) < rows - 1) down[c] = false;
	}
	for (let cy = 0; cy < rows; cy++) {
		for (let cx = 0; cx < cols; cx++) {
			const c = cy * cols + cx;
			const x0 = ox + cx * size,
				y0 = oy + cy * size;
			// east walls (the maze's own east border keeps two openings)
			const eastBorder = cx === cols - 1;
			if (right[c] && !(eastBorder && (cy === 1 || cy === rows - 1)))
				addWall(world, x0 + size, y0 + size / 2, t, size + t);
			// south walls (south border keeps two openings)
			const southBorder = cy === rows - 1;
			if (down[c] && !(southBorder && (cx === 1 || cx === cols - 2)))
				addWall(world, x0 + size / 2, y0 + size, size + t, t);
		}
	}
}

function buildArena(world: World) {
	// border
	addWall(world, W / 2, 0.15, W, 0.3);
	addWall(world, W / 2, H - 0.15, W, 0.3);
	addWall(world, 0.15, H / 2, 0.3, H);
	addWall(world, W - 0.15, H / 2, 0.3, H);

	// maze room (top left): 5 x 4 cells of 2.2 units
	buildMaze(world, 0.3, 0.3, 5, 4, 2.2);

	// the long divider at x = 21 with three gaps: two sliding gates and one that is always open
	const dx = 21,
		t = 0.3;
	const gaps = [
		[2.6, 4.8],
		[9.0, 11.0],
		[15.2, 17.4],
	];
	let y = 0.3;
	for (const [g0, g1] of gaps) {
		addWall(world, dx, (y + g0) / 2, t, g0 - y);
		y = g1;
	}
	addWall(world, dx, (y + H - 0.3) / 2, t, H - 0.3 - y);
	for (const gi of [0, 2]) {
		const [g0, g1] = gaps[gi];
		const h = g1 - g0 + 0.1;
		const gy = (g0 + g1) / 2;
		const body = world.createBody({
			type: gearbox.bodyTypes.KINEMATIC_OBJECT,
			x: dx,
			y: gy,
			color: "#f43f5e",
			shape: gearbox.shapes.BOX,
			width: t * 0.8,
			height: h,
			categoryBits: CAT_GATE,
		});
		// a gate opens by sliding along the divider into the wall above it (fixed and kinematic don't collide)
		S.gates.push({
			body,
			x: dx,
			closedY: gy,
			openY: gy - h,
			y: gy,
			w: t * 0.8,
			h,
			open: gi === 2,
			timer: 3 + gi * 2.5,
		});
		if (gi === 2) body.y = gy - h;
	}

	// right room: scattered rotated blocks
	const blocks: { x: number; y: number; s: number }[] = [];
	for (let tries = 0; blocks.length < 9 && tries < 400; tries++) {
		const s = range(0.9, 2.4);
		const x = range(22.8, W - 1.8),
			yy = range(1.8, H - 1.8);
		if (blocks.some((b) => Math.hypot(b.x - x, b.y - yy) < (b.s + s) / 2 + 1.6)) continue;
		blocks.push({ x, y: yy, s });
		addWall(world, x, yy, s, range(0.5, 1) * s, range(0, Math.PI));
	}

	// bottom left: random walls (straight and L-shaped) and pillars
	const segs: { x: number; y: number }[] = [];
	for (let tries = 0; segs.length < 6 && tries < 400; tries++) {
		const x = range(2.5, 18.5),
			yy = range(11.5, H - 2);
		if (segs.some((s) => Math.hypot(s.x - x, s.y - yy) < 3.6)) continue;
		segs.push({ x, y: yy });
		const len = range(2, 3.8);
		if (rand() < 0.5) {
			addWall(world, x, yy, len, 0.25);
			if (rand() < 0.6) addWall(world, x + len / 2, yy + (rand() < 0.5 ? 1 : -1) * 0.75, 0.25, 1.75);
		} else {
			addWall(world, x, yy, 0.25, len);
			if (rand() < 0.6) addWall(world, x + (rand() < 0.5 ? 1 : -1) * 0.75, yy + len / 2, 1.75, 0.25);
		}
	}
	for (let k = 0, tries = 0; k < 5 && tries < 200; tries++) {
		const x = range(2, 19),
			yy = range(11, H - 1.5);
		if (segs.some((s) => Math.hypot(s.x - x, s.y - yy) < 2.4)) continue;
		segs.push({ x, y: yy });
		addPillar(world, x, yy, range(0.3, 0.55));
		k++;
	}
}

// Largest 4-connected component of free cells: goals and spawns come from here, so every goal is reachable
// at least through the gate that never closes.
function freeComponent(nav: Nav): number[] {
	const blocked = nav.blocked,
		n = blocked.length,
		cols = nav.cols;
	const comp = new Int32Array(n).fill(-1);
	let best: number[] = [];
	const q = new Int32Array(n);
	for (let s = 0; s < n; s++) {
		if (blocked[s] || comp[s] >= 0) continue;
		let head = 0,
			tail = 0;
		q[tail++] = s;
		comp[s] = s;
		const cells: number[] = [];
		while (head < tail) {
			const c = q[head++];
			cells.push(c);
			const cx = c % cols;
			const nb = [cx > 0 ? c - 1 : -1, cx < cols - 1 ? c + 1 : -1, c - cols, c + cols];
			for (const m of nb) {
				if (m < 0 || m >= n || blocked[m] || comp[m] >= 0) continue;
				comp[m] = s;
				q[tail++] = m;
			}
		}
		if (cells.length > best.length) best = cells;
	}
	return best;
}

function randomFreePoint(nav: Nav, awayFrom?: Vec, minDist = 0): Vec {
	for (let k = 0; k < 60; k++) {
		const p = cellCenter(nav, S.free[Math.floor(rand() * S.free.length)]);
		if (S.crates.some((c) => Math.hypot(c.body.x - p.x, c.body.y - p.y) < CRATE_R + CLEARANCE + 0.3)) continue;
		if (S.bots.some((b) => Math.hypot(b.goal.x - p.x, b.goal.y - p.y) < 1.5)) continue;
		if (!awayFrom || Math.hypot(p.x - awayFrom.x, p.y - awayFrom.y) >= minDist) return p;
	}
	return cellCenter(nav, S.free[Math.floor(rand() * S.free.length)]);
}

function requestPath(nav: Nav, bot: Bot) {
	if (bot.reqId) {
		nav.cancel(bot.reqId); // a newer plan replaces one still being searched
		S.reqToBot.delete(bot.reqId);
	}
	const id = S.nextReq++;
	bot.reqId = id;
	bot.waiting = true;
	bot.sinceReplan = 0;
	S.reqToBot.set(id, bot);
	const from = { x: bot.body.x, y: bot.body.y };
	// Long trips go through the hierarchy (HPA corridor: walls first, then moving obstacles along the route);
	// short hops use plain grid A*.
	const far = Math.hypot(bot.goal.x - from.x, bot.goal.y - from.y) > 6;
	nav.request(id, from, bot.goal, { mode: far ? NAV_MODE.HPA_CORRIDOR : NAV_MODE.GRID });
	if (far) S.lastSecond.corridor++;
	else S.lastSecond.grid++;
}

function newGoal(nav: Nav, bot: Bot) {
	bot.goal = randomFreePoint(nav, { x: bot.body.x, y: bot.body.y }, 9);
	bot.path = [];
	bot.stuckCount = 0;
	bot.sinceArrival = 0;
	requestPath(nav, bot);
}

const distPointSeg = (p: Vec, a: Vec, b: Vec) => {
	const dx = b.x - a.x,
		dy = b.y - a.y;
	const l2 = dx * dx + dy * dy;
	const t = l2 > 0 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2)) : 0;
	return Math.hypot(a.x + dx * t - p.x, a.y + dy * t - p.y);
};

// Does a crate now sit on the next few metres of this bot's path?
function pathBlocked(bot: Bot): boolean {
	let a: Vec = { x: bot.body.x, y: bot.body.y };
	let ahead = 0;
	for (let i = bot.idx; i < bot.path.length && ahead < 5; i++) {
		const b = bot.path[i];
		for (const c of S.crates) {
			if (distPointSeg({ x: c.body.x, y: c.body.y }, a, b) < CRATE_R + BOT_R * 0.6) return true;
		}
		// a gate that has slid across the route (sampled along the segment against the gate's spine)
		for (const g of S.gates) {
			const top = { x: g.x, y: g.body.y - g.h / 2 },
				bottom = { x: g.x, y: g.body.y + g.h / 2 };
			const len = Math.hypot(b.x - a.x, b.y - a.y),
				n = Math.max(1, Math.ceil(len / 0.1));
			for (let k = 0; k <= n; k++) {
				const q = { x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n };
				if (distPointSeg(q, top, bottom) < g.w / 2 + BOT_R + 0.05) return true;
			}
		}
		ahead += Math.hypot(b.x - a.x, b.y - a.y);
		a = b;
	}
	return false;
}

function setupDom() {
	if (typeof document === "undefined") return;
	const container = document.getElementById("canvas-container");
	if (!container) return;
	document.getElementById("nav-arena-overlay")?.remove();
	document.getElementById("nav-arena-hud")?.remove();
	const overlay = document.createElement("canvas");
	overlay.id = "nav-arena-overlay";
	overlay.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:2;";
	container.appendChild(overlay);
	const hud = document.createElement("div");
	hud.id = "nav-arena-hud";
	hud.style.cssText =
		"position:absolute;bottom:10px;left:10px;z-index:3;padding:8px 10px;border-radius:6px;" +
		"background:rgba(2,6,23,0.78);border:1px solid rgba(148,163,184,0.35);color:#e2e8f0;" +
		"font:12px/1.45 ui-monospace,Menlo,Consolas,monospace;min-width:230px;";
	const stats = document.createElement("div");
	hud.appendChild(stats);
	const row = document.createElement("div");
	row.style.cssText = "margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;";
	const toggles: [keyof typeof S.view, string][] = [
		["paths", "Paths"],
		["grid", "Grid"],
		["clusters", "Clusters"],
	];
	for (const [key, label] of toggles) {
		const b = document.createElement("button");
		const paint = () => {
			b.style.cssText =
				"cursor:pointer;font:11px ui-monospace,monospace;padding:2px 8px;border-radius:4px;" +
				`border:1px solid #64748b;color:#e2e8f0;background:${S.view[key] ? "#0e7490" : "transparent"};`;
		};
		b.textContent = label;
		b.dataset.navArenaToggle = key;
		paint();
		b.addEventListener("click", () => {
			S.view[key] = !S.view[key];
			paint();
		});
		row.appendChild(b);
	}
	hud.appendChild(row);
	container.appendChild(hud);
	S.dom = { overlay, hud, stats };
}

function updateHud() {
	if (!S.dom) return;
	const nav = S.nav;
	const h = nav ? nav.hierarchyStats : { nodes: 0, edges: 0 };
	const gates = S.gates.map((g) => (g.open ? "open" : "shut")).join(" / ");
	S.dom.stats.innerHTML = [
		`<b style="color:#22d3ee">Native nav</b> · ${S.bots.length} bots · ${nav?.cols}×${nav?.rows} cells`,
		`findPaths: <b>${S.batchMs.toFixed(3)} ms</b> avg · ${S.shown.maxMs.toFixed(2)} ms max`,
		`replans/s: <b>${S.shown.replans}</b> (${S.shown.corridor} corridor, ${S.shown.grid} grid)`,
		`nodes/s: ${S.shown.nodes} · queued: ${nav?.queued ?? 0}`,
		`moving obstacles: ${S.crates.length} crates · gates: ${gates}`,
		`HPA: ${h.nodes} nodes / ${h.edges} edges · arrivals: ${S.totalArrivals}`,
	].join("<br>");
}

function cellBitmap(nav: Nav): HTMLCanvasElement {
	// static cells only change when a gate moves; repaint at most a few times a second
	if (S.cellImage && S.tick - S.cellImage.version < 15) return S.cellImage.canvas;
	const c = S.cellImage?.canvas ?? document.createElement("canvas");
	c.width = nav.cols;
	c.height = nav.rows;
	const ctx = c.getContext("2d")!;
	const img = ctx.createImageData(nav.cols, nav.rows);
	const blocked = nav.blocked;
	for (let i = 0; i < blocked.length; i++) {
		const o = i * 4;
		if (blocked[i]) {
			img.data[o] = 248;
			img.data[o + 1] = 113;
			img.data[o + 2] = 113;
			img.data[o + 3] = 70;
		} else {
			img.data[o] = 56;
			img.data[o + 1] = 189;
			img.data[o + 2] = 248;
			img.data[o + 3] = 14;
		}
	}
	ctx.putImageData(img, 0, 0);
	S.cellImage = { canvas: c, version: S.tick };
	return c;
}

function drawOverlay() {
	if (!S.dom || !S.nav) return;
	const { overlay } = S.dom;
	const base = gearbox.debug.canvas;
	if (!base) return;
	if (overlay.width !== base.width || overlay.height !== base.height) {
		overlay.width = base.width;
		overlay.height = base.height;
	}
	const ctx = overlay.getContext("2d")!;
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.clearRect(0, 0, overlay.width, overlay.height);
	const k = gearbox.debug.zoom * 100;
	ctx.setTransform(k, 0, 0, k, gearbox.debug.offsetX, gearbox.debug.offsetY);
	const px = 1 / k; // one screen pixel in world units
	const nav = S.nav;
	const t = performance.now() / 1000;

	if (S.view.grid) {
		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(cellBitmap(nav), nav.bounds.minX, nav.bounds.minY, nav.cols * nav.cell, nav.rows * nav.cell);
		// moving obstacles as the planner sees them (crate disc + clearance)
		ctx.setLineDash([4 * px, 4 * px]);
		ctx.strokeStyle = "rgba(251,191,36,0.7)";
		ctx.lineWidth = px;
		for (const c of S.crates) {
			ctx.beginPath();
			ctx.arc(c.body.x, c.body.y, CRATE_R + CLEARANCE, 0, Math.PI * 2);
			ctx.stroke();
		}
		ctx.setLineDash([]);
	}
	if (S.view.clusters) {
		const step = CLUSTER * nav.cell;
		ctx.strokeStyle = "rgba(167,139,250,0.45)";
		ctx.lineWidth = 1.5 * px;
		ctx.beginPath();
		for (let x = nav.bounds.minX; x <= nav.bounds.maxX + 1e-6; x += step) {
			ctx.moveTo(x, nav.bounds.minY);
			ctx.lineTo(x, nav.bounds.maxY);
		}
		for (let y = nav.bounds.minY; y <= nav.bounds.maxY + 1e-6; y += step) {
			ctx.moveTo(nav.bounds.minX, y);
			ctx.lineTo(nav.bounds.maxX, y);
		}
		ctx.stroke();
	}

	// walls, pillars, gates, crates (filled under the debug outlines' colours)
	ctx.fillStyle = "rgba(71,85,105,0.85)";
	for (const w of S.walls) {
		ctx.save();
		ctx.translate(w.x, w.y);
		ctx.rotate(w.angle);
		ctx.fillRect(-w.w / 2, -w.h / 2, w.w, w.h);
		ctx.restore();
	}
	for (const p of S.pillars) {
		ctx.beginPath();
		ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
		ctx.fill();
	}
	for (const g of S.gates) {
		ctx.fillStyle = g.open ? "rgba(74,222,128,0.55)" : "rgba(244,63,94,0.75)";
		ctx.fillRect(g.body.x - g.w / 2, g.body.y - g.h / 2, g.w, g.h);
	}
	for (const c of S.crates) {
		ctx.save();
		ctx.translate(c.body.x, c.body.y);
		ctx.rotate(c.body.r);
		ctx.fillStyle = "rgba(217,119,6,0.55)";
		ctx.fillRect(-CRATE_SIZE / 2, -CRATE_SIZE / 2, CRATE_SIZE, CRATE_SIZE);
		ctx.strokeStyle = "rgba(253,230,138,0.6)";
		ctx.lineWidth = 1.5 * px;
		ctx.beginPath();
		ctx.moveTo(-CRATE_SIZE / 2, -CRATE_SIZE / 2);
		ctx.lineTo(CRATE_SIZE / 2, CRATE_SIZE / 2);
		ctx.moveTo(CRATE_SIZE / 2, -CRATE_SIZE / 2);
		ctx.lineTo(-CRATE_SIZE / 2, CRATE_SIZE / 2);
		ctx.stroke();
		ctx.restore();
	}

	for (const bot of S.bots) {
		const b = bot.body;
		// planned path, faint
		if (S.view.paths && bot.path.length) {
			ctx.strokeStyle = bot.color;
			ctx.globalAlpha = 0.38;
			ctx.lineWidth = 2 * px;
			ctx.setLineDash([6 * px, 5 * px]);
			ctx.lineDashOffset = -t * 30 * px;
			ctx.beginPath();
			ctx.moveTo(b.x, b.y);
			for (let i = bot.idx; i < bot.path.length; i++) ctx.lineTo(bot.path[i].x, bot.path[i].y);
			ctx.stroke();
			ctx.setLineDash([]);
			ctx.globalAlpha = 1;
		}
		// goal marker
		const pulse = 0.22 + 0.06 * Math.sin(t * 4 + bot.reqId);
		ctx.strokeStyle = bot.color;
		ctx.lineWidth = 2 * px;
		ctx.globalAlpha = 0.9;
		ctx.beginPath();
		ctx.arc(bot.goal.x, bot.goal.y, pulse, 0, Math.PI * 2);
		ctx.moveTo(bot.goal.x - 0.12, bot.goal.y);
		ctx.lineTo(bot.goal.x + 0.12, bot.goal.y);
		ctx.moveTo(bot.goal.x, bot.goal.y - 0.12);
		ctx.lineTo(bot.goal.x, bot.goal.y + 0.12);
		ctx.stroke();
		ctx.globalAlpha = 1;
		// bot
		ctx.fillStyle = bot.color;
		ctx.shadowColor = bot.color;
		ctx.shadowBlur = 12;
		ctx.beginPath();
		ctx.arc(b.x, b.y, BOT_R, 0, Math.PI * 2);
		ctx.fill();
		ctx.shadowBlur = 0;
		ctx.strokeStyle = "rgba(2,6,23,0.9)";
		ctx.lineWidth = 3 * px;
		ctx.beginPath();
		ctx.moveTo(b.x, b.y);
		ctx.lineTo(b.x + Math.cos(bot.heading) * BOT_R * 0.9, b.y + Math.sin(bot.heading) * BOT_R * 0.9);
		ctx.stroke();
		if (bot.waiting) {
			ctx.strokeStyle = "rgba(226,232,240,0.8)";
			ctx.lineWidth = 1.5 * px;
			ctx.beginPath();
			ctx.arc(b.x, b.y, BOT_R + 0.08, t * 6, t * 6 + Math.PI);
			ctx.stroke();
		}
	}
}

export const navArenaExample = new Example({
	name: "Nav Arena",
	key: "nav-arena",
	description: [
		"Twelve bots race between random goals across a maze, a field of rotated blocks and a room of random walls, all planned by the **native nav grid** (`world.createNav`). Every bot that needs a path queues a request, and one `world.findPaths(budget)` call per tick runs them all inside WASM.",
		"### What it shows",
		"- **Tracked static obstacles**: walls, pillars and the two red sliding **gates** are ordinary physics bodies. `nav.track(mask)` keeps their cells up to date, and when a gate moves only the touched HPA clusters are rebuilt.",
		"- **HPA corridor**: long trips use `NAV_MODE.HPA_CORRIDOR` (hierarchy over the walls, then grid A* around moving obstacles inside the route's clusters). Short hops use plain grid A*.",
		"- **Moving obstacles**: the orange crates drift and get shoved by bots. Their positions go to `nav.setDynamicObstacles()` every tick, and a bot replans when a crate lands on its path.",
		"- **Time-sliced batches**: all requests share a budget of 6000 node expansions per tick. A long search that runs out continues next tick, so frame time stays flat.",
		"- **Bot avoidance**: one `world.queryRadiusBatch()` call per tick finds every bot's neighbours, and each bot steers around the ones it is about to hit.",
		"### HUD",
		"The overlay shows ms per `findPaths` batch, replans per second, and the hierarchy size. **Paths** shows each bot's planned route, **Grid** shows the blocked cells (walls inflated by the bot clearance) and the crate discs as the planner sees them, and **Clusters** shows the HPA cluster borders. Press **Reset** for a new layout.",
	].join("\n\n"),
	onInit: (world) => {
		world.clear();
		world.setGravity(0, 0);
		gearbox.debug.showAabbs = false;
		gearbox.debug.showForceVectors = false;
		gearbox.debug.showImpulseVectors = false;
		const g = globalThis as any;
		S.seed = typeof g.NAV_ARENA_SEED === "number" ? g.NAV_ARENA_SEED : (Math.random() * 1e9) >>> 0;
		rngState = S.seed || 1;
		S.bots = [];
		S.crates = [];
		S.gates = [];
		S.walls = [];
		S.pillars = [];
		S.reqToBot.clear();
		S.nextReq = 1;
		S.tick = 0;
		S.totalArrivals = S.totalReplans = S.totalNoPath = 0;
		S.batchMs = S.batchMaxMs = 0;
		S.lastSecond = { replans: 0, maxMs: 0, nodes: 0, ticks: 0, corridor: 0, grid: 0 };
		S.shown = { replans: 0, maxMs: 0, nodes: 0, corridor: 0, grid: 0 };
		S.cellImage = null;

		// 1. The grid. Walls and gates are tracked straight from the physics world.
		const nav = world.createNav(
			{ minX: 0, minY: 0, maxX: W, maxY: H },
			{ cell: CELL, clearance: CLEARANCE, rasterize: "touching" },
		);
		nav.track(CAT_WALL | CAT_GATE);
		S.nav = nav;
		buildArena(world);
		nav.syncStatic(); // rasterise the tracked bodies now (findPaths would do it on the first call)
		nav.buildHierarchy({ cluster: CLUSTER });
		S.free = freeComponent(nav);

		// 2. Crates: dynamic boxes that drift around; the planner gets them as moving discs.
		for (let k = 0; k < 8; k++) {
			const p = randomFreePoint(nav);
			const body = world.createBody({
				x: p.x,
				y: p.y,
				r: range(0, Math.PI),
				mass: 1.5,
				linearDamping: 1.2,
				angularDamping: 2,
				canSleep: false,
				color: "#f59e0b",
				shape: gearbox.shapes.BOX,
				width: CRATE_SIZE,
				height: CRATE_SIZE,
				categoryBits: CAT_CRATE,
				sFriction: 0.2,
				kFriction: 0.15,
			});
			S.crates.push({ body, wander: range(0, Math.PI * 2) });
		}

		// 3. Bots.
		for (let k = 0; k < 12; k++) {
			let p = randomFreePoint(nav);
			for (
				let tries = 0;
				tries < 40 && S.bots.some((b) => Math.hypot(b.body.x - p.x, b.body.y - p.y) < 1.2);
				tries++
			)
				p = randomFreePoint(nav);
			const color = BOT_COLORS[k % BOT_COLORS.length];
			const body = world.createBody({
				x: p.x,
				y: p.y,
				mass: 1,
				linearDamping: 0,
				canSleep: false,
				color,
				shape: gearbox.shapes.CIRCLE,
				radius: BOT_R,
				categoryBits: CAT_BOT,
				restitution: 0,
				sFriction: 0.1,
				kFriction: 0.05,
			});
			const bot: Bot = {
				body,
				color,
				goal: p,
				path: [],
				idx: 0,
				reqId: 0,
				waiting: false,
				sinceReplan: 0,
				replanEvery: range(3.5, 5),
				bestDist: Infinity,
				sinceProgress: 0,
				stuckCount: 0,
				sinceArrival: 0,
				arrivals: 0,
				heading: 0,
			};
			S.bots.push(bot);
			newGoal(nav, bot);
		}

		// Fit the whole arena in the view.
		const canvas = gearbox.debug.canvas;
		if (canvas) {
			gearbox.debug.zoom = Math.min(canvas.width / (W * 100), canvas.height / (H * 100)) * 0.96;
			gearbox.debug.centerCamera(W / 2, H / 2);
		}
		setupDom();
		updateHud();
	},
	onTick: (world, dt) => {
		const nav = S.nav;
		if (!nav) return;
		S.tick++;

		// Gates: slide open or shut every few seconds. They are kinematic, so the step moves them and the
		// tracked cells (and the HPA clusters they touch) update inside the next findPaths.
		let gateMoved = false;
		for (const g of S.gates) {
			g.timer -= dt;
			if (g.timer <= 0) {
				g.open = !g.open;
				g.timer = range(6, 9);
			}
			const target = g.open ? g.openY : g.closedY;
			const d = target - g.body.y;
			let v = Math.abs(d) < 0.02 ? 0 : Math.sign(d) * Math.min(1.5, Math.abs(d) / dt);
			// a closing gate waits while anything stands in the part of the doorway it is about to sweep
			// (a box query over that strip, no scan of the bodies)
			if (v > 0) {
				const front = g.body.y + g.h / 2;
				const inWay = world.queryAABB(g.x - 0.5, front - 0.1, g.x + 0.5, g.closedY + g.h / 2, {
					mask: CAT_BOT | CAT_CRATE,
				});
				if (inWay.length) v = 0;
			}
			if ((v === 0) !== (g.body.vy === 0)) gateMoved = true; // started or stopped moving: everyone replans
			g.body.vy = v;
			g.body.vx = 0;
		}

		// Crates drift on a slow random walk.
		for (const c of S.crates) {
			c.wander += range(-0.5, 0.5) * dt * 4;
			// pinned against a wall: turn around instead of piling up in the corners
			if (c.body.vx * c.body.vx + c.body.vy * c.body.vy < 0.01 && rand() < 0.02) c.wander += Math.PI;
			c.body.applyForce(Math.cos(c.wander) * 1.4, Math.sin(c.wander) * 1.4);
		}
		nav.setDynamicObstacles(S.crates.map((c) => ({ x: c.body.x, y: c.body.y, r: CRATE_R })));

		// Neighbours of every bot in one WASM call.
		const centers: number[] = [];
		for (const bot of S.bots) centers.push(bot.body.x, bot.body.y, NEIGHBOUR_R);
		const neighbours = world.queryRadiusBatch(
			centers,
			S.bots.map((b) => b.body),
			{ mask: CAT_BOT | CAT_CRATE },
		);

		for (let i = 0; i < S.bots.length; i++) {
			const bot = S.bots[i];
			const b = bot.body;
			bot.sinceReplan += dt;
			bot.sinceArrival += dt;

			// arrived?
			const toGoal = Math.hypot(bot.goal.x - b.x, bot.goal.y - b.y);
			if (toGoal < 0.35) {
				bot.arrivals++;
				S.totalArrivals++;
				newGoal(nav, bot);
			} else if (!bot.waiting) {
				if (bot.sinceReplan > bot.replanEvery) requestPath(nav, bot);
				else if ((S.tick + i) % 4 === 0 && bot.sinceReplan > 0.25 && pathBlocked(bot)) requestPath(nav, bot);
				else if (gateMoved) requestPath(nav, bot);
			}

			// follow the path
			let desX = 0,
				desY = 0;
			if (bot.path.length) {
				while (bot.idx < bot.path.length - 1) {
					const p = bot.path[bot.idx];
					if (Math.hypot(p.x - b.x, p.y - b.y) > 0.3) break;
					bot.idx++;
				}
				const p = bot.path[Math.min(bot.idx, bot.path.length - 1)];
				const dx = p.x - b.x,
					dy = p.y - b.y,
					d = Math.hypot(dx, dy);
				const speed = bot.idx >= bot.path.length - 1 ? Math.min(BOT_SPEED, 1 + toGoal * 2) : BOT_SPEED;
				if (d > 1e-6) {
					desX = (dx / d) * speed;
					desY = (dy / d) * speed;
				}
				// progress / stuck detection on the current waypoint
				if (d < bot.bestDist - 0.15) {
					bot.bestDist = d;
					bot.sinceProgress = 0;
				} else bot.sinceProgress += dt;
				if (bot.sinceProgress > 1.5 && !bot.waiting) {
					bot.sinceProgress = 0;
					bot.bestDist = Infinity;
					if (toGoal < 1.2) {
						// jammed right next to the goal (usually by another bot): close enough
						bot.arrivals++;
						S.totalArrivals++;
						newGoal(nav, bot);
					} else if (++bot.stuckCount >= 3) newGoal(nav, bot);
					else requestPath(nav, bot);
				}
			}

			// avoid other bots and crates: steer away from where each neighbour will be at closest approach
			let avX = 0,
				avY = 0;
			for (const o of neighbours[i]) {
				const crate = (o.fixtures[0]?.categoryBits ?? 0) === CAT_CRATE;
				const rr = BOT_R + (crate ? CRATE_R * 0.85 : BOT_R) + 0.12;
				const px = o.x - b.x,
					py = o.y - b.y;
				const vx = o.vx - desX,
					vy = o.vy - desY;
				const v2 = vx * vx + vy * vy;
				let tc = v2 > 1e-6 ? -(px * vx + py * vy) / v2 : 0;
				tc = Math.max(0, Math.min(1.2, tc));
				let cx = px + vx * tc,
					cy = py + vy * tc;
				let cd = Math.hypot(cx, cy);
				if (cd >= rr) continue;
				if (cd < 1e-3) {
					// head-on: everyone sidesteps to its right
					cx = desY;
					cy = -desX;
					cd = Math.hypot(cx, cy) || 1;
				}
				const w = ((rr - cd) / rr) * (crate ? 1.6 : 2.4) * (1 / (tc + 0.35));
				avX -= (cx / cd) * w;
				avY -= (cy / cd) * w;
				// a gentle right-hand rule so two bots meeting in a corridor pass instead of dancing
				if (!crate && px * desX + py * desY > 0) {
					avX += (desY / BOT_SPEED) * 0.6 * w;
					avY += (-desX / BOT_SPEED) * 0.6 * w;
				}
			}
			let tx = desX + avX * BOT_SPEED * 0.5,
				ty = desY + avY * BOT_SPEED * 0.5;
			const tl = Math.hypot(tx, ty);
			if (tl > BOT_SPEED) {
				tx = (tx / tl) * BOT_SPEED;
				ty = (ty / tl) * BOT_SPEED;
			}
			const blend = Math.min(1, 10 * dt);
			b.vx += (tx - b.vx) * blend;
			b.vy += (ty - b.vy) * blend;
			b.rs = 0;
			if (b.vx * b.vx + b.vy * b.vy > 0.04) bot.heading = Math.atan2(b.vy, b.vx);
		}

		// One batched, time-sliced call for every queued request.
		const t0 = performance.now();
		const results = world.findPaths(BUDGET, MIN_SLICE);
		const ms = performance.now() - t0;
		S.batchMs += (ms - S.batchMs) * 0.05;
		S.lastSecond.maxMs = Math.max(S.lastSecond.maxMs, ms);
		S.lastSecond.nodes += nav.lastExpanded;
		for (const r of results) {
			const bot = S.reqToBot.get(r.id);
			S.reqToBot.delete(r.id);
			if (!bot || bot.reqId !== r.id) continue;
			bot.reqId = 0;
			bot.waiting = false;
			S.totalReplans++;
			S.lastSecond.replans++;
			if (r.status === NAV_STATUS.PATH && r.points.length) {
				bot.path = r.points;
				bot.idx = 0;
				bot.bestDist = Infinity;
				bot.sinceProgress = 0;
			} else {
				S.totalNoPath++;
				newGoal(nav, bot); // goal walled in by a crate or a gate: pick another
			}
		}

		if (++S.lastSecond.ticks >= 60) {
			const l = S.lastSecond;
			S.shown = { replans: l.replans, maxMs: l.maxMs, nodes: l.nodes, corridor: l.corridor, grid: l.grid };
			S.lastSecond = { replans: 0, maxMs: 0, nodes: 0, ticks: 0, corridor: 0, grid: 0 };
			updateHud();
		}
	},
	onRender: () => {
		drawOverlay();
	},
	onCleanup: () => {
		S.nav?.destroy();
		S.nav = null;
		S.dom?.overlay.remove();
		S.dom?.hud.remove();
		S.dom = null;
	},
});
