#include <gtest/gtest.h>
#include "bvh.h"

// Helper function to create a simple AABB
Aabb createAabb(float minX, float minY, float maxX, float maxY) {
    return Aabb(Vec2(minX, minY), Vec2(maxX, maxY));
}

// ========== BASIC TESTS ==========

// Test Bvh insertion
TEST(BvhTest, InsertSingleNode) {
    Bvh bvh;
    Aabb aabb = createAabb(0.0f, 0.0f, 1.0f, 1.0f);
    void* userData = (void*)1;

    TreeNode* node = bvh.insert(aabb, userData);

    ASSERT_NE(node, nullptr);
    EXPECT_EQ(bvh._nodeCount, 1);
    EXPECT_EQ(bvh._root, node);
    EXPECT_EQ(node->aabb.min.x, 0.0f);
    EXPECT_EQ(node->aabb.min.y, 0.0f);
    EXPECT_EQ(node->aabb.max.x, 1.0f);
    EXPECT_EQ(node->aabb.max.y, 1.0f);
    EXPECT_EQ(node->userData, userData);
}

// Test Bvh insertion of multiple nodes
TEST(BvhTest, InsertMultipleNodes) {
    Bvh bvh;
    Aabb aabb1 = createAabb(0.0f, 0.0f, 1.0f, 1.0f);
    Aabb aabb2 = createAabb(2.0f, 2.0f, 3.0f, 3.0f);
    void* userData1 = (void*)1;
    void* userData2 = (void*)2;

    TreeNode* node1 = bvh.insert(aabb1, userData1);
    TreeNode* node2 = bvh.insert(aabb2, userData2);

    ASSERT_NE(node1, nullptr);
    ASSERT_NE(node2, nullptr);
    EXPECT_EQ(bvh._nodeCount, 2);
    EXPECT_NE(bvh._root, node1);
    EXPECT_NE(bvh._root, node2);
    EXPECT_EQ(bvh._root->left, node1);
    EXPECT_EQ(bvh._root->right, node2);
}

// Test Bvh node removal
TEST(BvhTest, RemoveNode) {
    Bvh bvh;
    Aabb aabb = createAabb(0.0f, 0.0f, 1.0f, 1.0f);
    void* userData = (void*)1;
    
    TreeNode* node = bvh.insert(aabb, userData);
    bvh.remove(node);

    EXPECT_EQ(bvh._nodeCount, 0);
    EXPECT_EQ(bvh._root, nullptr);
}

// Test Bvh update with significant movement
TEST(BvhTest, UpdateNodeWithSignificantMovement) {
    Bvh bvh;
    Aabb aabb = createAabb(0.0f, 0.0f, 1.0f, 1.0f);
    void* userData = (void*)1;

    TreeNode* node = bvh.insert(aabb, userData);
    Aabb newAabb = createAabb(10.0f, 10.0f, 11.0f, 11.0f);
    bvh.update(node, newAabb);

    EXPECT_EQ(node->aabb.min.x, 10.0f);
    EXPECT_EQ(node->aabb.min.y, 10.0f);
    EXPECT_EQ(node->aabb.max.x, 11.0f);
    EXPECT_EQ(node->aabb.max.y, 11.0f);
}

// Test Bvh update with insignificant movement (no update needed)
// Don't think that this is required.
// TEST(BvhTest, UpdateNodeWithInsignificantMovement) {
//     Bvh bvh;
//     Aabb aabb = createAabb(0.0f, 0.0f, 1.0f, 1.0f);
//     void* userData = (void*)1;
//     TreeNode* node = bvh.insert(aabb, userData);
//     Aabb newAabb = createAabb(0.1f, 0.1f, 1.1f, 1.1f);
//     bvh.update(node, newAabb);
//     // Since the center hasn't moved significantly, the node should not have been reinserted
//     EXPECT_EQ(node->aabb.min.x, 0.0f);
//     EXPECT_EQ(node->aabb.min.y, 0.0f);
//     EXPECT_EQ(node->aabb.max.x, 1.0f);
//     EXPECT_EQ(node->aabb.max.y, 1.0f);
// }

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
    std::vector<void*> results;
    bvh.query(queryAabb, results);

    ASSERT_EQ(results.size(), 2);
    EXPECT_TRUE(std::find(results.begin(), results.end(), userData1) != results.end());
    EXPECT_TRUE(std::find(results.begin(), results.end(), userData2) != results.end());
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
    std::vector<void*> results;
    bvh.query(queryAabb, results);

    ASSERT_EQ(results.size(), 0);
}

// ========== CLEAR TESTS ==========

// Test clearing an empty BVH
TEST(BvhTest, ClearEmptyBVH) {
    Bvh bvh;

    // Ensure the tree starts empty
    ASSERT_EQ(bvh._root, nullptr);
    ASSERT_EQ(bvh._nodeCount, 0);

    // Call clear on the empty tree
    bvh.clear();

    // Ensure that after clearing, the tree is still empty
    EXPECT_EQ(bvh._root, nullptr);
    EXPECT_EQ(bvh._nodeCount, 0);
}

// Test clearing a BVH with one node
TEST(BvhTest, ClearSingleNodeBVH) {
    Bvh bvh;

    // Insert a single AABB into the BVH
    Aabb aabb = createAabb(0.0f, 0.0f, 1.0f, 1.0f);
    void* userData = (void*)1;
    bvh.insert(aabb, userData);

    // Ensure the BVH has one node and it's the root
    ASSERT_NE(bvh._root, nullptr);
    EXPECT_EQ(bvh._nodeCount, 1);

    // Call clear on the BVH
    bvh.clear();

    // Ensure that the tree is cleared
    EXPECT_EQ(bvh._root, nullptr);
    EXPECT_EQ(bvh._nodeCount, 0);
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

    // Ensure the BVH has three nodes
    ASSERT_NE(bvh._root, nullptr);
    EXPECT_EQ(bvh._nodeCount, 3);

    // Call clear on the BVH
    bvh.clear();

    // Ensure that the tree is cleared
    EXPECT_EQ(bvh._root, nullptr);
    EXPECT_EQ(bvh._nodeCount, 0);
}

// Test calling clear multiple times in a row
TEST(BvhTest, ClearMultipleTimes) {
    Bvh bvh;

    // Insert some AABBs into the BVH
    Aabb aabb1 = createAabb(0.0f, 0.0f, 1.0f, 1.0f);
    Aabb aabb2 = createAabb(2.0f, 2.0f, 3.0f, 3.0f);
    void* userData1 = (void*)1;
    void* userData2 = (void*)2;

    bvh.insert(aabb1, userData1);
    bvh.insert(aabb2, userData2);

    // Ensure the BVH has nodes
    ASSERT_NE(bvh._root, nullptr);
    EXPECT_EQ(bvh._nodeCount, 2);

    // Call clear for the first time
    bvh.clear();
    EXPECT_EQ(bvh._root, nullptr);
    EXPECT_EQ(bvh._nodeCount, 0);

    // Call clear again on the already cleared tree
    bvh.clear();
    EXPECT_EQ(bvh._root, nullptr);
    EXPECT_EQ(bvh._nodeCount, 0);
}

// Test clearing a BVH after inserting and then removing some nodes
TEST(BvhTest, ClearAfterInsertionsAndRemovals) {
    Bvh bvh;

    // Insert multiple AABBs into the BVH
    Aabb aabb1 = createAabb(0.0f, 0.0f, 1.0f, 1.0f);
    Aabb aabb2 = createAabb(2.0f, 2.0f, 3.0f, 3.0f);
    Aabb aabb3 = createAabb(4.0f, 4.0f, 5.0f, 5.0f);

    void* userData1 = (void*)1;
    void* userData2 = (void*)2;
    void* userData3 = (void*)3;

    TreeNode* node1 = bvh.insert(aabb1, userData1);
    TreeNode* node2 = bvh.insert(aabb2, userData2);
    TreeNode* node3 = bvh.insert(aabb3, userData3);

    // Ensure the BVH has three nodes
    ASSERT_NE(bvh._root, nullptr);
    EXPECT_EQ(bvh._nodeCount, 3);

    // Remove one of the nodes
    bvh.remove(node2);
    EXPECT_EQ(bvh._nodeCount, 2);

    // Call clear on the BVH
    bvh.clear();

    // Ensure that the tree is cleared
    EXPECT_EQ(bvh._root, nullptr);
    EXPECT_EQ(bvh._nodeCount, 0);
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
    
    // Verify that _root is set and is a leaf node
    ASSERT_NE(bvh._root, nullptr);  // _root should be set
    EXPECT_TRUE(bvh._root->isLeaf());  // The root should be a leaf node
    EXPECT_EQ(bvh._root->userData, userData);  // Check if userData is correct
    
    // Verify that either left or right is set, but not both
    EXPECT_EQ(bvh._root->left, nullptr);  // As a leaf node, left should be null
    EXPECT_EQ(bvh._root->right, nullptr);  // As a leaf node, right should be null
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
    
    // Verify that _root is set and not a leaf node
    ASSERT_NE(bvh._root, nullptr);
    EXPECT_FALSE(bvh._root->isLeaf());  // The root should not be a leaf node
    
    // Verify that left and right are set and are both leaf nodes
    ASSERT_NE(bvh._root->left, nullptr);  // Left child should be set
    ASSERT_NE(bvh._root->right, nullptr);  // Right child should be set
    EXPECT_TRUE(bvh._root->left->isLeaf());  // Left child should be a leaf node
    EXPECT_TRUE(bvh._root->right->isLeaf());  // Right child should be a leaf node
    
    // Verify that the left and right nodes contain the correct user data
    EXPECT_EQ(bvh._root->left->userData, userData1);
    EXPECT_EQ(bvh._root->right->userData, userData2);
}

// Insert three AABBs should set the root and create an internal node with two leaf children.
TEST(BvhTest, InsertThreeAABBs_RootAndInternalNodes) {
    Bvh bvh;
    
    // Create three AABBs
    Aabb aabb1 = createAabb(0.0f, 0.0f, 1.0f, 1.0f);
    Aabb aabb2 = createAabb(1.0f, 1.0f, 2.0f, 2.0f);
    Aabb aabb3 = createAabb(0.5f, 0.5f, 1.5f, 1.5f);
    void* userData1 = (void*)1;
    void* userData2 = (void*)2;
    void* userData3 = (void*)3;
    
    // Insert the AABBs into the BVH
    bvh.insert(aabb1, userData1);
    bvh.insert(aabb2, userData2);
    bvh.insert(aabb3, userData3);
    
    // Verify that _root is set and not a leaf node
    ASSERT_NE(bvh._root, nullptr);
    EXPECT_FALSE(bvh._root->isLeaf());  // The root should not be a leaf node
    
    // Verify that left and right are set
    ASSERT_NE(bvh._root->left, nullptr);  // Left child should be set
    ASSERT_NE(bvh._root->right, nullptr);  // Right child should be set
    
    // Check if only one child is a leaf node and the other has two leaf children
    if (bvh._root->left->isLeaf()) {
        EXPECT_TRUE(bvh._root->left->isLeaf());
        EXPECT_FALSE(bvh._root->right->isLeaf());  // Right should be an internal node
        
        // Right should have two leaf children
        ASSERT_NE(bvh._root->right->left, nullptr);
        ASSERT_NE(bvh._root->right->right, nullptr);
        EXPECT_TRUE(bvh._root->right->left->isLeaf());
        EXPECT_TRUE(bvh._root->right->right->isLeaf());
    } else if (bvh._root->right->isLeaf()) {
        EXPECT_TRUE(bvh._root->right->isLeaf());
        EXPECT_FALSE(bvh._root->left->isLeaf());  // Left should be an internal node
        
        // Left should have two leaf children
        ASSERT_NE(bvh._root->left->left, nullptr);
        ASSERT_NE(bvh._root->left->right, nullptr);
        EXPECT_TRUE(bvh._root->left->left->isLeaf());
        EXPECT_TRUE(bvh._root->left->right->isLeaf());
    } else {
        FAIL() << "Neither child of _root is a leaf node, which is unexpected.";
    }
}

// Unbalanced tree.
TEST(BvhTest, InsertFourAABBs_UnbalancedTree) {
    Bvh bvh;
    
    // Create four sequential AABBs from left to right
    Aabb aabb1 = createAabb(0.0f, 0.0f, 1.0f, 1.0f);  // Far left
    Aabb aabb2 = createAabb(1.1f, 0.0f, 2.1f, 1.0f);  // Right of aabb1
    Aabb aabb3 = createAabb(2.2f, 0.0f, 3.2f, 1.0f);  // Right of aabb2
    Aabb aabb4 = createAabb(3.3f, 0.0f, 4.3f, 1.0f);  // Far right

    void* userData1 = (void*)1;
    void* userData2 = (void*)2;
    void* userData3 = (void*)3;
    void* userData4 = (void*)4;

    // Insert the AABBs into the BVH
    bvh.insert(aabb1, userData1);
    bvh.insert(aabb2, userData2);
    bvh.insert(aabb3, userData3);
    bvh.insert(aabb4, userData4);

    // Verify that _root is set and not a leaf node
    ASSERT_NE(bvh._root, nullptr);
    EXPECT_FALSE(bvh._root->isLeaf());  // The root should not be a leaf node

    // Now check that one of the root's children is a leaf, and the other is an internal node
    TreeNode* root = bvh._root;
    TreeNode* left = root->left;
    TreeNode* right = root->right;

    ASSERT_NE(left, nullptr);
    ASSERT_NE(right, nullptr);

    if (left->isLeaf()) {
        // If left is a leaf, the right child should be an internal node
        EXPECT_EQ(left->userData, userData1);  // Left should be the first AABB inserted
        EXPECT_FALSE(right->isLeaf());  // Right should not be a leaf

        // Verify that one child of right is a leaf, and the other is an internal node with two leafs
        ASSERT_NE(right->left, nullptr);
        ASSERT_NE(right->right, nullptr);

        TreeNode* rightLeft = right->left;
        TreeNode* rightRight = right->right;

        if (rightLeft->isLeaf()) {
            EXPECT_EQ(rightLeft->userData, userData2);  // rightLeft should be the second AABB
            EXPECT_FALSE(rightRight->isLeaf());  // rightRight should not be a leaf

            // rightRight should have two leaf children
            ASSERT_NE(rightRight->left, nullptr);
            ASSERT_NE(rightRight->right, nullptr);
            EXPECT_TRUE(rightRight->left->isLeaf());
            EXPECT_TRUE(rightRight->right->isLeaf());
            EXPECT_EQ(rightRight->left->userData, userData3);  // Third AABB
            EXPECT_EQ(rightRight->right->userData, userData4);  // Fourth AABB
        } else {
            EXPECT_EQ(rightRight->userData, userData2);  // rightRight should be the second AABB
            EXPECT_FALSE(rightLeft->isLeaf());  // rightLeft should not be a leaf

            // rightLeft should have two leaf children
            ASSERT_NE(rightLeft->left, nullptr);
            ASSERT_NE(rightLeft->right, nullptr);
            EXPECT_TRUE(rightLeft->left->isLeaf());
            EXPECT_TRUE(rightLeft->right->isLeaf());
            EXPECT_EQ(rightLeft->left->userData, userData3);  // Third AABB
            EXPECT_EQ(rightLeft->right->userData, userData4);  // Fourth AABB
        }
    } else if (right->isLeaf()) {
        // If right is a leaf, the left child should be an internal node
        EXPECT_EQ(right->userData, userData1);  // Right should be the first AABB inserted
        EXPECT_FALSE(left->isLeaf());  // Left should not be a leaf

        // Verify that one child of left is a leaf, and the other is an internal node with two leafs
        ASSERT_NE(left->left, nullptr);
        ASSERT_NE(left->right, nullptr);

        TreeNode* leftLeft = left->left;
        TreeNode* leftRight = left->right;

        if (leftLeft->isLeaf()) {
            EXPECT_EQ(leftLeft->userData, userData2);  // leftLeft should be the second AABB
            EXPECT_FALSE(leftRight->isLeaf());  // leftRight should not be a leaf

            // leftRight should have two leaf children
            ASSERT_NE(leftRight->left, nullptr);
            ASSERT_NE(leftRight->right, nullptr);
            EXPECT_TRUE(leftRight->left->isLeaf());
            EXPECT_TRUE(leftRight->right->isLeaf());
            EXPECT_EQ(leftRight->left->userData, userData3);  // Third AABB
            EXPECT_EQ(leftRight->right->userData, userData4);  // Fourth AABB
        } else {
            EXPECT_EQ(leftRight->userData, userData2);  // leftRight should be the second AABB
            EXPECT_FALSE(leftLeft->isLeaf());  // leftLeft should not be a leaf

            // leftLeft should have two leaf children
            ASSERT_NE(leftLeft->left, nullptr);
            ASSERT_NE(leftLeft->right, nullptr);
            EXPECT_TRUE(leftLeft->left->isLeaf());
            EXPECT_TRUE(leftLeft->right->isLeaf());
            EXPECT_EQ(leftLeft->left->userData, userData3);  // Third AABB
            EXPECT_EQ(leftLeft->right->userData, userData4);  // Fourth AABB
        }
    } else {
        FAIL() << "Neither child of root is a leaf node, which is unexpected.";
    }
}

// Balanced tree.
TEST(BvhTest, InsertFourAABBs_BalancedTree) {
    Bvh bvh;
    
    // Create four AABBs, two on the far left and two on the far right
    Aabb aabb1 = createAabb(0.0f, 0.0f, 1.0f, 1.0f);    // Far left
    Aabb aabb2 = createAabb(9.0f, 0.0f, 10.0f, 1.0f);   // Far right
    Aabb aabb3 = createAabb(0.5f, 0.0f, 1.5f, 1.0f);    // Near the far left
    Aabb aabb4 = createAabb(8.5f, 0.0f, 9.5f, 1.0f);    // Near the far right

    void* userData1 = (void*)1;
    void* userData2 = (void*)2;
    void* userData3 = (void*)3;
    void* userData4 = (void*)4;

    // Insert the AABBs into the BVH
    bvh.insert(aabb1, userData1);  // Far left
    bvh.insert(aabb2, userData2);  // Far right
    bvh.insert(aabb3, userData3);  // Near left
    bvh.insert(aabb4, userData4);  // Near right

    // Verify that _root is set and not a leaf node
    ASSERT_NE(bvh._root, nullptr);
    EXPECT_FALSE(bvh._root->isLeaf());  // The root should not be a leaf node

    // The root should have two children, both of which are internal nodes (because we are building a balanced tree)
    TreeNode* root = bvh._root;
    TreeNode* left = root->left;
    TreeNode* right = root->right;

    ASSERT_NE(left, nullptr);
    ASSERT_NE(right, nullptr);
    
    // Both left and right children should be internal nodes, not leaves
    EXPECT_FALSE(left->isLeaf());  // Left child should not be a leaf
    EXPECT_FALSE(right->isLeaf());  // Right child should not be a leaf
    
    // Both left and right nodes should have two leaf children each
    ASSERT_NE(left->left, nullptr);
    ASSERT_NE(left->right, nullptr);
    ASSERT_NE(right->left, nullptr);
    ASSERT_NE(right->right, nullptr);
    
    // Both children of the left node should be leaves
    EXPECT_TRUE(left->left->isLeaf());
    EXPECT_TRUE(left->right->isLeaf());

    // Both children of the right node should be leaves
    EXPECT_TRUE(right->left->isLeaf());
    EXPECT_TRUE(right->right->isLeaf());

    // Check that the leaves are correctly set (hard coded values - replaced with dynamic checks below)
    // EXPECT_EQ(left->left->userData, userData1);  // Leftmost leaf (first insert)
    // EXPECT_EQ(left->right->userData, userData3);  // Second insert near left
    
    // EXPECT_EQ(right->left->userData, userData2);  // Third insert near right
    // EXPECT_EQ(right->right->userData, userData4);  // Rightmost leaf (last insert)

    // Both children of the left node should be leaves, containing userData1 and userData3
    std::vector<void*> leftLeaves = {left->left->userData, left->right->userData};
    EXPECT_TRUE(std::find(leftLeaves.begin(), leftLeaves.end(), userData1) != leftLeaves.end());
    EXPECT_TRUE(std::find(leftLeaves.begin(), leftLeaves.end(), userData3) != leftLeaves.end());

    // Both children of the right node should be leaves, containing userData2 and userData4
    std::vector<void*> rightLeaves = {right->left->userData, right->right->userData};
    EXPECT_TRUE(std::find(rightLeaves.begin(), rightLeaves.end(), userData2) != rightLeaves.end());
    EXPECT_TRUE(std::find(rightLeaves.begin(), rightLeaves.end(), userData4) != rightLeaves.end());
}

// ========== REMOVAL TESTS ==========

// Remove the root node.
TEST(BvhTest, RemoveRootNode) {
    Bvh bvh;
    Aabb aabb1 = createAabb(0.0f, 0.0f, 1.0f, 1.0f);
    void* userData1 = (void*)1;

    TreeNode* node1 = bvh.insert(aabb1, userData1);
    
    EXPECT_EQ(bvh._nodeCount, 1);
    EXPECT_EQ(bvh._root, node1);

    bvh.remove(node1);

    EXPECT_EQ(bvh._nodeCount, 0);
    EXPECT_EQ(bvh._root, nullptr);
}

// Test Bvh tree structure after multiple insertions and removals
TEST(BvhTest, TreeStructureAfterInsertionsAndRemovals) {
    Bvh bvh;
    Aabb aabb1 = createAabb(0.0f, 0.0f, 1.0f, 1.0f);
    Aabb aabb2 = createAabb(2.0f, 2.0f, 3.0f, 3.0f);
    void* userData1 = (void*)1;
    void* userData2 = (void*)2;

    TreeNode* node1 = bvh.insert(aabb1, userData1);
    
    EXPECT_EQ(bvh._root, node1);
    
    TreeNode* node2 = bvh.insert(aabb2, userData2);

    // cout << bvh._nodeCount << endl;

    // Note that these checks are for debugging only.
    // Strictly speaking, this isn't what's being tested. They should be in other tests.
    EXPECT_EQ(node1->parent, node2->parent);
    ASSERT_NE(node1->parent, nullptr);
    EXPECT_NE(node1->parent, node2);
    EXPECT_NE(node2->parent, node1);
    EXPECT_EQ(node1->parent->parent, nullptr);

    bvh.remove(node1);

    EXPECT_EQ(bvh._nodeCount, 1);
    EXPECT_EQ(bvh._root, node2);

    bvh.remove(node2);

    EXPECT_EQ(bvh._nodeCount, 0);
    EXPECT_EQ(bvh._root, nullptr);
}

// Remove sibling to a saturated node.
TEST(BvhTest, RemovalOfLeafBesideSaturatedSibling) {
    Bvh bvh;
    Aabb aabb1 = createAabb(0.0f, 0.0f, 1.0f, 1.0f); // left
    Aabb aabb2 = createAabb(10.0f, 10.0f, 11.0f, 11.0f); // right
    Aabb aabb3 = createAabb(2.0f, 2.0f, 3.0f, 3.0f); // also left
    void* userData1 = (void*)1;
    void* userData2 = (void*)2;
    void* userData3 = (void*)3;

    TreeNode* node1 = bvh.insert(aabb1, userData1);
    TreeNode* node2 = bvh.insert(aabb2, userData2);
    TreeNode* node3 = bvh.insert(aabb3, userData3);

    TreeNode* parent1 = node1->parent;
    TreeNode* parent2 = node2->parent;
    TreeNode* parent3 = node3->parent;
    EXPECT_EQ(parent1, parent3);
    EXPECT_EQ(parent1, parent3);
    EXPECT_NE(parent1, nullptr);
    EXPECT_EQ(parent2, parent1->parent);

    bvh.remove(node2);

    // Basicall, the parent of node 1 and 3 will become the new root.
    EXPECT_EQ(bvh._root, node1->parent);
    EXPECT_EQ(bvh._root, node3->parent);
    ASSERT_NE(bvh._root, nullptr);

    EXPECT_EQ(bvh._root->left, node1);
    EXPECT_EQ(bvh._root->right, node3);

}

// Remove a leaf on a saturated node beside another leaf node.
TEST(BvhTest, RemovalOfLeafOnSaturatedNode) {
    Bvh bvh;
    Aabb aabb1 = createAabb(0.0f, 0.0f, 1.0f, 1.0f); // left
    Aabb aabb2 = createAabb(10.0f, 10.0f, 11.0f, 11.0f); // right
    Aabb aabb3 = createAabb(2.0f, 2.0f, 3.0f, 3.0f); // also left
    void* userData1 = (void*)1;
    void* userData2 = (void*)2;
    void* userData3 = (void*)3;

    TreeNode* node1 = bvh.insert(aabb1, userData1);
    TreeNode* node2 = bvh.insert(aabb2, userData2);
    TreeNode* node3 = bvh.insert(aabb3, userData3);

    TreeNode* parent1 = node1->parent;
    TreeNode* parent2 = node2->parent;
    TreeNode* parent3 = node3->parent;

    bvh.remove(node3);

    // Basicall, the parent of node 1 and 3 will become the new root.
    EXPECT_EQ(bvh._root, node1->parent);
    EXPECT_EQ(bvh._root, node2->parent);
    ASSERT_NE(bvh._root, nullptr);

    EXPECT_EQ(bvh._root->left, node1);
    EXPECT_EQ(bvh._root->right, node2);
}

// Remove sibling to a saturated node - nested.
TEST(BvhTest, RemovalOfLeafBesideSaturatedSiblingNested) {
    Bvh bvh;
    Aabb aabb1 = createAabb(0.0f, 0.0f, 1.0f, 1.0f); // left
    Aabb aabb2 = createAabb(10.0f, 10.0f, 11.0f, 11.0f); // right
    Aabb aabb3 = createAabb(2.0f, 2.0f, 3.0f, 3.0f); // also left
    Aabb aabb4 = createAabb(3.0f, 2.0f, 4.0f, 3.0f); // also left, join with 3
    void* userData1 = (void*)1;
    void* userData2 = (void*)2;
    void* userData3 = (void*)3;
    void* userData4 = (void*)4;

    TreeNode* node1 = bvh.insert(aabb1, userData1);
    TreeNode* node2 = bvh.insert(aabb2, userData2);
    TreeNode* node3 = bvh.insert(aabb3, userData3);
    TreeNode* node4 = bvh.insert(aabb4, userData4);

    bvh.remove(node1);

    EXPECT_EQ(node3->parent, node4->parent);
    EXPECT_EQ(node3->parent->parent, bvh._root);
    EXPECT_EQ(node2->parent, bvh._root);
    EXPECT_EQ(bvh._root->left, node3->parent);
    EXPECT_EQ(bvh._root->right, node2);
}

// Remove a leaf on a saturated node beside another leaf node - nested.
TEST(BvhTest, RemovalOfLeafOnSaturatedNodeNested) {
    Bvh bvh;
    Aabb aabb1 = createAabb(0.0f, 0.0f, 1.0f, 1.0f); // left
    Aabb aabb2 = createAabb(10.0f, 10.0f, 11.0f, 11.0f); // right
    Aabb aabb3 = createAabb(2.0f, 2.0f, 3.0f, 3.0f); // also left
    Aabb aabb4 = createAabb(3.0f, 2.0f, 3.0f, 4.0f); // also left, join with 3
    void* userData1 = (void*)1;
    void* userData2 = (void*)2;
    void* userData3 = (void*)3;
    void* userData4 = (void*)4;

    TreeNode* node1 = bvh.insert(aabb1, userData1);
    TreeNode* node2 = bvh.insert(aabb2, userData2);
    TreeNode* node3 = bvh.insert(aabb3, userData3);
    TreeNode* node4 = bvh.insert(aabb4, userData4);

    bvh.remove(node4);

    EXPECT_EQ(node3->parent, node1->parent);
    EXPECT_EQ(node3->parent->parent, bvh._root);
    EXPECT_EQ(node2->parent, bvh._root);
}


// ========== ADVANCED TESTS ==========

// Don't do stress testing if debug mode is on.
#ifndef DEBUG
// Test inserting a large number of nodes to stress memory allocation
TEST(BvhStressTest, InsertManyNodes) {
    Bvh bvh;

    const int numNodes = 10000; // Increase to a very high number if needed
    for (int i = 0; i < numNodes; ++i) {
        Aabb aabb = createAabb(i * 1.0f, i * 1.0f, i * 1.0f + 1.0f, i * 1.0f + 1.0f);
        void* userData = (void*)(intptr_t)i;
        bvh.insert(aabb, userData);
    }

    EXPECT_EQ(bvh._nodeCount, numNodes);
}

// Test repeated insertion and removal to check for memory leaks or dangling pointers
TEST(BvhStressTest, RepeatedInsertionAndRemoval) {
    Bvh bvh;

    const int numCycles = 1000;
    for (int i = 0; i < numCycles; ++i) {
        Aabb aabb = createAabb(0.0f, 0.0f, 1.0f, 1.0f);
        void* userData = (void*)1;

        TreeNode* node = bvh.insert(aabb, userData);
        bvh.remove(node);

        EXPECT_EQ(bvh._nodeCount, 0);
        EXPECT_EQ(bvh._root, nullptr);
    }
}

// Test inserting and updating a large number of nodes in quick succession
// TEST(BvhStressTest, InsertAndUpdateNodes) {
//     Bvh bvh;

//     const int numNodes = 1000;
//     std::vector<TreeNode*> nodes;

//     for (int i = 0; i < numNodes; ++i) {
//         Aabb aabb = createAabb(i * 1.0f, i * 1.0f, i * 1.0f + 1.0f, i * 1.0f + 1.0f);
//         void* userData = (void*)(intptr_t)i;
//         nodes.push_back(bvh.insert(aabb, userData));
//     }

//     EXPECT_EQ(bvh._nodeCount, numNodes);

//     // Update all nodes to new positions
//     for (int i = 0; i < numNodes; ++i) {
//         Aabb newAabb = createAabb(i * 2.0f, i * 2.0f, i * 2.0f + 1.0f, i * 2.0f + 1.0f);
//         bvh.update(nodes[i], newAabb);
//     }

//     // Check the node count remains the same
//     EXPECT_EQ(bvh._nodeCount, numNodes);
// }

// // Test inserting nodes with complex overlapping AABBs
// TEST(BvhStressTest, InsertComplexOverlappingNodes) {
//     Bvh bvh;

//     const int numNodes = 1000;
//     for (int i = 0; i < numNodes; ++i) {
//         float offset = i * 0.01f; // Creates small overlaps between many nodes
//         Aabb aabb = createAabb(offset, offset, offset + 1.0f, offset + 1.0f);
//         void* userData = (void*)(intptr_t)i;
//         bvh.insert(aabb, userData);
//     }

//     EXPECT_EQ(bvh._nodeCount, numNodes);
// }

// // Test removing and reinserting nodes to simulate high tree restructuring
// TEST(BvhStressTest, RemoveAndReinsertNodes) {
//     Bvh bvh;

//     const int numNodes = 1000;
//     std::vector<TreeNode*> nodes;

//     for (int i = 0; i < numNodes; ++i) {
//         Aabb aabb = createAabb(i * 1.0f, i * 1.0f, i * 1.0f + 1.0f, i * 1.0f + 1.0f);
//         void* userData = (void*)(intptr_t)i;
//         nodes.push_back(bvh.insert(aabb, userData));
//     }

//     EXPECT_EQ(bvh._nodeCount, numNodes);

//     // Remove all nodes and reinsert them in reverse order
//     for (int i = numNodes - 1; i >= 0; --i) {
//         bvh.remove(nodes[i]);
//     }

//     EXPECT_EQ(bvh._nodeCount, 0);

//     for (int i = numNodes - 1; i >= 0; --i) {
//         Aabb aabb = createAabb(i * 2.0f, i * 2.0f, i * 2.0f + 1.0f, i * 2.0f + 1.0f);
//         bvh.insert(aabb, (void*)(intptr_t)i);
//     }

//     EXPECT_EQ(bvh._nodeCount, numNodes);
// }



// Test Bvh traversal and collision detection with a callback
TEST(BvhTest, TraverseAndCheckCollisions_SingleCollision) {
    Bvh bvh;

    // Insert two overlapping AABBs
    Aabb aabb1 = createAabb(0.0f, 0.0f, 1.0f, 1.0f);
    void* userData1 = (void*)1;
    bvh.insert(aabb1, userData1);

    Aabb aabb2 = createAabb(0.5f, 0.5f, 1.5f, 1.5f);
    void* userData2 = (void*)2;
    bvh.insert(aabb2, userData2);

    // Vector to hold callback results
    std::vector<std::pair<void*, void*>> collisionPairs;

    // Define the callback function
    // auto callback = [&](void* obj1, void* obj2) {
    //     collisionPairs.emplace_back(obj1, obj2);
    // };

    // Traverse and check for collisions
    bvh.traverseAndCheckCollisions();

    // Assert that one collision was detected
    ASSERT_EQ(bvh.collisionPairs.size(), 1);
    EXPECT_EQ(bvh.collisionPairs[0].first, userData1);
    EXPECT_EQ(bvh.collisionPairs[0].second, userData2);
}

// Test Bvh traversal with no collisions
TEST(BvhTest, TraverseAndCheckCollisions_NoCollision) {
    Bvh bvh;

    // Insert two non-overlapping AABBs
    Aabb aabb1 = createAabb(0.0f, 0.0f, 1.0f, 1.0f);
    void* userData1 = (void*)1;
    bvh.insert(aabb1, userData1);

    Aabb aabb2 = createAabb(2.0f, 2.0f, 3.0f, 3.0f);
    void* userData2 = (void*)2;
    bvh.insert(aabb2, userData2);

    // Vector to hold callback results
    std::vector<std::pair<void*, void*>> collisionPairs;

    // Define the callback function
    // auto callback = [&](void* obj1, void* obj2) {
    //     collisionPairs.emplace_back(obj1, obj2);
    // };

    // Traverse and check for collisions
    bvh.traverseAndCheckCollisions();

    // Assert that no collisions were detected
    ASSERT_EQ(bvh.collisionPairs.size(), 0);
}

// Test Bvh traversal with multiple collisions
TEST(BvhTest, TraverseAndCheckCollisions_MultipleCollisions) {
    Bvh bvh;

    // Insert multiple overlapping AABBs
    Aabb aabb1 = createAabb(0.0f, 0.0f, 2.0f, 2.0f);
    void* userData1 = (void*)1;
    bvh.insert(aabb1, userData1);

    Aabb aabb2 = createAabb(1.0f, 1.0f, 3.0f, 3.0f);
    void* userData2 = (void*)2;
    bvh.insert(aabb2, userData2);

    Aabb aabb3 = createAabb(0.5f, 0.5f, 1.5f, 1.5f);
    void* userData3 = (void*)3;
    bvh.insert(aabb3, userData3);

    // Vector to hold callback results
    // vector<pair<void*, void*>> collisionPairs;

    // Define the callback function
    // auto callback = [&](void* obj1, void* obj2) {
    //     collisionPairs.emplace_back(obj1, obj2);
    // };

    // Traverse and check for collisions
    bvh.traverseAndCheckCollisions();

    // Log the detected collisions for debugging.
    // for (const auto& pair : collisionPairs) {
    //     cout << "Collision detected between object " << pair.first
    //               << " and object " << pair.second << endl;
    // }

    // Assert that multiple collisions were detected
    ASSERT_EQ(bvh.collisionPairs.size(), 3);

    // Check if specific pairs were detected (without order constraints)
    std::set<std::pair<void*, void*>> expectedCollisions = {
        {userData1, userData2},
        {userData1, userData3},
        {userData2, userData3}
    };

    std::set<std::pair<void*, void*>> actualCollisions;
    for (const auto& pair : bvh.collisionPairs) {
        // Ensure each pair is ordered to avoid issues with order in the set
        if (pair.first < pair.second) {
            actualCollisions.insert(pair);
        } else {
            actualCollisions.insert({pair.second, pair.first});
        }
    }

    EXPECT_EQ(expectedCollisions, actualCollisions);
}

#endif
