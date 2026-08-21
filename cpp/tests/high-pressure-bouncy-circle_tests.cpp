#include <gtest/gtest.h>
#include <cmath>
#include <sstream>
#include <string>
#include "world.h"
#include "body.h"
#include "fixture.h"

namespace {

constexpr float kG = 400.0f;
constexpr float kMass = 1.0f;
constexpr float kRadius = 0.5f;
constexpr float kThickness = 1.0f;
constexpr float kInnerWidth = 10.0f;
constexpr float kInnerHeight = 3.0f;
constexpr float kStartY = -0.85f;

emscripten_val wallOptions(float x, float y, float w, float h) {
    emscripten_val options;
    options.properties["x"] = x;
    options.properties["y"] = y;
    options.properties["type"] = (int)ObjectType::FIXED_OBJECT;
    options.properties["shape"] = (int)ObjectShape::BOX;
    options.properties["width"] = w;
    options.properties["height"] = h;
    options.properties["restitution"] = 1.0f;
    options.properties["sFriction"] = 0.0f;
    options.properties["kFriction"] = 0.0f;
    options.properties["linearDamping"] = 0.0f;
    options.properties["angularDamping"] = 0.0f;
    return options;
}

emscripten_val circleOptions(float x, float y) {
    emscripten_val options;
    options.properties["x"] = x;
    options.properties["y"] = y;
    options.properties["type"] = (int)ObjectType::DYNAMIC_OBJECT;
    options.properties["shape"] = (int)ObjectShape::CIRCLE;
    options.properties["radius"] = kRadius;
    options.properties["mass"] = kMass;
    options.properties["restitution"] = 1.0f;
    options.properties["sFriction"] = 0.0f;
    options.properties["kFriction"] = 0.0f;
    options.properties["linearDamping"] = 0.0f;
    options.properties["angularDamping"] = 0.0f;
    options.properties["canSleep"] = false;
    return options;
}

std::string bodyState(const Body* body) {
    std::ostringstream ss;
    ss << "pos=(" << body->getX() << ", " << body->getY() << ") "
       << "vel=(" << body->getVelocityX() << ", " << body->getVelocityY() << ")";
    return ss.str();
}

float mechanicalEnergy(const Body* body) {
    float vx = body->getVelocityX();
    float vy = body->getVelocityY();
    float ke = 0.5f * kMass * (vx * vx + vy * vy);
    float pe = kMass * kG * -body->getY();
    return ke + pe;
}

// Matches site/benchmarks/scenarios.ts HighPressureBouncyCircleScenario.
Body* setupWebsiteScenario(World& world) {
    world.setGravity(0.0f, kG);
    world.setTimeStep(1.0f / 60.0f);
    world.setHasRestitution(true);
    world.setHasFriction(true);
    world.setHasPenetrationResolution(true);

    world.createBody(1, wallOptions(0.0f, kInnerHeight / 2.0f + kThickness / 2.0f, kInnerWidth, kThickness));
    world.createBody(2, wallOptions(0.0f, -kInnerHeight / 2.0f - kThickness / 2.0f, kInnerWidth, kThickness));
    world.createBody(3, wallOptions(-kInnerWidth / 2.0f - kThickness / 2.0f, 0.0f, kThickness, kInnerHeight));
    world.createBody(4, wallOptions(kInnerWidth / 2.0f + kThickness / 2.0f, 0.0f, kThickness, kInnerHeight));

    int idx = world.createBody(10, circleOptions(0.0f, kStartY));
    return world.getBodyAtIndex(idx);
}

bool insideEnclosure(const Body* body, float margin) {
    return std::abs(body->getX()) <= kInnerWidth / 2.0f + margin &&
           std::abs(body->getY()) <= kInnerHeight / 2.0f + margin;
}

} // namespace

TEST(HighPressureBouncyCircle, WebsiteScenarioStaysInsideForOneSecond) {
    World world;
    Body* ball = setupWebsiteScenario(world);
    ASSERT_NE(ball, nullptr);

    for (int i = 0; i < 60; ++i) {
        world.step();
        ASSERT_TRUE(insideEnclosure(ball, 0.25f))
            << "escaped on step " << (i + 1) << ": " << bodyState(ball);
    }
}

TEST(HighPressureBouncyCircle, WebsiteScenarioEnergyDoesNotRunAway) {
    World world;
    Body* ball = setupWebsiteScenario(world);
    ASSERT_NE(ball, nullptr);

    const float e0 = kMass * kG * -kStartY;
    double earlySum = 0.0;
    double lateSum = 0.0;
    const int window = 60;
    const int total = 300;

    for (int i = 0; i < total; ++i) {
        world.step();
        ASSERT_TRUE(insideEnclosure(ball, 0.25f))
            << "escaped on step " << (i + 1) << ": " << bodyState(ball);

        float ratio = mechanicalEnergy(ball) / e0;
        if (i < window) {
            earlySum += ratio;
        }
        if (i >= total - window) {
            lateSum += ratio;
        }
    }

    const float earlyMean = static_cast<float>(earlySum / window);
    const float lateMean = static_cast<float>(lateSum / window);
#ifndef GEARBOX_DISABLE_KRB
    EXPECT_NEAR(lateMean, earlyMean, 0.08f)
        << "secular energy drift: early E/E0=" << earlyMean << " late E/E0=" << lateMean;
    EXPECT_NEAR(lateMean, 1.0f, 0.2f) << "late-window mean E/E0=" << lateMean;
#endif
}
