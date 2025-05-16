#ifndef BVH_H
#define BVH_H

#include <iostream>
#include <vector>
#include <limits>
#include <memory>
#include <stack>
#include "aabb.h"
#include "debug.h"
// #include "physical-object.h"

using namespace std;

// Node structure for the Dynamic AABB Tree
struct TreeNode {
    Aabb aabb; // The AABB for this node
    void* userData; // Pointer to the object this node represents
    TreeNode* parent;
    TreeNode* left;
    TreeNode* right;
    bool isLeaf() const { return left == nullptr && right == nullptr; }

    TreeNode(Aabb aabb, void* userData) : aabb(aabb), userData(userData), parent(nullptr), left(nullptr), right(nullptr) {}
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
        // cout << "Removing node." << endl;
        auto* parent = node->parent;
        _removeNode(node);
        _deallocateNode(node);
        _nodeCount--;

        // Whene a leaf is removed, it's parent is always a partial parent and can also be removed.
        if(parent) {
            _removeNode(parent);
            _deallocateNode(parent);
        }

        _updateTree(node);
    }

    // Update the position of an object in the tree (e.g., when it moves)
    void update(TreeNode* node, const Aabb& newAABB) {
        // DEBUG_PRINT("Updating BVH.");
        // if (node->aabb.containsPoint(newAABB.getCenter())) {
        //     return; // The object hasn't moved significantly, no update needed
        // }

        auto* parent = node->parent;

        _removeNode(node);

        // There could potentially be a faster way to do this by recycling the parent.
        // But for now, this will work.
        // This is worth looking into since updates happen frequently.
        if(parent) {
            _removeNode(parent);
            _deallocateNode(parent);
            _nodeCount--;
        }

        node->aabb = newAABB;
        _insertNode(node);

        // cout << _nodeCount << endl;
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

    // TODO: One optimization might be to count the number of fixed objects in a node
    // then if it's equal to the number of nodes, we don't need to traverse.
    // We could do something similar with nodes that contain leafs in 
    // non-colliding masks.
    void _traverseAndCheckCollisions(TreeNode* node1, TreeNode* node2) {
        if (!node1 && !node2) return;
        else if(!node2) _traverseAndCheckCollisions(node1->left, node1->right);
        else if(!node1) _traverseAndCheckCollisions(node2->left, node2->right);
        else if(node1->isLeaf() && node2->isLeaf()){
            if(node1->aabb.overlaps(node2->aabb)){
                // callback(node1->userData, node2->userData);
                // auto* obj1 = static_cast<PhysicalObject*>(node1->userData);
                // auto* obj2 = static_cast<PhysicalObject*>(node2->userData);
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

        TreeNode* current = _root;
        while (true) {
            TreeNode* left = current->left;
            TreeNode* right = current->right;

            // If we found a leaf node, we're done. We can create a parent and assign both leafs to it.
            if(current->isLeaf()){
                // Now current is a leaf node, so we create a new parent node
                TreeNode* oldParent = current->parent;
                TreeNode* newParent = _allocateNode(_combineAabbs(current->aabb, node->aabb), nullptr);

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
                    // This may be redundant. This case is handled in the first few lines of this function.
                    _root = newParent;
                }

                break;
            }
            // If either child is nullptr, insert on that side
            else if (left == nullptr) {
                current->left = node;
                node->parent = current;
                break;
            }
            else if (right == nullptr) {
                current->right = node;
                node->parent = current;
                break;
            }
            else{
                // If both sides are non-null, calculate the cost for each side
                Aabb combinedLeft = _combineAabbs(left->aabb, node->aabb);
                Aabb combinedRight = _combineAabbs(right->aabb, node->aabb);
                float newAreaLeft = combinedLeft.getSurfaceArea();
                float newAreaRight = combinedRight.getSurfaceArea();

                // Choose the side with the smaller cost
                if (newAreaLeft < newAreaRight) {
                    current = left;
                } else {
                    current = right;
                }
            }
        }

        // Update the tree upwards
        _updateTree(current);
    }

    // Remove a node from the tree
    void _removeNode(TreeNode* node) {

        if (node == _root) {
            // cout << "Removing root." << endl;
            if(node->left && node->right){
                cout << "Warning: Attempted to remove root node with two children. This is not supported." << endl;
            }
            else if(node->left){
                _root = node->left;
                node->left->parent = nullptr;
                node->left = nullptr;
            }
            else if (node->right){
                _root = node->right;
                node->right->parent = nullptr;
                node->right = nullptr;
            }
            else{
                _root = nullptr;
            }
            return;
        }
        else if(node->isLeaf()){
            // cout << "Removing leaf. " << node << endl;
            // If it's a leaf node, it can safely be removed immediately.
            TreeNode* parent = node->parent;
            // TreeNode* grandparent = parent->parent;
            // TreeNode* sibling = (parent->left == node) ? parent->right : parent->left;
            

            if(node == parent->left){
                parent->left = nullptr;
            }
            else{
                parent->right = nullptr;
            }

            node->parent = nullptr;

        }
        else if(!node->right || !node->left){
            // cout << "Removing partial parent." << endl;
            TreeNode* child = (node->left) ? node->left : node->right;

            child->parent = node->parent;

            if(node == node->parent->left){
                node->parent->left = child;
            }
            else{
                node->parent->right = child;
            }

            node->left = nullptr;
            node->right = nullptr;
            node->parent = nullptr;
        }
        else{
            // Is it even valid? Why would it be?
            // From the user's perspective, they should only be removing leaf nodes!

            cout << "Warning: Attempted to remove a non-leaf node from the tree." << endl;
        }

        // // DEBUG_PRINT("    Removing node.");
        // if (node == _root) {
        //     _root = nullptr;
        //     return;
        // }

        // TreeNode* parent = node->parent;
        // TreeNode* grandParent = parent->parent;
        // TreeNode* sibling = (parent->left == node) ? parent->right : parent->left;

        // if (grandParent != nullptr) {
        //     if (grandParent->left == parent) {
        //         grandParent->left = sibling;
        //     } else {
        //         grandParent->right = sibling;
        //     }
        //     sibling->parent = grandParent;
        //     _deallocateNode(parent);
        //     _updateTree(grandParent);
        // } else {
        //     _root = sibling;
        //     sibling->parent = nullptr;
        //     _deallocateNode(parent);
        // }
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
            Aabb oldAABB = node->aabb;

            // Ensure both left and right children exist before combining AABBs
            if (node->left != nullptr && node->right != nullptr) {
                node->aabb = _combineAabbs(node->left->aabb, node->right->aabb);
            } else if (node->left != nullptr) {
                // If only the left child exists, use its AABB
                node->aabb = node->left->aabb;
            } else if (node->right != nullptr) {
                // If only the right child exists, use its AABB
                node->aabb = node->right->aabb;
            }

            // Check if the AABB needs further updating
            if (oldAABB.containsPoint(node->aabb.getCenter())) {
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