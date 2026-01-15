#include <gtest/gtest.h>
#include "world.h"
#include "body.h"
#include "fixture.h"

// Helper to create options
emscripten_val createWorldOptions(float x, float y, float mass = 1.0f) {
    emscripten_val options;
    options.properties["x"] = x;
    options.properties["y"] = y;
    options.properties["mass"] = mass;
    options.properties["type"] = (int)ObjectType::DYNAMIC_OBJECT;
    options.properties["shape"] = (int)ObjectShape::CIRCLE;
    options.properties["radius"] = 1.0f;
    return options;
}

TEST(WorldTest, BasicStepKinematics) {
    World world;
    world.setGravity(0.0f, -10.0f); // 10 units/s^2 downwards
    world.setTimeStep(0.1f);
    
    int id = world.makeBody(1, createWorldOptions(0.0f, 10.0f));
    Body* obj = world.getBodyAtIndex(id);
    
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
    world.makeBody(1, createWorldOptions(0.0f, 0.0f));
    world.makeBody(2, createWorldOptions(1.0f, 0.0f));
    
    world.step();
    
    // Check collision flags in liveBodyIntData
    // BODY_IDATA_FLAGS is index 3 in the epoch
    int flag1 = world.liveBodyIntData[0 * BODY_IDATA_EPO + BODY_IDATA_FLAGS];
    int flag2 = world.liveBodyIntData[1 * BODY_IDATA_EPO + BODY_IDATA_FLAGS];
    
    EXPECT_TRUE(flag1 & HAS_PHYSICAL_COLLISION);
    EXPECT_TRUE(flag2 & HAS_PHYSICAL_COLLISION);
    EXPECT_TRUE(flag1 & HAS_AABB_COLLISION);
}

TEST(WorldTest, ObjectRemoval) {
    World world;
    world.makeBody(1, createWorldOptions(0, 0));
    world.makeBody(2, createWorldOptions(10, 10));
    
    EXPECT_EQ(world.getBodyCount(), 2);
    
    world.removeObject(1);
    EXPECT_EQ(world.getBodyCount(), 1);
    EXPECT_EQ(world.getBodyAtIndex(0)->getId(), 2);
}




