# BVH Collision Mask Biasing: A Bitwise Heuristic for Heterogeneous Spatial Partitioning

**Author:** Joshua Sideris
**Date:** January 5, 2026  
**Subject:** Optimization of Bounding Volume Hierarchies (BVH) in Physics Engines using logical collision masks.

---

## Abstract

Traditional Bounding Volume Hierarchies (BVH) utilize spatial heuristics, such as the Surface Area Heuristic (SAH), to minimize traversal costs during collision detection. However, in modern game engines, objects are often spatially overlapping but logically filtered via collision masks. This "logical pollution" reduces the pruning efficiency of the BVH. We present a novel approach, **BVH Collision Mask Biasing**, which integrates logical bitmasks directly into the insertion heuristic. Our empirical study demonstrates up to a **11.6x speedup** in high-density heterogeneous environments compared to multi-tree architectures, while maintaining competitive performance in sparse scenarios.

---

## 1. Introduction

Collision detection in 2D and 3D physics engines is typically divided into a broad phase and a narrow phase. The broad phase often employs a BVH to prune the search space. Standard BVH construction focuses exclusively on spatial proximity.

In many applications (e.g., "bullet hell" shooters, complex UI systems, or multi-layered simulations), hundreds of objects may occupy the same spatial region but belong to different collision layers (categories). A standard BVH will group these objects together, forcing the engine to traverse deep into the tree and check AABB overlaps for pairs that are logically guaranteed not to collide.

## 2. The Biasing Heuristic

We propose a modification to the standard insertion cost function. Given an internal node $N$ and a new object with bounds $B$ and collision properties $P$, the cost $C$ of inserting into $N$ is defined as:

$$C(N, B, P) = \Delta Area(N, B) + w \cdot \text{popcount}(P_{cat} \land \neg N_{agg\_cat} + P_{mask} \land \neg N_{agg\_mask})$$

Where:
- $\Delta Area(N, B)$ is the standard SAH increase in surface area.
- $N_{agg\_cat}$ and $N_{agg\_mask}$ are the bitwise OR of all categories and masks in node $N$'s subtree.
- $w$ is the **Mask Weight** (biasing factor).
- $\text{popcount}(x)$ counts the number of set bits in $x$.

This heuristic penalizes "polluting" a branch with new logical categories. As a result, objects with similar collision profiles naturally cluster into distinct subtrees, even when spatially overlapping.

## 3. Methodology

We compared our **Biased Single-Tree** approach against two baselines:
1.  **Standard BVH**: $w = 0$ (SAH-only).
2.  **Multi-Tree Baseline**: A system where each collision category is maintained in its own independent BVH. This is the common industry work-around for high-density layering.

Tests were conducted with 2,000 objects across varying numbers of categories (2 to 32) using both Uniform and Zipfian (Power-law) distributions of objects per category.

---

## 4. Results and Analysis

### 4.1 Scalability in High-Density Environments
In environments where objects are heavily overlapped (the "worst case" for spatial partitioning), the biased tree outperformed the multi-tree baseline significantly as the number of categories increased.

| Categories | Single Tree (ms) | Multi-Tree (ms) | Speedup |
| :--- | :--- | :--- | :--- |
| 4 | 0.1334 | 0.3411 | 2.56x |
| 16 | 0.1191 | 1.3843 | 11.62x |

**Analysis:** The multi-tree architecture suffers from $O(K^2)$ complexity overhead for category-pair management as the number of categories $K$ grows. The biased single-tree maintains $O(1)$ traversal logic while enjoying the pruning benefits of layer separation.

### 4.2 Distribution Sensitivity
Using a **Zipfian distribution** (where 80% of objects belong to 20% of categories), the biased tree remained robust, showing a **5.2x speedup** over multi-tree at 32 categories. This indicates the heuristic effectively prioritizes the most active layers.

### 4.3 The "Golden Ratio" of Weight
Through iterative testing, we identified $w = 1.0$ as the optimal bias weight. At this value:
- Dense scenarios achieve near-maximum speedup.
- Sparse scenarios maintain >85% efficiency compared to pure SAH.

---

## 5. Comparative Architecture Analysis

| Feature | Biased Single-Tree | Multi-Tree Architecture |
| :--- | :--- | :--- |
| **Broad-phase Logic** | Unified, Simple | Complex Pairwise Management |
| **Memory Overhead** | Minimal (Aggregated Bits) | High (Multiple Tree Roots/Allocations) |
| **Dynamic Updates** | Propagates via Parent Chain | Requires Routing to Specific Tree |
| **Worst-Case Culling** | High (Mask-aware pruning) | High (Separate traversals) |

## 6. Conclusion

BVH Collision Mask Biasing is a powerful, low-overhead optimization for dynamic physics engines. It effectively bridges the gap between spatial and logical partitioning. We recommend this approach for engines where memory efficiency and simplicity are prioritized, or where the number of collision layers is high.

---
*Gearbox2D - Engineering Physics for the Web and Beyond.*


