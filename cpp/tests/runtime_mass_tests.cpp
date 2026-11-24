#include <gtest/gtest.h>
#include "body.h"
#include "fixture.h"
#include "world.h"

namespace {
emscripten_val circle(float radius) {
    emscripten_val options;
    options.properties["shape"] = (int)ObjectShape::CIRCLE;
    options.properties["radius"] = radius;
    return options;
}

void checkResponse(Body* body, float mass, float inertia) {
    body->setVelocityX(0);
    body->setAngularVelocity(0);
    body->applyImpulse(1, 0, 0, 0);
    body->applyAngularImpulse(1);
    EXPECT_NEAR(body->getMass(), mass, 1e-5);
    EXPECT_NEAR(body->getVelocityX(), mass > 0 ? 1 / mass : 0, 1e-6);
    EXPECT_NEAR(body->getAngularVelocity(), inertia > 0 ? 1 / inertia : 0, 1e-6);
}

TEST(RuntimeMass, OverrideTracksDistributionAndResetUsesCurrentDensities) {
    World world;
    world.createBody(1, emscripten_val{});
    Body* body = world.getBody(1);
    body->setMass(10);
    checkResponse(body, 10, 0);
    world.createFixture(1, 2, circle(1));
    world.createFixture(1, 3, circle(2));
    checkResponse(body, 10, 17);
    body->setMass(20);
    checkResponse(body, 20, 34);
    world.getFixture(2)->setDensity(4);
    checkResponse(body, 20, 25);
    body->setMass(0);
    checkResponse(body, 8 * M_PI, 10 * M_PI);
    world.getFixture(2)->setDensity(0);
    checkResponse(body, 4 * M_PI, 8 * M_PI);
    world.getFixture(3)->setDensity(0);
    checkResponse(body, 0, 0);
}

TEST(RuntimeMass, FixedAndKinematicIgnoreOverrides) {
    for (auto type : {ObjectType::FIXED_OBJECT, ObjectType::KINEMATIC_OBJECT}) {
        World world;
        auto options = circle(1);
        options.properties["type"] = (int)type;
        world.createBody(1, options);
        Body* body = world.getBody(1);
        body->setMass(10);
        body->fixtures.front()->setDensity(4);
        checkResponse(body, 0, 0);
    }
}
}
