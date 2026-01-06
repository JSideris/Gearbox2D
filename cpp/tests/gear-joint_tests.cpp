#include <gtest/gtest.h>
#include "world.h"
#include "physical-object.h"
#include "hinge-joint.h"
#include "gear-joint.h"

class GearJointTest : public ::testing::Test {
protected:
    World world;
    emscripten_val options;

    GearJointTest() {
        options.properties["x"] = 0.0f;
        options.properties["y"] = 0.0f;
        options.properties["type"] = static_cast<int>(ObjectType::RIGID_BODY);
        options.properties["shape"] = static_cast<int>(ObjectShape::BOX);
        options.properties["width"] = 1.0f;
        options.properties["height"] = 1.0f;
        options.properties["mass"] = 1.0f;
    }
};

TEST_F(GearJointTest, GearRatioConstraint) {
    int idStatic = 1, id1 = 2, id2 = 3;
    int hinge1Id = 101, hinge2Id = 102, gearId = 200;
    
    // Static body to anchor both hinges
    options.properties["type"] = static_cast<int>(ObjectType::FIXED_OBJECT);
    world.makeObject(idStatic, options);
    
    // First gear body
    options.properties["type"] = static_cast<int>(ObjectType::RIGID_BODY);
    options.properties["x"] = 1.0f;
    world.makeObject(id1, options);
    
    // Second gear body
    options.properties["x"] = -1.0f;
    world.makeObject(id2, options);
    
    // Hinge for first gear
    world.createHingeJoint(hinge1Id, idStatic, id1, 1.0f, 0.0f, 0.0f, 0.0f);
    
    // Hinge for second gear
    world.createHingeJoint(hinge2Id, idStatic, id2, -1.0f, 0.0f, 0.0f, 0.0f);
    
    // Gear joint with ratio 2.0
    // theta2 + 2.0 * theta1 = const
    // -> w2 + 2.0 * w1 = 0
    world.createGearJoint(gearId, hinge1Id, hinge2Id, 2.0f);
    
    PhysicalObject* obj1 = world.getObject(id1);
    PhysicalObject* obj2 = world.getObject(id2);
    
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
    world.makeObject(idStatic, options);
    options.properties["type"] = static_cast<int>(ObjectType::RIGID_BODY);
    world.makeObject(id1, options);
    world.makeObject(id2, options);
    
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

