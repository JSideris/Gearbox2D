#include <gtest/gtest.h>
#include "world.h"
#include "spring-joint.h"
#include "body.h"
#include "fixture.h"
#include "debug.h"
#include "constants.h"
#include <cmath>

class SpringJointTest : public ::testing::Test {
protected:
    World world;

    emscripten_val createOptions(float x, float y, float mass = 1.0f) {
        emscripten_val options;
        options.properties["x"] = x;
        options.properties["y"] = y;
        options.properties["mass"] = mass;
        options.properties["shape"] = 1; // Circle
        options.properties["radius"] = 0.5f;
        return options;
    }

    void setupTwoBodySpring(float x1, float x2) {
        world.setGravity(0.0f, 0.0f);
        world.setTimeStep(1.0f / 60.0f);
        world.createBody(1, createOptions(x1, 0));
        world.createBody(2, createOptions(x2, 0));
        world.createSpringJoint(1, 1, 2, 0, 0, 0, 0, 2.0f, 5.0f, 0.7f);
    }

    static float centerDistance(Body* a, Body* b) {
        float dx = b->getX() - a->getX();
        float dy = b->getY() - a->getY();
        return std::sqrt(dx * dx + dy * dy);
    }
};

TEST_F(SpringJointTest, Creation) {
    world.createBody(1, createOptions(0, 0));
    world.createBody(2, createOptions(2, 0));
    
    int jointId = world.createSpringJoint(1, 1, 2, 0, 0, 0, 0, 2.0f, 5.0f, 0.7f);
    EXPECT_EQ(jointId, 1);
    
    Joint* joint = world.getJoint(1);
    ASSERT_NE(joint, nullptr);
    
    SpringJoint* spring = dynamic_cast<SpringJoint*>(joint);
    ASSERT_NE(spring, nullptr);
    EXPECT_FLOAT_EQ(spring->length, 2.0f);
    EXPECT_FLOAT_EQ(spring->frequencyHz, 5.0f);
    EXPECT_FLOAT_EQ(spring->dampingRatio, 0.7f);
}

TEST_F(SpringJointTest, PullsTogether) {
    // Two objects separated by 4 units, spring length 2 units
    world.createBody(1, createOptions(0, 0));
    world.createBody(2, createOptions(4, 0));
    
    world.createSpringJoint(1, 1, 2, 0, 0, 0, 0, 2.0f, 5.0f, 0.7f);
    
    // Step once to see velocity change
    world.step();
    
    Body* obj1 = world.getBody(1);
    Body* obj2 = world.getBody(2);
    
    // obj1 should have positive VX, obj2 should have negative VX
    EXPECT_GT(obj1->getVelocity().x, 0.0f);
    EXPECT_LT(obj2->getVelocity().x, 0.0f);
}

TEST_F(SpringJointTest, PushesApart) {
    // Two objects separated by 1 unit, spring length 2 units
    world.createBody(1, createOptions(0, 0));
    world.createBody(2, createOptions(1, 0));
    
    world.createSpringJoint(1, 1, 2, 0, 0, 0, 0, 2.0f, 5.0f, 0.7f);
    
    // Step once
    world.step();
    
    Body* obj1 = world.getBody(1);
    Body* obj2 = world.getBody(2);
    
    // obj1 should have negative VX, obj2 should have positive VX
    EXPECT_LT(obj1->getVelocity().x, 0.0f);
    EXPECT_GT(obj2->getVelocity().x, 0.0f);
}

TEST_F(SpringJointTest, Damping) {
    // Check if damping reduces velocity over time
    world.createBody(1, createOptions(0, 0, 0.0f)); // Fixed
    world.getBody(1)->type = ObjectType::FIXED_OBJECT;
    
    world.createBody(2, createOptions(4, 0, 1.0f));
    
    world.createSpringJoint(1, 1, 2, 0, 0, 0, 0, 2.0f, 2.0f, 0.1f);
    
    // Run for a bit and check velocity magnitude vs no damping
    for (int i = 0; i < 60; ++i) world.step();
    float velDamped = world.getBody(2)->getVelocity().magnitude();
    
    // Reset and try with more damping
    world.clear();
    world.createBody(1, createOptions(0, 0, 0.0f));
    world.getBody(1)->type = ObjectType::FIXED_OBJECT;
    world.createBody(2, createOptions(4, 0, 1.0f));
    world.createSpringJoint(1, 1, 2, 0, 0, 0, 0, 2.0f, 2.0f, 0.9f);
    
    for (int i = 0; i < 60; ++i) world.step();
    float velMoreDamped = world.getBody(2)->getVelocity().magnitude();
    
    EXPECT_LT(velMoreDamped, velDamped);
}

// Keep vs strip inventory: .decomposer/bugs/20260818-105244-spring-keep-vs-strip.md
TEST_F(SpringJointTest, StretchImpulseExceedsPositionCorrectionCap) {
    setupTwoBodySpring(0.0f, 4.0f);

    world.step();

    Body* obj1 = world.getBody(1);
    Body* obj2 = world.getBody(2);

    EXPECT_GT(obj1->getVelocity().x, MAX_POSITION_CORRECTION);
    EXPECT_LT(obj2->getVelocity().x, -MAX_POSITION_CORRECTION);
    EXPECT_GT(obj1->getVelocity().x - obj2->getVelocity().x, 2.0f * MAX_POSITION_CORRECTION);
}

TEST_F(SpringJointTest, StretchSettlesNearRestLength) {
    setupTwoBodySpring(0.0f, 4.0f);

    for (int i = 0; i < 60; ++i) {
        world.step();
    }

    Body* obj1 = world.getBody(1);
    Body* obj2 = world.getBody(2);
    EXPECT_NEAR(centerDistance(obj1, obj2), 2.0f, 0.25f);
}

TEST_F(SpringJointTest, CompressImpulseExceedsPositionCorrectionCap) {
    setupTwoBodySpring(0.0f, 1.0f);

    world.step();

    Body* obj1 = world.getBody(1);
    Body* obj2 = world.getBody(2);

    EXPECT_LT(obj1->getVelocity().x, -MAX_POSITION_CORRECTION);
    EXPECT_GT(obj2->getVelocity().x, MAX_POSITION_CORRECTION);
    EXPECT_GT(obj2->getVelocity().x - obj1->getVelocity().x, 2.0f * MAX_POSITION_CORRECTION);
}

TEST_F(SpringJointTest, CompressSettlesNearRestLength) {
    setupTwoBodySpring(0.0f, 1.0f);

    for (int i = 0; i < 60; ++i) {
        world.step();
    }

    Body* obj1 = world.getBody(1);
    Body* obj2 = world.getBody(2);
    EXPECT_NEAR(centerDistance(obj1, obj2), 2.0f, 0.25f);
}

// TODO: get this test case working again or rewrite it.
// TEST_F(SpringJointTest, UpdateParametersAtRuntime) {
//     world.createBody(1, createOptions(0, 0, 0.0f));
//     world.getBody(1)->type = ObjectType::FIXED_OBJECT;
//     world.createBody(2, createOptions(5, 0, 1.0f));
    
//     world.createSpringJoint(1, 1, 2, 0, 0, 0, 0, 5.0f, 5.0f, 0.7f);
//     Joint* joint = world.getJoint(1);
    
//     // Initial state: at rest
//     for (int i = 0; i < 60; ++i) world.step();
//     EXPECT_NEAR(world.getBody(2)->getX(), 5.0f, 0.05f);
    
//     // Change length
//     joint->setLength(3.0f);
//     EXPECT_EQ(joint->getLength(), 3.0f);
//     for (int i = 0; i < 120; ++i) world.step();
//     EXPECT_NEAR(world.getBody(2)->getX(), 3.0f, 0.1f);
    
//     // Change frequency
//     joint->setFrequencyHz(2.0f);
//     EXPECT_EQ(joint->getFrequencyHz(), 2.0f);
    
//     // Change damping
//     joint->setDampingRatio(0.1f);
//     EXPECT_EQ(joint->getDampingRatio(), 0.1f);
// }

