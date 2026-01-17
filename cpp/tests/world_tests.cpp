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

// Helper to create fixture options
emscripten_val createFixtureOptions(int shape, float radius = 1.0f) {
    emscripten_val options;
    options.properties["shape"] = shape;
    options.properties["radius"] = radius;
    options.properties["categoryBits"] = 0xFFFF;
    options.properties["maskBits"] = 0xFFFF;
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

TEST(WorldTest, ObjectRemovalIndexConsistency) {
    World world;
    
    // Create body A (ID 1)
    int bIdA = 1;
    world.makeBody(bIdA, createWorldOptions(0, 0));
    // makeBody with createWorldOptions already adds 1 fixture.
    
    // Create body B (ID 2)
    int bIdB = 2;
    world.makeBody(bIdB, createWorldOptions(10, 10));
    // makeBody with createWorldOptions already adds 1 fixture.
    
    // Add another fixture to body B
    emscripten_val b2Options = createFixtureOptions((int)ObjectShape::CIRCLE, 0.5f);
    b2Options.properties["localX"] = 2.0f;
    b2Options.properties["localY"] = 2.0f;
    world.addFixture(bIdB, 0, b2Options);
    
    // Index mapping should be:
    // Body A: index 0 (ID 1)
    // Body B: index 1 (ID 2)
    // Fixture A: index 0 (points to body index 0)
    // Fixture B1: index 1 (points to body index 1)
    // Fixture B2: index 2 (points to body index 1)
    
    EXPECT_EQ(world.getBodyCount(), 2);
    EXPECT_EQ(world.getFixtureCount(), 3);

    EXPECT_EQ(world.liveFixtureIntData[0 * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX], 0);
    EXPECT_EQ(world.liveFixtureIntData[1 * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX], 1);
    EXPECT_EQ(world.liveFixtureIntData[2 * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX], 1);

    // Remove body A (ID 1, index 0). Body B (index 1) should be swapped to index 0.
    world.removeObject(bIdA);
    
    EXPECT_EQ(world.getBodyCount(), 1);
    EXPECT_EQ(world.getBodyAtIndex(0)->getId(), bIdB);
    EXPECT_EQ(world.getBodyAtIndex(0)->worldIndex, 0);
    
    // IMPORTANT: Fixtures for Body B should now point to body index 0
    // After removal of A, the remaining fixtures should be at index 0 and 1 (from old B)
    EXPECT_EQ(world.liveFixtureIntData[0 * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX], 0);
    EXPECT_EQ(world.liveFixtureIntData[1 * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX], 0);
}

TEST(WorldTest, RemoveLastObject) {
    World world;
    int bId = 1;
    world.makeBody(bId, createWorldOptions(0, 0));
    
    EXPECT_EQ(world.getBodyCount(), 1);
    EXPECT_EQ(world.getFixtureCount(), 1);
    
    world.removeObject(bId);
    
    EXPECT_EQ(world.getBodyCount(), 0);
    EXPECT_EQ(world.getFixtureCount(), 0);
}




