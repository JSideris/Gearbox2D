# Broad Phase

Gearbox2D uses a Dynamic Bounding Volume Hierarchy (BVH) for its broad phase collision detection. To maximize performance, the BVH employs several "logical biasing" techniques during object insertion. These heuristics encourage objects with similar physical properties to cluster together, allowing the engine to prune entire subtrees of potential collisions early in the detection process.

## Biasing Optimizations

The insertion cost is calculated using a Surface Area Heuristic (SAH) combined with several experimental weights.

### 1. Spatial Fit (SAH)
The fundamental heuristic. Objects prefer to be inserted into branches where they cause the smallest increase in total surface area.

### 2. Sleep Biasing
Sleeping objects are biased to group with other sleeping objects. 
*   **Why?** The engine can skip self-collision checks for subtrees containing only sleeping objects ($O(1)$ pruning).

### 3. Mask & Category Biasing
Objects with similar collision filters (user-defined categories and masks) prefer to cluster.
*   **Why?** If a dynamic object is spatially near a static object but their masks don't allow interaction, logical biasing keeps them in separate branches to avoid unnecessary AABB tests.

### 4. Static Island Biasing
Static level geometry is strongly encouraged to form "pure" static branches.
*   **Why?** Static-vs-Static checks are common and entirely unnecessary. Pure static branches can be skipped globally during broadphase.

### 5. Body Biasing
Multiple fixtures belonging to the same physical `Body` are biased to stay together.
*   **Why?** Fixtures on the same body almost never collide with each other. Grouping them allows for massive early pruning.

### 6. Sensor Biasing
Triggers and sensors are grouped separately from rigid physical bodies.
*   **Why?** Sensors often have unique collision rules (e.g., they might ignore environment tiles but look for players).

### 7. Velocity Biasing
Objects moving in similar directions or at similar speeds are encouraged to cluster.
*   **Why?** This improves the efficiency of "Fat AABBs" and can be a precursor to advanced continuous collision detection (CCD) optimizations.

## Experimental Tuning

All bias weights are internally adjustable, allowing for fine-grained performance tuning based on the specific needs of a simulation (e.g., high body counts vs. high particle counts).
