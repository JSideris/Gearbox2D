#include <gtest/gtest.h>
#include "bvh.h"
#include <set>
#include <algorithm>

// Helper function to create a simple AABB
Aabb createAabb(float minX, float minY, float maxX, float maxY) {
    return Aabb(Vec2(minX, minY), Vec2(maxX, maxY));
}

// Helper to count leaves in the tree
int countLeaves(BvhNode* node) {
    if (!node) return 0;
    if (node->isLeaf) return 1;
    return countLeaves(node->left) + countLeaves(node->right);
}

// ========== BASIC TESTS ==========

// Test Bvh insertion
TEST(BvhTest, InsertSingleNode) {
    Bvh bvh;
    Aabb aabb = createAabb(0.0f, 0.0f, 1.0f, 1.0f);
    void* userData = (void*)1;

    BvhNode* node = bvh.insert(aabb, userData);

    ASSERT_NE(node, nullptr);
    EXPECT_FALSE(bvh.empty());
    EXPECT_EQ(bvh.getRoot(), node);
    EXPECT_EQ(node->bounds.min.x, 0.0f);
    EXPECT_EQ(node->bounds.min.y, 0.0f);
    EXPECT_EQ(node->bounds.max.x, 1.0f);
    EXPECT_EQ(node->bounds.max.y, 1.0f);
    EXPECT_EQ(node->data, userData);
}

// Test Bvh insertion of multiple nodes
TEST(BvhTest, InsertMultipleNodes) {
    Bvh bvh;
    Aabb aabb1 = createAabb(0.0f, 0.0f, 1.0f, 1.0f);
    Aabb aabb2 = createAabb(2.0f, 2.0f, 3.0f, 3.0f);
    void* userData1 = (void*)1;
    void* userData2 = (void*)2;

    BvhNode* node1 = bvh.insert(aabb1, userData1);
    BvhNode* node2 = bvh.insert(aabb2, userData2);

    ASSERT_NE(node1, nullptr);
    ASSERT_NE(node2, nullptr);
    EXPECT_EQ(countLeaves(bvh.getRoot()), 2);
    EXPECT_NE(bvh.getRoot(), node1);
    EXPECT_NE(bvh.getRoot(), node2);
    
    // In the new BVH, internal nodes have children. 
    // They might be left/right in any order depending on insertion heuristic.
    EXPECT_TRUE((bvh.getRoot()->left == node1 && bvh.getRoot()->right == node2) ||
                (bvh.getRoot()->left == node2 && bvh.getRoot()->right == node1));
}

// Test Bvh node removal
TEST(BvhTest, RemoveNode) {
    Bvh bvh;
    Aabb aabb = createAabb(0.0f, 0.0f, 1.0f, 1.0f);
    void* userData = (void*)1;
    
    BvhNode* node = bvh.insert(aabb, userData);
    bvh.remove(node);

    EXPECT_TRUE(bvh.empty());
    EXPECT_EQ(bvh.getRoot(), nullptr);
}

// Test Bvh update with significant movement
TEST(BvhTest, UpdateNodeWithSignificantMovement) {
    Bvh bvh;
    Aabb aabb = createAabb(0.0f, 0.0f, 1.0f, 1.0f);
    void* userData = (void*)1;

    BvhNode* node = bvh.insert(aabb, userData);
    Aabb newAabb = createAabb(10.0f, 10.0f, 11.0f, 11.0f);
    bvh.updateLeaf(node, newAabb, node->properties);

    EXPECT_EQ(node->bounds.min.x, 10.0f);
    EXPECT_EQ(node->bounds.min.y, 10.0f);
    EXPECT_EQ(node->bounds.max.x, 11.0f);
    EXPECT_EQ(node->bounds.max.y, 11.0f);
}

// Test Bvh query for overlapping nodes
TEST(BvhTest, QueryOverlappingNodes) {
    Bvh bvh;
    Aabb aabb1 = createAabb(0.0f, 0.0f, 1.0f, 1.0f);
    Aabb aabb2 = createAabb(0.5f, 0.5f, 1.5f, 1.5f);
    Aabb aabb3 = createAabb(2.0f, 2.0f, 3.0f, 3.0f);
    void* userData1 = (void*)1;
    void* userData2 = (void*)2;
    void* userData3 = (void*)3;

    bvh.insert(aabb1, userData1);
    bvh.insert(aabb2, userData2);
    bvh.insert(aabb3, userData3);

    Aabb queryAabb = createAabb(0.0f, 0.0f, 1.0f, 1.0f);
    std::vector<BvhNode*> results;
    bvh.query(queryAabb, results);

    ASSERT_EQ(results.size(), 2);
    
    bool found1 = false;
    bool found2 = false;
    for (auto* node : results) {
        if (node->data == userData1) found1 = true;
        if (node->data == userData2) found2 = true;
    }
    EXPECT_TRUE(found1);
    EXPECT_TRUE(found2);
}

// Test Bvh query for non-overlapping nodes
TEST(BvhTest, QueryNonOverlappingNodes) {
    Bvh bvh;
    Aabb aabb1 = createAabb(0.0f, 0.0f, 1.0f, 1.0f);
    Aabb aabb2 = createAabb(2.0f, 2.0f, 3.0f, 3.0f);
    void* userData1 = (void*)1;
    void* userData2 = (void*)2;

    bvh.insert(aabb1, userData1);
    bvh.insert(aabb2, userData2);

    Aabb queryAabb = createAabb(4.0f, 4.0f, 5.0f, 5.0f);
    std::vector<BvhNode*> results;
    bvh.query(queryAabb, results);

    ASSERT_EQ(results.size(), 0);
}

// ========== CLEAR TESTS ==========

// Test clearing an empty BVH
TEST(BvhTest, ClearEmptyBVH) {
    Bvh bvh;

    // Ensure the tree starts empty
    ASSERT_TRUE(bvh.empty());

    // Call clear on the empty tree
    bvh.clear();

    // Ensure that after clearing, the tree is still empty
    EXPECT_TRUE(bvh.empty());
    EXPECT_EQ(bvh.getRoot(), nullptr);
}

// Test clearing a BVH with one node
TEST(BvhTest, ClearSingleNodeBVH) {
    Bvh bvh;

    // Insert a single AABB into the BVH
    Aabb aabb = createAabb(0.0f, 0.0f, 1.0f, 1.0f);
    void* userData = (void*)1;
    bvh.insert(aabb, userData);

    // Ensure the BVH has one node and it's the root
    ASSERT_FALSE(bvh.empty());
    EXPECT_EQ(countLeaves(bvh.getRoot()), 1);

    // Call clear on the BVH
    bvh.clear();

    // Ensure that the tree is cleared
    EXPECT_TRUE(bvh.empty());
    EXPECT_EQ(bvh.getRoot(), nullptr);
}

// Test clearing a BVH with multiple nodes
TEST(BvhTest, ClearMultipleNodeBVH) {
    Bvh bvh;

    // Insert multiple AABBs into the BVH
    Aabb aabb1 = createAabb(0.0f, 0.0f, 1.0f, 1.0f);
    Aabb aabb2 = createAabb(2.0f, 2.0f, 3.0f, 3.0f);
    Aabb aabb3 = createAabb(4.0f, 4.0f, 5.0f, 5.0f);

    void* userData1 = (void*)1;
    void* userData2 = (void*)2;
    void* userData3 = (void*)3;

    bvh.insert(aabb1, userData1);
    bvh.insert(aabb2, userData2);
    bvh.insert(aabb3, userData3);

    // Ensure the BVH has three leaves
    ASSERT_FALSE(bvh.empty());
    EXPECT_EQ(countLeaves(bvh.getRoot()), 3);

    // Call clear on the BVH
    bvh.clear();

    // Ensure that the tree is cleared
    EXPECT_TRUE(bvh.empty());
    EXPECT_EQ(bvh.getRoot(), nullptr);
}

// ========== TREE STRUCTURE TESTS ==========

// Single insertion should set the root and create a leaf node.
TEST(BvhTest, InsertOneAABB_RootSetAndLeafNode) {
    Bvh bvh;
    
    // Create one AABB
    Aabb aabb = createAabb(0.0f, 0.0f, 1.0f, 1.0f);
    void* userData = (void*)1;
    
    // Insert the AABB into the BVH
    bvh.insert(aabb, userData);
    
    // Verify that root is set and is a leaf node
    ASSERT_NE(bvh.getRoot(), nullptr);
    EXPECT_TRUE(bvh.getRoot()->isLeaf);
    EXPECT_EQ(bvh.getRoot()->data, userData);
    
    // Verify that left and right are null
    EXPECT_EQ(bvh.getRoot()->left, nullptr);
    EXPECT_EQ(bvh.getRoot()->right, nullptr);
}

// Insert two AABBs should set the root and create two leaf nodes.
TEST(BvhTest, InsertTwoAABBs_RootHasTwoLeafNodes) {
    Bvh bvh;
    
    // Create two overlapping AABBs
    Aabb aabb1 = createAabb(0.0f, 0.0f, 1.0f, 1.0f);
    Aabb aabb2 = createAabb(0.5f, 0.5f, 1.5f, 1.5f);
    void* userData1 = (void*)1;
    void* userData2 = (void*)2;
    
    // Insert the AABBs into the BVH
    bvh.insert(aabb1, userData1);
    bvh.insert(aabb2, userData2);
    
    // Verify that root is set and not a leaf node
    ASSERT_NE(bvh.getRoot(), nullptr);
    EXPECT_FALSE(bvh.getRoot()->isLeaf);
    
    // Verify that left and right are set and are both leaf nodes
    ASSERT_NE(bvh.getRoot()->left, nullptr);
    ASSERT_NE(bvh.getRoot()->right, nullptr);
    EXPECT_TRUE(bvh.getRoot()->left->isLeaf);
    EXPECT_TRUE(bvh.getRoot()->right->isLeaf);
    
    // Verify data
    std::set<void*> foundData = {bvh.getRoot()->left->data, bvh.getRoot()->right->data};
    EXPECT_EQ(foundData.size(), 2);
    EXPECT_TRUE(foundData.count(userData1));
    EXPECT_TRUE(foundData.count(userData2));
}

// Test Bvh collision detection
TEST(BvhTest, DetectCollisions_SingleCollision) {
    Bvh bvh;

    // Insert two overlapping AABBs
    Aabb aabb1 = createAabb(0.0f, 0.0f, 1.0f, 1.0f);
    void* userData1 = (void*)1;
    bvh.insert(aabb1, userData1);

    Aabb aabb2 = createAabb(0.5f, 0.5f, 1.5f, 1.5f);
    void* userData2 = (void*)2;
    bvh.insert(aabb2, userData2);

    // Detect collisions
    bvh.detectCollisions();

    // Assert that one collision was detected
    ASSERT_EQ(bvh.collisionPairs.size(), 1);
    
    // Order might be different
    void* first = bvh.collisionPairs[0].first;
    void* second = bvh.collisionPairs[0].second;
    EXPECT_TRUE((first == userData1 && second == userData2) || (first == userData2 && second == userData1));
}

// Test Bvh collision detection with no collisions
TEST(BvhTest, DetectCollisions_NoCollision) {
    Bvh bvh;

    // Insert two non-overlapping AABBs
    Aabb aabb1 = createAabb(0.0f, 0.0f, 1.0f, 1.0f);
    void* userData1 = (void*)1;
    bvh.insert(aabb1, userData1);

    Aabb aabb2 = createAabb(2.0f, 2.0f, 3.0f, 3.0f);
    void* userData2 = (void*)2;
    bvh.insert(aabb2, userData2);

    // Detect collisions
    bvh.detectCollisions();

    // Assert that no collisions were detected
    ASSERT_EQ(bvh.collisionPairs.size(), 0);
}

// ========== ADVANCED FILTERING & OPTIMIZATION TESTS ==========

// Test collision filtering based on categories and masks
TEST(BvhTest, DetectCollisions_CategoryFiltering) {
    Bvh bvh;
    Aabb overlapAabb = createAabb(0, 0, 1, 1);
    
    // Object A: Dynamic, collides with Static
    CollisionProperties propsA;
    propsA.userCategory = CATEGORY_DYNAMIC;
    propsA.userMask = CATEGORY_STATIC;
    propsA.systemCategory = CATEGORY_DYNAMIC;
    
    // Object B: Dynamic, collides with All
    CollisionProperties propsB;
    propsB.userCategory = CATEGORY_DYNAMIC;
    propsB.userMask = CATEGORY_ALL;
    propsB.systemCategory = CATEGORY_DYNAMIC;
    
    bvh.insert(overlapAabb, (void*)1, propsA);
    bvh.insert(overlapAabb, (void*)2, propsB);
    
    bvh.detectCollisions();
    // Should NOT collide because Object A only collides with Static, but Object B is Dynamic
    EXPECT_EQ(bvh.collisionPairs.size(), 0);
    
    // Object C: Static, collides with All
    CollisionProperties propsC;
    propsC.userCategory = CATEGORY_STATIC;
    propsC.userMask = CATEGORY_ALL;
    propsC.systemCategory = CATEGORY_STATIC;
    
    bvh.insert(overlapAabb, (void*)3, propsC);
    
    bvh.detectCollisions();
    // 1-2: No (from above)
    // 1-3: Yes (A is Dynamic/Static-mask, C is Static/All-mask)
    // 2-3: Yes (B is Dynamic/All-mask, C is Static/All-mask)
    EXPECT_EQ(bvh.collisionPairs.size(), 2);
}

// Test sleeping logic: sleeping objects don't collide with each other
TEST(BvhTest, DetectCollisions_SleepLogic) {
    Bvh bvh;
    Aabb overlapAabb = createAabb(0, 0, 1, 1);
    
    BvhNode* node1 = bvh.insert(overlapAabb, (void*)1);
    BvhNode* node2 = bvh.insert(overlapAabb, (void*)2);
    
    // Both awake -> should collide
    bvh.detectCollisions();
    EXPECT_EQ(bvh.collisionPairs.size(), 1);
    
    // One sleeps -> should still collide (awake vs sleep)
    node1->sleep();
    bvh.detectCollisions();
    EXPECT_EQ(bvh.collisionPairs.size(), 1);
    
    // Both sleep -> should NOT collide
    node2->sleep();
    bvh.detectCollisions();
    EXPECT_EQ(bvh.collisionPairs.size(), 0);
    
    // Wake one up -> should collide again
    node1->wakeUp();
    bvh.detectCollisions();
    EXPECT_EQ(bvh.collisionPairs.size(), 1);
}

// Test special exclusions: point vs point and non-rigid sensors
TEST(BvhTest, DetectCollisions_SpecialExclusions) {
    Bvh bvh;
    Aabb overlapAabb = createAabb(0, 0, 1, 1);
    
    // Points don't collide with points
    CollisionProperties pointProps;
    pointProps.systemCategory = CATEGORY_POINT;
    
    bvh.insert(overlapAabb, (void*)1, pointProps);
    bvh.insert(overlapAabb, (void*)2, pointProps);
    
    bvh.detectCollisions();
    EXPECT_EQ(bvh.collisionPairs.size(), 0);
    
    // Non-rigid sensors don't collide with other non-rigid sensors
    bvh.clear();
    CollisionProperties sensorProps;
    sensorProps.systemCategory = CATEGORY_SENSOR;
    sensorProps.isRigid = false;
    
    bvh.insert(overlapAabb, (void*)3, sensorProps);
    bvh.insert(overlapAabb, (void*)4, sensorProps);
    
    bvh.detectCollisions();
    EXPECT_EQ(bvh.collisionPairs.size(), 0);
    
    // Sensor vs Rigid should collide
    CollisionProperties rigidProps;
    rigidProps.systemCategory = CATEGORY_DYNAMIC;
    rigidProps.isRigid = true;
    
    bvh.insert(overlapAabb, (void*)5, rigidProps);
    bvh.detectCollisions();
    // 3-4: No
    // 3-5: Yes
    // 4-5: Yes
    EXPECT_EQ(bvh.collisionPairs.size(), 2);
}

// Test property propagation to ancestors
TEST(BvhTest, PropertyPropagation) {
    Bvh bvh;
    
    // Create a tree with multiple nodes to ensure we have ancestors
    CollisionProperties p1; p1.userCategory = CATEGORY_DYNAMIC; p1.systemCategory = CATEGORY_DYNAMIC; p1.isSleeping = true;
    CollisionProperties p2; p2.userCategory = CATEGORY_DYNAMIC; p2.systemCategory = CATEGORY_DYNAMIC; p2.isSleeping = true;
    CollisionProperties p3; p3.userCategory = CATEGORY_STATIC;  p3.systemCategory = CATEGORY_STATIC;  p3.isSleeping = true;
    
    BvhNode* n1 = bvh.insert(createAabb(0,0,1,1), (void*)1, p1);
    BvhNode* n2 = bvh.insert(createAabb(2,2,3,3), (void*)2, p2);
    BvhNode* n3 = bvh.insert(createAabb(4,4,5,5), (void*)3, p3);
    
    BvhNode* root = bvh.getRoot();
    ASSERT_NE(root, nullptr);
    EXPECT_FALSE(root->isLeaf);
    
    // Initially all sleeping
    EXPECT_FALSE(root->aggregated.containsAwake);
    EXPECT_TRUE((root->aggregated.containsUserCategories & CATEGORY_DYNAMIC) != 0);
    EXPECT_TRUE((root->aggregated.containsUserCategories & CATEGORY_STATIC) != 0);
    
    // Wake up one leaf, check ancestor propagation
    n1->wakeUp();
    EXPECT_TRUE(root->aggregated.containsAwake);
    
    // Change category and check propagation
    CollisionProperties newProps = n3->properties;
    newProps.userCategory = CATEGORY_SENSOR;
    newProps.systemCategory = CATEGORY_SENSOR;
    n3->updateProperties(newProps);
    
    EXPECT_TRUE((root->aggregated.containsUserCategories & CATEGORY_SENSOR) != 0);
    // Static should be gone if n3 was the only static object
    EXPECT_FALSE((root->aggregated.containsUserCategories & CATEGORY_STATIC) != 0);
}
