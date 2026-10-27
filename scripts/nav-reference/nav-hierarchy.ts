// Vendored verbatim from gear3engine plugins/g3e-ai/src/nav-hierarchy.ts at develop 339add4 (PER-871 parity reference). Do not edit.
import { AStarSearch, type AStarEdge, type AStarGraph, type AStarResult } from "./astar";
import type { NavBounds, NavGrid, NavPath } from "./nav-grid";
import type { Vec2 } from "./geometry2";

const SQRT2 = Math.SQRT2;

export type NavHierarchyOptions = {
	/** Cluster side in cells. Default 16. */
	cluster?: number;
	/** An open stretch of a cluster border at least this long gets two entrances (one at each end), shorter ones one in the middle. Default 6. */
	wideEntrance?: number;
};

export type NavHierarchyQuery = {
	/**
	 * "ignore" (default): walls only. The route, the snapping of the ends and the string pulling see the grid's static
	 * obstacles only; moving obstacles and pushed layers are left to local steering. "corridor": the abstract route is
	 * still planned on the walls, then refined with plain A* (moving obstacles and pushed layers included, same tie
	 * rule as findPath) inside the clusters along it plus one cluster around; null if the corridor is blocked.
	 */
	dynamic?: "ignore" | "corridor";
	/** Give up (null) once a single search inside the query expands this many nodes. Default 200 000. */
	maxExpanded?: number;
};

/** Effort counters of the last finished query (tests / benchmarks). */
export type NavHierarchyStats = { expanded: number; abstractExpanded: number; abstractLength: number };

/**
 * PER-877: hierarchical path planning (HPA*) over a {@link NavGrid}'s static obstacles, for long routes on big grids.
 *
 * The grid is cut into `cluster` x `cluster` cells. Where two neighbouring clusters share an open stretch of border
 * there are entrances (cell pairs across it); inside each cluster the cheapest path between every two of its entrance
 * cells is found once with the grid's own A* (same edges, octile heuristic and tie rule), kept to the cluster. A query
 * links the start and goal to their clusters' entrances the same way, runs A* on that small entrance graph and stitches
 * the cached cell paths, then string-pulls the result. Routes are near-optimal (cluster borders are crossed at the
 * entrances), deterministic, and cost a few thousand node expansions instead of the full grid.
 *
 * Static obstacles are rasterised once by the grid; if `grid.blocked` changes, call {@link rebuild} with the changed
 * area and only the clusters it touches are searched again.
 */
export class NavHierarchy {
	readonly cluster: number;
	readonly ccols: number;
	readonly crows: number;
	private readonly wide: number;
	/** Bumped by every {@link rebuild}: sliced queries started before it start over. */
	version = 0;

	// entrance graph: node -> cell, cluster; adjacency in CSR form
	private nodeCell = new Int32Array(0);
	private nodeOf: Int32Array;
	private adjStart = new Int32Array(1);
	private adjNode = new Int32Array(0);
	private adjCost = new Float64Array(0);
	private adjPath: (Int32Array | null)[] = [];
	private maxDeg = 0;
	/** per cluster: its entrance nodes (CSR) */
	private clStart = new Int32Array(1);
	private clNodes = new Int32Array(0);
	/** per cluster: the intra-cluster paths last computed, keyed by its entrance cells (reused by a partial rebuild) */
	private intra: (IntraCache | null)[];
	private regions: (RegionGraph | null)[];
	private queryPool: AbstractQuery[] = [];
	private corridorPool: CorridorGraph[] = [];
	/** The last finished query's effort (see {@link NavHierarchyStats}). */
	lastStats: NavHierarchyStats = { expanded: 0, abstractExpanded: 0, abstractLength: 0 };

	constructor(readonly grid: NavGrid, options: NavHierarchyOptions = {}) {
		const k = (this.cluster = Math.max(2, Math.floor(options.cluster ?? 16)));
		this.wide = Math.max(1, Math.floor(options.wideEntrance ?? 6));
		this.ccols = Math.ceil(grid.cols / k);
		this.crows = Math.ceil(grid.rows / k);
		this.nodeOf = new Int32Array(grid.size).fill(-1);
		this.intra = new Array(this.ccols * this.crows).fill(null);
		this.regions = new Array(this.ccols * this.crows).fill(null);
		this.build(null);
	}

	/** Entrance nodes in the abstract graph. */
	get nodeCount(): number {
		return this.nodeCell.length;
	}

	/** Directed abstract edges. */
	get edgeCount(): number {
		return this.adjNode.length;
	}

	/** Cluster index of a cell. */
	clusterOf(cell: number): number {
		const cols = this.grid.cols, r = (cell / cols) | 0, c = cell - r * cols;
		return ((r / this.cluster) | 0) * this.ccols + ((c / this.cluster) | 0);
	}

	/**
	 * Call after changing `grid.blocked`: re-finds the entrances and searches again inside the clusters that `area`
	 * (world units; default the whole grid) touches, plus any cluster whose entrances moved. Bumps {@link version}.
	 */
	rebuild(area?: NavBounds): void {
		const n = this.ccols * this.crows;
		let mask: Uint8Array | null = null;
		if (area) {
			mask = new Uint8Array(n);
			const g = this.grid, k = this.cluster;
			const [c0, r0] = g.cellCoords(area.minX, area.minY), [c1, r1] = g.cellCoords(area.maxX, area.maxY);
			// one cell of margin: a changed cell on a border moves the entrances of the cluster across it too
			const cc0 = Math.max(0, Math.floor((c0 - 1) / k)), cc1 = Math.min(this.ccols - 1, Math.floor((c1 + 1) / k));
			const cr0 = Math.max(0, Math.floor((r0 - 1) / k)), cr1 = Math.min(this.crows - 1, Math.floor((r1 + 1) / k));
			for (let cr = cr0; cr <= cr1; cr++) for (let cc = cc0; cc <= cc1; cc++) mask[cr * this.ccols + cc] = 1;
		} else {
			mask = new Uint8Array(n).fill(1);
		}
		this.build(mask);
		this.version++;
	}

	private region(cl: number): RegionGraph {
		let r = this.regions[cl];
		if (!r) {
			const k = this.cluster, g = this.grid;
			const c0 = (cl % this.ccols) * k, r0 = ((cl / this.ccols) | 0) * k;
			r = this.regions[cl] = new RegionGraph(g, c0, r0, Math.min(k, g.cols - c0), Math.min(k, g.rows - r0));
		}
		return r;
	}

	/** (Re)builds the entrance graph; `dirty` marks clusters whose cached intra paths can't be reused (null: none cached yet). */
	private build(dirty: Uint8Array | null): void {
		const g = this.grid, k = this.cluster, cols = g.cols, rows = g.rows, blocked = g.blocked;
		for (let i = 0; i < this.nodeCell.length; i++) this.nodeOf[this.nodeCell[i]] = -1;
		const cells: number[] = [];
		const inter: number[] = []; // pairs of node ids
		const node = (cell: number) => {
			let id = this.nodeOf[cell];
			if (id < 0) { id = this.nodeOf[cell] = cells.length; cells.push(cell); }
			return id;
		};
		const transitions = (len: number, at: (t: number) => [number, number]) => {
			let t = 0;
			while (t < len) {
				const [a0, b0] = at(t);
				if (blocked[a0] === 1 || blocked[b0] === 1) { t++; continue; }
				let e = t;
				while (e + 1 < len) { const [a, b] = at(e + 1); if (blocked[a] === 1 || blocked[b] === 1) break; e++; }
				const run = e - t + 1;
				const picks = run >= this.wide ? (run === 1 ? [t] : [t, e]) : [t + ((run - 1) >> 1)];
				for (const p of picks) { const [a, b] = at(p); inter.push(node(a), node(b)); }
				t = e + 1;
			}
		};
		for (let cr = 0; cr < this.crows; cr++) {
			for (let cc = 0; cc < this.ccols; cc++) {
				const c0 = cc * k, r0 = cr * k, w = Math.min(k, cols - c0), h = Math.min(k, rows - r0);
				if (c0 + w < cols) { const ca = c0 + w - 1; transitions(h, t => [(r0 + t) * cols + ca, (r0 + t) * cols + ca + 1]); } // right border
				if (r0 + h < rows) { const ra = r0 + h - 1; transitions(w, t => [ra * cols + c0 + t, (ra + 1) * cols + c0 + t]); } // bottom border
			}
		}
		const N = cells.length;
		this.nodeCell = Int32Array.from(cells);
		// cluster -> nodes, in node order
		const ncl = this.ccols * this.crows, clCount = new Int32Array(ncl + 1);
		const nodeCl = new Int32Array(N);
		for (let i = 0; i < N; i++) { nodeCl[i] = this.clusterOf(cells[i]); clCount[nodeCl[i] + 1]++; }
		for (let c = 0; c < ncl; c++) clCount[c + 1] += clCount[c];
		this.clStart = clCount.slice();
		const fill = clCount.slice(0, ncl), clNodes = new Int32Array(N);
		for (let i = 0; i < N; i++) clNodes[fill[nodeCl[i]]++] = i;
		this.clNodes = clNodes;
		// edges per node: inter first (in border order), then intra (in pair order)
		const out: { to: number; cost: number; path: Int32Array | null }[][] = Array.from({ length: N }, () => []);
		const straight = g.cell;
		for (let e = 0; e < inter.length; e += 2) {
			const a = inter[e], b = inter[e + 1];
			out[a].push({ to: b, cost: straight, path: null });
			out[b].push({ to: a, cost: straight, path: null });
		}
		const ties = g.astarTies;
		for (let cl = 0; cl < ncl; cl++) {
			const s = this.clStart[cl], e = this.clStart[cl + 1];
			const here = Array.from(clNodes.subarray(s, e), i => cells[i]);
			let cache = this.intra[cl];
			if (!cache || (dirty && dirty[cl]) || !sameCells(cache.cells, here)) {
				const reg = this.region(cl);
				const pairs: IntraPair[] = [];
				for (let i = 0; i < here.length; i++) {
					for (let j = i + 1; j < here.length; j++) {
						const res = new AStarSearch(reg, reg.local(here[i]), reg.local(here[j]), { ties }).step(Infinity);
						if (res) pairs.push({ i, j, cost: res.cost, path: Int32Array.from(res.path, l => reg.global(l)) });
					}
				}
				cache = this.intra[cl] = { cells: here, pairs };
			}
			for (const p of cache.pairs) {
				const a = clNodes[s + p.i], b = clNodes[s + p.j];
				out[a].push({ to: b, cost: p.cost, path: p.path });
				out[b].push({ to: a, cost: p.cost, path: p.path.slice().reverse() });
			}
		}
		const adjStart = new Int32Array(N + 1);
		for (let i = 0; i < N; i++) adjStart[i + 1] = adjStart[i] + out[i].length;
		const M = adjStart[N], adjNode = new Int32Array(M), adjCost = new Float64Array(M), adjPath: (Int32Array | null)[] = new Array(M);
		let maxDeg = 0;
		for (let i = 0; i < N; i++) {
			maxDeg = Math.max(maxDeg, out[i].length);
			for (let e = 0; e < out[i].length; e++) { const x = out[i][e], at = adjStart[i] + e; adjNode[at] = x.to; adjCost[at] = x.cost; adjPath[at] = x.path; }
		}
		this.adjStart = adjStart; this.adjNode = adjNode; this.adjCost = adjCost; this.adjPath = adjPath; this.maxDeg = maxDeg;
		this.queryPool.length = 0; // their sizes are stale
	}

	/** The route from `from` to `to` (see {@link NavHierarchyQuery}), or null. Same answer as {@link findPathSliced} run to the end. */
	findPath(from: Vec2, to: Vec2, query: NavHierarchyQuery = {}): NavPath | null {
		const s = this.findPathSliced(from, to, query);
		const r = s.step(Infinity);
		return r === undefined ? null : r;
	}

	/**
	 * {@link findPath} spread over calls: each {@link NavHierarchySearch.step} expands at most its budget of nodes (across
	 * all the small searches the query makes) and returns undefined until done. Starts over after a {@link rebuild}. In
	 * "corridor" mode the last search goes on over the grid as it is at each step (like {@link AStarSearch}).
	 */
	findPathSliced(from: Vec2, to: Vec2, query: NavHierarchyQuery = {}): NavHierarchySearch {
		return new NavHierarchySearch(this, from, to, query);
	}

	/** @internal the query as a resumable generator; `budget.left` is topped up by each step. */
	*plan(from: Vec2, to: Vec2, query: NavHierarchyQuery, budget: { left: number; used: number }): Generator<void, NavPath | null, void> {
		const g = this.grid, ties = g.astarTies, maxExpanded = query.maxExpanded ?? 200_000;
		const corridor = query.dynamic === "corridor";
		const stats: NavHierarchyStats = { expanded: 0, abstractExpanded: 0, abstractLength: 0 };
		const run = function* (search: AStarSearch): Generator<void, AStarResult | null, void> {
			try {
				for (;;) {
					if (budget.left <= 0) yield;
					const slice = budget.left, before = search.expanded;
					const r = search.step(slice);
					const used = r === undefined ? search.expanded - before : r ? r.expanded - before : (Number.isFinite(slice) ? slice : 0);
					budget.left -= used; budget.used += used; stats.expanded += used;
					if (r !== undefined) return r;
				}
			} finally { search.dispose(); }
		};
		const s = g.nearestFreeStatic(from), goal = g.nearestFreeStatic(to);
		if (!s || !goal) return null;
		const sc = g.indexOf(s), gc = g.indexOf(goal);
		const scl = this.clusterOf(sc), gcl = this.clusterOf(gc);
		const q = this.takeQuery();
		try {
			q.reset(sc, gc);
			// start -> its cluster's entrances, its cluster's entrances -> goal, and start -> goal inside one cluster
			const sreg = this.region(scl), greg = this.region(gcl);
			for (let e = this.clStart[scl]; e < this.clStart[scl + 1]; e++) {
				const n = this.clNodes[e];
				const r = yield* run(new AStarSearch(sreg, sreg.local(sc), sreg.local(this.nodeCell[n]), { ties, maxExpanded }));
				if (r) q.addStart(n, r.cost, Int32Array.from(r.path, l => sreg.global(l)));
			}
			for (let e = this.clStart[gcl]; e < this.clStart[gcl + 1]; e++) {
				const n = this.clNodes[e];
				const r = yield* run(new AStarSearch(greg, greg.local(this.nodeCell[n]), greg.local(gc), { ties, maxExpanded }));
				if (r) q.addGoal(n, r.cost, Int32Array.from(r.path, l => greg.global(l)));
			}
			if (scl === gcl) {
				const r = yield* run(new AStarSearch(sreg, sreg.local(sc), sreg.local(gc), { ties, maxExpanded }));
				if (r) q.addStart(q.goalId, r.cost, Int32Array.from(r.path, l => sreg.global(l)));
			}
			const before = stats.expanded;
			const top = yield* run(new AStarSearch(q, q.startId, q.goalId, { ties, maxExpanded }));
			stats.abstractExpanded = stats.expanded - before;
			if (!top) return null;
			stats.abstractLength = top.path.length;
			const cells = q.stitch(top.path);
			if (!corridor) return g.finishCells(cells, from, s, goal, true, true);
			// corridor: plain A* (moving obstacles included) inside the clusters the route crosses, one cluster around
			const ds = g.nearestFree(from), dg = g.nearestFree(to);
			if (!ds || !dg) return null;
			const cg = this.takeCorridor();
			try {
				cg.open(cells, this);
				cg.open([g.indexOf(ds), g.indexOf(dg)], this);
				const r = yield* run(new AStarSearch(cg, g.indexOf(ds), g.indexOf(dg), { ties, maxExpanded }));
				return r ? g.finishCells(r.path, from, ds, dg, false, true) : null;
			} finally { this.giveCorridor(cg); }
		} finally {
			this.giveQuery(q);
			this.lastStats = stats;
		}
	}

	/** @internal */
	edges(node: number): { start: number; end: number; nodes: Int32Array; costs: Float64Array; paths: (Int32Array | null)[] } {
		return { start: this.adjStart[node], end: this.adjStart[node + 1], nodes: this.adjNode, costs: this.adjCost, paths: this.adjPath };
	}

	/** @internal */
	cellOfNode(n: number): number {
		return this.nodeCell[n];
	}

	/** @internal */
	get maxDegree(): number {
		return this.maxDeg;
	}

	/** @internal */
	get adjacency(): { start: Int32Array; nodes: Int32Array; costs: Float64Array; paths: (Int32Array | null)[] } {
		return { start: this.adjStart, nodes: this.adjNode, costs: this.adjCost, paths: this.adjPath };
	}

	private takeQuery(): AbstractQuery {
		return this.queryPool.pop() ?? new AbstractQuery(this);
	}

	private giveQuery(q: AbstractQuery): void {
		if (q.size === this.nodeCount + 2 && this.queryPool.length < 8) this.queryPool.push(q);
	}

	private takeCorridor(): CorridorGraph {
		const c = this.corridorPool.pop() ?? new CorridorGraph(this.grid, this.ccols * this.crows);
		c.clear();
		return c;
	}

	private giveCorridor(c: CorridorGraph): void {
		if (this.corridorPool.length < 2) this.corridorPool.push(c);
	}

	/** @internal for CorridorGraph */
	markAround(mask: Uint8Array, cell: number): void {
		const cl = this.clusterOf(cell), cc = cl % this.ccols, cr = (cl / this.ccols) | 0;
		for (let r = Math.max(0, cr - 1); r <= Math.min(this.crows - 1, cr + 1); r++)
			for (let c = Math.max(0, cc - 1); c <= Math.min(this.ccols - 1, cc + 1); c++) mask[r * this.ccols + c] = 1;
	}
}

type IntraPair = { i: number; j: number; cost: number; path: Int32Array };
type IntraCache = { cells: number[]; pairs: IntraPair[] };

function sameCells(a: readonly number[], b: readonly number[]): boolean {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
	return true;
}

/**
 * PER-877: {@link NavHierarchy.findPath} in progress; each {@link step} expands at most its budget of nodes.
 */
export class NavHierarchySearch {
	private gen: Generator<void, NavPath | null, void> | null = null;
	private version = -1;
	private result: NavPath | null | undefined = undefined;
	private readonly budget = { left: 0, used: 0 };

	constructor(readonly hierarchy: NavHierarchy, readonly from: Vec2, readonly to: Vec2, private readonly query: NavHierarchyQuery = {}) {}

	/** True once {@link step} has returned the path (or null). */
	get done(): boolean {
		return this.result !== undefined;
	}

	/** Nodes expanded so far (every small search counted, restarts included). */
	get expanded(): number {
		return this.budget.used;
	}

	/** Expands up to `budget` nodes (at least 1): the path (or null) when finished, else undefined. */
	step(budget: number): NavPath | null | undefined {
		if (this.result !== undefined) return this.result;
		if (this.gen && this.version !== this.hierarchy.version) { this.gen.return(null); this.gen = null; }
		if (!this.gen) { this.version = this.hierarchy.version; this.gen = this.hierarchy.plan(this.from, this.to, this.query, this.budget); }
		this.budget.left = Math.max(1, budget);
		const r = this.gen.next();
		if (!r.done) return undefined;
		this.gen = null;
		return (this.result = r.value);
	}

	/** Abandons the query (frees its bookkeeping). */
	dispose(): void {
		this.gen?.return(null);
		this.gen = null;
		if (this.result === undefined) this.result = null;
	}
}

/**
 * The static grid inside one cluster as a dense graph with local ids (row-major in the cluster): the same edges in the
 * same order as {@link NavGrid.neighborsInto} would list (static obstacles only, kept to the cluster), and the same
 * octile heuristic values, so searches tie-break exactly like the grid's.
 */
class RegionGraph implements AStarGraph {
	readonly size: number;
	readonly maxDegree = 8;
	private readonly cols: number;
	private readonly cell: number;
	private readonly blocked: Uint8Array;
	constructor(grid: NavGrid, readonly c0: number, readonly r0: number, readonly w: number, readonly h: number) {
		this.size = w * h;
		this.cols = grid.cols;
		this.cell = grid.cell;
		this.blocked = grid.blocked;
	}
	local(cell: number): number {
		const r = (cell / this.cols) | 0, c = cell - r * this.cols;
		return (r - this.r0) * this.w + (c - this.c0);
	}
	global(l: number): number {
		const r = (l / this.w) | 0, c = l - r * this.w;
		return (r + this.r0) * this.cols + c + this.c0;
	}
	private free(lc: number, lr: number): boolean {
		return lc >= 0 && lr >= 0 && lc < this.w && lr < this.h && this.blocked[(lr + this.r0) * this.cols + lc + this.c0] !== 1;
	}
	neighborsInto(i: number, nodes: Int32Array, costs: Float64Array): number {
		const w = this.w, lr = (i / w) | 0, lc = i - lr * w, straight = this.cell, diag = SQRT2 * this.cell;
		const up = this.free(lc, lr - 1), down = this.free(lc, lr + 1), left = this.free(lc - 1, lr), right = this.free(lc + 1, lr);
		let k = 0;
		if (up) {
			if (left && this.free(lc - 1, lr - 1)) { nodes[k] = i - w - 1; costs[k++] = diag; }
			nodes[k] = i - w; costs[k++] = straight;
			if (right && this.free(lc + 1, lr - 1)) { nodes[k] = i - w + 1; costs[k++] = diag; }
		}
		if (left) { nodes[k] = i - 1; costs[k++] = straight; }
		if (right) { nodes[k] = i + 1; costs[k++] = straight; }
		if (down) {
			if (left && this.free(lc - 1, lr + 1)) { nodes[k] = i + w - 1; costs[k++] = diag; }
			nodes[k] = i + w; costs[k++] = straight;
			if (right && this.free(lc + 1, lr + 1)) { nodes[k] = i + w + 1; costs[k++] = diag; }
		}
		return k;
	}
	neighbors(i: number, out: AStarEdge[]): void {
		const nodes = new Int32Array(8), costs = new Float64Array(8), k = this.neighborsInto(i, nodes, costs);
		for (let e = 0; e < k; e++) out.push({ node: nodes[e], cost: costs[e] });
	}
	heuristic(a: number, b: number): number {
		const w = this.w, ra = (a / w) | 0, rb = (b / w) | 0;
		const dx = Math.abs((a - ra * w) - (b - rb * w)), dy = Math.abs(ra - rb);
		return (Math.max(dx, dy) + (SQRT2 - 1) * Math.min(dx, dy)) * this.cell;
	}
}

/** One query's entrance graph: the shared nodes 0..N-1 plus the start (N) and goal (N+1) and their links. */
class AbstractQuery implements AStarGraph {
	readonly size: number;
	readonly startId: number;
	readonly goalId: number;
	maxDegree: number;
	private sc = 0;
	private gc = 0;
	private startTo: number[] = [];
	private startCost: number[] = [];
	private startPath: Int32Array[] = [];
	/** goal links by node: index into goalCost/goalPath, or -1 */
	private goalAt: Int32Array;
	private goalNodes: number[] = [];
	private goalCost: number[] = [];
	private goalPath: Int32Array[] = [];
	constructor(private readonly h: NavHierarchy) {
		this.startId = h.nodeCount;
		this.goalId = h.nodeCount + 1;
		this.size = h.nodeCount + 2;
		this.goalAt = new Int32Array(h.nodeCount).fill(-1);
		this.maxDegree = h.maxDegree + 1;
	}
	reset(sc: number, gc: number): void {
		this.sc = sc; this.gc = gc;
		for (const n of this.goalNodes) this.goalAt[n] = -1;
		this.startTo.length = 0; this.startCost.length = 0; this.startPath.length = 0;
		this.goalNodes.length = 0; this.goalCost.length = 0; this.goalPath.length = 0;
		this.maxDegree = this.h.maxDegree + 1;
	}
	addStart(to: number, cost: number, path: Int32Array): void {
		this.startTo.push(to); this.startCost.push(cost); this.startPath.push(path);
		this.maxDegree = Math.max(this.maxDegree, this.startTo.length);
	}
	addGoal(from: number, cost: number, path: Int32Array): void {
		this.goalAt[from] = this.goalNodes.length;
		this.goalNodes.push(from); this.goalCost.push(cost); this.goalPath.push(path);
	}
	private cellOf(n: number): number {
		return n === this.startId ? this.sc : n === this.goalId ? this.gc : this.h.cellOfNode(n);
	}
	heuristic(a: number, b: number): number {
		return this.h.grid.heuristic(this.cellOf(a), this.cellOf(b));
	}
	neighborsInto(n: number, nodes: Int32Array, costs: Float64Array): number {
		if (n === this.startId) {
			for (let e = 0; e < this.startTo.length; e++) { nodes[e] = this.startTo[e]; costs[e] = this.startCost[e]; }
			return this.startTo.length;
		}
		if (n === this.goalId) return 0;
		const adj = this.h.adjacency, s = adj.start[n], e = adj.start[n + 1];
		let k = 0;
		for (let i = s; i < e; i++) { nodes[k] = adj.nodes[i]; costs[k++] = adj.costs[i]; }
		const gi = this.goalAt[n];
		if (gi >= 0) { nodes[k] = this.goalId; costs[k++] = this.goalCost[gi]; }
		return k;
	}
	neighbors(n: number, out: AStarEdge[]): void {
		const nodes = new Int32Array(this.maxDegree), costs = new Float64Array(this.maxDegree), k = this.neighborsInto(n, nodes, costs);
		for (let e = 0; e < k; e++) out.push({ node: nodes[e], cost: costs[e] });
	}
	/** The abstract path as grid cells, start..goal. */
	stitch(path: readonly number[]): number[] {
		const cells: number[] = [this.sc];
		const add = (seg: ArrayLike<number>) => { for (let i = 1; i < seg.length; i++) cells.push(seg[i]); };
		const adj = this.h.adjacency;
		for (let p = 0; p + 1 < path.length; p++) {
			const a = path[p], b = path[p + 1];
			if (a === this.startId) { add(this.startPath[this.startTo.indexOf(b)]); continue; }
			if (b === this.goalId) { add(this.goalPath[this.goalAt[a]]); continue; }
			for (let i = adj.start[a]; i < adj.start[a + 1]; i++) {
				if (adj.nodes[i] !== b) continue;
				const seg = adj.paths[i];
				if (seg) add(seg); else cells.push(this.h.cellOfNode(b));
				break;
			}
		}
		return cells;
	}
}

/** The grid (moving obstacles included) cut down to a set of clusters: the grid's own edges, minus those leaving it. */
class CorridorGraph implements AStarGraph {
	readonly size: number;
	readonly maxDegree = 8;
	private readonly mask: Uint8Array;
	private hier: NavHierarchy | null = null;
	constructor(private readonly grid: NavGrid, clusters: number) {
		this.size = grid.size;
		this.mask = new Uint8Array(clusters);
	}
	clear(): void {
		this.mask.fill(0);
	}
	open(cells: readonly number[], h: NavHierarchy): void {
		this.hier = h;
		for (const c of cells) h.markAround(this.mask, c);
	}
	neighborsInto(i: number, nodes: Int32Array, costs: Float64Array): number {
		const k = this.grid.neighborsInto(i, nodes, costs), h = this.hier!, mask = this.mask;
		let m = 0;
		for (let e = 0; e < k; e++) if (mask[h.clusterOf(nodes[e])] === 1) { nodes[m] = nodes[e]; costs[m++] = costs[e]; }
		return m;
	}
	neighbors(i: number, out: AStarEdge[]): void {
		const nodes = new Int32Array(8), costs = new Float64Array(8), k = this.neighborsInto(i, nodes, costs);
		for (let e = 0; e < k; e++) out.push({ node: nodes[e], cost: costs[e] });
	}
	heuristic(a: number, b: number): number {
		return this.grid.heuristic(a, b);
	}
}
