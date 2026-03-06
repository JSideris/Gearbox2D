#ifndef BVH_H
#define BVH_H

#include "aabb.h"
#include <vector>
#include <memory>
#include <algorithm>
#include <limits>

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
    int32_t bodyId;             // The ID of the body this fixture belongs to
    Vec2 velocity;              // Current velocity of the body
    
    CollisionProperties() 
        : userCategory(0xFFFFFFFF), 
          userMask(0xFFFFFFFF),
          systemCategory(CATEGORY_DYNAMIC),
          isSleeping(false),
          isRigid(true),
          bodyId(-1),
          velocity(0, 0) {}
    
    bool canCollideWith(const CollisionProperties& other) const {
        // Skip fixtures belonging to the same body
        if (bodyId != -1 && bodyId == other.bodyId) return false;

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
    bool containsSleep;                // Any sleeping objects in subtree?
    bool containsRigid;                // Any rigid objects in subtree?
    int32_t bodyId;                    // The ID if all objects belong to same body, else -1
    bool isMultiBody;                  // True if contains objects from multiple bodies
    Vec2 avgVelocity;                  // Average velocity of all objects in subtree
    int leafCount;                     // Number of leaves in subtree
    
    AggregatedProperties() 
        : containsSystemCategories(0), 
          containsUserCategories(0),
          mayCollideWithUserMask(0),
          containsAwake(false),
          containsSleep(false),
          containsRigid(false),
          bodyId(-1),
          isMultiBody(false),
          avgVelocity(0, 0),
          leafCount(0) {}
    
    void mergeWith(const AggregatedProperties& other) {
        containsSystemCategories |= other.containsSystemCategories;
        containsUserCategories |= other.containsUserCategories;
        mayCollideWithUserMask |= other.mayCollideWithUserMask;
        containsAwake |= other.containsAwake;
        containsSleep |= other.containsSleep;
        containsRigid |= other.containsRigid;

        if (leafCount == 0) {
            bodyId = other.bodyId;
            isMultiBody = other.isMultiBody;
            avgVelocity = other.avgVelocity;
        } else if (other.leafCount > 0) {
            if (isMultiBody || other.isMultiBody || bodyId != other.bodyId) {
                isMultiBody = true;
                bodyId = -1;
            }
            // Running weighted average
            avgVelocity = (avgVelocity * (float)leafCount + other.avgVelocity * (float)other.leafCount) / (float)(leafCount + other.leafCount);
        }
        leafCount += other.leafCount;
    }
    
    static AggregatedProperties fromLeaf(const CollisionProperties& props) {
        AggregatedProperties agg;
        agg.containsSystemCategories = props.systemCategory;
        agg.containsUserCategories = props.userCategory;
        agg.mayCollideWithUserMask = props.userMask;
        agg.containsAwake = !props.isSleeping;
        agg.containsSleep = props.isSleeping;
        agg.containsRigid = props.isRigid;
        agg.bodyId = props.bodyId;
        agg.isMultiBody = false;
        agg.avgVelocity = props.velocity;
        agg.leafCount = 1;
        return agg;
    }
    
    bool canPotentiallyCollideWith(const AggregatedProperties& other) const {
        // Optimization: Skip if both subtrees only contain fixtures from the same body
        if (bodyId != -1 && bodyId == other.bodyId && !isMultiBody && !other.isMultiBody) {
            return false;
        }

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

class BvhNode {
public:
    Aabb bounds;
    BvhNode* parent;
    bool isLeaf;
    int height;

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
    : bounds(aabb), parent(nullptr), isLeaf(true), height(0),
      data(userData), properties(props), left(nullptr), right(nullptr) {
		// For leaves, aggregated properties come directly from leaf properties
		aggregated = AggregatedProperties::fromLeaf(properties);
	}
    
    // Constructor for internal node
    BvhNode(BvhNode* leftChild, BvhNode* rightChild)
		: parent(nullptr), isLeaf(false), height(0), data(nullptr),
		left(leftChild), right(rightChild) {
        
        if (left) left->parent = this;
        if (right) right->parent = this;
        
        updateBounds();
        updateAggregatedProperties();
        updateHeight();
    }
    
    ~BvhNode() {
        // Don't delete children here - BVH will manage the tree destruction
    }
    
    void updateHeight() {
        if (isLeaf) {
            height = 0;
        } else {
            height = 1 + std::max(left ? left->height : 0, right ? right->height : 0);
        }
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
    
    // Update bounds and properties for all ancestors
    void updateAncestors() {
        BvhNode* current = parent;
        while (current) {
            current->updateBounds();
            current->updateAggregatedProperties();
            current->updateHeight();
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
    struct Config {
        float maskWeight = 1.0f;
        float sleepWeight = 1.0f;
        float staticWeight = 0.2f;
        float bodyWeight = 0.3f;
        float sensorWeight = 0.2f;
        float velocityWeight = 0.1f;
    };

    Config config;

    // Public collision results - contains pairs of Fixture pointers
    std::vector<std::pair<void*, void*>> collisionPairs;

private:
    BvhNode* root;
    uint32_t tieBreaker = 0;
    
    // Surface Area Heuristic for insertion cost calculation
    float computeInsertionCost(BvhNode* node, const Aabb& newBounds, const CollisionProperties& newProps) const {
        if (!node) return std::numeric_limits<float>::max();
        
        Aabb combinedBounds = node->bounds;
        combinedBounds.mergeWith(newBounds);
        
        float areaIncrease = combinedBounds.getSurfaceArea();
        if (!node->isLeaf) {
            areaIncrease -= node->bounds.getSurfaceArea();
        }
        
        // --- Keep existing biasing factors as secondary weights ---
        
        // Mask Biasing: Logical separation of user-defined categories
        // We exclude internal system categories from general mask pollution
        uint32_t newCats = newProps.userCategory & ~node->aggregated.containsUserCategories;
        uint32_t newMasks = newProps.userMask & ~node->aggregated.mayCollideWithUserMask;
        int maskPollution = __builtin_popcount(newCats) + __builtin_popcount(newMasks);
        float maskCost = maskPollution * config.maskWeight;

        // Static Biasing: Strong-arm static objects into their own pure branches
        bool isNewStatic = (newProps.systemCategory & CATEGORY_STATIC) != 0;
        bool isSubtreePureStatic = (node->aggregated.containsSystemCategories == CATEGORY_STATIC);
        float staticCost = (isNewStatic != isSubtreePureStatic ? 1.0f : 0.0f) * config.staticWeight;

        // Sensor Biasing: Keep sensors grouped to skip rigid collision checks
        bool isNewSensor = (newProps.systemCategory & CATEGORY_SENSOR) != 0;
        bool isSubtreePureSensor = (node->aggregated.containsSystemCategories == CATEGORY_SENSOR);
        float sensorCost = (isNewSensor != isSubtreePureSensor ? 1.0f : 0.0f) * config.sensorWeight;

        // Sleep Biasing: penalize "polluting" a subtree with different sleep states.
        bool addsAwake = !newProps.isSleeping && !node->aggregated.containsAwake;
        bool addsSleep = newProps.isSleeping && !node->aggregated.containsSleep;
        float sleepCost = ((addsAwake ? 1.0f : 0.0f) + (addsSleep ? 1.0f : 0.0f)) * config.sleepWeight;

        // Body Biasing: Encourage fixtures from the same body to stay together
        float bodyCost = 0.0f;
        if (node->aggregated.leafCount > 0) {
            if (node->aggregated.isMultiBody || node->aggregated.bodyId != newProps.bodyId) {
                bodyCost = config.bodyWeight;
            }
        }

        // Velocity Biasing: Group objects moving in similar directions/speeds
        float velocityCost = 0.0f;
        if (node->aggregated.leafCount > 0) {
            float vDiff = (newProps.velocity - node->aggregated.avgVelocity).magnitude();
            velocityCost = vDiff * config.velocityWeight;
        }
        
        return areaIncrease + maskCost + staticCost + sensorCost + sleepCost + bodyCost + velocityCost;
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
            if (leftCost < rightCost) {
                current = current->left;
            } else if (rightCost < leftCost) {
                current = current->right;
            } else {
                // Costs are equal, use tie-breaker to prevent biased unbalancing
                tieBreaker++;
                if (tieBreaker % 2 == 0) {
                    current = current->left;
                } else {
                    current = current->right;
                }
            }
        }
        
        return current;
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
    
    // Rotate a node to maintain AVL balance (height-based)
    // Returns the new root of this subtree
    BvhNode* balance(BvhNode* iA) {
        if (!iA || iA->isLeaf || iA->height < 2) return iA;
        
        BvhNode* iB = iA->left;
        BvhNode* iC = iA->right;
        
        int balanceFactor = (iC ? iC->height : 0) - (iB ? iB->height : 0);
        
        // Rotate C up (Right heavy)
        if (balanceFactor > 1) {
            BvhNode* iF = iC->left;
            BvhNode* iG = iC->right;
            
            // Swap A and C
            iC->left = iA;
            iC->parent = iA->parent;
            iA->parent = iC;
            
            if (iC->parent) {
                if (iC->parent->left == iA) iC->parent->left = iC;
                else iC->parent->right = iC;
            } else {
                root = iC;
            }
            
            // Re-assign iC's children
            if ((iF ? iF->height : 0) > (iG ? iG->height : 0)) {
                iC->right = iF;
                iA->right = iG;
                if (iG) iG->parent = iA;
                if (iF) iF->parent = iC;
            } else {
                iC->right = iG;
                iA->right = iF;
                if (iF) iF->parent = iA;
                if (iG) iG->parent = iC;
            }
            
            iA->updateBounds(); iA->updateAggregatedProperties(); iA->updateHeight();
            iC->updateBounds(); iC->updateAggregatedProperties(); iC->updateHeight();
            return iC;
        }
        
        // Rotate B up (Left heavy)
        if (balanceFactor < -1) {
            BvhNode* iD = iB->left;
            BvhNode* iE = iB->right;
            
            // Swap A and B
            iB->right = iA;
            iB->parent = iA->parent;
            iA->parent = iB;
            
            if (iB->parent) {
                if (iB->parent->left == iA) iB->parent->left = iB;
                else iB->parent->right = iB;
            } else {
                root = iB;
            }
            
            // Re-assign iB's children
            if ((iD ? iD->height : 0) > (iE ? iE->height : 0)) {
                iB->left = iD;
                iA->left = iE;
                if (iE) iE->parent = iA;
                if (iD) iD->parent = iB;
            } else {
                iB->left = iE;
                iA->left = iD;
                if (iD) iD->parent = iA;
                if (iE) iE->parent = iB;
            }
            
            iA->updateBounds(); iA->updateAggregatedProperties(); iA->updateHeight();
            iB->updateBounds(); iB->updateAggregatedProperties(); iB->updateHeight();
            return iB;
        }
        
        return iA;
    }
    
    // Update bounds and properties up the tree, balancing as we go
    void updateAncestors(BvhNode* node) {
        BvhNode* current = node;
        while (current) {
            current->updateBounds();
            current->updateAggregatedProperties();
            current->updateHeight();
            current = balance(current);
            current = current->parent;
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
		if (!nodeA || !nodeB) return;
		
		// Early exit based on aggregated properties
		if (!nodeA->aggregated.canPotentiallyCollideWith(nodeB->aggregated)) {
			return;
		}
        
        // Skip if bounds don't overlap
        if (!nodeA->bounds.overlaps(nodeB->bounds)) return;
        
        // If both are leaves, add the collision pair
		if (nodeA->isLeaf && nodeB->isLeaf) {
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