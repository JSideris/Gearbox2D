#ifndef BVH_H
#define BVH_H

#include <iostream>
#include <vector>
#include <limits>
#include <memory>
#include <stack>
#include "aabb.h"
#include "debug.h"

using namespace std;

// Node structure for the Dynamic AABB Tree
struct TreeNode {
    Aabb aabb; // The AABB for this node
    void* userData; // Pointer to the object this node represents
    TreeNode* parent;
    TreeNode* left;
    TreeNode* right;
    bool isSleeping = false; // Flag to indicate if this node is sleeping
    
    bool isLeaf() const { return left == nullptr && right == nullptr; }

    TreeNode(Aabb aabb, void* userData) : aabb(aabb), userData(userData), parent(nullptr), left(nullptr), right(nullptr), isSleeping(false) {}
    
    // Put this node to sleep and propagate sleep state upward
    void sleep() {
        if (isSleeping) return; // Already sleeping
        
        isSleeping = true;
        
        // Propagate sleep state upward if leaf node
        if (isLeaf() && parent) {
            parent->updateSleepState();
        }
    }
    
    // Wake up this node and propagate wake state upward
    void wakeUp() {
        if (!isSleeping) return; // Already awake
        
        isSleeping = false;
        
        // Wake up parent nodes
        TreeNode* currentParent = parent;
        while (currentParent) {
            currentParent->isSleeping = false;
            currentParent = currentParent->parent;
        }
    }
    
    // Update sleep state based on children
    void updateSleepState() {
        if (isLeaf()) return; // Leaf nodes have their sleep state managed externally
        
        bool wasSleeping = isSleeping;
        
        // Internal node is sleeping only if both children are sleeping
        isSleeping = left && right && left->isSleeping && right->isSleeping;
        
        // If sleep state changed, propagate upward
        if (wasSleeping != isSleeping && parent) {
            parent->updateSleepState();
        }
    }
};

// template <typename T> // TODO: try this later.
class Bvh {
public:
    // Usually, this will be physical objects.
    vector<pair<void*, void*>> collisionPairs;

    Bvh() : _root(nullptr), _nodeCount(0), _insertionCount(0) {
        // DEBUG_PRINT("BVH created.");
    }

    // Insert a new object into the tree, returning a pointer to the new node
    TreeNode* insert(const Aabb& aabb, void* userData) {
        // DEBUG_PRINT("Inserting AABB.");
        TreeNode* node = _allocateNode(aabb, userData);
        _insertNode(node);
        _nodeCount++;
        _insertionCount++;
        return node;
    }

    // Remove an object from the tree
    void remove(TreeNode* node) {
        if (!node) return;
        
        // Store grandparent for update (parent will be removed)
        TreeNode* grandparent = nullptr;
        if (node->parent) {
            grandparent = node->parent->parent;
        }
        
        _removeNode(node);      // This handles parent removal too
        _deallocateNode(node);
        _nodeCount -= 2;        // Leaf + its parent (unless it was root)
        
        // Update from grandparent upward
        if (grandparent) {
            _updateTree(grandparent);
        }
    }

    // Update the position of an object in the tree (e.g., when it moves)
    void update(TreeNode* node, const Aabb& newAABB) {
        // DEBUG_PRINT("Updating BVH.");
        
        // Early exit if the new AABB is contained within the old one
        // This is a common optimization for objects that move slightly
        if (node->parent && node->parent->aabb.contains(newAABB)) {
            node->aabb = newAABB;
            _updateTree(node->parent);
            return;
        }

        // Remove the node from the tree
        // Note: This automatically handles parent removal and cleanup
        _removeNode(node);
        
        // Update the node's AABB
        node->aabb = newAABB;
        
        // Reinsert the node
        _insertNode(node);
    }

    // Deallocate all nodes.
    void clear() {
        collisionPairs.clear();
        if (!_root) return;  // No tree to clear

        stack<TreeNode*> stack;
        stack.push(_root);
        _root = nullptr;  // Reset the root

        while (!stack.empty()) {
            TreeNode* node = stack.top();
            stack.pop();

            // Push the children onto the stack for further traversal
            if (node->left) stack.push(node->left);
            if (node->right) stack.push(node->right);

            // Deallocate the current node
            _deallocateNode(node);

            // Ensure we do not underflow _nodeCount
            if (_nodeCount > 0) _nodeCount--;
        }

        if(_nodeCount != 0) cout << "Warning: Node count is not zero after clearing the tree." << endl;

        // Ensure _nodeCount is reset after clearing the entire tree
        _nodeCount = 0;
    }



    // Query the tree to find potential overlaps with a given AABB
    void query(const Aabb& aabb, vector<void*>& results) const {
        _queryNode(_root, aabb, results);
    }

    // void traverseAndCheckCollisions(std::function<void(void*, void*)> callback){
    void traverseAndCheckCollisions(){
        collisionPairs.clear();
        _traverseAndCheckCollisions(_root->left, _root->right);
    }


// private:
    TreeNode* _root;
    int _nodeCount;
    int _insertionCount;

    void _traverseAndCheckCollisions(TreeNode* node1, TreeNode* node2) {
        if (!node1 && !node2) return;
        else if(!node2) _traverseAndCheckCollisions(node1->left, node1->right);
        else if(!node1) _traverseAndCheckCollisions(node2->left, node2->right);
        else if(node1->isLeaf() && node2->isLeaf()){
            if(node1->aabb.overlaps(node2->aabb)){
                collisionPairs.push_back({node1->userData, node2->userData});
            }
        }
        else if(node1->isLeaf()){
            // Right is a leaf node. Try it against left's children.
            _traverseAndCheckCollisions(node1, node2->left);
            _traverseAndCheckCollisions(node1, node2->right);
            _traverseAndCheckCollisions(node1->left, node2);
        }
        else if(node2->isLeaf()){
            // Left is a leaf node. Try it against right's children.
            _traverseAndCheckCollisions(node1->left, node2);
            _traverseAndCheckCollisions(node1->right, node2);
            _traverseAndCheckCollisions(node1, node2->left);
        }
        else{
            // Neither side is a leaf node.
            _traverseAndCheckCollisions(node1->left, node1->right);
            _traverseAndCheckCollisions(node2->left, node2->right);

            _traverseAndCheckCollisions(node1->left, node2->left);
            _traverseAndCheckCollisions(node1->left, node2->right);
            _traverseAndCheckCollisions(node1->right, node2->left);
            _traverseAndCheckCollisions(node1->right, node2->right);
        }
    }

    // Allocate a new node
    TreeNode* _allocateNode(const Aabb& aabb, void* userData) {
        // DEBUG_PRINT("    Allocating node.");
        TreeNode* node = new TreeNode(aabb, userData);
        return node;
    }

    // Deallocate a node
    void _deallocateNode(TreeNode* node) {
        // DEBUG_PRINT("    Deallocating node.");
        delete node;
    }

    // Insert a node into the tree
    void _insertNode(TreeNode* node) {
        // DEBUG_PRINT("    Inserting node.");
        if (_root == nullptr) {
            _root = node;
            return;
        }

        // If root is a leaf, create a new root with both nodes as children
        if (_root->isLeaf()) {
            TreeNode* newRoot = _allocateNode(_combineAabbs(_root->aabb, node->aabb), nullptr);
            newRoot->isSleeping = _root->isSleeping && node->isSleeping;
            newRoot->left = _root;
            newRoot->right = node;
            _root->parent = newRoot;
            node->parent = newRoot;
            _root = newRoot;
            return;
        }

        // Traverse down the tree to find the best leaf to pair with
        TreeNode* current = _root;
        while (!current->isLeaf()) {
            TreeNode* left = current->left;
            TreeNode* right = current->right;

            // Calculate the cost for each child
            Aabb combinedLeft = _combineAabbs(left->aabb, node->aabb);
            Aabb combinedRight = _combineAabbs(right->aabb, node->aabb);
            
            float costLeft = combinedLeft.getSurfaceArea();
            float costRight = combinedRight.getSurfaceArea();
            
            // Apply sleep bias to cost calculation
            const float sleepBias = 0.9f; // 10% bias for sleeping nodes
            if (left->isSleeping && node->isSleeping) {
                costLeft *= sleepBias;
            }
            if (right->isSleeping && node->isSleeping) {
                costRight *= sleepBias;
            }

            // Add inheritance cost (cost of enlarging ancestors)
            float inheritanceCost = combinedLeft.getSurfaceArea() - current->aabb.getSurfaceArea();
            
            // Cost of descending into left subtree
            float costDescendLeft = costLeft + inheritanceCost;
            if (!left->isLeaf()) {
                costDescendLeft = costLeft - left->aabb.getSurfaceArea() + inheritanceCost;
            }
            
            // Cost of descending into right subtree
            float costDescendRight = costRight + inheritanceCost;
            if (!right->isLeaf()) {
                costDescendRight = costRight - right->aabb.getSurfaceArea() + inheritanceCost;
            }

            // Choose the child with lower cost
            if (costDescendLeft < costDescendRight) {
                current = left;
            } else {
                current = right;
            }
        }

        // Now current is a leaf node, create a new parent
        TreeNode* oldParent = current->parent;
        TreeNode* newParent = _allocateNode(_combineAabbs(current->aabb, node->aabb), nullptr);
        
        // Set initial sleep state for new parent
        newParent->isSleeping = current->isSleeping && node->isSleeping;
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
            
            // Update the tree upwards from the parent
            _updateTree(oldParent);
        } else {
            _root = newParent;
        }
    }

    // Remove a node from the tree
    void _removeNode(TreeNode* node) {
        if (node == _root) {
            if (!node->isLeaf()) {
                cout << "Warning: Cannot remove non-leaf root node." << endl;
                return;
            }
            _root = nullptr;
            return;
        }

        // Only leaf nodes should be removed
        if (!node->isLeaf()) {
            cout << "Warning: Attempted to remove a non-leaf node. Only leaf nodes can be removed." << endl;
            return;
        }

        TreeNode* parent = node->parent;
        TreeNode* grandparent = parent->parent;
        TreeNode* sibling = (parent->left == node) ? parent->right : parent->left;

        // Replace parent with sibling in the tree
        if (grandparent != nullptr) {
            if (grandparent->left == parent) {
                grandparent->left = sibling;
            } else {
                grandparent->right = sibling;
            }
            sibling->parent = grandparent;
            
            // Update the tree upwards from grandparent
            _updateTree(grandparent);
        } else {
            // Parent was the root
            _root = sibling;
            sibling->parent = nullptr;
        }

        // Clean up the removed node and its parent
        node->parent = nullptr;
        _deallocateNode(parent);
    }

    // Combine two AABBs into one
    Aabb _combineAabbs(const Aabb& a, const Aabb& b) const {
        // DEBUG_PRINT("    Combining AABBs.");
        Aabb combined;
        combined.min.x = min(a.min.x, b.min.x);
        combined.min.y = min(a.min.y, b.min.y);
        combined.max.x = max(a.max.x, b.max.x);
        combined.max.y = max(a.max.y, b.max.y);
        return combined;
    }
    


    // Update the tree after an insertion or removal
    void _updateTree(TreeNode* node) {
        while (node != nullptr) {
            // For leaf nodes, nothing to update
            if (node->isLeaf()) {
                node = node->parent;
                continue;
            }

            // Store old AABB for comparison
            Aabb oldAABB = node->aabb;
            
            // Update AABB by combining children (internal nodes always have both children)
            node->aabb = _combineAabbs(node->left->aabb, node->right->aabb);
            
            // Update sleep state based on children
            node->updateSleepState();

            // Early termination: if AABB hasn't changed, ancestors won't change either
            if (
                oldAABB.min.x == node->aabb.min.x && 
                oldAABB.min.y == node->aabb.min.y && 
                oldAABB.max.x == node->aabb.max.x &&
                oldAABB.max.y == node->aabb.max.y
            ) {
                break;
            }

            // Move up to the parent node
            node = node->parent;
        }
    }

    // Recursive query function to find potential overlaps
    void _queryNode(TreeNode* node, const Aabb& aabb, vector<void*>& results) const {
        // DEBUG_PRINT("    Querying node.");
        if (node == nullptr) return;

        if (node->aabb.overlaps(aabb)) {
            if (node->isLeaf()) {
                results.push_back(node->userData);
            } else {
                _queryNode(node->left, aabb, results);
                _queryNode(node->right, aabb, results);
            }
        }
    }
};

#endif