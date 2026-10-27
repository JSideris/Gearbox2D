// Vendored verbatim from gear3engine plugins/g3e-ai/src/astar.ts at develop 339add4 (PER-871 parity reference). Do not edit.
/** One outgoing edge: target node id and its (non-negative) cost. */
export type AStarEdge = { node: number; cost: number };

/**
 * An implicit graph for {@link astar}. Node ids are numbers; the graph is never materialised.
 * `heuristic` must not overestimate the remaining cost (admissible) for the path to be cheapest.
 */
export interface AStarGraph {
	/** Push the edges leaving `node` into `out` (it arrives empty). */
	neighbors(node: number, out: AStarEdge[]): void;
	/** Estimated cost from `a` to `b`; 0 everywhere turns A* into Dijkstra. */
	heuristic(a: number, b: number): number;
	/** If node ids are exactly 0..size-1, bookkeeping uses flat typed arrays (much faster on big grids). */
	readonly size?: number;
	/**
	 * Optional allocation-free form of {@link neighbors} (PER-568): write the edges leaving `node` into
	 * `nodes` / `costs` (room for {@link maxDegree} entries) and return how many. It must list exactly
	 * the same edges in the same order as `neighbors`; astar then uses it instead.
	 */
	neighborsInto?(node: number, nodes: Int32Array, costs: Float64Array): number;
	/** Upper bound on edges per node, required with {@link neighborsInto}. */
	readonly maxDegree?: number;
}

export type AStarOptions = {
	/** Give up (return null) after expanding this many nodes. Default 200 000. */
	maxExpanded?: number;
	/**
	 * How equal-f open entries are ordered. "lowerH" (default): lower h first, then insertion order
	 * ({@link AStarHeap}). "heap" (opt-in): no tie rule, entries pop in whatever order a plain binary
	 * min-heap on f gives ({@link PlainAStarHeap}). Use it to reproduce searches made with such a heap.
	 */
	ties?: "lowerH" | "heap";
};

export type AStarResult = {
	/** start..goal inclusive. */
	path: number[];
	cost: number;
	/** Nodes expanded (closed) before reaching the goal: a measure of search effort. */
	expanded: number;
};

/**
 * Binary min-heap of node ids keyed by f = g + h. Ties are broken deterministically: lower h first
 * (the entry closer to the goal, so A* runs straight through plateaus), then insertion order.
 * PER-870: typed-array storage that grows and is reused across searches; (f, h, order) is a strict
 * total order, so the pop sequence is exactly the one of the previous array heap.
 */
export class AStarHeap {
	private ids = new Int32Array(64);
	private f = new Float64Array(64);
	private h = new Float64Array(64);
	private order = new Float64Array(64);
	private n = 0;
	private counter = 0;

	get size(): number {
		return this.n;
	}

	/** Empties the heap (and restarts insertion order) for reuse. */
	clear(): void {
		this.n = 0;
		this.counter = 0;
	}

	private grow(): void {
		const cap = this.ids.length * 2;
		const ids = new Int32Array(cap), f = new Float64Array(cap), h = new Float64Array(cap), o = new Float64Array(cap);
		ids.set(this.ids); f.set(this.f); h.set(this.h); o.set(this.order);
		this.ids = ids; this.f = f; this.h = h; this.order = o;
	}

	push(id: number, f: number, h: number): void {
		if (this.n === this.ids.length) this.grow();
		const I = this.ids, F = this.f, H = this.h, O = this.order;
		const o = this.counter++;
		let i = this.n++;
		while (i > 0) {
			const p = (i - 1) >> 1;
			const fp = F[p];
			if (f > fp || (f === fp && (h > H[p] || (h === H[p] && o > O[p])))) break; // !(new < parent)
			I[i] = I[p]; F[i] = fp; H[i] = H[p]; O[i] = O[p];
			i = p;
		}
		I[i] = id; F[i] = f; H[i] = h; O[i] = o;
	}

	pop(): number {
		const I = this.ids, F = this.f, H = this.h, O = this.order;
		const top = I[0];
		const n = --this.n;
		if (n > 0) {
			const id = I[n], f = F[n], h = H[n], o = O[n];
			let i = 0;
			for (;;) {
				const l = 2 * i + 1;
				if (l >= n) break;
				let m = l;
				const r = l + 1;
				if (r < n && (F[r] < F[l] || (F[r] === F[l] && (H[r] < H[l] || (H[r] === H[l] && O[r] < O[l]))))) m = r;
				if (!(F[m] < f || (F[m] === f && (H[m] < h || (H[m] === h && O[m] < o))))) break;
				I[i] = I[m]; F[i] = F[m]; H[i] = H[m]; O[i] = O[m];
				i = m;
			}
			I[i] = id; F[i] = f; H[i] = h; O[i] = o;
		}
		return top;
	}
}

/**
 * Plain binary min-heap of node ids keyed by f only (no tie rule): equal keys pop in the order the
 * sift-up/sift-down below happens to leave them. Deterministic, but tie order depends on the push/pop
 * history. Used by `astar(..., { ties: "heap" })`. PER-870: the same sifts on reused typed arrays.
 */
export class PlainAStarHeap {
	/** PER-870: [key, id] pairs interleaved in one array (one cache line per entry). */
	private e = new Float64Array(128);
	private n = 0;

	get size(): number {
		return this.n;
	}

	/** Empties the heap for reuse. */
	clear(): void {
		this.n = 0;
	}

	push(id: number, f: number, _h?: number): void {
		if (2 * this.n === this.e.length) { const e = new Float64Array(this.e.length * 2); e.set(this.e); this.e = e; }
		const e = this.e;
		let i = this.n++;
		while (i > 0) {
			const p = (i - 1) >> 1;
			const kp = e[2 * p];
			if (kp <= f) break;
			e[2 * i] = kp;
			e[2 * i + 1] = e[2 * p + 1];
			i = p;
		}
		e[2 * i] = f;
		e[2 * i + 1] = id;
	}

	pop(): number {
		const e = this.e;
		const top = e[1];
		const n = --this.n;
		const key = e[2 * n], id = e[2 * n + 1];
		if (n > 0) {
			let i = 0;
			for (;;) {
				let c = 2 * i + 1;
				if (c >= n) break;
				let kc = e[2 * c];
				if (c + 1 < n) { const k2 = e[2 * c + 2]; if (k2 < kc) { c++; kc = k2; } }
				if (kc >= key) break;
				e[2 * i] = kc;
				e[2 * i + 1] = e[2 * c + 1];
				i = c;
			}
			e[2 * i] = key;
			e[2 * i + 1] = id;
		}
		return top;
	}
}

type OpenHeap = AStarHeap | PlainAStarHeap;

/** PER-870: idle heaps kept for the next search (a search takes one and gives it back). */
const heapPool: { lowerH: AStarHeap[]; heap: PlainAStarHeap[] } = { lowerH: [], heap: [] };
function takeHeap(ties: AStarOptions["ties"]): OpenHeap {
	const h = ties === "heap" ? heapPool.heap.pop() ?? new PlainAStarHeap() : heapPool.lowerH.pop() ?? new AStarHeap();
	h.clear();
	return h;
}
function giveHeap(h: OpenHeap): void {
	if (h instanceof PlainAStarHeap) { if (heapPool.heap.length < 8) heapPool.heap.push(h); }
	else if (heapPool.lowerH.length < 8) heapPool.lowerH.push(h);
}

interface Book {
	g(n: number): number;
	setG(n: number, v: number, from: number): void;
	from(n: number): number;
	closed(n: number): boolean;
	close(n: number): void;
}

/**
 * Flat bookkeeping for graphs with node ids 0..size-1, reused across searches on the same graph
 * (PER-568): a generation stamp marks which entries belong to the current search, so nothing is
 * allocated or cleared per call.
 */
class DenseBook {
	readonly g: Float64Array;
	readonly came: Int32Array;
	/** stamp[n] === gen: g/came set this search; === gen + 1: closed too. */
	readonly stamp: Uint32Array;
	gen = 0;
	busy = false;
	/** PER-870: neighbour scratch for neighborsInto (room for maxDegree). */
	nodes: Int32Array | null = null;
	costs: Float64Array | null = null;
	constructor(readonly size: number) {
		this.g = new Float64Array(size);
		this.came = new Int32Array(size);
		this.stamp = new Uint32Array(size);
	}
	begin(): void {
		this.gen += 2;
		if (this.gen >= 0xfffffff0) { this.stamp.fill(0); this.gen = 2; }
	}
	scratch(deg: number): void {
		if (!this.nodes || this.nodes.length < deg) { this.nodes = new Int32Array(deg); this.costs = new Float64Array(deg); }
	}
}

const denseBooks = new WeakMap<AStarGraph, DenseBook>();

function denseBookFor(graph: AStarGraph, size: number): DenseBook {
	let b = denseBooks.get(graph);
	if (!b || b.size !== size || b.busy) {
		b = new DenseBook(size);
		if (!denseBooks.get(graph)?.busy) denseBooks.set(graph, b);
	}
	b.begin();
	return b;
}

/** PER-870: idle books for time-sliced searches (each live {@link AStarSearch} owns one). */
const sliceBooks = new WeakMap<AStarGraph, DenseBook[]>();

function sparseBook(): Book {
	const g = new Map<number, number>();
	const came = new Map<number, number>();
	const closed = new Set<number>();
	return {
		g: n => g.get(n) ?? Infinity,
		setG: (n, v, f) => { g.set(n, v); came.set(n, f); },
		from: n => came.get(n) ?? -1,
		closed: n => closed.has(n),
		close: n => { closed.add(n); },
	};
}

/**
 * Cheapest path from `start` to `goal` (inclusive) with A*, or null if the goal is unreachable or
 * the search exceeds `maxExpanded`. Deterministic: the same graph always yields the same path.
 * Node ids must be non-negative.
 */
export function astar(graph: AStarGraph, start: number, goal: number, options: AStarOptions = {}): AStarResult | null {
	const maxExpanded = options.maxExpanded ?? 200_000;
	const open = takeHeap(options.ties);
	try {
		if (graph.size !== undefined && graph.size > 0) {
			const book = denseBookFor(graph, graph.size);
			book.busy = true;
			try {
				const st = new DenseState(graph, book, open, start, goal, maxExpanded);
				return st.run(Infinity) as AStarResult | null;
			} finally {
				book.busy = false;
			}
		}
		return sparseAstar(graph, start, goal, maxExpanded, open);
	} finally {
		giveHeap(open);
	}
}

function sparseAstar(graph: AStarGraph, start: number, goal: number, maxExpanded: number, open: OpenHeap): AStarResult | null {
	const book = sparseBook();
	const edges: AStarEdge[] = [];
	book.setG(start, 0, -1);
	const h0 = graph.heuristic(start, goal);
	open.push(start, h0, h0);
	let expanded = 0;
	while (open.size) {
		const cur = open.pop();
		if (book.closed(cur)) continue; // stale heap entry
		if (cur === goal) {
			const path = [cur];
			for (let n = book.from(cur); n >= 0; n = book.from(n)) path.push(n);
			return { path: path.reverse(), cost: book.g(goal), expanded };
		}
		book.close(cur);
		if (++expanded > maxExpanded) return null;
		edges.length = 0;
		graph.neighbors(cur, edges);
		const gc = book.g(cur);
		for (const { node, cost } of edges) {
			if (cost < 0) throw new Error(`astar: negative edge cost ${cost} (${cur} -> ${node})`);
			if (book.closed(node)) continue;
			const t = gc + cost;
			if (t < book.g(node)) {
				book.setG(node, t, cur);
				const h = graph.heuristic(node, goal);
				open.push(node, t + h, h);
			}
		}
	}
	return null;
}

/**
 * One dense search in progress (the same expansion order as the sparse loop above): the one-shot
 * {@link astar} runs it to the end, {@link AStarSearch} a slice at a time.
 */
class DenseState {
	expanded = 0;
	result: AStarResult | null | undefined = undefined;
	private readonly edges: AStarEdge[] = [];
	private readonly into: boolean;
	constructor(readonly graph: AStarGraph, readonly book: DenseBook, readonly open: OpenHeap, start: number, readonly goal: number, readonly maxExpanded: number) {
		this.into = !!(graph.neighborsInto && graph.maxDegree);
		if (this.into) book.scratch(graph.maxDegree!);
		book.g[start] = 0; book.came[start] = -1; book.stamp[start] = book.gen;
		const h0 = graph.heuristic(start, goal);
		open.push(start, h0, h0);
	}

	/** Expands up to `slice` nodes; the result once done (null: no path / over maxExpanded), else undefined. */
	run(slice: number): AStarResult | null | undefined {
		if (this.result !== undefined) return this.result;
		const graph = this.graph, book = this.book, open = this.open, goal = this.goal, maxExpanded = this.maxExpanded;
		const G = book.g, came = book.came, stamp = book.stamp, gen = book.gen, closedGen = gen + 1;
		const nodes = book.nodes!, costs = book.costs!, into = this.into, edges = this.edges;
		let expanded = this.expanded, done = 0;
		try {
			while (open.size) {
				if (done >= slice) return undefined;
				const cur = open.pop();
				if (stamp[cur] === closedGen) continue; // stale heap entry
				if (cur === goal) {
					const path = [cur];
					for (let n = came[cur]; n >= 0; n = came[n]) path.push(n);
					return (this.result = { path: path.reverse(), cost: G[goal], expanded });
				}
				stamp[cur] = closedGen;
				done++;
				if (++expanded > maxExpanded) return (this.result = null);
				const gc = G[cur];
				if (into) {
					const k = graph.neighborsInto!(cur, nodes, costs);
					for (let e = 0; e < k; e++) {
						const node = nodes[e], cost = costs[e];
						if (cost < 0) throw new Error(`astar: negative edge cost ${cost} (${cur} -> ${node})`);
						const sn = stamp[node];
						if (sn === closedGen) continue;
						const t = gc + cost;
						if (t < (sn >= gen ? G[node] : Infinity)) {
							G[node] = t; came[node] = cur; stamp[node] = gen;
							const h = graph.heuristic(node, goal);
							open.push(node, t + h, h);
						}
					}
				} else {
					edges.length = 0;
					graph.neighbors(cur, edges);
					for (let e = 0; e < edges.length; e++) {
						const node = edges[e].node, cost = edges[e].cost;
						if (cost < 0) throw new Error(`astar: negative edge cost ${cost} (${cur} -> ${node})`);
						const sn = stamp[node];
						if (sn === closedGen) continue;
						const t = gc + cost;
						if (t < (sn >= gen ? G[node] : Infinity)) {
							G[node] = t; came[node] = cur; stamp[node] = gen;
							const h = graph.heuristic(node, goal);
							open.push(node, t + h, h);
						}
					}
				}
			}
			return (this.result = null);
		} finally {
			this.expanded = expanded;
		}
	}
}

/**
 * PER-870: a resumable (time-sliced) A* on a dense graph (`size` set): {@link step} expands at most
 * `slice` nodes and returns undefined while the search is unfinished, then the same result a one-shot
 * {@link astar} would give for the same graph, start, goal and options (same path, cost and expanded).
 * The graph must not change between slices (a caller whose graph changed starts a new search). Owns
 * its bookkeeping until done or {@link dispose}d, so several can be in flight at once.
 */
export class AStarSearch {
	private state: DenseState | null;
	private readonly heap: OpenHeap;
	private readonly book: DenseBook;
	private final: AStarResult | null | undefined = undefined;

	constructor(readonly graph: AStarGraph, start: number, goal: number, options: AStarOptions = {}) {
		const size = graph.size;
		if (size === undefined || !(size > 0)) throw new Error("AStarSearch: needs a dense graph (size > 0)");
		let free = sliceBooks.get(graph);
		if (!free) sliceBooks.set(graph, free = []);
		let book = free.pop();
		while (book && book.size !== size) book = free.pop();
		book ??= new DenseBook(size);
		book.begin();
		this.book = book;
		this.heap = takeHeap(options.ties);
		this.state = new DenseState(graph, book, this.heap, start, goal, options.maxExpanded ?? 200_000);
	}

	/** Nodes expanded so far. */
	get expanded(): number {
		return this.state?.expanded ?? this.final?.expanded ?? 0;
	}

	/** True once {@link step} has returned the result (or the search was disposed). */
	get done(): boolean {
		return !this.state;
	}

	/** Expands up to `slice` nodes (at least 1): the result when finished (null = no path), else undefined. */
	step(slice: number): AStarResult | null | undefined {
		if (!this.state) return this.final ?? null;
		const r = this.state.run(Math.max(1, Math.floor(slice)));
		if (r === undefined) return undefined;
		this.final = r;
		this.dispose();
		return r;
	}

	/** Gives the bookkeeping back (call it to abandon an unfinished search). */
	dispose(): void {
		if (!this.state) return;
		this.state = null;
		giveHeap(this.heap);
		const free = sliceBooks.get(this.graph);
		if (free && free.length < 4) free.push(this.book);
	}
}
