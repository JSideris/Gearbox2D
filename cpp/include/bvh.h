#ifndef BVH_H
#define BVH_H

#include "aabb.h"
#include <vector>
#include <memory>
#include <algorithm>
#include <limits>
#include <fstream>
#include <chrono>

#define MAX_ALLOWED_COLLISIONS 20000

// Collision categories as bitflags
enum CollisionCategory : uint32_t {
    CATEGORY_STATIC     = 1 << 0,
    CATEGORY_DYNAMIC    = 1 << 1,
    CATEGORY_SENSOR     = 1 << 2,
    CATEGORY_POINT      = 1 << 3,
    // Add more categories as needed...
    CATEGORY_ALL        = 0xFFFFFFFF
};

// Object properties that affect collision behavior
struct CollisionProperties {
    uint32_t userCategory;      // What this object is (user defined)
    uint32_t userMask;          // What it can collide with (user defined)
    uint32_t systemCategory;    // Internal engine category (Static, Dynamic, Point, etc.)
    bool isSleeping;
    bool isRigid;               // For sensor filtering
    
    CollisionProperties() 
        : userCategory(0xFFFFFFFF), 
          userMask(0xFFFFFFFF),
          systemCategory(CATEGORY_DYNAMIC),
          isSleeping(false),
          isRigid(true) {}
    
    bool canCollideWith(const CollisionProperties& other) const {
        // Sleeping objects don't collide with each other
        if (isSleeping && other.isSleeping) return false;
        
        // Points don't collide with points
        if ((systemCategory & CATEGORY_POINT) && (other.systemCategory & CATEGORY_POINT)) {
            return false;
        }
        
        // Non-rigid sensors don't collide with other non-rigid sensors
        if ((systemCategory & CATEGORY_SENSOR) && (other.systemCategory & CATEGORY_SENSOR) &&
            !isRigid && !other.isRigid) {
            return false;
        }
        
        // Check user collision masks
        return (userCategory & other.userMask) && (other.userCategory & userMask);
    }
};

// Aggregated properties for internal nodes
struct AggregatedProperties {
    uint32_t containsSystemCategories; // OR of all child system categories
    uint32_t containsUserCategories;   // OR of all child user categories
    uint32_t mayCollideWithUserMask;   // OR of all child user masks
    bool containsAwake;                // Any awake objects in subtree?
    bool containsRigid;                // Any rigid objects in subtree?
    
    AggregatedProperties() 
        : containsSystemCategories(0), 
          containsUserCategories(0),
          mayCollideWithUserMask(0),
          containsAwake(false),
          containsRigid(false) {}
    
    void mergeWith(const AggregatedProperties& other) {
        containsSystemCategories |= other.containsSystemCategories;
        containsUserCategories |= other.containsUserCategories;
        mayCollideWithUserMask |= other.mayCollideWithUserMask;
        containsAwake |= other.containsAwake;
        containsRigid |= other.containsRigid;
    }
    
    static AggregatedProperties fromLeaf(const CollisionProperties& props) {
        AggregatedProperties agg;
        agg.containsSystemCategories = props.systemCategory;
        agg.containsUserCategories = props.userCategory;
        agg.mayCollideWithUserMask = props.userMask;
        agg.containsAwake = !props.isSleeping;
        agg.containsRigid = props.isRigid;
        return agg;
    }
    
    bool canPotentiallyCollideWith(const AggregatedProperties& other) const {
        // If both subtrees contain only sleeping objects, skip
        if (!containsAwake && !other.containsAwake) return false;
        
        // Check if any objects in this subtree can collide with any in the other based on user masks
        bool thisCanCollideWithOther = (containsUserCategories & other.mayCollideWithUserMask) != 0;
        bool otherCanCollideWithThis = (other.containsUserCategories & mayCollideWithUserMask) != 0;
        
        if (!thisCanCollideWithOther || !otherCanCollideWithThis) return false;
        
        // Special case: if both subtrees contain only points, skip
        if (containsSystemCategories == CATEGORY_POINT && 
            other.containsSystemCategories == CATEGORY_POINT) {
            return false;
        }
        
        // Special case: if both contain only non-rigid sensors, skip
        if (containsSystemCategories == CATEGORY_SENSOR && 
            other.containsSystemCategories == CATEGORY_SENSOR &&
            !containsRigid && !other.containsRigid) {
            return false;
        }
        
        return true;
    }
};

// Structure to track BVH performance metrics
struct BvhMetrics {
    long aabb_tests = 0;
    long mask_culls = 0;
    long pair_candidates = 0;
    int max_depth = 0;
    float avg_depth = 0.0f;

    void reset() {
        aabb_tests = 0;
        mask_culls = 0;
        pair_candidates = 0;
        max_depth = 0;
        avg_depth = 0.0f;
    }
};

extern BvhMetrics g_bvhMetrics;

class BvhNode {
public:
    Aabb bounds;
    BvhNode* parent;
    bool isLeaf;

	// For leaf nodes
	CollisionProperties properties;  // Leaf collision properties

	// For both leaf and internal nodes
	AggregatedProperties aggregated; // Aggregated subtree properties
    
    // For leaf nodes
    void* data;
    
    // For internal nodes
    BvhNode* left;
    BvhNode* right;
    
    // Constructor for leaf node
	BvhNode(const Aabb& aabb, void* userData, const CollisionProperties& props)
    : bounds(aabb), parent(nullptr), isLeaf(true), 
      data(userData), properties(props), left(nullptr), right(nullptr) {
		// For leaves, aggregated properties come directly from leaf properties
		aggregated = AggregatedProperties::fromLeaf(properties);
	}
    
    // Constructor for internal node
    BvhNode(BvhNode* leftChild, BvhNode* rightChild)
		: parent(nullptr), isLeaf(false), data(nullptr),
		left(leftChild), right(rightChild) {
        
        if (left) left->parent = this;
        if (right) right->parent = this;
        
        updateBounds();
        updateAggregatedProperties();
    }
    
    ~BvhNode() {
        // Don't delete children here - BVH will manage the tree destruction
    }
    
    void updateBounds() {
        if (isLeaf) return;
        
        if (left && right) {
            bounds = left->bounds;
            bounds.mergeWith(right->bounds);
        } else if (left) {
            bounds = left->bounds;
        } else if (right) {
            bounds = right->bounds;
        }
    }
    
	void updateAggregatedProperties() {
		if (isLeaf) {
			aggregated = AggregatedProperties::fromLeaf(properties);
			return;
		}
		
		aggregated = AggregatedProperties();
		if (left) aggregated.mergeWith(left->aggregated);
		if (right) aggregated.mergeWith(right->aggregated);
	}
    
    // Update bounds and sleep state for all ancestors
    void updateAncestors() {
        BvhNode* current = parent;
        while (current) {
            if (!current->isLeaf) {
                current->updateBounds();
                current->updateAggregatedProperties();
            }
            current = current->parent;
        }
    }
    
	void updateProperties(const CollisionProperties& newProps) {
		if (!isLeaf) return;
		properties = newProps;
		aggregated = AggregatedProperties::fromLeaf(properties);
		updateAncestors();
	}
	
	// Convenience methods for backward compatibility
	void sleep() {
		if (!isLeaf) return;
		properties.isSleeping = true;
		updateProperties(properties);
	}
	
	void wakeUp() {
		if (!isLeaf) return;
		properties.isSleeping = false;
		updateProperties(properties);
	}
    
    // Get the sibling of this node
    BvhNode* getSibling() const {
        if (!parent) return nullptr;
        return (parent->left == this) ? parent->right : parent->left;
    }
};

class Bvh {
public:
    // Public collision results - contains pairs of Fixture pointers
    std::vector<std::pair<void*, void*>> collisionPairs;

private:
    BvhNode* root;
    
    // Surface Area Heuristic for insertion cost calculation with mask biasing
    float computeInsertionCost(BvhNode* node, const Aabb& newBounds, const CollisionProperties& newProps) const {
        if (!node) return std::numeric_limits<float>::max();
        
        Aabb combinedBounds = node->bounds;
        combinedBounds.mergeWith(newBounds);
        
        float combinedArea = combinedBounds.getSurfaceArea();
        float currentArea = node->bounds.getSurfaceArea();
        float spatialCost = combinedArea - currentArea;

        // Mask Biasing: penalize "polluting" a subtree with new categories or masks.
        // This encourages objects with similar collision profiles to cluster together.
        uint32_t newCats = newProps.userCategory & ~node->aggregated.containsUserCategories;
        uint32_t newMasks = newProps.userMask & ~node->aggregated.mayCollideWithUserMask;
        uint32_t newSystemCats = newProps.systemCategory & ~node->aggregated.containsSystemCategories;
        
        int pollution = __builtin_popcount(newCats) + __builtin_popcount(newMasks) + __builtin_popcount(newSystemCats);
        
        // Empirical weight for mask purity vs spatial fit.
        // Weight 1.0f was found to be the "golden ratio" in performance studies.
        const float maskWeight = 1.0f;
        float maskCost = pollution * maskWeight;
        
        return spatialCost + maskCost;
    }
    
    // Find the best place to insert a new leaf
    BvhNode* findBestInsertionPoint(const Aabb& newBounds, const CollisionProperties& newProps) {
        if (!root) return nullptr;
        
        BvhNode* current = root;
        
        while (!current->isLeaf) {
            float leftCost = std::numeric_limits<float>::max();
            float rightCost = std::numeric_limits<float>::max();
            
            if (current->left) {
                leftCost = computeInsertionCost(current->left, newBounds, newProps);
            }
            if (current->right) {
                rightCost = computeInsertionCost(current->right, newBounds, newProps);
            }
            
            // Choose the child with lower insertion cost
            if (leftCost <= rightCost && current->left) {
                current = current->left;
            } else if (current->right) {
                current = current->right;
            } else {
                break;
            }
        }
        
        return current;
    }
    
    // Update bounds and sleep state for all ancestors
    void updateAncestors(BvhNode* node) {
        if (node) {
            node->updateAncestors();
        }
    }
    
    // Recursively destroy nodes
    void destroyNode(BvhNode* node) {
        if (!node) return;
        
        if (!node->isLeaf) {
            destroyNode(node->left);
            destroyNode(node->right);
        }
        
        delete node;
    }
    
    // Replace a node with its child in the tree structure
    void replaceNode(BvhNode* oldNode, BvhNode* newNode) {
        if (oldNode->parent) {
            if (oldNode->parent->left == oldNode) {
                oldNode->parent->left = newNode;
            } else {
                oldNode->parent->right = newNode;
            }
            
            if (newNode) {
                newNode->parent = oldNode->parent;
            }
        } else {
            root = newNode;
            if (newNode) {
                newNode->parent = nullptr;
            }
        }
    }
    
    // Query implementation
    void queryRecursive(BvhNode* node, const Aabb& queryBounds, std::vector<BvhNode*>& results) const {
        if (!node || !node->bounds.overlaps(queryBounds)) return;
        
        if (node->isLeaf) {
            results.push_back(node);
        } else {
            queryRecursive(node->left, queryBounds, results);
            queryRecursive(node->right, queryBounds, results);
        }
    }
    
    // Internal collision detection between two subtrees
    void detectCollisionsRecursive(BvhNode* nodeA, BvhNode* nodeB) {
		if (!nodeA || !nodeB || collisionPairs.size() > MAX_ALLOWED_COLLISIONS) return;
		
		// Early exit based on aggregated properties
		if (!nodeA->aggregated.canPotentiallyCollideWith(nodeB->aggregated)) {
            g_bvhMetrics.mask_culls++;
			return;
		}
        
        // Skip if bounds don't overlap
        g_bvhMetrics.aabb_tests++;
        if (!nodeA->bounds.overlaps(nodeB->bounds)) return;
        
        // If both are leaves, add the collision pair
		if (nodeA->isLeaf && nodeB->isLeaf) {
            g_bvhMetrics.pair_candidates++;
			if (nodeA != nodeB && nodeA->data && nodeB->data) {
				// Final collision check with full properties
				if (nodeA->properties.canCollideWith(nodeB->properties)) {
					collisionPairs.push_back({nodeA->data, nodeB->data});
				}
			}
			return;
		}
        
        // Recurse on children
        if (nodeA->isLeaf) {
            // nodeA is leaf, nodeB is internal
            detectCollisionsRecursive(nodeA, nodeB->left);
            detectCollisionsRecursive(nodeA, nodeB->right);
        } else if (nodeB->isLeaf) {
            // nodeB is leaf, nodeA is internal
            detectCollisionsRecursive(nodeA->left, nodeB);
            detectCollisionsRecursive(nodeA->right, nodeB);
        } else {
            // Both are internal nodes
            detectCollisionsRecursive(nodeA->left, nodeB->left);
            detectCollisionsRecursive(nodeA->left, nodeB->right);
            detectCollisionsRecursive(nodeA->right, nodeB->left);
            detectCollisionsRecursive(nodeA->right, nodeB->right);
        }
    }
    
    // Self-collision detection within a single subtree
    void detectSelfCollisionsRecursive(BvhNode* node) {
        if (!node || !node->aggregated.containsAwake) return;
        
        if (node->isLeaf) return; // Leaf nodes can't have self-collisions
        
        // Check left subtree against right subtree
        if (node->left && node->right) {
            detectCollisionsRecursive(node->left, node->right);
        }
        
        // Recursively check self-collisions within each subtree
        detectSelfCollisionsRecursive(node->left);
        detectSelfCollisionsRecursive(node->right);
    }
    
public:
    Bvh() : root(nullptr) {}
    
    ~Bvh() {
        destroyNode(root);
    }
    
    // Insert a new leaf and return pointer to it
    BvhNode* insert(const Aabb& bounds, void* data, const CollisionProperties& props = CollisionProperties()) {
		BvhNode* newLeaf = new BvhNode(bounds, data, props);
        
        if (!root) {
            root = newLeaf;
            return newLeaf;
        }
        
        // Find the best place to insert
        BvhNode* bestNode = findBestInsertionPoint(bounds, props);
        
        // Create a new internal node to be the parent of bestNode and newLeaf
        BvhNode* oldParent = bestNode->parent;
        BvhNode* newParent = new BvhNode(bestNode, newLeaf);
        newParent->parent = oldParent;
        
        if (oldParent) {
            if (oldParent->left == bestNode) {
                oldParent->left = newParent;
            } else {
                oldParent->right = newParent;
            }
        } else {
            root = newParent;
        }
        
        // Update ancestors
        updateAncestors(newParent);
        
        return newLeaf;
    }
    
    // Remove a leaf node
    void remove(BvhNode* leaf) {
        if (!leaf || !leaf->isLeaf) return;
        
        if (leaf == root) {
            root = nullptr;
            delete leaf;
            return;
        }
        
        BvhNode* parent = leaf->parent;
        BvhNode* sibling = leaf->getSibling();
        BvhNode* grandparent = parent->parent;
        
        // Replace parent with sibling
        if (grandparent) {
            if (grandparent->left == parent) {
                grandparent->left = sibling;
            } else {
                grandparent->right = sibling;
            }
            sibling->parent = grandparent;
        } else {
            root = sibling;
            sibling->parent = nullptr;
        }
        
        // Update ancestors starting from sibling's parent (the original grandparent)
        if (grandparent) {
            updateAncestors(sibling);
        }
        
        // Clean up
        delete leaf;
        delete parent;
    }
    
    // Update a leaf's AABB and propagate changes with re-insertion
    BvhNode* updateLeaf(BvhNode* leaf, const Aabb& newBounds) {
        if (!leaf || !leaf->isLeaf) return leaf;
        
        // Capture data and properties before removal
        void* userData = leaf->data;
        CollisionProperties props = leaf->properties;

        // Remove the leaf from the tree
        remove(leaf);
        
        // Re-insert the leaf at the best new location
        return insert(newBounds, userData, props);
    }
    
    // Detect all potential collision pairs in the tree
    void detectCollisions() {
        collisionPairs.clear();
        if (!root) return;
        
        // Perform self-collision detection starting from root
        detectSelfCollisionsRecursive(root);
    }
    
    // Query all leaves that overlap with the given bounds
    void query(const Aabb& queryBounds, std::vector<BvhNode*>& results) const {
        results.clear();
        queryRecursive(root, queryBounds, results);
    }
    
    // Get root node (for debugging/visualization)
    BvhNode* getRoot() const { return root; }

    // Update tree metrics
    void updateMetrics() {
        if (!root) {
            g_bvhMetrics.max_depth = 0;
            g_bvhMetrics.avg_depth = 0;
            return;
        }
        
        int max_d = 0;
        long total_d = 0;
        int leaf_count = 0;
        
        std::vector<std::pair<BvhNode*, int>> stack;
        stack.push_back({root, 0});
        
        while (!stack.empty()) {
            auto current = stack.back();
            stack.pop_back();
            
            BvhNode* node = current.first;
            int depth = current.second;
            
            if (node->isLeaf) {
                leaf_count++;
                total_d += depth;
                if (depth > max_d) max_d = depth;
            } else {
                if (node->left) stack.push_back({node->left, depth + 1});
                if (node->right) stack.push_back({node->right, depth + 1});
            }
        }
        
        g_bvhMetrics.max_depth = max_d;
        g_bvhMetrics.avg_depth = leaf_count > 0 ? (float)total_d / leaf_count : 0;
    }
    
    // Check if tree is empty
    bool empty() const { return root == nullptr; }

    // Clear the tree
    void clear() {
        destroyNode(root);
        root = nullptr;
        collisionPairs.clear();
    }
};

#endif // BVH_H