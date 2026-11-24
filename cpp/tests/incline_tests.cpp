#include <cmath>
#include <string>
#include <gtest/gtest.h>
#include "body.h"
#include "world.h"

namespace {
constexpr float angle = 20.0f * 3.14159265f / 180.0f;
constexpr float gravity = 9.81f;
constexpr float dt = 1.0f / 60.0f;
constexpr int frames = 240;

struct Surface {
    const char* name;
    float muStatic;
    float muKinetic;
};

class InclineTest : public testing::TestWithParam<Surface> {};

TEST_P(InclineTest, BoxReleasedFromRest) {
    const Surface surface = GetParam();
    World world;
    world.setGravity(0.0f, gravity);
    world.setTimeStep(dt);

    const Vec2 downhill(std::cos(angle), std::sin(angle));
    const Vec2 outward(downhill.y, -downhill.x);
    emscripten_val box;
    box.properties["type"] = static_cast<int>(ObjectType::FIXED_OBJECT);
    box.properties["shape"] = static_cast<int>(ObjectShape::BOX);
    box.properties["width"] = 100.0f;
    box.properties["height"] = 1.0f;
    box.properties["r"] = angle;
    box.properties["sFriction"] = surface.muStatic;
    box.properties["kFriction"] = surface.muKinetic;
    box.properties["restitution"] = 0.0f;
    world.createBody(1, box);

    // Start flush on the ramp. The 2 x 0.5 footprint is stable against tipping.
    const Vec2 start = outward * 0.75f;
    box.properties["type"] = static_cast<int>(ObjectType::DYNAMIC_OBJECT);
    box.properties["x"] = start.x;
    box.properties["y"] = start.y;
    box.properties["width"] = 2.0f;
    box.properties["height"] = 0.5f;
    box.properties["mass"] = 1.0f;
    box.properties["canSleep"] = false;
    box.properties["linearDamping"] = 0.0f;
    box.properties["angularDamping"] = 0.0f;
    world.createBody(2, box);
    Body* slider = world.getBody(2);
    ASSERT_NE(slider, nullptr);

    float along = 0.0f;
    float peakExcursion = 0.0f;
    for (int step = 0; step < frames; ++step) {
        world.step();
        const Vec2 travel = Vec2(slider->getX(), slider->getY()) - start;
        along = travel.dot(downhill);
        peakExcursion = std::max(peakExcursion, std::abs(along));
        ASSERT_NEAR(travel.dot(outward), 0.0f, 0.02f) << step;
        ASSERT_NEAR(slider->getRotation(), angle, 0.02f) << step;
    }
    RecordProperty("downhill_displacement_m", std::to_string(along));
    if (surface.muStatic > std::tan(angle)) {
        EXPECT_LT(peakExcursion, 0.01f);
    } else {
        // Coulomb sliding from rest: a = g (sin(theta) - mu_k cos(theta)).
        const float a = gravity * (downhill.y - surface.muKinetic * downhill.x);
        const float duration = frames * dt;
        const float expected = 0.5f * a * duration * duration;
        EXPECT_NEAR(along, expected, 0.05f * expected);
    }
}

INSTANTIATE_TEST_SUITE_P(Surfaces, InclineTest, testing::Values(
    Surface{"Hold", 0.8f, 0.6f},
    Surface{"Slide", 0.2f, 0.15f},
    Surface{"Frictionless", 0.0f, 0.0f}),
    [](const testing::TestParamInfo<Surface>& info) { return info.param.name; });
} // namespace
