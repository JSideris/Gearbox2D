#include <gtest/gtest.h>
#include "world.h"
#include "body.h"
#include "fixture.h"
#include "constants.h"

// Helper to create options for different body types
emscripten_val createTestOptions(float x, float y, ObjectType type, bool wantsEvents = true) {
    emscripten_val options;
    options.properties["x"] = x;
    options.properties["y"] = y;
    options.properties["type"] = (int)type;
    options.properties["shape"] = (int)ObjectShape::CIRCLE;
    options.properties["radius"] = 1.0f;
    options.properties["mass"] = (type == ObjectType::FIXED_OBJECT) ? 0.0f : 1.0f;
    options.properties["wantsEvents"] = wantsEvents;
    return options;
}

TEST(StaticBodySleepTest, StaticBodyStaysAsleepOnCollision) {
    World world;
    world.setGravity(0.0f, 0.0f);
    
    // Create a static body and put it to sleep
    world.makeBody(1, createTestOptions(0.0f, 0.0f, ObjectType::FIXED_OBJECT));
    Body* staticBody = world.getBody(1);
    staticBody->sleep();
    EXPECT_TRUE(staticBody->isSleeping);
    
    // Create a dynamic body that will hit the static body
    // Position it so it's moving towards the static body
    world.makeBody(2, createTestOptions(-3.0f, 0.0f, ObjectType::DYNAMIC_OBJECT));
    Body* dynamicBody = world.getBody(2);
    dynamicBody->setVelocityInternal(Vec2(10.0f, 0.0f)); // Moving right
    
    // Step the world until they collide
    bool collided = false;
    for (int i = 0; i < 20; ++i) {
        world.step();
        if (world.liveBodyIntData[staticBody->worldIndex * BODY_IDATA_EPO + BODY_IDATA_FLAGS] & HAS_PHYSICAL_COLLISION) {
            collided = true;
            break;
        }
    }
    
    // Verify they are in contact/colliding
    EXPECT_TRUE(collided) << "Bodies never collided according to HAS_PHYSICAL_COLLISION flag";
    
    // CRITICAL: Static body should STILL be sleeping
    EXPECT_TRUE(staticBody->isSleeping);
    EXPECT_FALSE(dynamicBody->isSleeping);
}

TEST(StaticBodySleepTest, StaticBodyStaysAsleepWithJoint) {
    World world;
    world.setGravity(0.0f, 0.0f);
    
    // Create a static body and a dynamic body
    world.makeBody(1, createTestOptions(0.0f, 0.0f, ObjectType::FIXED_OBJECT));
    world.makeBody(2, createTestOptions(5.0f, 0.0f, ObjectType::DYNAMIC_OBJECT));
    
    Body* staticBody = world.getBody(1);
    Body* dynamicBody = world.getBody(2);
    
    // Put static body to sleep
    staticBody->sleep();
    EXPECT_TRUE(staticBody->isSleeping);
    
    // Create a distance joint between them
    world.createDistanceJoint(1, 1, 2, 0, 0, 5, 0, 5.0f);
    
    // Step the world. Dynamic body is awake, joint propagation might try to wake static body.
    world.step();
    
    // CRITICAL: Static body should STILL be sleeping
    EXPECT_TRUE(staticBody->isSleeping);
}

TEST(StaticBodySleepTest, StaticBodyStaysAsleepOnExternalForce) {
    World world;
    world.setGravity(0.0f, 0.0f);
    
    // Create a static body and put it to sleep
    world.makeBody(1, createTestOptions(0.0f, 0.0f, ObjectType::FIXED_OBJECT));
    Body* staticBody = world.getBody(1);
    staticBody->sleep();
    EXPECT_TRUE(staticBody->isSleeping);
    
    // Apply an impulse (external force)
    staticBody->applyImpulse(10.0f, 0.0f, staticBody->getX(), staticBody->getY());
    
    // Step the world
    world.step();
    
    // CRITICAL: Static body should STILL be sleeping
    EXPECT_TRUE(staticBody->isSleeping);
}
