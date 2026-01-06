#include <gtest/gtest.h>
#include "world.h"
#include "physical-object.h"
#include "hinge-joint.h"

// Helper to create options for test objects
emscripten_val createTestOptions(float x, float y, float mass = 1.0f) {
    emscripten_val options;
    options.properties["x"] = x;
    options.properties["y"] = y;
    options.properties["mass"] = mass;
    options.properties["type"] = (int)ObjectType::RIGID_BODY;
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
    int id = world.makeObject(1, createTestOptions(0.0f, 0.0f, 1.0f));
    PhysicalObject* obj = world.getObjectAtIndex(id);
    
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
    int idA = world.makeObject(1, createTestOptions(0.0f, 0.0f, 1.0f));
    PhysicalObject* objA = world.getObjectAtIndex(idA);
    objA->setVelocityX(5.0f);
    
    // B: Stationary object far away, forced to sleep
    int idB = world.makeObject(2, createTestOptions(10.0f, 0.0f, 1.0f));
    PhysicalObject* objB = world.getObject(2);
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
    int idA = world.makeObject(1, createTestOptions(0.0f, 0.0f, 0.0f));
    PhysicalObject* anchor = world.getObject(1);
    anchor->type = ObjectType::FIXED_OBJECT;
    
    // Pendulum (Dynamic)
    int idP = world.makeObject(2, createTestOptions(2.0f, 0.0f, 1.0f));
    PhysicalObject* pendulum = world.getObject(2);
    
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


