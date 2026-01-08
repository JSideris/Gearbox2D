#include <gtest/gtest.h>
#include "world.h"
#include "physical-object.h"

// Helper to create options
emscripten_val createWorldOptions(float x, float y, float mass = 1.0f) {
    emscripten_val options;
    options.properties["x"] = x;
    options.properties["y"] = y;
    options.properties["mass"] = mass;
    options.properties["type"] = (int)ObjectType::RIGID_BODY;
    options.properties["shape"] = (int)ObjectShape::CIRCLE;
    options.properties["radius"] = 1.0f;
    return options;
}

TEST(WorldTest, BasicStepKinematics) {
    World world;
    world.setGravity(0.0f, -10.0f); // 10 units/s^2 downwards
    world.setTimeStep(0.1f);
    
    int id = world.makeObject(1, createWorldOptions(0.0f, 10.0f));
    PhysicalObject* obj = world.getObjectAtIndex(id);
    
    // Initial velocity should be 0
    EXPECT_FLOAT_EQ(obj->getVelocityY(), 0.0f);
    
    world.step();
    
    // After one step (0.1s):
    // Velocity: v = v0 + g * dt = 0 + (-10) * 0.1 = -1.0
    EXPECT_FLOAT_EQ(obj->getVelocityY(), -1.0f);
    
    // Position: y = y0 + v * dt = 10.0 + (-1.0) * 0.1 = 9.9
    EXPECT_FLOAT_EQ(obj->getY(), 9.9f);
}

TEST(WorldTest, CollisionFlagsUpdate) {
    World world;
    world.setGravity(0.0f, 0.0f);
    
    // Two circles overlapping at the start
    world.makeObject(1, createWorldOptions(0.0f, 0.0f));
    world.makeObject(2, createWorldOptions(1.0f, 0.0f));
    
    world.step();
    
    // Check collision flags in liveIntData
    // LIVE_INT_HAS_COLLISION is index 3 in the epoch
    int flag1 = world.liveIntData[0 * LIVE_INT_EPO + LIVE_INT_HAS_COLLISION];
    int flag2 = world.liveIntData[1 * LIVE_INT_EPO + LIVE_INT_HAS_COLLISION];
    
    EXPECT_TRUE(flag1 & HAS_PHYSICAL_COLLISION);
    EXPECT_TRUE(flag2 & HAS_PHYSICAL_COLLISION);
    EXPECT_TRUE(flag1 & HAS_AABB_COLLISION);
}

TEST(WorldTest, ObjectRemoval) {
    World world;
    world.makeObject(1, createWorldOptions(0, 0));
    world.makeObject(2, createWorldOptions(10, 10));
    
    EXPECT_EQ(world.getObjectCount(), 2);
    
    world.removeObject(1);
    EXPECT_EQ(world.getObjectCount(), 1);
    EXPECT_EQ(world.getObjectAtIndex(0)->getId(), 2);
}




