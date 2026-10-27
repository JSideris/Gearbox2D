// Vendored verbatim from gear3engine plugins/g3e-ai/src/nav-grid.ts at develop 339add4 (PER-871 parity reference). Do not edit.
import { astar, AStarSearch, type AStarEdge, type AStarGraph, type AStarResult } from "./astar";
import { boxOverlapsRect, discOverlapsRect, distToBox, segmentHitsBox, segmentHitsDisc, type Disc, type OrientedBox, type Vec2 } from "./geometry2";

/** World rectangle the grid covers. */
export type NavBounds = { minX: number; minY: number; maxX: number; maxY: number };

/** A static box obstacle. `blocksSight: false` keeps it out of {@link NavGrid.lineOfSight} (it still blocks movement). */
export type NavBox = OrientedBox & { blocksSight?: boolean };

/** A static disc obstacle. `keepOut` adds extra inflation beyond the grid clearance (e.g. a hazard's pull). */
export type NavDisc = Disc & { keepOut?: number; blocksSight?: boolean };

export type NavObstacles = { boxes?: NavBox[]; discs?: NavDisc[] };

export type NavGridOptions = {
	/** Cell size in world units. Default 1. */
	cell?: number;
	/** Obstacles are inflated by this much (agent radius + margin). Default 0. */
	clearance?: number;
	/** Also keep `clearance` away from the bounds. Default true. */
	blockEdges?: boolean;
	/**
	 * Which cells an obstacle blocks. "touching" (default): every cell it overlaps, plus every cell whose
	 * centre is within the clearance. "centers" (opt-in): only cells whose centre is within the clearance
	 * (discs: within r + keepOut + clearance of the centre), so obstacles thinner than a cell can leak.
	 */
	rasterize?: "touching" | "centers";
	/** findPath when start and goal snap to the same cell: "goal" (default) returns [goal]; "empty" returns no points. */
	atGoal?: "goal" | "empty";
	/**
	 * nearestFree for a point outside the bounds whose nearest in-bounds cell is free: "center" (default)
	 * returns that cell's centre; "point" returns the point itself.
	 */
	nearestFreeOutside?: "center" | "point";
	/** Passed to {@link astar} as `ties` by findPath. Default "lowerH". */
	astarTies?: "lowerH" | "heap";
};

export type NavPath = {
	/** Waypoints after the start, ending at the goal (or the free spot nearest to it). */
	points: Vec2[];
	/** Polyline length from the start through every waypoint. */
	length: number;
};

const SQRT2 = Math.SQRT2;

/**
 * Occupancy grid for 2D navigation: static boxes and discs are rasterised once (every cell the
 * obstacle touches, plus every cell whose centre is within the clearance of it, so even obstacles
 * thinner than a cell never leak); moving obstacles can be swapped in with {@link setDynamicObstacles}. Paths come from
 * 8-connected A* (no cutting past blocked corners, octile heuristic) and are then string-pulled so
 * agents fly straight between the few corners that matter. Queries are pure and deterministic.
 */
export class NavGrid implements AStarGraph {
	readonly cols: number;
	readonly rows: number;
	readonly cell: number;
	readonly clearance: number;
	/** 1 = blocked by a static obstacle or the edge margin. Index = row * cols + col. */
	readonly blocked: Uint8Array;
	readonly boxes: readonly NavBox[];
	readonly discs: readonly NavDisc[];
	/** PER-870: the cells blocked by moving obstacles (dynamicList[0..dynamicLen)), each once. */
	private dynamicList: Int32Array;
	private dynamicLen = 0;
	/** dynamic as a bitmap (1 = blocked by a moving obstacle), for the A* hot loop (PER-568). */
	private dynamicMask: Uint8Array;
	/** PER-870: pushed layers (see {@link pushDynamicObstacles}): where each starts in dynamicList. */
	private layerStarts: number[] = [];
	/** PER-870: bumped whenever the moving obstacles change (time-sliced searches restart on a change). */
	private dynamicVersion = 0;
	/** Most edges a cell has (8-connected); see {@link neighborsInto}. */
	readonly maxDegree = 8;
	private readonly touching: boolean;
	private readonly options: NavGridOptions;

	constructor(readonly bounds: NavBounds, obstacles: NavObstacles = {}, options: NavGridOptions = {}) {
		const cell = (this.cell = options.cell ?? 1);
		const clearance = (this.clearance = options.clearance ?? 0);
		if (!(cell > 0)) throw new Error(`NavGrid: cell must be > 0 (got ${cell})`);
		if (!(bounds.maxX > bounds.minX && bounds.maxY > bounds.minY)) throw new Error("NavGrid: empty bounds");
		this.cols = Math.ceil((bounds.maxX - bounds.minX) / cell);
		this.rows = Math.ceil((bounds.maxY - bounds.minY) / cell);
		this.blocked = new Uint8Array(this.cols * this.rows);
		this.dynamicMask = new Uint8Array(this.cols * this.rows);
		this.dynamicList = new Int32Array(64);
		this.boxes = obstacles.boxes ?? [];
		this.discs = obstacles.discs ?? [];
		this.options = options;
		const touching = (this.touching = (options.rasterize ?? "touching") === "touching");
		if (options.blockEdges ?? true) {
			for (let i = 0; i < this.size; i++) {
				const p = this.center(i);
				if (p.x < bounds.minX + clearance || p.x > bounds.maxX - clearance || p.y < bounds.minY + clearance || p.y > bounds.maxY - clearance) this.blocked[i] = 1;
			}
		}
		for (const b of this.boxes) {
			const R = Math.hypot(b.w, b.h) / 2 + clearance;
			this.forCellsNear(b.x, b.y, R, i => { if (distToBox(this.center(i), b) < clearance || (touching && this.touches(i, r => boxOverlapsRect(b, ...r)))) this.blocked[i] = 1; });
		}
		for (const d of this.discs) {
			const R = d.r + (d.keepOut ?? 0) + clearance;
			this.forCellsNear(d.x, d.y, R, i => { const p = this.center(i); if (Math.hypot(p.x - d.x, p.y - d.y) < R || (touching && this.touches(i, r => discOverlapsRect(d, ...r)))) this.blocked[i] = 1; });
		}
	}

	/** Cell `i` as [minX, minY, maxX, maxY], passed to an overlap test. */
	private touches(i: number, overlaps: (rect: [number, number, number, number]) => boolean): boolean {
		const p = this.center(i), h = this.cell / 2;
		return overlaps([p.x - h, p.y - h, p.x + h, p.y + h]);
	}

	/** A grid over [-halfW, halfW] x [-halfH, halfH]. */
	static centered(halfW: number, halfH: number, obstacles: NavObstacles = {}, options: NavGridOptions = {}): NavGrid {
		return new NavGrid({ minX: -halfW, minY: -halfH, maxX: halfW, maxY: halfH }, obstacles, options);
	}

	/** Cell count; A* node ids are 0..size-1. */
	get size(): number {
		return this.cols * this.rows;
	}

	private forCellsNear(x: number, y: number, R: number, f: (i: number) => void): void {
		const [c0, r0] = this.cellCoords(x - R, y - R), [c1, r1] = this.cellCoords(x + R, y + R);
		for (let r = Math.max(0, r0); r <= Math.min(this.rows - 1, r1); r++) {
			for (let c = Math.max(0, c0); c <= Math.min(this.cols - 1, c1); c++) f(r * this.cols + c);
		}
	}

	/** [col, row] of the cell containing (x, y); may be out of range. */
	cellCoords(x: number, y: number): [number, number] {
		return [Math.floor((x - this.bounds.minX) / this.cell), Math.floor((y - this.bounds.minY) / this.cell)];
	}

	/** Cell index of a point, or -1 outside the bounds. */
	indexOf(p: Vec2): number {
		const [c, r] = this.cellCoords(p.x, p.y);
		if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) return -1;
		return r * this.cols + c;
	}

	center(i: number): Vec2 {
		const c = i % this.cols, r = (i / this.cols) | 0;
		return { x: this.bounds.minX + (c + 0.5) * this.cell, y: this.bounds.minY + (r + 0.5) * this.cell };
	}

	isBlocked(i: number): boolean {
		return this.blocked[i] === 1 || this.dynamicMask[i] === 1;
	}

	/** Inside the bounds and not in an (inflated) obstacle. */
	isFree(p: Vec2): boolean {
		const i = this.indexOf(p);
		return i >= 0 && !this.isBlocked(i);
	}

	/**
	 * Replaces the moving obstacles (inflated by the clearance like static ones). They block A*,
	 * smoothing and {@link isFree} until the next call; pass [] to clear them. Also drops every layer
	 * added with {@link pushDynamicObstacles}.
	 */
	setDynamicObstacles(discs: readonly Disc[]): void {
		const mask = this.dynamicMask, list = this.dynamicList;
		for (let k = 0; k < this.dynamicLen; k++) mask[list[k]] = 0;
		this.dynamicLen = 0;
		this.layerStarts.length = 0;
		for (const d of discs) this.rasterDynamic(d);
		this.dynamicVersion++;
	}

	/**
	 * PER-870: adds moving obstacles on top of the current ones, as a layer {@link popDynamicObstacles}
	 * takes off again (last in, first out), touching only the cells these discs cover. Push then pop
	 * leaves the grid exactly as before; a push gives the same grid as setDynamicObstacles with the
	 * current discs plus these.
	 */
	pushDynamicObstacles(discs: readonly Disc[]): void {
		this.layerStarts.push(this.dynamicLen);
		for (const d of discs) this.rasterDynamic(d);
		this.dynamicVersion++;
	}

	/** PER-870: takes off the last {@link pushDynamicObstacles} layer (no-op without one). */
	popDynamicObstacles(): void {
		const start = this.layerStarts.pop();
		if (start === undefined) return;
		const mask = this.dynamicMask, list = this.dynamicList;
		for (let k = start; k < this.dynamicLen; k++) mask[list[k]] = 0;
		this.dynamicLen = start;
		this.dynamicVersion++;
	}

	/** PER-870: layers pushed and not yet popped. */
	get dynamicLayers(): number {
		return this.layerStarts.length;
	}

	/** Blocks the cells disc `d` covers that are not blocked by a moving obstacle yet (same test as ever). */
	private rasterDynamic(d: Disc): void {
		const R = d.r + this.clearance, cell = this.cell, cols = this.cols, mask = this.dynamicMask;
		const minX = this.bounds.minX, minY = this.bounds.minY;
		const [c0, r0] = this.cellCoords(d.x - R, d.y - R), [c1, r1] = this.cellCoords(d.x + R, d.y + R);
		const rEnd = Math.min(this.rows - 1, r1), cEnd = Math.min(cols - 1, c1), cStart = Math.max(0, c0);
		for (let r = Math.max(0, r0); r <= rEnd; r++) {
			const py = minY + (r + 0.5) * cell;
			for (let c = cStart; c <= cEnd; c++) {
				const i = r * cols + c;
				if (mask[i] === 1) continue;
				const px = minX + (c + 0.5) * cell;
				if (Math.hypot(px - d.x, py - d.y) < R || (this.touching && this.touches(i, q => discOverlapsRect(d, ...q)))) {
					mask[i] = 1;
					if (this.dynamicLen === this.dynamicList.length) { const l = new Int32Array(this.dynamicLen * 2); l.set(this.dynamicList); this.dynamicList = l; }
					this.dynamicList[this.dynamicLen++] = i;
				}
			}
		}
	}

	get dynamicCount(): number {
		return this.dynamicLen;
	}

	/**
	 * `p` itself if it is free, else the centre of the nearest free cell (ring search up to
	 * `maxRadius` cells; ties go to the first in row-major order), else null.
	 */
	nearestFree(p: Vec2, maxRadius = 30): Vec2 | null {
		return this.nearestFreeBy(p, maxRadius, i => this.isBlocked(i));
	}

	/**
	 * PER-877: {@link nearestFree} against the static obstacles only (moving obstacles and pushed layers are
	 * ignored), as the hierarchical planner ({@link NavHierarchy}) sees the grid.
	 */
	nearestFreeStatic(p: Vec2, maxRadius = 30): Vec2 | null {
		return this.nearestFreeBy(p, maxRadius, i => this.blocked[i] === 1);
	}

	private nearestFreeBy(p: Vec2, maxRadius: number, isBlocked: (i: number) => boolean): Vec2 | null {
		const [pc, pr] = this.cellCoords(p.x, p.y);
		const c0 = Math.max(0, Math.min(this.cols - 1, pc)), r0 = Math.max(0, Math.min(this.rows - 1, pr));
		if (pc === c0 && pr === r0 && !isBlocked(r0 * this.cols + c0)) return p;
		if (!isBlocked(r0 * this.cols + c0)) return this.options.nearestFreeOutside === "point" ? p : this.center(r0 * this.cols + c0);
		for (let rad = 1; rad <= maxRadius; rad++) {
			let best = -1, bestD = Infinity;
			for (let dr = -rad; dr <= rad; dr++) {
				for (let dc = -rad; dc <= rad; dc++) {
					if (Math.max(Math.abs(dr), Math.abs(dc)) !== rad) continue;
					const r = r0 + dr, c = c0 + dc;
					if (r < 0 || c < 0 || r >= this.rows || c >= this.cols) continue;
					const i = r * this.cols + c;
					if (isBlocked(i)) continue;
					const d = dr * dr + dc * dc;
					if (d < bestD) { bestD = d; best = i; }
				}
			}
			if (best >= 0) return this.center(best);
		}
		return null;
	}

	/** 8-connected free neighbours; diagonals only when both adjacent sides are free (no corner cutting). */
	neighbors(i: number, out: AStarEdge[]): void {
		const cols = this.cols, rows = this.rows;
		const c = i % cols, r = (i / cols) | 0;
		const free = (cc: number, rr: number) => cc >= 0 && rr >= 0 && cc < cols && rr < rows && !this.isBlocked(rr * cols + cc);
		for (let dr = -1; dr <= 1; dr++) {
			for (let dc = -1; dc <= 1; dc++) {
				if (!dr && !dc) continue;
				const cc = c + dc, rr = r + dr;
				if (!free(cc, rr)) continue;
				if (dr && dc && (!free(c + dc, r) || !free(c, r + dr))) continue;
				out.push({ node: rr * cols + cc, cost: (dr && dc ? SQRT2 : 1) * this.cell });
			}
		}
	}

	/**
	 * {@link neighbors} without allocating (PER-568): the same edges in the same order, written into
	 * `nodes` / `costs` (room for {@link maxDegree}); returns the count. Used by {@link astar}.
	 */
	neighborsInto(i: number, nodes: Int32Array, costs: Float64Array): number {
		if (this.isBlocked !== NavGrid.prototype.isBlocked || this.neighbors !== NavGrid.prototype.neighbors) {
			// a subclass changed the rules: go through them
			const out: AStarEdge[] = [];
			this.neighbors(i, out);
			for (let e = 0; e < out.length; e++) { nodes[e] = out[e].node; costs[e] = out[e].cost; }
			return out.length;
		}
		const cols = this.cols, rows = this.rows, blocked = this.blocked, dyn = this.dynamicMask;
		const c = i % cols, r = (i / cols) | 0;
		const straight = this.cell, diag = SQRT2 * this.cell;
		// free(c + dc, r + dr) for the 3x3 block, row-major from (-1, -1); PER-870: inlined (no closure per call)
		let k = 0;
		const hasUp = r > 0, hasDown = r + 1 < rows, hasLeft = c > 0, hasRight = c + 1 < cols;
		const iu = i - cols, id = i + cols;
		const up = hasUp && blocked[iu] !== 1 && dyn[iu] !== 1;
		const down = hasDown && blocked[id] !== 1 && dyn[id] !== 1;
		const left = hasLeft && blocked[i - 1] !== 1 && dyn[i - 1] !== 1;
		const right = hasRight && blocked[i + 1] !== 1 && dyn[i + 1] !== 1;
		if (up) {
			if (left && blocked[iu - 1] !== 1 && dyn[iu - 1] !== 1) { nodes[k] = iu - 1; costs[k++] = diag; }
			nodes[k] = iu; costs[k++] = straight;
			if (right && blocked[iu + 1] !== 1 && dyn[iu + 1] !== 1) { nodes[k] = iu + 1; costs[k++] = diag; }
		}
		if (left) { nodes[k] = i - 1; costs[k++] = straight; }
		if (right) { nodes[k] = i + 1; costs[k++] = straight; }
		if (down) {
			if (left && blocked[id - 1] !== 1 && dyn[id - 1] !== 1) { nodes[k] = id - 1; costs[k++] = diag; }
			nodes[k] = id; costs[k++] = straight;
			if (right && blocked[id + 1] !== 1 && dyn[id + 1] !== 1) { nodes[k] = id + 1; costs[k++] = diag; }
		}
		return k;
	}

	/** Octile distance: exact on an empty 8-connected grid, so admissible. */
	heuristic(a: number, b: number): number {
		const cols = this.cols, ra = (a / cols) | 0, rb = (b / cols) | 0; // PER-870: integer col/row (same values as % and /)
		const dx = Math.abs((a - ra * cols) - (b - rb * cols));
		const dy = Math.abs(ra - rb);
		return (Math.max(dx, dy) + (SQRT2 - 1) * Math.min(dx, dy)) * this.cell;
	}

	/** True if the straight segment stays in free cells (sampled every quarter cell). */
	walkable(a: Vec2, b: Vec2): boolean {
		const d = Math.hypot(b.x - a.x, b.y - a.y);
		const n = Math.max(1, Math.ceil(d / (this.cell * 0.25)));
		if (this.isFree !== NavGrid.prototype.isFree || this.isBlocked !== NavGrid.prototype.isBlocked) {
			for (let k = 0; k <= n; k++) {
				const t = k / n;
				if (!this.isFree({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })) return false;
			}
			return true;
		}
		// Same samples and cell test as isFree, without allocating (PER-568).
		const { minX, minY } = this.bounds, cell = this.cell, cols = this.cols, rows = this.rows, blocked = this.blocked, dyn = this.dynamicMask;
		for (let k = 0; k <= n; k++) {
			const t = k / n;
			const c = Math.floor((a.x + (b.x - a.x) * t - minX) / cell), r = Math.floor((a.y + (b.y - a.y) * t - minY) / cell);
			if (c < 0 || r < 0 || c >= cols || r >= rows) return false;
			const i = r * cols + c;
			if (blocked[i] === 1 || dyn[i] === 1) return false;
		}
		return true;
	}

	/** PER-877: {@link walkable} against the static obstacles only (the same samples; moving obstacles ignored). */
	walkableStatic(a: Vec2, b: Vec2): boolean {
		const d = Math.hypot(b.x - a.x, b.y - a.y);
		const n = Math.max(1, Math.ceil(d / (this.cell * 0.25)));
		const { minX, minY } = this.bounds, cell = this.cell, cols = this.cols, rows = this.rows, blocked = this.blocked;
		for (let k = 0; k <= n; k++) {
			const t = k / n;
			const c = Math.floor((a.x + (b.x - a.x) * t - minX) / cell), r = Math.floor((a.y + (b.y - a.y) * t - minY) / cell);
			if (c < 0 || r < 0 || c >= cols || r >= rows) return false;
			if (blocked[r * cols + c] === 1) return false;
		}
		return true;
	}

	/** PER-877: the tie rule findPath passes to {@link astar} (the `astarTies` option). */
	get astarTies(): "lowerH" | "heap" {
		return this.options.astarTies ?? "lowerH";
	}

	/** PER-877: the `atGoal` option. */
	get atGoal(): "goal" | "empty" {
		return this.options.atGoal ?? "goal";
	}

	/**
	 * Line of sight against the real (uninflated) obstacles that block sight; `pad` grows them
	 * (e.g. a projectile's radius). Independent of the grid resolution.
	 */
	lineOfSight(a: Vec2, b: Vec2, pad = 0): boolean {
		for (const box of this.boxes) if (box.blocksSight !== false && segmentHitsBox(a, b, box, pad)) return false;
		for (const d of this.discs) if (d.blocksSight !== false && segmentHitsDisc(a, b, d, pad)) return false;
		return true;
	}

	/**
	 * A* from `from` to `to`, then string-pulled. Starts/goals inside obstacles snap to the nearest
	 * free spot. Null if there is no free spot nearby or no path.
	 */
	findPath(from: Vec2, to: Vec2, options: { maxExpanded?: number } = {}): NavPath | null {
		const s = this.nearestFree(from), g = this.nearestFree(to);
		if (!s || !g) return null;
		const res = astar(this, this.indexOf(s), this.indexOf(g), { ties: this.options.astarTies, ...options });
		return this.finishPath(res, from, s, g);
	}

	/** The A* result as waypoints: snapped ends, string-pulled, the start dropped (shared by both findPaths). */
	private finishPath(res: AStarResult | null, from: Vec2, s: Vec2, g: Vec2): NavPath | null {
		if (!res) return null;
		return this.finishCells(res.path, from, s, g, false, false);
	}

	/**
	 * @internal (PER-877) cells start..goal as a NavPath: snapped ends, string-pulled (against the static
	 * obstacles only when `staticOnly`; with {@link smoothGallop} when `gallop`), the start dropped.
	 */
	finishCells(cells: readonly number[], from: Vec2, s: Vec2, g: Vec2, staticOnly: boolean, gallop: boolean): NavPath {
		const raw = cells.map(i => this.center(i));
		raw[0] = s;
		raw[raw.length - 1] = g;
		const walk = staticOnly ? (a: Vec2, b: Vec2) => this.walkableStatic(a, b) : (a: Vec2, b: Vec2) => this.walkable(a, b);
		const points = gallop ? this.smoothGallop(raw, walk) : this.smoothBy(raw, walk);
		points.shift();
		if (!points.length && this.options.atGoal !== "empty") points.push(g);
		let length = 0, prev = from;
		for (const p of points) { length += Math.hypot(p.x - prev.x, p.y - prev.y); prev = p; }
		return { points, length };
	}

	/**
	 * PER-870 (opt-in): {@link findPath} spread over several calls. Each {@link NavPathSearch.step}
	 * expands at most its budget of A* nodes (e.g. per tick) and returns undefined until done, then
	 * exactly what findPath(from, to, options) returns on the same grid. If the moving obstacles change
	 * between steps the search starts over on the new grid (so the answer is always findPath's on the
	 * grid of the step that finishes).
	 */
	findPathSliced(from: Vec2, to: Vec2, options: { maxExpanded?: number } = {}): NavPathSearch {
		return new NavPathSearch(this, from, to, options);
	}

	/** @internal for {@link NavPathSearch}: the grid's moving-obstacle version, snaps and A* start. */
	beginSliced(from: Vec2, to: Vec2, options: { maxExpanded?: number }): { version: number; s: Vec2 | null; g: Vec2 | null; search: AStarSearch | null } {
		const s = this.nearestFree(from), g = this.nearestFree(to);
		const search = s && g ? new AStarSearch(this, this.indexOf(s), this.indexOf(g), { ties: this.options.astarTies, ...options }) : null;
		return { version: this.dynamicVersion, s, g, search };
	}

	/** @internal for {@link NavPathSearch}. */
	get sliceVersion(): number {
		return this.dynamicVersion;
	}

	/** @internal for {@link NavPathSearch}. */
	finishSliced(res: AStarResult | null, from: Vec2, s: Vec2, g: Vec2): NavPath | null {
		return this.finishPath(res, from, s, g);
	}

	/** Greedy string pulling: from each kept point jump to the farthest point still {@link walkable} from it. */
	smooth(points: readonly Vec2[]): Vec2[] {
		return this.smoothBy(points, (a, b) => this.walkable(a, b));
	}

	/** PER-877: {@link smooth} against the static obstacles only ({@link walkableStatic}). */
	smoothStatic(points: readonly Vec2[]): Vec2[] {
		return this.smoothBy(points, (a, b) => this.walkableStatic(a, b));
	}

	/**
	 * PER-877: string pulling in O(log n) line tests per kept point: from each kept point, try 2, 4, 8, ... points
	 * ahead until a segment is blocked, then binary-search the farthest walkable one in between. Can jump past a
	 * blocked stretch to a farther visible point (never a longer path than {@link smooth} on a straight-ish run), and
	 * every kept segment is walkable. Used by {@link NavHierarchy}; {@link smooth} itself is unchanged.
	 */
	smoothGallop(points: readonly Vec2[], walkable: (a: Vec2, b: Vec2) => boolean = (a, b) => this.walkable(a, b)): Vec2[] {
		const n = points.length;
		if (n <= 2) return points.slice();
		const out = [points[0]];
		let i = 0;
		while (i < n - 1) {
			let ok = i + 1, step = 2, bad = -1;
			for (;;) {
				const j = Math.min(n - 1, i + step);
				if (walkable(points[i], points[j])) { ok = j; if (j === n - 1) break; step *= 2; }
				else { bad = j; break; }
			}
			if (bad > 0) {
				let lo = ok, hi = bad; // walkable(lo), !walkable(hi)
				while (hi - lo > 1) { const m = (lo + hi) >> 1; if (walkable(points[i], points[m])) lo = m; else hi = m; }
				ok = lo;
			}
			out.push(points[ok]);
			i = ok;
		}
		return out;
	}

	private smoothBy(points: readonly Vec2[], walkable: (a: Vec2, b: Vec2) => boolean): Vec2[] {
		if (points.length <= 2) return points.slice();
		const out = [points[0]];
		let i = 0;
		while (i < points.length - 1) {
			let j = i + 1;
			while (j + 1 < points.length && walkable(points[i], points[j + 1])) j++;
			out.push(points[j]);
			i = j;
		}
		return out;
	}
}

/**
 * PER-870: a {@link NavGrid.findPath} in progress, a budget of A* expansions per {@link step}
 * (from {@link NavGrid.findPathSliced}).
 */
export class NavPathSearch {
	private cur: ReturnType<NavGrid["beginSliced"]> | null = null;
	private result: NavPath | null | undefined = undefined;

	constructor(readonly grid: NavGrid, readonly from: Vec2, readonly to: Vec2, private readonly options: { maxExpanded?: number } = {}) {}

	/** True once {@link step} has returned the path (or null). */
	get done(): boolean {
		return this.result !== undefined;
	}

	/**
	 * Expands up to `budget` A* nodes (at least 1): the path (or null) when finished, else undefined.
	 * Starts over if the grid's moving obstacles changed since the last step.
	 */
	step(budget: number): NavPath | null | undefined {
		if (this.result !== undefined) return this.result;
		if (this.cur && this.cur.version !== this.grid.sliceVersion) { this.cur.search?.dispose(); this.cur = null; }
		this.cur ??= this.grid.beginSliced(this.from, this.to, this.options);
		const { s, g, search } = this.cur;
		if (!s || !g || !search) return (this.result = null);
		const res = search.step(budget);
		if (res === undefined) return undefined;
		this.result = this.grid.finishSliced(res, this.from, s, g);
		this.cur = null;
		return this.result;
	}

	/** Abandons the search (frees its bookkeeping). */
	dispose(): void {
		this.cur?.search?.dispose();
		this.cur = null;
		if (this.result === undefined) this.result = null;
	}
}
