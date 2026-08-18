#include <gtest/gtest.h>
#include <vector>
#include "world.h"
#include "body.h"
#include "fixture.h"
#include "hinge-joint.h"
#include "gear-joint.h"
#include "constants.h"

class GearJointTest : public ::testing::Test {
protected:
    World world;
    emscripten_val options;

    GearJointTest() {
        options.properties["x"] = 0.0f;
        options.properties["y"] = 0.0f;
        options.properties["type"] = static_cast<int>(ObjectType::DYNAMIC_OBJECT);
        options.properties["shape"] = static_cast<int>(ObjectShape::BOX);
        options.properties["width"] = 1.0f;
        options.properties["height"] = 1.0f;
        options.properties["mass"] = 1.0f;
        options.properties["maskBits"] = 0;
    }
};

TEST_F(GearJointTest, GearRatioConstraint) {
    int idStatic = 1, id1 = 2, id2 = 3;
    int hinge1Id = 101, hinge2Id = 102, gearId = 200;
    
    // Static body to anchor both hinges
    options.properties["type"] = static_cast<int>(ObjectType::FIXED_OBJECT);
    world.createBody(idStatic, options);
    
    // First gear body
    options.properties["type"] = static_cast<int>(ObjectType::DYNAMIC_OBJECT);
    options.properties["x"] = 1.0f;
    world.createBody(id1, options);
    
    // Second gear body
    options.properties["x"] = -1.0f;
    world.createBody(id2, options);
    
    // Hinge for first gear
    world.createHingeJoint(hinge1Id, idStatic, id1, 1.0f, 0.0f, 0.0f, 0.0f);
    
    // Hinge for second gear
    world.createHingeJoint(hinge2Id, idStatic, id2, -1.0f, 0.0f, 0.0f, 0.0f);
    
    // Gear joint with ratio 2.0
    // theta2 + 2.0 * theta1 = const
    // -> w2 + 2.0 * w1 = 0
    world.createGearJoint(gearId, hinge1Id, hinge2Id, 2.0f);
    
    Body* obj1 = world.getBody(id1);
    Body* obj2 = world.getBody(id2);
    
    // Rotate first gear
    obj1->setAngularVelocity(1.0f);
    
    for (int i = 0; i < 60; ++i) {
        world.step();
    }
    
    // w2 should be approximately -2.0 * w1
    // Given w1 was 1.0, w2 should be -2.0
    EXPECT_NEAR(obj2->getAngularVelocity(), -2.0f * obj1->getAngularVelocity(), 0.1f);
}

TEST_F(GearJointTest, GearCleanup) {
    int idStatic = 1, id1 = 2, id2 = 3;
    int hinge1Id = 101, hinge2Id = 102, gearId = 200;
    
    options.properties["type"] = static_cast<int>(ObjectType::FIXED_OBJECT);
    world.createBody(idStatic, options);
    options.properties["type"] = static_cast<int>(ObjectType::DYNAMIC_OBJECT);
    world.createBody(id1, options);
    world.createBody(id2, options);
    
    world.createHingeJoint(hinge1Id, idStatic, id1, 0.0f, 0.0f, 0.0f, 0.0f);
    world.createHingeJoint(hinge2Id, idStatic, id2, 0.0f, 0.0f, 0.0f, 0.0f);
    world.createGearJoint(gearId, hinge1Id, hinge2Id, 1.0f);
    
    EXPECT_NE(world.getJoint(gearId), nullptr);
    
    // Removing a hinge should NOT remove the gear joint automatically in our current impl
    // unless we add specific logic in World::removeJoint or similar.
    // Wait, World::removeObject removes joints associated with the object.
    // GearJoint is associated with bodies via the hinges.
    
    world.removeObject(id1);
    
    // Gear joint should be removed because it was associated with id1 via hinge1
    // Actually, in our GearJoint constructor we pass j1->bodyA and j2->bodyB to the Joint constructor.
    // So GearJoint IS connected to these bodies.
    EXPECT_EQ(world.getJoint(gearId), nullptr);
}

TEST_F(GearJointTest, UpdateRatioAtRuntime) {
    int idStatic = 1, id1 = 2, id2 = 3;
    int hinge1Id = 101, hinge2Id = 102, gearId = 200;
    
    // Static body to anchor both hinges
    options.properties["type"] = static_cast<int>(ObjectType::FIXED_OBJECT);
    world.createBody(idStatic, options);
    
    // First gear body
    options.properties["type"] = static_cast<int>(ObjectType::DYNAMIC_OBJECT);
    options.properties["x"] = 1.0f;
    world.createBody(id1, options);
    
    // Second gear body
    options.properties["x"] = -1.0f;
    world.createBody(id2, options);
    
    // Hinge for first gear
    world.createHingeJoint(hinge1Id, idStatic, id1, 1.0f, 0.0f, 0.0f, 0.0f);
    
    // Hinge for second gear
    world.createHingeJoint(hinge2Id, idStatic, id2, -1.0f, 0.0f, 0.0f, 0.0f);
    
    // Gear joint with initial ratio 1.0
    world.createGearJoint(gearId, hinge1Id, hinge2Id, 1.0f);
    
    Joint* joint = world.getJoint(gearId);
    EXPECT_EQ(joint->getRatio(), 1.0f);
    
    // Update ratio to 0.5
    joint->setRatio(0.5f);
    EXPECT_EQ(joint->getRatio(), 0.5f);
    
    Body* obj1 = world.getBody(id1);
    Body* obj2 = world.getBody(id2);
    
    // Rotate first gear
    obj1->setAngularVelocity(1.0f);
    
    for (int i = 0; i < 60; ++i) {
        world.step();
    }
    
    // w2 should be approximately -0.5 * w1
    EXPECT_NEAR(obj2->getAngularVelocity(), -0.5f * obj1->getAngularVelocity(), 0.1f);
}

TEST_F(GearJointTest, GearPhaseConstraintHolds) {
    int idStatic = 1, id1 = 2, id2 = 3;
    int hinge1Id = 101, hinge2Id = 102, gearId = 200;

    options.properties["type"] = static_cast<int>(ObjectType::FIXED_OBJECT);
    world.createBody(idStatic, options);

    options.properties["type"] = static_cast<int>(ObjectType::DYNAMIC_OBJECT);
    options.properties["x"] = 1.0f;
    world.createBody(id1, options);

    options.properties["x"] = -1.0f;
    world.createBody(id2, options);

    world.createHingeJoint(hinge1Id, idStatic, id1, 1.0f, 0.0f, 0.0f, 0.0f);
    world.createHingeJoint(hinge2Id, idStatic, id2, -1.0f, 0.0f, 0.0f, 0.0f);
    world.createGearJoint(gearId, hinge1Id, hinge2Id, 2.0f);

    Body* obj1 = world.getBody(id1);
    Body* obj2 = world.getBody(id2);
    obj1->setAngularVelocity(1.0f);

    for (int i = 0; i < 300; ++i) {
        world.step();
    }

    const float C = 2.0f * obj1->getRotation() + obj2->getRotation();
    EXPECT_NEAR(C, 0.0f, PENETRATION_SLOP);
}

TEST_F(GearJointTest, GearTrainFiveGears) {
    constexpr int kNumGears = 5;
    constexpr float kStartX = 2.0f;
    constexpr float kY = 0.0f;
    constexpr float kSpacing = 1.5f;

    int idStatic = 1;
    options.properties["type"] = static_cast<int>(ObjectType::FIXED_OBJECT);
    options.properties["maskBits"] = 0;
    world.createBody(idStatic, options);

    std::vector<int> gearIds;
    std::vector<int> hingeIds;
    gearIds.reserve(kNumGears);
    hingeIds.reserve(kNumGears);

    for (int i = 0; i < kNumGears; ++i) {
        const float size = (i % 2 == 0) ? 1.0f : 0.5f;
        const float x = kStartX + static_cast<float>(i) * kSpacing;
        const int gearId = 10 + i;
        const int hingeId = 100 + i;

        options.properties["type"] = static_cast<int>(ObjectType::DYNAMIC_OBJECT);
        options.properties["x"] = x;
        options.properties["y"] = kY;
        options.properties["mass"] = size;
        options.properties["shape"] = static_cast<int>(ObjectShape::CIRCLE);
        options.properties["radius"] = size;
        options.properties["maskBits"] = 0;
        world.createBody(gearId, options);

        world.createHingeJoint(hingeId, idStatic, gearId, x, kY, 0.0f, 0.0f);
        gearIds.push_back(gearId);
        hingeIds.push_back(hingeId);
    }

    std::vector<float> ratios;
    for (int i = 1; i < kNumGears; ++i) {
        const float prevSize = ((i - 1) % 2 == 0) ? 1.0f : 0.5f;
        const float currSize = (i % 2 == 0) ? 1.0f : 0.5f;
        const float ratio = prevSize / currSize;
        ratios.push_back(ratio);
        world.createGearJoint(200 + i, hingeIds[i - 1], hingeIds[i], ratio);
    }

    world.getBody(gearIds[0])->setAngularVelocity(1.0f);

    for (int i = 0; i < 60; ++i) {
        world.step();
    }

    for (int i = 0; i < kNumGears; ++i) {
        EXPECT_GT(std::abs(world.getBody(gearIds[i])->getAngularVelocity()), 0.0f);
    }

    for (int i = 0; i < kNumGears - 1; ++i) {
        Body* a = world.getBody(gearIds[i]);
        Body* b = world.getBody(gearIds[i + 1]);
        EXPECT_NEAR(b->getAngularVelocity(), -ratios[i] * a->getAngularVelocity(), 0.1f);
    }
}

