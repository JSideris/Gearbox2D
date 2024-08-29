#pragma once

#include <vector>
#include <limits>
#include <memory>
#include "aabb.h"

// Node structure for the Dynamic AABB Tree
struct TreeNode {
    Aabb aabb; // The AABB for this node
    void* userData; // Pointer to the object this node represents
    TreeNode* parent;
    TreeNode* left;
    TreeNode* right;
    bool isLeaf() const { return left == nullptr && right == nullptr; }

    TreeNode() : userData(nullptr), parent(nullptr), left(nullptr), right(nullptr) {}
};

class Bvh {
public:
    Bvh() : root(nullptr), nodeCount(0), insertionCount(0) {}

    // Insert a new object into the tree, returning a pointer to the new node
    TreeNode* insert(const Aabb& aabb, void* userData) {
        TreeNode* node = allocateNode(aabb, userData);
        insertNode(node);
        nodeCount++;
        insertionCount++;
        return node;
    }

    // Remove an object from the tree
    void remove(TreeNode* node) {
        removeNode(node);
        deallocateNode(node);
        nodeCount--;
    }

    // Update the position of an object in the tree (e.g., when it moves)
    void update(TreeNode* node, const Aabb& newAABB) {
        if (node->aabb.containsPoint(newAABB.getCenter())) {
            return; // The object hasn't moved significantly, no update needed
        }
        remove(node);
        node->aabb = newAABB;
        insertNode(node);
    }

    // Query the tree to find potential overlaps with a given AABB
    void query(const Aabb& aabb, std::vector<void*>& results) const {
        queryNode(root, aabb, results);
    }

private:
    TreeNode* root;
    int nodeCount;
    int insertionCount;

    // Allocate a new node
    TreeNode* allocateNode(const Aabb& aabb, void* userData) {
        TreeNode* node = new TreeNode();
        node->aabb = aabb;
        node->userData = userData;
        return node;
    }

    // Deallocate a node
    void deallocateNode(TreeNode* node) {
        delete node;
    }

    // Insert a node into the tree
    void insertNode(TreeNode* node) {
        if (root == nullptr) {
            root = node;
            return;
        }

        TreeNode* current = root;
        while (!current->isLeaf()) {
            TreeNode* left = current->left;
            TreeNode* right = current->right;

            float combinedArea = current->aabb.getSurfaceArea();
            Aabb combinedLeft = combineAABBs(left->aabb, node->aabb);
            Aabb combinedRight = combineAABBs(right->aabb, node->aabb);
            float newAreaLeft = combinedLeft.getSurfaceArea();
            float newAreaRight = combinedRight.getSurfaceArea();

            float costLeft = newAreaLeft - combinedArea;
            float costRight = newAreaRight - combinedArea;

            if (costLeft < costRight) {
                current = left;
            } else {
                current = right;
            }
        }

        // Now current is a leaf node, so we create a new parent node
        TreeNode* oldParent = current->parent;
        TreeNode* newParent = allocateNode(combineAABBs(current->aabb, node->aabb), nullptr);
        newParent->left = current;
        newParent->right = node;
        newParent->parent = oldParent;
        node->parent = newParent;
        current->parent = newParent;

        if (oldParent != nullptr) {
            if (oldParent->left == current) {
                oldParent->left = newParent;
            } else {
                oldParent->right = newParent;
            }
        } else {
            root = newParent;
        }

        // Update the tree upwards
        updateTree(newParent);
    }

    // Remove a node from the tree
    void removeNode(TreeNode* node) {
        if (node == root) {
            root = nullptr;
            return;
        }

        TreeNode* parent = node->parent;
        TreeNode* grandParent = parent->parent;
        TreeNode* sibling = (parent->left == node) ? parent->right : parent->left;

        if (grandParent != nullptr) {
            if (grandParent->left == parent) {
                grandParent->left = sibling;
            } else {
                grandParent->right = sibling;
            }
            sibling->parent = grandParent;
            deallocateNode(parent);
            updateTree(grandParent);
        } else {
            root = sibling;
            sibling->parent = nullptr;
            deallocateNode(parent);
        }
    }

    // Combine two AABBs into one
    Aabb combineAABBs(const Aabb& a, const Aabb& b) const {
        Aabb combined;
        combined.min.x = std::min(a.min.x, b.min.x);
        combined.min.y = std::min(a.min.y, b.min.y);
        combined.max.x = std::max(a.max.x, b.max.x);
        combined.max.y = std::max(a.max.y, b.max.y);
        return combined;
    }

    // Update the tree after an insertion or removal
    void updateTree(TreeNode* node) {
        while (node != nullptr) {
            Aabb oldAABB = node->aabb;
            node->aabb = combineAABBs(node->left->aabb, node->right->aabb);
            if (oldAABB.containsPoint(node->aabb.getCenter())) {
                break;
            }
            node = node->parent;
        }
    }

    // Recursive query function to find potential overlaps
    void queryNode(TreeNode* node, const Aabb& aabb, std::vector<void*>& results) const {
        if (node == nullptr) return;

        if (node->aabb.overlaps(aabb)) {
            if (node->isLeaf()) {
                results.push_back(node->userData);
            } else {
                queryNode(node->left, aabb, results);
                queryNode(node->right, aabb, results);
            }
        }
    }
};