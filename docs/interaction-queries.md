# Spatial Queries

Every query walks the BVH broadphase first and then runs an exact shape test on its few candidates. None of them iterate every body, so they stay cheap as the world grows. Use them instead of scanning your own body list.

| Query | Finds |
|---|---|
| `queryBodiesAtPoint(x, y, mask)` / `queryFixturesAtPoint` | shapes containing a point |
| `queryAABB(minX, minY, maxX, maxY, opts)` | bodies overlapping an axis-aligned box |
| `queryRadius(x, y, radius, opts)` | bodies overlapping a circle |
| `raycast(x1, y1, x2, y2, opts)` | the closest hit along a segment, or `null` |
| `raycastAll(x1, y1, x2, y2, opts)` | every hit along a segment, nearest first |
| `queryRadiusBatch(queries, exclude?, opts)` | many radius queries in **one** WASM call |

For paths (grid A* / HPA*, batched once per tick) see [Navigation](navigation.md).

## Filters

All queries take `{ mask, skipSensors }`. A fixture matches when `(categoryBits & mask) != 0`, the same rule as `queryBodiesAtPoint`. `skipSensors: true` ignores sensor fixtures (usually what you want for line of sight). Raycasts also take `exclude` (a body to ignore, such as the shooter) and, for `raycastAll`, `uniqueBodies`.

```js
const nearby = world.queryRadius(ship.x, ship.y, 25, { mask: CATEGORY_SHIPS });
const crates = world.queryAABB(0, 0, 10, 10);

const hit = world.raycast(gun.x, gun.y, aimX, aimY, { exclude: ship, skipSensors: true });
if (hit) console.log(hit.body.id, hit.fraction, hit.x, hit.y, hit.nx, hit.ny);
```

A raycast hit has `fraction` (0..1 along the segment), the hit point and the surface normal. A ray that starts inside a shape hits it at `fraction` 0 with the normal pointing back along the ray. `POINT` fixtures have no area, so rays never hit them (box and radius queries still find them).

Results are deterministic: hits are ordered by fixture creation order (rays: by distance, then fixture order), independent of how the BVH tree happens to be shaped.

## Batched neighbour queries

`queryRadiusBatch` runs one radius query per centre in a single call into WASM, for example every agent's neighbours each tick:

```js
const queries = [];
for (const a of agents) queries.push(a.body.x, a.body.y, 30);
const neighbours = world.queryRadiusBatch(queries, agents.map((a) => a.body)); // exclude self
// neighbours[i] is a Body[] for agents[i]
```

## Allocation-free API

The `*Raw` methods return a hit count and leave the results in reused typed arrays inside WASM memory, so a hot loop allocates nothing:

- `world.queryHits`: `[internalFixtureId, internalBodyId]` pairs. Map with `world.bodyByInternalId(id)` / `world.fixtureByInternalId(id)`, or compare against `body.internalId`.
- `world.rayHits`: `[fraction, x, y, nx, ny]` per hit (raycasts only).
- `world.batchOffsets`: hits of batch query `i` are pairs `batchOffsets[i]` to `batchOffsets[i + 1]`.

```js
const n = world.queryRadiusRaw(x, y, 20, mask, QUERY_FLAGS.UNIQUE_BODIES);
for (let i = 0; i < n; i++) handle(world.queryHits[i * 2 + 1]);

const { centers, exclude } = world.batchInput(agents.length); // [x, y, radius] per query
// ...fill centers / exclude (internal body id or -1)...
const total = world.queryRadiusBatchRaw(agents.length, mask, QUERY_FLAGS.UNIQUE_BODIES);
```

`QUERY_FLAGS` are `UNIQUE_BODIES` (one hit per body), `SKIP_SENSORS` and `RAY_ALL`. The arrays are only valid until the next query on that world; re-read `world.queryHits` after each call, and call `batchInput()` again before filling a new batch.

## Sensor-vs-sensor contacts

By default two sensors never report contacts with each other. Opt a sensor in with the fixture option `sensorContacts: true` (or `fixture.sensorContacts = true` at runtime). A pair of sensors reports `onCollisionStart` / `onCollisionEnd` only when **both** opted in and their category/mask filters allow it. Nothing changes for fixtures that don't opt in. Sensors still never push each other.

```js
world.createBody({ ..., isSensor: true, wantsEvents: true, sensorContacts: true });
```

A fixed (static) sensor and a moving sensor already reported contacts before this option existed; that is unchanged.
