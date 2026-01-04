#include <gtest/gtest.h>
#include "world.h"
#include "physical-object.h"

// Helper to create options with bitmasks
emscripten_val createMaskOptions(float x, float y, uint32_t category, uint32_t mask) {
    emscripten_val options;
    options.properties["x"] = x;
    options.properties["y"] = y;
    options.properties["mass"] = 1.0f;
    options.properties["type"] = (int)ObjectType::RIGID_BODY;
    options.properties["shape"] = (int)ObjectShape::CIRCLE;
    options.properties["radius"] = 1.0f;
    options.properties["categoryBits"] = (int)category;
    options.properties["maskBits"] = (int)mask;
    return options;
}

TEST(CollisionMaskTest, NoCollisionBetweenDifferentMasks) {
    World world;
    world.setGravity(0.0f, 0.0f);
    world.setTimeStep(0.016f);
    
    // Two overlapping circles with incompatible bitmasks
    // Category 1, Mask 2 (collides with 2)
    world.makeObject(1, createMaskOptions(0.0f, 0.0f, 0x1, 0x2));
    // Category 1, Mask 1 (collides with 1)
    world.makeObject(2, createMaskOptions(0.5f, 0.0f, 0x1, 0x1));
    
    world.step();
    
    // They should NOT have physical collision even though they overlap
    int flag1 = world.liveIntData[0 * LIVE_INT_EPO + LIVE_INT_HAS_COLLISION];
    int flag2 = world.liveIntData[1 * LIVE_INT_EPO + LIVE_INT_HAS_COLLISION];
    
    EXPECT_FALSE(flag1 & HAS_PHYSICAL_COLLISION);
    EXPECT_FALSE(flag2 & HAS_PHYSICAL_COLLISION);
    
    // But they should have AABB collision if they overlap in BVH (BVH overlaps by bounds)
    // Wait, the BVH optimization uses category/mask bits to skip narrow phase.
    // So HAS_AABB_COLLISION might still be set if they were checked in broadphase.
}

TEST(CollisionMaskTest, CollisionBetweenCompatibleMasks) {
    World world;
    world.setGravity(0.0f, 0.0f);
    
    // Two overlapping circles with compatible bitmasks
    // Category 1, Mask 1
    world.makeObject(1, createMaskOptions(0.0f, 0.0f, 0x1, 0x1));
    // Category 1, Mask 1
    world.makeObject(2, createMaskOptions(0.5f, 0.0f, 0x1, 0x1));
    
    world.step();
    
    int flag1 = world.liveIntData[0 * LIVE_INT_EPO + LIVE_INT_HAS_COLLISION];
    int flag2 = world.liveIntData[1 * LIVE_INT_EPO + LIVE_INT_HAS_COLLISION];
    
    EXPECT_TRUE(flag1 & HAS_PHYSICAL_COLLISION);
    EXPECT_TRUE(flag2 & HAS_PHYSICAL_COLLISION);
}

TEST(CollisionMaskTest, RuntimeUpdateMasks) {
    World world;
    world.setGravity(0.0f, 0.0f);
    
    // Initially compatible
    world.makeObject(1, createMaskOptions(0.0f, 0.0f, 0x1, 0x1));
    world.makeObject(2, createMaskOptions(0.5f, 0.0f, 0x1, 0x1));
    
    world.step();
    EXPECT_TRUE(world.liveIntData[0 * LIVE_INT_EPO + LIVE_INT_HAS_COLLISION] & HAS_PHYSICAL_COLLISION);
    
    // Now make them incompatible
    world.getObject(1)->setMaskBits(0x2); // Object 1 now only collides with 2
    
    world.step();
    EXPECT_FALSE(world.liveIntData[0 * LIVE_INT_EPO + LIVE_INT_HAS_COLLISION] & HAS_PHYSICAL_COLLISION);
    
    // Now make them compatible again
    world.getObject(2)->setCategoryBits(0x2); // Object 2 is now category 2
    
    world.step();
    EXPECT_TRUE(world.liveIntData[0 * LIVE_INT_EPO + LIVE_INT_HAS_COLLISION] & HAS_PHYSICAL_COLLISION);
}

