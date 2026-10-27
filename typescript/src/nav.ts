// PER-871: native grid pathfinding. A thin wrapper over World::nav* in WASM: requests are written straight
// into WASM memory, World.findPaths(budget) runs every queued request in one call, and results are read
// back from a shared Float64Array. See docs/navigation.md.
import type { CppWorld } from "./wasm-types.js";

export type NavVec2 = { x: number; y: number };
export type NavDisc = { x: number; y: number; r: number };
export type NavBounds = { minX: number; minY: number; maxX: number; maxY: number };

export type NavGridOptions = {
	/** Cell size in world units. Default 1. */
	cell?: number;
	/** Obstacles are inflated by this much (agent radius + margin). Default 0. */
	clearance?: number;
	/** Also keep `clearance` away from the bounds. Default true. */
	blockEdges?: boolean;
	/** "touching" (default): every cell an obstacle overlaps plus cells within the clearance; "centers": only cells whose centre is within it. */
	rasterize?: "touching" | "centers";
	/** Start and goal in the same cell: "goal" (default) returns [goal], "empty" no points. */
	atGoal?: "goal" | "empty";
	/** nearest free spot for a point outside the bounds next to a free cell: "center" (default) or the point itself. */
	nearestFreeOutside?: "center" | "point";
	/** Equal-f A* ties: "lowerH" (default) or "heap" (plain binary heap order). */
	astarTies?: "lowerH" | "heap";
};

/** Request modes. */
export const NAV_MODE = {
	/** Plain A* over the whole grid, moving obstacles included (NavGrid.findPath). */
	GRID: 0,
	/** Hierarchical A* over the walls only (NavHierarchy.findPath). Needs buildHierarchy(). */
	HPA: 1,
	/** HPA route refined with A* (moving obstacles included) in the clusters along it. */
	HPA_CORRIDOR: 2,
} as const;

export const NAV_STATUS = { NO_PATH: 0, PATH: 1, NO_HIERARCHY: -2, BAD_REQUEST: -3 } as const;

export type NavRequestOptions = {
	mode?: number;
	/** Give up (no path) once a single search expands this many nodes. Default 200 000. */
	maxExpanded?: number;
	/** Extra obstacles for this request only (pushed while it searches, e.g. a detour around fire). */
	discs?: readonly NavDisc[];
};

export type NavPathResult = {
	id: number;
	status: number;
	/** Nodes expanded for this request (every slice and restart counted). */
	expanded: number;
	/** Polyline length from the start through every point. */
	length: number;
	/** Waypoints after the start, ending at the goal (or the free spot nearest to it). */
	points: NavVec2[];
};

const REQ = 8;
const FLAG = { CENTERS: 1, NO_EDGES: 2, AT_GOAL_EMPTY: 4, OUTSIDE_POINT: 8, TIES_HEAP: 16 };

/** The nav grid of one World. Create it with world.createNav(bounds, options). */
export class Nav {
	readonly cols: number;
	readonly rows: number;
	readonly cell: number;
	readonly bounds: NavBounds;
	private header: Int32Array | null = null;
	private gen = -1;
	private reqView = new Float64Array(0);
	private discView = new Float64Array(0);
	private outView = new Float64Array(0);
	private baseView = new Uint8Array(0);
	private blockedView = new Uint8Array(0);
	private pending = 0;
	private pendingDiscs = 0;

	/** @internal */
	constructor(
		private readonly cpp: CppWorld,
		bounds: NavBounds,
		options: NavGridOptions = {},
	) {
		this.cell = options.cell ?? 1;
		this.bounds = { ...bounds };
		let flags = 0;
		if ((options.rasterize ?? "touching") === "centers") flags |= FLAG.CENTERS;
		if (options.blockEdges === false) flags |= FLAG.NO_EDGES;
		if (options.atGoal === "empty") flags |= FLAG.AT_GOAL_EMPTY;
		if (options.nearestFreeOutside === "point") flags |= FLAG.OUTSIDE_POINT;
		if (options.astarTies === "heap") flags |= FLAG.TIES_HEAP;
		cpp.navCreate(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY, this.cell, options.clearance ?? 0, flags);
		this.cols = cpp.navCols();
		this.rows = cpp.navRows();
		this.sync();
	}

	/** Re-fetches the views when a buffer moved or the heap grew (a detached view has length 0). */
	private sync(): void {
		if (!this.header || this.header.length === 0) {
			this.header = this.cpp.navGetHeader();
			this.gen = -1;
		}
		if (this.header[0] !== this.gen || this.reqView.length === 0 || this.baseView.length === 0) {
			this.reqView = this.cpp.navGetRequestView();
			this.discView = this.cpp.navGetDiscView();
			this.outView = this.cpp.navGetOutView();
			this.baseView = this.cpp.navGetBaseView();
			this.blockedView = this.cpp.navGetBlockedView();
			this.gen = this.header[0];
		}
	}

	/** Cell index of a point, or -1 outside the bounds (row-major, like g3e-ai NavGrid.indexOf). */
	indexOf(p: NavVec2): number {
		const c = Math.floor((p.x - this.bounds.minX) / this.cell),
			r = Math.floor((p.y - this.bounds.minY) / this.cell);
		if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) return -1;
		return r * this.cols + c;
	}

	/** A static box obstacle (rasterised natively, same rules as g3e-ai NavGrid). */
	addBox(b: { x: number; y: number; w: number; h: number; angle?: number }): void {
		this.cpp.navAddBox(b.x, b.y, b.w, b.h, b.angle ?? 0);
	}

	/** A static disc obstacle; `keepOut` adds inflation beyond the clearance. */
	addDisc(d: { x: number; y: number; r: number; keepOut?: number }): void {
		this.cpp.navAddDisc(d.x, d.y, d.r, d.keepOut ?? 0);
	}

	/**
	 * The base layer (1 = blocked): edge margin, static shapes, and anything you write here. After writing,
	 * call commitBase(). Re-read it after other world calls (heap growth replaces the view).
	 */
	get base(): Uint8Array {
		this.sync();
		return this.baseView;
	}

	/** Applies cells written to `base` (a cell rectangle, inclusive; default all) at the next sync. */
	commitBase(c0 = -1, r0 = -1, c1 = -1, r1 = -1): void {
		this.cpp.navCommitBase(c0, r0, c1, r1);
	}

	/** Copies a whole static mask (cols * rows, 1 = blocked) into the base layer, e.g. a JS NavGrid's `blocked`. */
	setStaticMask(mask: ArrayLike<number>): void {
		const base = this.base;
		if (mask.length !== base.length)
			throw new Error(`Nav.setStaticMask: expected ${base.length} cells, got ${mask.length}`);
		base.set(mask as ArrayLike<number>);
		this.commitBase();
	}

	/** What A* treats as static (base + tracked fixtures), as of the last sync. */
	get blocked(): Uint8Array {
		this.sync();
		return this.blockedView;
	}

	/** Applies tracked-fixture moves and base changes now (findPaths does this itself). */
	syncStatic(): void {
		this.cpp.navSync();
		this.sync();
	}

	/**
	 * Physics-world obstacles: fixtures whose categoryBits & mask != 0 block their cells (inflated by the
	 * clearance). The step only notes which of them moved; cells and hierarchy update at the next findPaths.
	 * 0 turns tracking off. Sensors are skipped unless `sensors` is true.
	 */
	track(mask: number, opts: { sensors?: boolean } = {}): void {
		this.cpp.navTrack(mask >>> 0, opts.sensors ? 1 : 0);
	}

	private writeDiscs(discs: readonly NavDisc[], at: number): void {
		if ((at + discs.length) * 3 > this.discView.length) {
			this.cpp.navReserve(0, at + discs.length);
			this.sync();
		}
		const v = this.discView;
		for (let i = 0; i < discs.length; i++) {
			const o = (at + i) * 3;
			v[o] = discs[i].x;
			v[o + 1] = discs[i].y;
			v[o + 2] = discs[i].r;
		}
	}

	/** Replaces the moving obstacles (and drops pushed layers). Same semantics as g3e-ai NavGrid.setDynamicObstacles. */
	setDynamicObstacles(discs: readonly NavDisc[]): void {
		this.dropPendingIfOverwritten();
		this.sync();
		this.writeDiscs(discs, 0);
		this.cpp.navSetDynamic(discs.length);
	}

	/** Adds a layer of moving obstacles that popDynamicObstacles() takes off again (last in, first out). */
	pushDynamicObstacles(discs: readonly NavDisc[]): void {
		this.dropPendingIfOverwritten();
		this.sync();
		this.writeDiscs(discs, 0);
		this.cpp.navPushDynamic(discs.length);
	}

	popDynamicObstacles(): void {
		this.cpp.navPopDynamic();
	}

	get dynamicLayers(): number {
		return this.cpp.navDynamicLayers();
	}

	// set/push reuse the disc buffer from 0; requests staged with discs before them would lose theirs, so refuse.
	private dropPendingIfOverwritten(): void {
		if (this.pendingDiscs > 0)
			throw new Error("Nav: set/push obstacles after request() with discs and before findPaths()");
	}

	/** Builds the hierarchical planner (HPA*) over the static cells; rebuilt in part when they change. */
	buildHierarchy(opts: { cluster?: number; wideEntrance?: number } = {}): void {
		this.cpp.navBuildHierarchy(
			Math.max(2, Math.floor(opts.cluster ?? 16)),
			Math.max(1, Math.floor(opts.wideEntrance ?? 6)),
		);
	}

	/** Entrance nodes / directed edges of the hierarchy (0 before buildHierarchy). */
	get hierarchyStats(): { nodes: number; edges: number } {
		this.sync();
		return { nodes: this.header![4], edges: this.header![5] };
	}

	/**
	 * Queues a path request; nothing crosses into WASM until findPaths(). `id` comes back with the result.
	 * Unfinished requests carry over to the next findPaths.
	 */
	request(id: number, from: NavVec2, to: NavVec2, opts: NavRequestOptions = {}): void {
		this.sync();
		const k = this.pending;
		if ((k + 1) * REQ > this.reqView.length) {
			this.cpp.navReserve(Math.max(64, (k + 1) * 2), 0);
			this.sync();
		}
		const discs = opts.discs ?? [];
		if (discs.length) this.writeDiscs(discs, this.pendingDiscs);
		const v = this.reqView,
			o = k * REQ;
		v[o] = id;
		v[o + 1] = from.x;
		v[o + 2] = from.y;
		v[o + 3] = to.x;
		v[o + 4] = to.y;
		v[o + 5] = opts.mode ?? NAV_MODE.GRID;
		v[o + 6] = opts.maxExpanded ?? 0;
		v[o + 7] = discs.length;
		this.pending++;
		this.pendingDiscs += discs.length;
	}

	/** Requests queued in WASM (started or waiting), not counting ones staged since the last findPaths. */
	get queued(): number {
		this.sync();
		return this.header![2];
	}

	/** Nodes expanded by the last findPaths / findPath call. */
	get lastExpanded(): number {
		this.sync();
		return this.header![3];
	}

	/**
	 * Runs queued requests (oldest first) within `budget` A* node expansions, in one WASM call. Each request
	 * gets at least `minSlice` nodes even once the budget is spent (0: requests past the budget wait).
	 * Returns how many finished; read them with results() or the raw `out` view.
	 */
	findPathsRaw(budget: number, minSlice = 0): number {
		const n = this.cpp.findPaths(budget, minSlice, this.pending);
		this.pending = 0;
		this.pendingDiscs = 0;
		this.sync();
		return n;
	}

	/** findPathsRaw, then the finished requests as objects. */
	findPaths(budget: number, minSlice = 0): NavPathResult[] {
		this.findPathsRaw(budget, minSlice);
		return this.results();
	}

	/** One path right now (its own WASM call; does not touch the queue). */
	findPath(from: NavVec2, to: NavVec2, opts: { mode?: number; maxExpanded?: number } = {}): NavPathResult {
		this.cpp.navFindPath(from.x, from.y, to.x, to.y, opts.mode ?? NAV_MODE.GRID, opts.maxExpanded ?? 0);
		this.sync();
		return this.results()[0];
	}

	/**
	 * Results of the last call as a raw view: out[0] = count, then per result
	 * [id, status, expanded, length, nPoints, x0, y0, x1, y1, ...]. Valid until the next nav call.
	 */
	get out(): Float64Array {
		this.sync();
		return this.outView;
	}

	results(): NavPathResult[] {
		const o = this.out,
			res: NavPathResult[] = [];
		let at = 1;
		for (let k = 0; k < o[0]; k++) {
			const n = o[at + 4],
				points: NavVec2[] = new Array(n);
			for (let i = 0; i < n; i++) points[i] = { x: o[at + 5 + 2 * i], y: o[at + 6 + 2 * i] };
			res.push({ id: o[at], status: o[at + 1], expanded: o[at + 2], length: o[at + 3], points });
			at += 5 + 2 * n;
		}
		return res;
	}

	/** Drops a queued request (no result is reported for it). */
	cancel(id: number): void {
		this.cpp.navCancel(id);
	}

	/** Drops every queued request. */
	clearRequests(): void {
		this.cpp.navClearRequests();
		this.pending = 0;
		this.pendingDiscs = 0;
	}

	/** Frees the grid. */
	destroy(): void {
		this.cpp.navDestroy();
	}
}
