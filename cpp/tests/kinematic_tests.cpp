#include <gtest/gtest.h>
#include "physical-object.h"
#include "world.h"

// Helper to create options for Kinematic PhysicalObject
emscripten_val createKinematicOptions(float x = 0.0f, float y = 0.0f) {
    emscripten_val options;
    options.properties["x"] = x;
    options.properties["y"] = y;
    options.properties["type"] = (int)ObjectType::KINEMATIC_OBJECT;
    options.properties["shape"] = (int)ObjectShape::CIRCLE;
    options.properties["radius"] = 1.0f;
    return options;
}

TEST(KinematicObjectTest, CreationAndMass) {
    World world;
    emscripten_val options = createKinematicOptions(10.0f, 20.0f);
    
    int index = world.makeObject(1, options);
    PhysicalObject* obj = world.getObjectAtIndex(index);
    
    EXPECT_EQ(obj->getId(), 1);
    EXPECT_EQ(obj->type, ObjectType::KINEMATIC_OBJECT);
    EXPECT_FLOAT_EQ(obj->getMass(), 0.0f);
    EXPECT_FLOAT_EQ(obj->getInverseMass(), 0.0f);
    EXPECT_FLOAT_EQ(obj->getInverseInertia(), 0.0f);
}

TEST(KinematicObjectTest, MovementByVelocity) {
    World world;
    world.setGravity(0.0f, 10.0f); // Gravity should NOT affect kinematic objects
    
    emscripten_val options = createKinematicOptions(0.0f, 0.0f);
    int index = world.makeObject(1, options);
    PhysicalObject* obj = world.getObjectAtIndex(index);
    
    obj->setVelocityX(10.0f);
    obj->setVelocityY(5.0f);
    
    // Step world
    world.step();
    
    // Position should be velocity * timeStep
    float dt = 1.0f / 60.0f;
    EXPECT_NEAR(obj->getX(), 10.0f * dt, 1e-5f);
    EXPECT_NEAR(obj->getY(), 5.0f * dt, 1e-5f);
    
    // Velocity should remain constant (no gravity, no damping for kinematic objects currently same as fixed)
    // Actually, fixed objects in this engine DO have damping applied if not specifically excluded.
    // Let's check stepMovement again.
    
    // Step world again
    world.step();
    EXPECT_NEAR(obj->getX(), 20.0f * dt, 1e-4f);
    EXPECT_NEAR(obj->getY(), 10.0f * dt, 1e-4f);
}

TEST(KinematicObjectTest, IgnoresForces) {
    World world;
    emscripten_val options = createKinematicOptions(0.0f, 0.0f);
    int index = world.makeObject(1, options);
    PhysicalObject* obj = world.getObjectAtIndex(index);
    
    obj->applyForce(100.0f, 100.0f);
    world.step();
    
    EXPECT_FLOAT_EQ(obj->getX(), 0.0f);
    EXPECT_FLOAT_EQ(obj->getY(), 0.0f);
    EXPECT_FLOAT_EQ(obj->getVelocityX(), 0.0f);
    EXPECT_FLOAT_EQ(obj->getVelocityY(), 0.0f);
}

TEST(KinematicObjectTest, IgnoresImpulses) {
    World world;
    emscripten_val options = createKinematicOptions(0.0f, 0.0f);
    int index = world.makeObject(1, options);
    PhysicalObject* obj = world.getObjectAtIndex(index);
    
    obj->applyImpulse(100.0f, 100.0f, 0.0f, 0.0f);
    world.step();
    
    EXPECT_FLOAT_EQ(obj->getX(), 0.0f);
    EXPECT_FLOAT_EQ(obj->getY(), 0.0f);
    EXPECT_FLOAT_EQ(obj->getVelocityX(), 0.0f);
    EXPECT_FLOAT_EQ(obj->getVelocityY(), 0.0f);
}

