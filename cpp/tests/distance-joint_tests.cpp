#include <gtest/gtest.h>
#include "world.h"
#include "body.h"
#include "fixture.h"
#include "distance-joint.h"
#include <cmath>

class DistanceJointTest : public ::testing::Test {
protected:
    World world;
    emscripten_val options;

    DistanceJointTest() {
        options.properties["x"] = 0.0f;
        options.properties["y"] = 0.0f;
        options.properties["type"] = static_cast<int>(ObjectType::DYNAMIC_OBJECT);
        options.properties["shape"] = static_cast<int>(ObjectShape::BOX);
        options.properties["width"] = 1.0f;
        options.properties["height"] = 1.0f;
        options.properties["mass"] = 1.0f;
    }
};

TEST_F(DistanceJointTest, CentrifugalForce) {
    int idA = 1, idB = 2, jointId = 100;
    
    // Fixed object at (0, 0)
    options.properties["type"] = static_cast<int>(ObjectType::FIXED_OBJECT);
    world.createBody(idA, options);
    
    // Rigid body at (2, 0) with vertical velocity
    options.properties["x"] = 2.0f;
    options.properties["type"] = static_cast<int>(ObjectType::DYNAMIC_OBJECT);
    world.createBody(idB, options);
    
    Body* objB = world.getBody(idB);
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

TEST_F(DistanceJointTest, SetLengthAtRuntime) {
    int idA = 1, idB = 2, jointId = 100;
    
    // Fixed object at (0, 0)
    options.properties["type"] = static_cast<int>(ObjectType::FIXED_OBJECT);
    world.createBody(idA, options);
    
    // Rigid body at (5, 0)
    options.properties["x"] = 5.0f;
    options.properties["type"] = static_cast<int>(ObjectType::DYNAMIC_OBJECT);
    world.createBody(idB, options);
    
    Body* objB = world.getBody(idB);
    
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

TEST_F(DistanceJointTest, IsolatedLengthErrorCorrectsWithBias) {
    world.setGravity(0.0f, 0.0f);

    options.properties["type"] = static_cast<int>(ObjectType::FIXED_OBJECT);
    world.createBody(1, options);

    options.properties["x"] = 5.0f;
    options.properties["type"] = static_cast<int>(ObjectType::DYNAMIC_OBJECT);
    world.createBody(2, options);

    const float length = 3.0f;
    world.createDistanceJoint(100, 1, 2, 0.0f, 0.0f, 0.0f, 0.0f, length);

    Body* objB = world.getBody(2);
    float initialError = std::abs(objB->getPosition().magnitude() - length);
    EXPECT_GT(initialError, 1.5f);

    for (int i = 0; i < 8; ++i) {
        world.step();
    }

    float finalError = std::abs(objB->getPosition().magnitude() - length);
    EXPECT_LT(finalError, initialError * 0.5f);
    EXPECT_LT(finalError, 0.55f);
}

TEST_F(DistanceJointTest, ChainMidBodyNotTangentSnapped) {
    world.setGravity(0.0f, 0.0f);

    options.properties["type"] = static_cast<int>(ObjectType::DYNAMIC_OBJECT);
    options.properties["x"] = 0.0f;
    options.properties["y"] = 0.0f;
    world.createBody(1, options);

    options.properties["x"] = 2.0f;
    world.createBody(2, options);

    options.properties["x"] = 4.0f;
    world.createBody(3, options);

    world.createDistanceJoint(100, 1, 2, 0.0f, 0.0f, 0.0f, 0.0f, 2.0f);
    world.createDistanceJoint(101, 2, 3, 0.0f, 0.0f, 0.0f, 0.0f, 2.0f);

    Body* mid = world.getBody(2);
    mid->setVelocity(Vec2(3.0f, 0.0f));
    mid->setAngularVelocity(1.0f);

    world.step();

    EXPECT_NE(mid->getAngularVelocity(), 0.0f);

    Vec2 pMid = mid->getPosition();
    Vec2 pLeft = world.getBody(1)->getPosition();
    Vec2 rod = pMid - pLeft;
    float rodMag = rod.magnitude();
    EXPECT_GT(rodMag, 1e-4f);
    Vec2 tangent(-rod.y / rodMag, rod.x / rodMag);
    Vec2 v = mid->getVelocity();
    float vPerp = std::abs(v.x * tangent.y - v.y * tangent.x);
    EXPECT_GT(vPerp, 0.1f);
}

TEST_F(DistanceJointTest, MixedOverlapChainStaysFinite) {
    world.setGravity(0.0f, -10.0f);
    world.setTimeStep(1.0f / 60.0f);

    options.properties["type"] = static_cast<int>(ObjectType::DYNAMIC_OBJECT);
    options.properties["shape"] = static_cast<int>(ObjectShape::CIRCLE);
    options.properties["radius"] = 0.5f;
    options.properties["canSleep"] = false;

    // Bottom pair overlaps (center distance 0.9 < 2 * radius).
    options.properties["x"] = 0.0f;
    options.properties["y"] = 0.0f;
    world.createBody(1, options);

    options.properties["x"] = 0.9f;
    options.properties["y"] = 0.0f;
    world.createBody(2, options);

    // Top link is separated from the contacted pair.
    options.properties["x"] = 0.45f;
    options.properties["y"] = 2.0f;
    world.createBody(3, options);

    const float linkDist = 1.0f;
    world.createDistanceJoint(100, 1, 2, 0.0f, 0.0f, 0.0f, 0.0f, linkDist);
    world.createDistanceJoint(101, 2, 3, 0.0f, 0.0f, 0.0f, 0.0f, linkDist);

    for (int i = 0; i < 90; ++i) {
        world.step();
        for (int id : {1, 2, 3}) {
            Body* body = world.getBody(id);
            ASSERT_NE(body, nullptr);
            EXPECT_TRUE(std::isfinite(body->getX()));
            EXPECT_TRUE(std::isfinite(body->getY()));
            EXPECT_TRUE(std::isfinite(body->getVelocityX()));
            EXPECT_TRUE(std::isfinite(body->getVelocityY()));
            EXPECT_TRUE(std::isfinite(body->getAngularVelocity()));
        }
    }
}


TEST_F(DistanceJointTest, UndisturbedTwentyLinkChainSettles) {
    world.setGravity(0.0f, 10.0f);
    world.setTimeStep(1.0f / 60.0f);
    emscripten_val anchorOptions;
    anchorOptions["type"] = static_cast<int>(ObjectType::FIXED_OBJECT);
    anchorOptions["shape"] = static_cast<int>(ObjectShape::CIRCLE);
    anchorOptions["radius"] = 0.1f;
    anchorOptions["x"] = 5.0f;
    anchorOptions["y"] = 1.049f;
    world.createBody(1, anchorOptions);

    // Deterministic offsets within the showcase's initialization range.
    options["type"] = static_cast<int>(ObjectType::DYNAMIC_OBJECT);
    options["shape"] = static_cast<int>(ObjectShape::BOX);
    options["width"] = 0.4f;
    options["height"] = 0.15f;
    options["mass"] = 0.2f;
    options["canSleep"] = false;
    options["x"] = 5.0000049f;
    for (int i = 0; i < 20; ++i) {
        options["y"] = static_cast<float>(1.0 + (i + 1) * 0.4);
        world.createBody(i + 2, options);
        const Vec2 anchor(5.0f, static_cast<float>(1.2 + i * 0.4));
        const Vec2 a = anchor - world.getBody(i + 1)->getPosition();
        const Vec2 b = anchor - world.getBody(i + 2)->getPosition();
        world.createDistanceJoint(100 + i, i + 1, i + 2, a.x, a.y, b.x, b.y, 0.0f);
    }

    for (int step = 0; step < 600; ++step) world.step();
    Vec2 settled[20];
    for (int i = 0; i < 20; ++i) settled[i] = world.getBody(i + 2)->getPosition();
    float peakTravel = 0.0f, peakGap = 0.0f;
    for (int step = 0; step < 600; ++step) {
        world.step();
        for (int i = 0; i < 20; ++i) {
            Joint* joint = world.getJoint(100 + i);
            Body* a = joint->bodyA;
            Body* b = joint->bodyB;
            const Vec2 pa = a->getPosition() + joint->getLocalAnchorA().rotate(a->getRotation());
            const Vec2 pb = b->getPosition() + joint->getLocalAnchorB().rotate(b->getRotation());
            const float gap = (pb - pa).magnitude();
            const float travel = (b->getPosition() - settled[i]).magnitude();
            ASSERT_TRUE(std::isfinite(gap) && std::isfinite(travel));
            peakGap = std::max(peakGap, gap);
            peakTravel = std::max(peakTravel, travel);
        }
    }
    EXPECT_LT(peakGap, PENETRATION_SLOP);
    EXPECT_LT(peakTravel, 0.001f); // Less than a millimetre over ten seconds at rest.

    for (int i = 0; i < 20; ++i) world.getBody(i + 2)->canSleep = true;
    for (int step = 0; step < 300; ++step) world.step();
    for (int i = 0; i < 20; ++i) {
        const Body* body = world.getBody(i + 2);
        ASSERT_TRUE(body->isSleeping);
        EXPECT_FLOAT_EQ(body->getVelocity().magnitude(), 0.0f);
    }

    Body* tip = world.getBody(21);
    const Vec2 start = tip->getPosition();
    tip->setVelocity(Vec2(0.25f, 0.0f));
    world.step();
    const Vec2 displacement = tip->getPosition() - start;
    EXPECT_GT(displacement.x, 0.0f);
    EXPECT_LT(displacement.magnitude(), 0.25f / 60.0f);
}

TEST_F(DistanceJointTest, EditedPinHoldsBothAxesAndAllowsRotation) {
    world.setGravity(0.0f, 0.0f);
    options["type"] = static_cast<int>(ObjectType::FIXED_OBJECT);
    world.createBody(1, options);
    options["type"] = static_cast<int>(ObjectType::DYNAMIC_OBJECT);
    options["x"] = 1.0f;
    options["canSleep"] = false;
    world.createBody(2, options);
    world.createDistanceJoint(100, 1, 2, 0, 0, 0, 0, 1.0f);
    Joint* joint = world.getJoint(100);
    Body* body = world.getBody(2);
    joint->setLength(0.0f);
    joint->setLocalAnchorA(Vec2(1, 0));
    body->setVelocity(Vec2(3, -2));
    body->setAngularVelocity(1.0f);
    world.step();
    EXPECT_LT(body->getVelocity().magnitude(), 1e-4f);
    EXPECT_GT(body->getAngularVelocity(), 0.9f);
    EXPECT_LT(joint->getReactionForce(60).x, 0.0f);
    EXPECT_GT(joint->getReactionForce(60).y, 0.0f);

    joint->setLength(1.0f);
    body->setX(2.0f);
    body->setVelocity(Vec2(0, 1));
    world.step();
    EXPECT_GT(body->getVelocityY(), 0.9f);
}
