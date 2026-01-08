#include <gtest/gtest.h>
#include "world.h"
#include "spring-joint.h"
#include "physical-object.h"
#include "debug.h"

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
};

TEST_F(SpringJointTest, Creation) {
    world.makeObject(1, createOptions(0, 0));
    world.makeObject(2, createOptions(2, 0));
    
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
    world.makeObject(1, createOptions(0, 0));
    world.makeObject(2, createOptions(4, 0));
    
    world.createSpringJoint(1, 1, 2, 0, 0, 0, 0, 2.0f, 5.0f, 0.7f);
    
    // Step once to see velocity change
    world.step();
    
    PhysicalObject* obj1 = world.getObject(1);
    PhysicalObject* obj2 = world.getObject(2);
    
    // obj1 should have positive VX, obj2 should have negative VX
    EXPECT_GT(obj1->getVelocity().x, 0.0f);
    EXPECT_LT(obj2->getVelocity().x, 0.0f);
}

TEST_F(SpringJointTest, PushesApart) {
    // Two objects separated by 1 unit, spring length 2 units
    world.makeObject(1, createOptions(0, 0));
    world.makeObject(2, createOptions(1, 0));
    
    world.createSpringJoint(1, 1, 2, 0, 0, 0, 0, 2.0f, 5.0f, 0.7f);
    
    // Step once
    world.step();
    
    PhysicalObject* obj1 = world.getObject(1);
    PhysicalObject* obj2 = world.getObject(2);
    
    // obj1 should have negative VX, obj2 should have positive VX
    EXPECT_LT(obj1->getVelocity().x, 0.0f);
    EXPECT_GT(obj2->getVelocity().x, 0.0f);
}

TEST_F(SpringJointTest, Damping) {
    // Check if damping reduces velocity over time
    world.makeObject(1, createOptions(0, 0, 0.0f)); // Fixed
    world.getObject(1)->type = ObjectType::FIXED_OBJECT;
    
    world.makeObject(2, createOptions(4, 0, 1.0f));
    
    world.createSpringJoint(1, 1, 2, 0, 0, 0, 0, 2.0f, 2.0f, 0.1f);
    
    // Run for a bit and check velocity magnitude vs no damping
    for (int i = 0; i < 60; ++i) world.step();
    float velDamped = world.getObject(2)->getVelocity().magnitude();
    
    // Reset and try with more damping
    world.clear();
    world.makeObject(1, createOptions(0, 0, 0.0f));
    world.getObject(1)->type = ObjectType::FIXED_OBJECT;
    world.makeObject(2, createOptions(4, 0, 1.0f));
    world.createSpringJoint(1, 1, 2, 0, 0, 0, 0, 2.0f, 2.0f, 0.9f);
    
    for (int i = 0; i < 60; ++i) world.step();
    float velMoreDamped = world.getObject(2)->getVelocity().magnitude();
    
    EXPECT_LT(velMoreDamped, velDamped);
}

TEST_F(SpringJointTest, UpdateParametersAtRuntime) {
    world.makeObject(1, createOptions(0, 0, 0.0f));
    world.getObject(1)->type = ObjectType::FIXED_OBJECT;
    world.makeObject(2, createOptions(5, 0, 1.0f));
    
    world.createSpringJoint(1, 1, 2, 0, 0, 0, 0, 5.0f, 5.0f, 0.7f);
    Joint* joint = world.getJoint(1);
    
    // Initial state: at rest
    for (int i = 0; i < 60; ++i) world.step();
    EXPECT_NEAR(world.getObject(2)->getX(), 5.0f, 0.05f);
    
    // Change length
    joint->setLength(3.0f);
    EXPECT_EQ(joint->getLength(), 3.0f);
    for (int i = 0; i < 120; ++i) world.step();
    EXPECT_NEAR(world.getObject(2)->getX(), 3.0f, 0.1f);
    
    // Change frequency
    joint->setFrequencyHz(2.0f);
    EXPECT_EQ(joint->getFrequencyHz(), 2.0f);
    
    // Change damping
    joint->setDampingRatio(0.1f);
    EXPECT_EQ(joint->getDampingRatio(), 0.1f);
}

