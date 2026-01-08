#include <gtest/gtest.h>
#include "world.h"
#include "physical-object.h"
#include "distance-joint.h"

class DistanceJointTest : public ::testing::Test {
protected:
    World world;
    emscripten_val options;

    DistanceJointTest() {
        options.properties["x"] = 0.0f;
        options.properties["y"] = 0.0f;
        options.properties["type"] = static_cast<int>(ObjectType::RIGID_BODY);
        options.properties["shape"] = static_cast<int>(ObjectShape::BOX);
        options.properties["width"] = 1.0f;
        options.properties["height"] = 1.0f;
        options.properties["mass"] = 1.0f;
    }
};

TEST_F(DistanceJointTest, DistanceIsMaintained) {
    int idA = 1, idB = 2, jointId = 100;
    
    // Fixed object at (0, 0)
    options.properties["type"] = static_cast<int>(ObjectType::FIXED_OBJECT);
    world.makeObject(idA, options);
    
    // Rigid body at (5, 0)
    options.properties["x"] = 5.0f;
    options.properties["type"] = static_cast<int>(ObjectType::RIGID_BODY);
    world.makeObject(idB, options);
    
    PhysicalObject* objB = world.getObject(idB);
    
    // Distance joint with length 3.0
    // Anchors at centers (0, 0)
    world.createDistanceJoint(jointId, idA, idB, 0.0f, 0.0f, 0.0f, 0.0f, 3.0f);
    
    // Let it settle for a bit
    for (int i = 0; i < 60; ++i) {
        world.step();
    }
    
    float distance = objB->getPosition().magnitude();
    EXPECT_NEAR(distance, 3.0f, 0.01f);
}

TEST_F(DistanceJointTest, CentrifugalForce) {
    int idA = 1, idB = 2, jointId = 100;
    
    // Fixed object at (0, 0)
    options.properties["type"] = static_cast<int>(ObjectType::FIXED_OBJECT);
    world.makeObject(idA, options);
    
    // Rigid body at (2, 0) with vertical velocity
    options.properties["x"] = 2.0f;
    options.properties["type"] = static_cast<int>(ObjectType::RIGID_BODY);
    world.makeObject(idB, options);
    
    PhysicalObject* objB = world.getObject(idB);
    objB->setVelocity(Vec2(0.0f, 10.0f));
    
    // Distance joint with length 2.0
    world.createDistanceJoint(jointId, idA, idB, 0.0f, 0.0f, 0.0f, 0.0f, 2.0f);
    
    // Step and check if it orbits
    for (int i = 0; i < 100; ++i) {
        world.step();
        float distance = objB->getPosition().magnitude();
        EXPECT_NEAR(distance, 2.0f, 0.05f);
    }
}

TEST_F(DistanceJointTest, ReactionForce) {
    int idA = 1, idB = 2, jointId = 100;
    
    world.setGravity(0.0f, -10.0f);
    
    // Fixed object at (0, 0)
    options.properties["type"] = static_cast<int>(ObjectType::FIXED_OBJECT);
    world.makeObject(idA, options);
    
    // Rigid body at (0, -2)
    options.properties["x"] = 0.0f;
    options.properties["y"] = -2.0f;
    options.properties["type"] = static_cast<int>(ObjectType::RIGID_BODY);
    options.properties["mass"] = 1.0f;
    world.makeObject(idB, options);
    
    // Distance joint with length 2.0
    world.createDistanceJoint(jointId, idA, idB, 0.0f, 0.0f, 0.0f, 0.0f, 2.0f);
    
    for (int i = 0; i < 20; ++i) {
        world.step();
    }
    
    Joint* joint = world.getJoint(jointId);
    Vec2 reaction = joint->getReactionForce(60.0f);
    
    // Upward force should be 10.0 (mass * gravity)
    EXPECT_NEAR(reaction.y, 10.0f, 0.5f);
}

TEST_F(DistanceJointTest, SetLengthAtRuntime) {
    int idA = 1, idB = 2, jointId = 100;
    
    // Fixed object at (0, 0)
    options.properties["type"] = static_cast<int>(ObjectType::FIXED_OBJECT);
    world.makeObject(idA, options);
    
    // Rigid body at (5, 0)
    options.properties["x"] = 5.0f;
    options.properties["type"] = static_cast<int>(ObjectType::RIGID_BODY);
    world.makeObject(idB, options);
    
    PhysicalObject* objB = world.getObject(idB);
    
    // Distance joint with length 5.0
    world.createDistanceJoint(jointId, idA, idB, 0.0f, 0.0f, 0.0f, 0.0f, 5.0f);
    
    for (int i = 0; i < 60; ++i) world.step();
    EXPECT_NEAR(objB->getPosition().magnitude(), 5.0f, 0.01f);
    
    // Change length to 3.0
    Joint* joint = world.getJoint(jointId);
    joint->setLength(3.0f);
    EXPECT_EQ(joint->getLength(), 3.0f);
    
    for (int i = 0; i < 60; ++i) world.step();
    EXPECT_NEAR(objB->getPosition().magnitude(), 3.0f, 0.05f);
}

