# Navigation (Pathfinding)

Gearbox2D can plan paths for many agents natively. Each world has one nav grid of cells, each blocked or free. Path requests queue up during the tick, and `world.findPaths(budget)` runs all of them in **one** WASM call. Results come back through a shared `Float64Array`.

The planner is a C++ port of gear3engine's g3e-ai `NavGrid` (typed-array A*) and `NavHierarchy` (HPA*). It uses the same rasterisation, neighbour order, tie-breaking, smoothing and options, so it returns the same paths as the JS version, point for point. `scripts/nav-parity-test.mjs` checks this on 30 seeded worlds.

To see it running, open the **Nav Arena** showcase (`showcase.html#nav-arena`). Twelve bots cross a maze, sliding gates and drifting crates, with one batched `findPaths` call per tick. Its source is `site/examples/showcase/nav-arena.ts`.

```js
import gearbox, { NAV_MODE, NAV_STATUS } from "gearbox2d";
```

## Creating the grid

```js
const nav = world.createNav({ minX: 0, minY: 0, maxX: 32, maxY: 20 }, { cell: 0.25, clearance: 0.4 });
nav.cols; // 128
nav.rows; // 80
```

`world.createNav(bounds, options)` makes the world's grid and returns a `Nav`. A world has one grid, and calling `createNav` again replaces it, dropping its obstacles, hierarchy, tracking and queued requests. `world.nav` returns the current grid, or `null` if there is none.

| Option | Default | Meaning |
|---|---|---|
| `cell` | `1` | Cell size in world units. |
| `clearance` | `0` | Obstacles are inflated by this much. Use the agent radius plus a margin, so a path through free cells keeps the agent's whole body clear. |
| `blockEdges` | `true` | Also keep `clearance` away from the bounds. |
| `rasterize` | `"touching"` | `"touching"`: every cell an obstacle overlaps, plus cells within the clearance. `"centers"`: only cells whose centre lies within it. |
| `atGoal` | `"goal"` | Start and goal in the same cell: `"goal"` returns `[goal]`, `"empty"` returns no points. |
| `nearestFreeOutside` | `"center"` | For a point outside the bounds next to a free cell, the nearest free spot is that cell's centre, or with `"point"`, the point itself. |
| `astarTies` | `"lowerH"` | How A* breaks ties between equal-f nodes: `"lowerH"` or `"heap"` (plain binary-heap order). |

`nav.indexOf({ x, y })` gives the row-major cell index of a point, or `-1` outside the bounds. `nav.cell` and `nav.bounds` are read-only copies of what you passed.

## Static obstacles

There are three ways to block cells, and they can be mixed.

**Shapes.** These are rasterised natively, with the same rules as `NavGrid`:

```js
nav.addBox({ x: 10, y: 4, w: 6, h: 0.5, angle: 0.3 }); // centre, size, rotation in radians
nav.addDisc({ x: 20, y: 12, r: 1.5, keepOut: 0.5 });   // keepOut: extra inflation beyond the clearance
```

**Physics bodies.** Use `nav.track(mask)` to block the cells of every fixture whose `categoryBits & mask` is non-zero, inflated by the clearance. Fixtures created later are picked up automatically, and removed bodies free their cells. Sensors are skipped unless you pass `{ sensors: true }`, and `nav.track(0)` turns tracking off.

```js
const WALLS = 1, DOORS = 2;
nav.track(WALLS | DOORS);
world.createBody({ type: gearbox.bodyTypes.FIXED_OBJECT, x: 5, y: 5, shape: gearbox.shapes.BOX, width: 4, height: 0.3, categoryBits: WALLS });
```

Tracking is how a door or a moving platform works: move the body (a kinematic body with a velocity, or set `x`/`y`), and its cells follow. `world.step()` only notes which tracked fixtures moved. Their cells, and the hierarchy clusters they touch, are updated at the start of the next `findPaths`, or when you call `nav.syncStatic()`, so physics steps never pay for pathfinding. Cells are tested against the fixture's real shape at its current pose, not its broadphase AABB. That means a hand-moved body is placed correctly at the next sync, even though [spatial queries](interaction-queries.md) only see it after the next step.

**A mask.** `nav.setStaticMask(mask)` copies a finished `cols * rows` array (1 = blocked) into the base layer, for example a JS `NavGrid`'s `blocked`. For partial edits, write into `nav.base` and then call `nav.commitBase(c0, r0, c1, r1)` with the inclusive cell rectangle you changed. Called with no arguments, it commits the whole grid.

```js
const base = nav.base;              // Uint8Array view into WASM memory
base[nav.indexOf({ x: 3, y: 3 })] = 1;
nav.commitBase();                   // applied at the next sync
```

`nav.blocked` is what A* treats as static (base layer plus tracked fixtures), as of the last sync. Call `nav.syncStatic()` first if you need it up to date right after creating bodies, for example to flood-fill the reachable area before picking spawn points.

## Moving obstacles

Moving obstacles are discs, inflated by the clearance, with the same semantics as `NavGrid.setDynamicObstacles` / `pushDynamicObstacles` / `popDynamicObstacles`. Use them for things that move every tick, such as crates, other units or a fire zone. They cost nothing until a search reads them, and they never touch the hierarchy.

```js
// every tick, before findPaths:
nav.setDynamicObstacles(crates.map((c) => ({ x: c.x, y: c.y, r: 0.57 })));

nav.pushDynamicObstacles([fireZone]); // a temporary extra layer
nav.popDynamicObstacles();            // removes the last pushed layer
nav.dynamicLayers;                    // how many layers are on
```

`setDynamicObstacles` replaces everything, including pushed layers. Plain grid A* and the HPA corridor avoid moving obstacles, but plain HPA ignores them (see the modes below).

A request can also carry its own `discs`, which are pushed only while that request searches, for example a detour around one threat:

```js
nav.request(bot.id, bot.pos, bot.goal, { discs: [{ x: enemy.x, y: enemy.y, r: 3 }] });
```

Call `setDynamicObstacles` / `pushDynamicObstacles` **before** you queue requests that carry discs in the same tick. They share one staging buffer, so the order is enforced and the wrong order throws.

## Hierarchy (HPA*)

```js
nav.buildHierarchy({ cluster: 16, wideEntrance: 6 });
nav.hierarchyStats; // { nodes, edges } — entrance nodes and directed edges, 0 before buildHierarchy
```

`buildHierarchy` splits the grid into `cluster × cluster` cell blocks and links their entrances. An entrance at least `wideEntrance` cells wide gets a node at each end instead of one in the middle. Long routes are then searched on that small graph and only refined at the cell level near the ends, which costs far fewer expansions than grid A* across a big map.

The hierarchy covers the static cells only. When they change (tracked fixtures move, `addBox`/`addDisc` are called, or you commit `base`), only the clusters that touch the changed cells are rebuilt, at the next sync. In the arena example a sliding gate costs about 0.1 ms per rebuild. Calling `buildHierarchy` again rebuilds everything, and requests in flight start over on the new hierarchy.

## Requests and `findPaths`

```js
// During the tick. Nothing crosses into WASM yet.
nav.request(bot.id, bot.pos, bot.target);                                     // plain A*
nav.request(scout.id, scout.pos, flag, { mode: NAV_MODE.HPA });               // hierarchical, walls only
nav.request(runner.id, runner.pos, base, { mode: NAV_MODE.HPA_CORRIDOR, maxExpanded: 50000 });

// Once per tick, after world.step():
for (const r of world.findPaths(6000, 150)) {
	if (r.status === NAV_STATUS.PATH) bots.get(r.id).follow(r.points);
	else bots.get(r.id).pickAnotherGoal();
}
```

| Mode | Same as | Sees | Use for |
|---|---|---|---|
| `NAV_MODE.GRID` | `NavGrid.findPath` | walls, moving obstacles and the request's `discs` | short hops, or small grids |
| `NAV_MODE.HPA` | `NavHierarchy.findPath` | walls only | long routes where moving things don't matter (strategic planning) |
| `NAV_MODE.HPA_CORRIDOR` | `NavHierarchy.findPath(.., { dynamic: "corridor" })` | walls first, then moving obstacles inside the route's clusters | long routes that must dodge moving things |

An HPA or corridor request made before `buildHierarchy` finishes with `NO_HIERARCHY`.

**Budget.** `world.findPaths(budget, minSlice = 0)` (or `nav.findPaths`) runs queued requests oldest first, until `budget` A* node expansions have been spent across the whole call. A request that runs out of budget keeps its search state and **continues next tick**, so a long route spreads over several ticks instead of causing a spike. `minSlice` gives every queued request at least that many expansions even after the budget is spent, so new requests are never starved by one huge search. Pass `Infinity` to finish everything now. `maxExpanded` (default 200 000) gives up on a single search, like the JS planner, and the request finishes with `NO_PATH`.

**Results.** Each result is `{ id, status, expanded, length, points }`:

- `id` is the number you passed to `request`. Ids are yours, so a sequence number per request makes it easy to drop a stale answer.
- `status` is `NAV_STATUS.PATH`, `NO_PATH`, `NO_HIERARCHY` or `BAD_REQUEST` (unknown mode).
- `points` are the waypoints after the start, ending at the goal, or at the free spot nearest to it when the goal is blocked. A blocked start is moved to the nearest free cell the same way.
- `length` is the polyline length from the start through every point.
- `expanded` counts the nodes this request expanded, over every slice and restart.

Only requests that finished in this call are returned. Unfinished ones carry over.

**Managing the queue.**

```js
nav.cancel(id);        // drop one queued request (no result is reported)
nav.clearRequests();   // drop all of them
nav.queued;            // requests waiting in WASM (not counting ones staged since the last findPaths)
nav.lastExpanded;      // nodes expanded by the last findPaths / findPath call
```

If you re-plan an agent while its previous request is still in flight, either `cancel` the old id or ignore results whose id is no longer the agent's latest.

**One path right now.** `nav.findPath(from, to, { mode, maxExpanded })` runs a single search to completion in its own WASM call and leaves the queue alone. It's handy in tools and tests, but in a game loop prefer the queue.

## Allocation-free results

`nav.findPathsRaw(budget, minSlice)` returns only the count of finished requests. Read them straight from `nav.out`:

```js
const n = nav.findPathsRaw(6000);
const out = nav.out; // out[0] = count, then per result [id, status, expanded, length, nPoints, x0, y0, x1, y1, ...]
for (let k = 0, at = 1; k < n; k++) {
	const id = out[at], status = out[at + 1], nPoints = out[at + 4];
	for (let i = 0; i < nPoints; i++) follow(id, out[at + 5 + 2 * i], out[at + 6 + 2 * i]);
	at += 5 + 2 * nPoints;
}
```

`nav.results()` decodes the same view into objects. That is what `findPaths` returns.

## Freeing

`nav.destroy()` frees the grid, its hierarchy, tracking and queue. `world.clear()` keeps the grid but forgets the cleared bodies, so tracked cells free themselves at the next sync. A new `world.createNav` replaces the old grid, which you don't need to destroy first. Destroying the world frees everything.

## Caveats

- **Views are short-lived.** `nav.out`, `nav.base` and `nav.blocked` point into WASM memory. They are valid until the next nav call, or anything that can grow the heap. Re-read the property instead of keeping the array.
- **Buffers never shrink.** Request, disc and result buffers grow to the largest batch you have used, and stay that size until the grid is destroyed. The same goes for the query buffers.
- **Tracked moves apply lazily.** A moved door is in the grid only after the next `findPaths` / `syncStatic`. Paths planned before that still go through it, so re-plan the agents whose route crosses it (the arena example replans everyone when a gate starts or stops).
- **HPA ignores moving obstacles.** Use `HPA_CORRIDOR` or `GRID` when they matter.
- **Grid paths are not steering.** Paths keep `clearance` from walls and moving discs, but not from other agents. Agents still need local avoidance, which a batched [`queryRadiusBatch`](interaction-queries.md) makes cheap.

## Performance

On the Saucers ctf map (400 × 400 cells, 150 routes over 150 m), native plain A* runs about 1.1–1.15× faster than the JS typed-array A* in V8. HPA and the HPA corridor run about 1.3× faster, and building the hierarchy is about 3× faster (about 11 ms vs 35 ms). The search is limited by heap and memory traffic, which V8 already handles well. The bigger gains come from batching: one crossing per tick (about 0.1 µs for an empty call), and time-sliced requests that spread the work across ticks. `scripts/nav-bench.mjs` reproduces these numbers.
