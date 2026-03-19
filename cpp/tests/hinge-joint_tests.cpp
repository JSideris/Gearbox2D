#include <gtest/gtest.h>
#include "world.h"
#include "body.h"
#include "fixture.h"
#include "hinge-joint.h"

class HingeJointTest : public ::testing::Test {
protected:
    World world;
    emscripten_val options;

    HingeJointTest() {
        options.properties["x"] = 0.0f;
        options.properties["y"] = 0.0f;
        options.properties["type"] = static_cast<int>(ObjectType::DYNAMIC_OBJECT);
        options.properties["shape"] = static_cast<int>(ObjectShape::BOX);
        options.properties["width"] = 2.0f;
        options.properties["height"] = 2.0f;
        options.properties["mass"] = 1.0f;
    }
};

TEST_F(HingeJointTest, JointCreationAndCleanup) {
    int idA = 1, idB = 2, jointId = 100;
    
    world.createBody(idA, options);
    world.createBody(idB, options);
    
    world.createHingeJoint(jointId, idA, idB, 1.0f, 0.0f, -1.0f, 0.0f);
    
    EXPECT_NE(world.getJoint(jointId), nullptr);
    
    world.removeObject(idA);
    
    // Joint should be automatically removed when one of its bodies is removed
    EXPECT_EQ(world.getJoint(jointId), nullptr);
}

TEST_F(HingeJointTest, HingeKeepsBodiesTogether) {
    int idA = 1, idB = 2, jointId = 100;
    
    options.properties["x"] = 0.0f;
    world.createBody(idA, options);
    
    options.properties["x"] = 2.0f;
    world.createBody(idB, options);
    
    Body* objA = world.getBody(idA);
    Body* objB = world.getBody(idB);
    
    // Anchor at (1, 0) in world space
    // For A, local anchor is (1, 0)
    // For B, local anchor is (-1, 0)
    world.createHingeJoint(jointId, idA, idB, 1.0f, 0.0f, -1.0f, 0.0f);
    
    // Apply force to objB to pull it away
    objB->applyForce(100.0f, 0.0f);
    
    for (int i = 0; i < 60; ++i) {
        world.step();
    }
    
    // The gap should remain close to 2.0 (the sum of half-widths)
    float distance = (objB->getPosition() - objA->getPosition()).magnitude();
    EXPECT_NEAR(distance, 2.0f, 0.1f);
}

TEST_F(HingeJointTest, ReactionForceCalculation) {
    int idA = 1, idB = 2, jointId = 100;
    
    world.setGravity(0.0f, -10.0f);
    
    // Fixed object at (0, 0)
    options.properties["x"] = 0.0f;
    options.properties["y"] = 0.0f;
    options.properties["type"] = static_cast<int>(ObjectType::FIXED_OBJECT);
    world.createBody(idA, options);
    
    // Rigid body at (0, -3) - vertically below idA
    options.properties["x"] = 0.0f;
    options.properties["y"] = -3.0f;
    options.properties["type"] = static_cast<int>(ObjectType::DYNAMIC_OBJECT);
    options.properties["mass"] = 1.0f;
    world.createBody(idB, options);
    
    // Hinge joint at (0, 0) in world space
    // For idA at (0,0), world (0,0) is local (0,0)
    // For idB at (0,-3), world (0,0) is local (0,3)
    world.createHingeJoint(jointId, idA, idB, 0.0f, 0.0f, 0.0f, 3.0f);
    
    // Let it settle for a bit
    for (int i = 0; i < 10; ++i) {
        world.step();
    }
    
    Joint* joint = world.getJoint(jointId);
    Vec2 reaction = joint->getReactionForce(60.0f);
    
    // Reaction force should oppose the gravity force (mass 1.0 * gravity 10.0 = 10.0)
    EXPECT_NEAR(reaction.y, 10.0f, 0.5f);
    EXPECT_NEAR(reaction.x, 0.0f, 0.1f);
}

TEST_F(HingeJointTest, UpdateAnchorsAtRuntime) {
    int idA = 1, idB = 2, jointId = 100;
    
    // Fixed object at (0, 0)
    options.properties["type"] = static_cast<int>(ObjectType::FIXED_OBJECT);
    world.createBody(idA, options);
    
    // Rigid body at (2, 0)
    options.properties["x"] = 2.0f;
    options.properties["type"] = static_cast<int>(ObjectType::DYNAMIC_OBJECT);
    world.createBody(idB, options);
    
    // Hinge at (1, 0) in world space
    world.createHingeJoint(jointId, idA, idB, 1.0f, 0.0f, -1.0f, 0.0f);
    
    for (int i = 0; i < 30; ++i) world.step();
    EXPECT_NEAR(world.getBody(idB)->getX(), 2.0f, 0.05f);
    
    // Move anchor on B from (-1, 0) to (-2, 0)
    // This should push B to (3, 0) in world space
    Joint* joint = world.getJoint(jointId);
    joint->setLocalAnchorB(Vec2(-2.0f, 0.0f));
    EXPECT_EQ(joint->getLocalAnchorB().x, -2.0f);
    
    for (int i = 0; i < 60; ++i) world.step();
    EXPECT_NEAR(world.getBody(idB)->getX(), 3.0f, 0.1f);
}

