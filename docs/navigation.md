# Navigation (Pathfinding)

Gearbox2D can plan paths for many agents natively. Each world has one nav grid (cells marked blocked or free). Path requests queue up during the tick, and `world.findPaths(budget)` runs them all in **one** WASM call. Results come back through a shared `Float64Array`.

The planner is a C++ port of gear3engine's g3e-ai `NavGrid` (typed-array A*) and `NavHierarchy` (HPA*). It uses the same rasterisation, neighbour order, tie-breaking, smoothing and options, so it returns the same paths as the JS version, point for point. `scripts/nav-parity-test.mjs` checks this on 30 seeded worlds.

## Setup

```js
const nav = world.createNav({ minX: -200, minY: -200, maxX: 200, maxY: 200 }, {
	cell: 1,            // cell size (world units)
	clearance: 2,       // obstacles are inflated by this (agent radius + margin)
	rasterize: "centers", // or "touching" (default)
	atGoal: "empty",    // same-cell start/goal: no points (default "goal")
	nearestFreeOutside: "point",
	astarTies: "heap",  // or "lowerH" (default)
});

// Static obstacles go straight into the grid:
for (const w of walls) nav.addBox(w);      // { x, y, w, h, angle }
nav.addDisc({ x: 10, y: 5, r: 3 });

// ...or take them from the physics world: fixtures whose categoryBits match the mask block their cells.
nav.track(CATEGORY_WALLS);

// ...or copy a finished mask (cols * rows, 1 = blocked), e.g. a JS NavGrid's `blocked`.
nav.setStaticMask(jsGrid.blocked);

nav.buildHierarchy({ cluster: 16 }); // optional, needed for HPA requests
```

`world.step()` only notes which tracked fixtures moved. Their cells, and the hierarchy clusters they touch, are updated at the start of the next `findPaths` (or by calling `nav.syncStatic()`). Physics steps never pay for pathfinding.

## Moving obstacles

These use the same semantics as `NavGrid.setDynamicObstacles` / `pushDynamicObstacles` / `popDynamicObstacles`: discs inflated by the clearance, which plain A* and the HPA corridor avoid. HPA alone ignores them.

```js
nav.setDynamicObstacles(rocks.map((r) => ({ x: r.x, y: r.y, r: r.radius })));
nav.pushDynamicObstacles([fireZone]); // a temporary layer
nav.popDynamicObstacles();
```

## Requests

```js
// During the tick (no WASM crossing):
nav.request(bot.id, bot.pos, bot.target);                                   // plain A*
nav.request(other.id, other.pos, flag, { mode: NAV_MODE.HPA });             // hierarchical, walls only
nav.request(third.id, third.pos, base, { mode: NAV_MODE.HPA_CORRIDOR, discs: [threat] });

// Once per tick, after step():
for (const r of world.findPaths(20000)) {
	if (r.status === NAV_STATUS.PATH) bots.get(r.id).follow(r.points);
}
```

| Mode | Same as | Sees |
|---|---|---|
| `NAV_MODE.GRID` | `NavGrid.findPath` | walls + moving obstacles + the request's `discs` |
| `NAV_MODE.HPA` | `NavHierarchy.findPath` | walls only |
| `NAV_MODE.HPA_CORRIDOR` | `NavHierarchy.findPath(.., { dynamic: "corridor" })` | walls, then moving obstacles inside the route's clusters |

The `budget` caps A* node expansions across the whole call. Requests run oldest first. A request that runs out of budget keeps its search state and continues next tick, so a long route spreads over several ticks instead of causing a spike. `minSlice` gives every queued request at least that many nodes even after the budget is spent. `nav.cancel(id)` and `nav.clearRequests()` drop queued requests. `maxExpanded` (default 200 000) gives up on a single search, like the JS planner.

A result is `{ id, status, expanded, length, points }`. `points` are the waypoints after the start, ending at the goal (or the free spot nearest to it). Status is `PATH`, `NO_PATH`, `NO_HIERARCHY` (an HPA request before `buildHierarchy`), or `BAD_REQUEST`.

For a single path right now there is `nav.findPath(from, to, { mode })`. It makes its own WASM call and leaves the queue alone.

### Allocation-free results

`nav.findPathsRaw(budget)` returns only the count. Then read `nav.out` directly: `out[0]` = count, then for each result `[id, status, expanded, length, nPoints, x0, y0, x1, y1, ...]`. The view stays valid until the next nav call.

## Performance

On the Saucers ctf map (400 × 400 cells, 150 routes over 150 m), native plain A* runs about 1.1–1.15× faster than the JS typed-array A* in V8, HPA and the HPA corridor about 1.3× faster, and building the hierarchy about 3× faster (about 11 ms vs 35 ms). The search is limited by heap and memory traffic, which V8 already handles well. The bigger gains come from batching: one crossing per tick (about 0.1 µs for an empty call) and time-sliced requests that spread work across ticks. `scripts/nav-bench.mjs` reproduces these numbers.
