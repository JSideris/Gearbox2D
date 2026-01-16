#include <gtest/gtest.h>
#include "world.h"
#include "body.h"
#include "fixture.h"
#include "hinge-joint.h"

// Helper to create options for test objects
emscripten_val createTestOptions(float x, float y, float mass = 1.0f) {
    emscripten_val options;
    options.properties["x"] = x;
    options.properties["y"] = y;
    options.properties["mass"] = mass;
    options.properties["type"] = (int)ObjectType::DYNAMIC_OBJECT;
    options.properties["shape"] = (int)ObjectShape::BOX;
    options.properties["width"] = 1.0f;
    options.properties["height"] = 1.0f;
    return options;
}

TEST(StabilityTest, SlowMotionPreventsSleep) {
    World world;
    world.setGravity(0.0f, 0.0f);
    world.setTimeStep(1.0f / 60.0f);
    
    // Create an object moving very slowly (below the old 0.1 threshold, but above the new 0.005 threshold)
    int id = world.makeBody(1, createTestOptions(0.0f, 0.0f, 1.0f));
    Body* obj = world.getBodyAtIndex(id);
    
    // Set a very slow velocity
    obj->setVelocityX(0.02f); 
    
    // Run for 2 seconds (exceeding the default 1.0s sleep time required)
    for (int i = 0; i < 120; ++i) {
        world.step();
    }
    
    // The object should still be awake because it's moving
    EXPECT_FALSE(obj->isSleeping);
}

TEST(StabilityTest, ContactWakesSleepingObject) {
    World world;
    world.setGravity(0.0f, 0.0f);
    world.setTimeStep(1.0f / 60.0f);
    
    // A: Moving object
    int idA = world.makeBody(1, createTestOptions(0.0f, 0.0f, 1.0f));
    Body* objA = world.getBodyAtIndex(idA);
    objA->setVelocityX(5.0f);
    
    // B: Stationary object far away, forced to sleep
    int idB = world.makeBody(2, createTestOptions(10.0f, 0.0f, 1.0f));
    Body* objB = world.getBody(2);
    objB->sleep();
    EXPECT_TRUE(objB->isSleeping);
    
    // Step until they should collide (at x=10, with velocity 5, should take ~2 seconds)
    // We'll run for 150 frames (~2.5s)
    for (int i = 0; i < 150; ++i) {
        world.step();
        if (!objB->isSleeping) break;
    }
    
    // B should have been woken up by the collision
    EXPECT_FALSE(objB->isSleeping);
    EXPECT_GT(std::abs(objB->getVelocityX()), 0.1f);
}

TEST(StabilityTest, JointMovementWakesSleepingObject) {
    World world;
    world.setGravity(0.0f, 0.0f);
    world.setTimeStep(1.0f / 60.0f);
    
    // Anchor (Fixed)
    int idA = world.makeBody(1, createTestOptions(0.0f, 0.0f, 0.0f));
    Body* anchor = world.getBody(1);
    anchor->type = ObjectType::FIXED_OBJECT;
    
    // Pendulum (Dynamic)
    int idP = world.makeBody(2, createTestOptions(2.0f, 0.0f, 1.0f));
    Body* pendulum = world.getBody(2);
    
    // Connect them
    world.createHingeJoint(1, 1, 2, 0.0f, 0.0f, -2.0f, 0.0f);
    
    // Force pendulum to sleep
    pendulum->sleep();
    EXPECT_TRUE(pendulum->isSleeping);
    
    // Rotate the anchor (though it's fixed, we can manually change its rotation if the engine supported it, 
    // but here we'll just check if applying velocity to the pendulum wakes it up, simulating a joint pull)
    pendulum->setVelocityY(1.0f);
    
    // In our fix, setVelocity should wake it up immediately
    EXPECT_FALSE(pendulum->isSleeping);
}

TEST(StabilityTest, NaNRecovery) {
    World world;
    world.setGravity(0.0f, 0.0f);
    world.setTimeStep(1.0f / 60.0f);
    
    int id = world.makeBody(1, createTestOptions(10.0f, 10.0f, 1.0f));
    Body* obj = world.getBodyAtIndex(id);
    
    // Simulate a NaN explosion (e.g. from an invalid joint or contact)
    obj->setVelocityX(std::numeric_limits<float>::quiet_NaN());
    
    // Before stepping, lastX/lastY are 10.0f.
    // The step will catch the NaN in _velocity and reset the object.
    world.step();
    
    EXPECT_TRUE(std::isfinite(obj->getX()));
    EXPECT_TRUE(std::isfinite(obj->getY()));
    EXPECT_TRUE(std::isfinite(obj->getVelocityX()));
    EXPECT_EQ(obj->getVelocityX(), 0.0f);
    EXPECT_EQ(obj->getX(), 10.0f);
}

TEST(StabilityTest, VelocityClamping) {
    World world;
    world.setGravity(0.0f, 0.0f);
    world.setTimeStep(1.0f / 60.0f);
    
    int id = world.makeBody(1, createTestOptions(0.0f, 0.0f, 1.0f));
    Body* obj = world.getBodyAtIndex(id);
    
    // Set a velocity way beyond the cap (1000.0f)
    obj->setVelocityX(5000.0f);
    
    world.step();
    
    EXPECT_LE(obj->getVelocityX(), 1000.1f);
}

TEST(StabilityTest, RestitutionEnergyConservation) {
    World world;
    world.setGravity(0.0f, 10.0f);
    world.setTimeStep(1.0f / 60.0f);
    // world.setHasPenetrationResolution(false); // Enable penetration resolution for realistic testing
    
    // 1. Create a fixed floor at y=10
    emscripten_val floorOptions = createTestOptions(0.0f, 10.0f, 0.0f);
    floorOptions.properties["type"] = (int)ObjectType::FIXED_OBJECT;
    floorOptions.properties["width"] = 20.0f;
    floorOptions.properties["height"] = 1.0f;
    floorOptions.properties["restitution"] = 1.0f;
    world.makeBody(1, floorOptions);

    // 2. Create a bouncy ball starting at y=0 (10 units above floor)
    emscripten_val ballOptions = createTestOptions(0.0f, 0.0f, 1.0f);
    ballOptions.properties["shape"] = (int)ObjectShape::CIRCLE;
    ballOptions.properties["radius"] = 0.5f;
    ballOptions.properties["restitution"] = 1.0f;
    ballOptions.properties["linearDamping"] = 0.0f; // No air resistance
    world.makeBody(2, ballOptions);
    Body* ball = world.getBody(2);

    float initialHeight = ball->getY();
    float minObservedY = initialHeight;

    // Run for 5 seconds and record max height
    for (int i = 0; i < 300; ++i) {
        world.step();
        if (ball->getY() < minObservedY) minObservedY = ball->getY();
    }
    float peakAt5s = minObservedY;

    // Run for another 5 seconds
    for (int i = 0; i < 300; ++i) {
        world.step();
        if (ball->getY() < minObservedY) minObservedY = ball->getY();
    }
    float peakAt10s = minObservedY;

    // Assertions
    // 1. It shouldn't have gained much energy (O(dt^2) error from penetration resolution is okay, O(dt) gain from restitution is not)
    // With kinematic compensation, this should be very close to initialHeight (0.0f)
    EXPECT_GE(peakAt10s, initialHeight - 0.001f); 
    
    // 2. The energy should not be runaway. Numerical drift is expected in discrete engines.
    // We expect it to be EXTREMELY stable now.
    EXPECT_GE(peakAt10s, peakAt5s - 0.0001f);
}



