#include <gtest/gtest.h>
#include "bvh.h"

// Helper to check if two leaf nodes share the same parent
bool shareParent(BvhNode* a, BvhNode* b) {
    return a && b && a->parent == b->parent && a->parent != nullptr;
}

TEST(BvhBiasingTest, ClusteringByMask) {
    Bvh bvh;
    Aabb overlapAabb(Vec2(0, 0), Vec2(1, 1));

    // Profile A
    CollisionProperties propsA;
    propsA.userCategory = 1 << 4;
    propsA.userMask = 1 << 4;

    // Profile B
    CollisionProperties propsB;
    propsB.userCategory = 1 << 5;
    propsB.userMask = 1 << 5;

    // Insert 4 objects in the same spot, alternating profiles: A1, B1, A2, B2
    // With spatial-only SAH, A2 would likely join with the nearest node (B1) or root.
    // With biasing, A2 should strongly prefer joining A1's branch.
    
    BvhNode* a1 = bvh.insert(overlapAabb, (void*)1, propsA);
    BvhNode* b1 = bvh.insert(overlapAabb, (void*)2, propsB);
    BvhNode* a2 = bvh.insert(overlapAabb, (void*)3, propsA);
    BvhNode* b2 = bvh.insert(overlapAabb, (void*)4, propsB);

    // Verify clustering:
    // a1 and a2 should share a parent (internal node with aggregated Profile A)
    // b1 and b2 should share a parent (internal node with aggregated Profile B)
    EXPECT_TRUE(shareParent(a1, a2)) << "Objects with same profile should cluster together when spatially identical";
    EXPECT_TRUE(shareParent(b1, b2)) << "Objects with same profile should cluster together when spatially identical";
    
    // The internal nodes should also share the root parent
    EXPECT_EQ(a1->parent->parent, b1->parent->parent);
    EXPECT_EQ(a1->parent->parent, bvh.getRoot());
}

TEST(BvhBiasingTest, SpatialPriorityOverMask) {
    Bvh bvh;
    
    // Spatial fit should still dominate if the distances are large enough.
    // Group 1 at (0,0)
    Aabb aabb1(Vec2(0, 0), Vec2(1, 1));
    // Group 2 at (100,100)
    Aabb aabb2(Vec2(100, 100), Vec2(101, 101));

    CollisionProperties propsA; propsA.userCategory = 1 << 4;
    CollisionProperties propsB; propsB.userCategory = 1 << 5;

    BvhNode* n1_A = bvh.insert(aabb1, (void*)1, propsA);
    BvhNode* n2_B = bvh.insert(aabb2, (void*)2, propsB);
    
    // Insert n3_A at (100,100). 
    // It matches n1_A's mask but is 100 units away.
    // It differs from n2_B's mask but is in the same spot.
    BvhNode* n3_A = bvh.insert(aabb2, (void*)3, propsA);

    EXPECT_TRUE(shareParent(n2_B, n3_A)) << "Spatial fit should win over mask fit at large distances";
}


