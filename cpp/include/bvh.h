#ifndef BVH_H
#define BVH_H

#include "aabb.h"
#include "simd-math.h"
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
    bool mayContainSelfCollisions;     // True if subtree could contain colliding objects
    
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
          leafCount(0),
          mayContainSelfCollisions(false) {}
    
    void mergeWith(const AggregatedProperties& other) {
        bool childrenCanCollide = canPotentiallyCollideWith(other);

        containsSystemCategories |= other.containsSystemCategories;
        containsUserCategories |= other.containsUserCategories;
        mayCollideWithUserMask |= other.mayCollideWithUserMask;
        containsAwake |= other.containsAwake;
        containsSleep |= other.containsSleep;
        containsRigid |= other.containsRigid;
        mayContainSelfCollisions = mayContainSelfCollisions || other.mayContainSelfCollisions || childrenCanCollide;

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
        agg.mayContainSelfCollisions = false;
        return agg;
    }
    
    bool canPotentiallyCollideWith(const AggregatedProperties& other) const {
        // Optimization: Skip if both subtrees only contain fixtures from the same body
        if (bodyId != -1 && bodyId == other.bodyId && !isMultiBody && !other.isMultiBody) {
            return false;
        }

        // If both subtrees contain only sleeping objects, skip
        if (!containsAwake && !other.containsAwake) return false;

        // Static-Static Pruning: Skip if both subtrees contain ONLY static objects
        if (containsSystemCategories == CATEGORY_STATIC && 
            other.containsSystemCategories == CATEGORY_STATIC) {
            return false;
        }
        
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
    int childCount;

    // SoA data for SIMD loading of child bounds
    // We allocate 8 to maintain 16-byte alignment and safely allow a 5th temporary child during splits
    alignas(16) float childMinX[8];
    alignas(16) float childMinY[8];
    alignas(16) float childMaxX[8];
    alignas(16) float childMaxY[8];

    BvhNode* children[8];

	// For leaf nodes
	CollisionProperties properties;  // Leaf collision properties

	// For both leaf and internal nodes
	AggregatedProperties aggregated; // Aggregated subtree properties
    
    // For leaf nodes
    void* data;
    
    // Constructor for leaf node
	BvhNode(const Aabb& aabb, void* userData, const CollisionProperties& props)
    : bounds(aabb), parent(nullptr), isLeaf(true), height(0), childCount(0),
      data(userData), properties(props) {
        for (int i = 0; i < 8; ++i) {
            children[i] = nullptr;
            childMinX[i] = childMinY[i] = std::numeric_limits<float>::max();
            childMaxX[i] = childMaxY[i] = std::numeric_limits<float>::lowest();
        }
		// For leaves, aggregated properties come directly from leaf properties
		aggregated = AggregatedProperties::fromLeaf(properties);
	}
    
    // Constructor for internal node
    BvhNode()
		: parent(nullptr), isLeaf(false), height(0), childCount(0), data(nullptr) {
        for (int i = 0; i < 8; ++i) {
            children[i] = nullptr;
            childMinX[i] = childMinY[i] = std::numeric_limits<float>::max();
            childMaxX[i] = childMaxY[i] = std::numeric_limits<float>::lowest();
        }
        updateHeight();
    }
    
    ~BvhNode() {
        // Don't delete children here - BVH will manage the tree destruction
    }
    
    void updateHeight() {
        if (isLeaf) {
            height = 0;
        } else {
            int maxH = 0;
            for (int i = 0; i < childCount; ++i) {
                if (children[i]) maxH = std::max(maxH, children[i]->height);
            }
            height = 1 + maxH;
        }
    }

    void updateBounds() {
        if (isLeaf) return;
        
        bounds = Aabb();
        for (int i = 0; i < childCount; ++i) {
            if (children[i]) {
                bounds.mergeWith(children[i]->bounds);
                childMinX[i] = children[i]->bounds.min.x;
                childMinY[i] = children[i]->bounds.min.y;
                childMaxX[i] = children[i]->bounds.max.x;
                childMaxY[i] = children[i]->bounds.max.y;
            } else {
                childMinX[i] = childMinY[i] = std::numeric_limits<float>::max();
                childMaxX[i] = childMaxY[i] = std::numeric_limits<float>::lowest();
            }
        }
        // Fill remaining slots with "empty" bounds that won't overlap anything
        for (int i = childCount; i < 8; ++i) {
            childMinX[i] = childMinY[i] = std::numeric_limits<float>::max();
            childMaxX[i] = childMaxY[i] = std::numeric_limits<float>::lowest();
        }
    }
    
	void updateAggregatedProperties() {
		if (isLeaf) {
			aggregated = AggregatedProperties::fromLeaf(properties);
			return;
		}
		
		aggregated = AggregatedProperties();
		for (int i = 0; i < childCount; ++i) {
            if (children[i]) aggregated.mergeWith(children[i]->aggregated);
        }
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
    
    void addChild(BvhNode* child) {
        if (childCount >= 8) return; // Safely allow temporarily exceeding 4 children before splitting
        children[childCount] = child;
        child->parent = this;
        childCount++;
        updateBounds();
        updateAggregatedProperties();
        updateHeight();
    }

    void removeChild(BvhNode* child) {
        for (int i = 0; i < childCount; ++i) {
            if (children[i] == child) {
                // Shift children left
                for (int j = i; j < childCount - 1; ++j) {
                    children[j] = children[j + 1];
                }
                children[childCount - 1] = nullptr;
                childCount--;
                child->parent = nullptr;
                updateBounds();
                updateAggregatedProperties();
                updateHeight();
                return;
            }
        }
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
    
    // Calculate logical biasing multiplier for SAH
    float computeBiasingMultiplier(BvhNode* node, const CollisionProperties& newProps) const {
        if (!node) return 1.0f;
        
        // --- Logical Biasing Multipliers ---
        float multiplier = 1.0f;

        // Mask Biasing: Logical separation of user-defined categories
        uint32_t newCats = newProps.userCategory & ~node->aggregated.containsUserCategories;
        uint32_t newMasks = newProps.userMask & ~node->aggregated.mayCollideWithUserMask;
        int maskPollution = __builtin_popcount(newCats) + __builtin_popcount(newMasks);
        if (maskPollution > 0) {
            multiplier += maskPollution * config.maskWeight;
        }

        // Static Biasing: Encourage static objects into pure branches
        bool isNewStatic = (newProps.systemCategory & CATEGORY_STATIC) != 0;
        bool isSubtreePureStatic = (node->aggregated.containsSystemCategories == CATEGORY_STATIC);
        if (isNewStatic != isSubtreePureStatic) {
            multiplier += config.staticWeight;
        }

        // Sensor Biasing: Keep sensors grouped
        bool isNewSensor = (newProps.systemCategory & CATEGORY_SENSOR) != 0;
        bool isSubtreePureSensor = (node->aggregated.containsSystemCategories == CATEGORY_SENSOR);
        if (isNewSensor != isSubtreePureSensor) {
            multiplier += config.sensorWeight;
        }

        // Sleep Biasing: Penalize mixing awake/sleeping objects
        bool addsAwake = !newProps.isSleeping && !node->aggregated.containsAwake;
        bool addsSleep = newProps.isSleeping && !node->aggregated.containsSleep;
        if (addsAwake || addsSleep) {
            multiplier += config.sleepWeight;
        }

        // Body Biasing: Keep fixtures from same body together
        if (node->aggregated.leafCount > 0) {
            if (node->aggregated.isMultiBody || node->aggregated.bodyId != newProps.bodyId) {
                multiplier += config.bodyWeight;
            }
        }

        // Velocity Biasing: Group similar velocities
        if (node->aggregated.leafCount > 0) {
            float vDiff = (newProps.velocity - node->aggregated.avgVelocity).magnitude();
            multiplier += vDiff * config.velocityWeight;
        }

        return multiplier;
    }
    
    // Find the best place to insert a new leaf
    BvhNode* findBestInsertionPoint(const Aabb& newBounds, const CollisionProperties& newProps) {
        if (!root) return nullptr;
        
        BvhNode* current = root;
        
        while (!current->isLeaf) {
            // SIMD-accelerated cost calculation for 4 children
            V128 q_minX = v128_splat_f32(newBounds.min.x);
            V128 q_minY = v128_splat_f32(newBounds.min.y);
            V128 q_maxX = v128_splat_f32(newBounds.max.x);
            V128 q_maxY = v128_splat_f32(newBounds.max.y);

            V128 c_minX = v128_load_f32(current->childMinX);
            V128 c_minY = v128_load_f32(current->childMinY);
            V128 c_maxX = v128_load_f32(current->childMaxX);
            V128 c_maxY = v128_load_f32(current->childMaxY);

            // Old Area: 2 * ((c.max.x - c.min.x) + (c.max.y - c.min.y))
            V128 oldWidth = v128_sub_f32(c_maxX, c_minX);
            V128 oldHeight = v128_sub_f32(c_maxY, c_minY);
            V128 oldArea = v128_mul_f32(v128_splat_f32(2.0f), v128_add_f32(oldWidth, oldHeight));

            // Combined bounds: min = min(c.min, q.min), max = max(c.max, q.max)
            V128 combinedMinX = v128_min_f32(c_minX, q_minX);
            V128 combinedMinY = v128_min_f32(c_minY, q_minY);
            V128 combinedMaxX = v128_max_f32(c_maxX, q_maxX);
            V128 combinedMaxY = v128_max_f32(c_maxY, q_maxY);

            // New Surface area
            V128 newWidth = v128_sub_f32(combinedMaxX, combinedMinX);
            V128 newHeight = v128_sub_f32(combinedMaxY, combinedMinY);
            V128 newArea = v128_mul_f32(v128_splat_f32(2.0f), v128_add_f32(newWidth, newHeight));

            // Area Increase = newArea - oldArea
            V128 areaIncrease = v128_sub_f32(newArea, oldArea);

            // Cost = areaIncrease + tiny fraction of newArea to differentiate identical increases
            V128 baseCost = v128_add_f32(areaIncrease, v128_mul_f32(newArea, v128_splat_f32(0.01f)));

            float costs[4];
            v128_store_f32(costs, baseCost);

            // Apply multipliers sequentially
            for (int i = 0; i < current->childCount; ++i) {
                float multiplier = computeBiasingMultiplier(current->children[i], newProps);
                costs[i] *= multiplier;
            }

            int bestIndex = 0;
            float minCost = costs[0];
            for (int i = 1; i < current->childCount; ++i) {
                if (costs[i] < minCost) {
                    minCost = costs[i];
                    bestIndex = i;
                } else if (costs[i] == minCost) {
                    tieBreaker++;
                    if (tieBreaker % 2 == 0) bestIndex = i;
                }
            }
            
            current = current->children[bestIndex];
        }
        
        return current;
    }
    
    // Recursively destroy nodes
    void destroyNode(BvhNode* node) {
        if (!node) return;
        
        if (!node->isLeaf) {
            for (int i = 0; i < node->childCount; ++i) {
                destroyNode(node->children[i]);
            }
        }
        
        delete node;
    }
    
    // Split a node that has more than 4 children
    void splitNode(BvhNode* node) {
        if (node->childCount <= 4) return;

        // Find the axis to split along based on children's centers
        float minX = std::numeric_limits<float>::max();
        float maxX = std::numeric_limits<float>::lowest();
        float minY = std::numeric_limits<float>::max();
        float maxY = std::numeric_limits<float>::lowest();

        for (int i = 0; i < node->childCount; ++i) {
            Vec2 center = node->children[i]->bounds.getCenter();
            minX = std::min(minX, center.x);
            maxX = std::max(maxX, center.x);
            minY = std::min(minY, center.y);
            maxY = std::max(maxY, center.y);
        }

        bool splitX = (maxX - minX) > (maxY - minY);
        
        // Sort children along the chosen axis
        std::sort(node->children, node->children + node->childCount, [splitX](BvhNode* a, BvhNode* b) {
            Vec2 ca = a->bounds.getCenter();
            Vec2 cb = b->bounds.getCenter();
            return splitX ? ca.x < cb.x : ca.y < cb.y;
        });

        // Split into two nodes
        int splitIndex = node->childCount / 2;
        int originalCount = node->childCount;
        
        BvhNode* newNode = new BvhNode();
        newNode->parent = node->parent;
        
        // Move second half of children to newNode
        node->childCount = splitIndex;
        newNode->childCount = originalCount - splitIndex;
        
        for (int i = 0; i < newNode->childCount; ++i) {
            newNode->children[i] = node->children[splitIndex + i];
            newNode->children[i]->parent = newNode;
            node->children[splitIndex + i] = nullptr;
        }

        node->updateBounds();
        node->updateAggregatedProperties();
        node->updateHeight();
        
        newNode->updateBounds();
        newNode->updateAggregatedProperties();
        newNode->updateHeight();

        if (!node->parent) {
            // node was root, create a new root
            BvhNode* newRoot = new BvhNode();
            newRoot->addChild(node);
            newRoot->addChild(newNode);
            root = newRoot;
        } else {
            // add newNode to parent
            node->parent->addChild(newNode);
            if (node->parent->childCount > 4) {
                splitNode(node->parent);
            } else {
                updateAncestors(node->parent->parent);
            }
        }
    }
    
    // Update bounds and properties up the tree
    void updateAncestors(BvhNode* node) {
        BvhNode* current = node;
        while (current) {
            current->updateBounds();
            current->updateAggregatedProperties();
            current->updateHeight();
            current = current->parent;
        }
    }
    
    // Query implementation
    void queryRecursive(BvhNode* node, const Aabb& queryBounds, std::vector<BvhNode*>& results) const {
        if (!node || !node->bounds.overlaps(queryBounds)) return;
        
        if (node->isLeaf) {
            results.push_back(node);
        } else {
            // SIMD 4-way check
            V128 q_minX = v128_splat_f32(queryBounds.min.x);
            V128 q_minY = v128_splat_f32(queryBounds.min.y);
            V128 q_maxX = v128_splat_f32(queryBounds.max.x);
            V128 q_maxY = v128_splat_f32(queryBounds.max.y);

            V128 c_minX = v128_load_f32(node->childMinX);
            V128 c_minY = v128_load_f32(node->childMinY);
            V128 c_maxX = v128_load_f32(node->childMaxX);
            V128 c_maxY = v128_load_f32(node->childMaxY);

            // Overlap check: (q.min.x <= c.max.x && q.max.x >= c.min.x) && (q.min.y <= c.max.y && q.max.y >= c.min.y)
            V128 overlapX1 = v128_le_f32(q_minX, c_maxX);
            V128 overlapX2 = v128_ge_f32(q_maxX, c_minX);
            V128 overlapY1 = v128_le_f32(q_minY, c_maxY);
            V128 overlapY2 = v128_ge_f32(q_maxY, c_minY);

            V128 overlap = v128_and(v128_and(overlapX1, overlapX2), v128_and(overlapY1, overlapY2));
            int mask = v128_bitmask(overlap);

            for (int i = 0; i < node->childCount; ++i) {
                if (mask & (1 << i)) {
                    queryRecursive(node->children[i], queryBounds, results);
                }
            }
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
            // nodeA is leaf, nodeB is internal. Test nodeA against children of nodeB using SIMD
            V128 q_minX = v128_splat_f32(nodeA->bounds.min.x);
            V128 q_minY = v128_splat_f32(nodeA->bounds.min.y);
            V128 q_maxX = v128_splat_f32(nodeA->bounds.max.x);
            V128 q_maxY = v128_splat_f32(nodeA->bounds.max.y);

            V128 c_minX = v128_load_f32(nodeB->childMinX);
            V128 c_minY = v128_load_f32(nodeB->childMinY);
            V128 c_maxX = v128_load_f32(nodeB->childMaxX);
            V128 c_maxY = v128_load_f32(nodeB->childMaxY);

            V128 overlapX1 = v128_le_f32(q_minX, c_maxX);
            V128 overlapX2 = v128_ge_f32(q_maxX, c_minX);
            V128 overlapY1 = v128_le_f32(q_minY, c_maxY);
            V128 overlapY2 = v128_ge_f32(q_maxY, c_minY);

            V128 overlap = v128_and(v128_and(overlapX1, overlapX2), v128_and(overlapY1, overlapY2));
            int mask = v128_bitmask(overlap);

            for (int i = 0; i < nodeB->childCount; ++i) {
                if (mask & (1 << i)) {
                    detectCollisionsRecursive(nodeA, nodeB->children[i]);
                }
            }
        } else if (nodeB->isLeaf) {
            // nodeB is leaf, nodeA is internal. Test nodeB against children of nodeA using SIMD
            V128 q_minX = v128_splat_f32(nodeB->bounds.min.x);
            V128 q_minY = v128_splat_f32(nodeB->bounds.min.y);
            V128 q_maxX = v128_splat_f32(nodeB->bounds.max.x);
            V128 q_maxY = v128_splat_f32(nodeB->bounds.max.y);

            V128 c_minX = v128_load_f32(nodeA->childMinX);
            V128 c_minY = v128_load_f32(nodeA->childMinY);
            V128 c_maxX = v128_load_f32(nodeA->childMaxX);
            V128 c_maxY = v128_load_f32(nodeA->childMaxY);

            V128 overlapX1 = v128_le_f32(q_minX, c_maxX);
            V128 overlapX2 = v128_ge_f32(q_maxX, c_minX);
            V128 overlapY1 = v128_le_f32(q_minY, c_maxY);
            V128 overlapY2 = v128_ge_f32(q_maxY, c_minY);

            V128 overlap = v128_and(v128_and(overlapX1, overlapX2), v128_and(overlapY1, overlapY2));
            int mask = v128_bitmask(overlap);

            for (int i = 0; i < nodeA->childCount; ++i) {
                if (mask & (1 << i)) {
                    detectCollisionsRecursive(nodeA->children[i], nodeB);
                }
            }
        } else {
            // Both are internal nodes. Descend the LARGER node to prevent combinatorial explosion.
            if (nodeA->bounds.getSurfaceArea() > nodeB->bounds.getSurfaceArea()) {
                // nodeA is larger. Splat nodeB's bounds and test against nodeA's children
                V128 q_minX = v128_splat_f32(nodeB->bounds.min.x);
                V128 q_minY = v128_splat_f32(nodeB->bounds.min.y);
                V128 q_maxX = v128_splat_f32(nodeB->bounds.max.x);
                V128 q_maxY = v128_splat_f32(nodeB->bounds.max.y);

                V128 c_minX = v128_load_f32(nodeA->childMinX);
                V128 c_minY = v128_load_f32(nodeA->childMinY);
                V128 c_maxX = v128_load_f32(nodeA->childMaxX);
                V128 c_maxY = v128_load_f32(nodeA->childMaxY);

                V128 overlapX1 = v128_le_f32(q_minX, c_maxX);
                V128 overlapX2 = v128_ge_f32(q_maxX, c_minX);
                V128 overlapY1 = v128_le_f32(q_minY, c_maxY);
                V128 overlapY2 = v128_ge_f32(q_maxY, c_minY);

                V128 overlap = v128_and(v128_and(overlapX1, overlapX2), v128_and(overlapY1, overlapY2));
                int mask = v128_bitmask(overlap);

                for (int i = 0; i < nodeA->childCount; ++i) {
                    if (mask & (1 << i)) {
                        detectCollisionsRecursive(nodeA->children[i], nodeB);
                    }
                }
            } else {
                // nodeB is larger. Splat nodeA's bounds and test against nodeB's children
                V128 q_minX = v128_splat_f32(nodeA->bounds.min.x);
                V128 q_minY = v128_splat_f32(nodeA->bounds.min.y);
                V128 q_maxX = v128_splat_f32(nodeA->bounds.max.x);
                V128 q_maxY = v128_splat_f32(nodeA->bounds.max.y);

                V128 c_minX = v128_load_f32(nodeB->childMinX);
                V128 c_minY = v128_load_f32(nodeB->childMinY);
                V128 c_maxX = v128_load_f32(nodeB->childMaxX);
                V128 c_maxY = v128_load_f32(nodeB->childMaxY);

                V128 overlapX1 = v128_le_f32(q_minX, c_maxX);
                V128 overlapX2 = v128_ge_f32(q_maxX, c_minX);
                V128 overlapY1 = v128_le_f32(q_minY, c_maxY);
                V128 overlapY2 = v128_ge_f32(q_maxY, c_minY);

                V128 overlap = v128_and(v128_and(overlapX1, overlapX2), v128_and(overlapY1, overlapY2));
                int mask = v128_bitmask(overlap);

                for (int i = 0; i < nodeB->childCount; ++i) {
                    if (mask & (1 << i)) {
                        detectCollisionsRecursive(nodeA, nodeB->children[i]);
                    }
                }
            }
        }
    }
    
    // Self-collision detection within a single subtree
    void detectSelfCollisionsRecursive(BvhNode* node) {
        if (!node || !node->aggregated.containsAwake || !node->aggregated.mayContainSelfCollisions) return;
        
        if (node->isLeaf) return; // Leaf nodes can't have self-collisions
        
        // Check children against each other
        for (int i = 0; i < node->childCount; ++i) {
            for (int j = i + 1; j < node->childCount; ++j) {
                detectCollisionsRecursive(node->children[i], node->children[j]);
            }
        }
        
        // Recursively check self-collisions within each child subtree
        for (int i = 0; i < node->childCount; ++i) {
            detectSelfCollisionsRecursive(node->children[i]);
        }
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
        
        // Find the best internal node to host the new leaf
        BvhNode* bestNode = findBestInsertionPoint(bounds, props);
        
        if (bestNode == root && bestNode->isLeaf) {
            // Root is a leaf, create new internal root
            BvhNode* newRoot = new BvhNode();
            newRoot->addChild(bestNode);
            newRoot->addChild(newLeaf);
            root = newRoot;
            return newLeaf;
        }

        // Add to parent of bestNode
        BvhNode* parent = bestNode->parent;
        parent->children[parent->childCount++] = newLeaf;
        newLeaf->parent = parent;

        // Check if parent needs split
        if (parent->childCount > 4) {
            splitNode(parent);
        } else {
            updateAncestors(parent);
        }
        
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
        
        BvhNode* current = leaf->parent;
        current->removeChild(leaf);
        delete leaf;

        // Remove empty ancestor nodes up the tree
        while (current && current->childCount == 0) {
            BvhNode* parent = current->parent;
            if (parent) {
                parent->removeChild(current);
            } else {
                root = nullptr;
            }
            delete current;
            current = parent;
        }

        // Update bounds for remaining ancestors
        if (current) {
            updateAncestors(current);
        }

        // Collapse root if it only has 1 child and is not a leaf
        while (root && !root->isLeaf && root->childCount == 1) {
            BvhNode* loneChild = root->children[0];
            BvhNode* oldRoot = root;
            root = loneChild;
            root->parent = nullptr;
            oldRoot->childCount = 0;
            delete oldRoot;
        }
    }
    
    // Update a leaf's AABB and propagate changes with re-insertion
    BvhNode* updateLeaf(BvhNode* leaf, const Aabb& newBounds, const CollisionProperties& props) {
        if (!leaf || !leaf->isLeaf) return leaf;
        
        // Capture data before removal
        void* userData = leaf->data;

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