#include <gtest/gtest.h>
#include "world.h"
#include "body.h"
#include "fixture.h"
#include "collision-solver.h"
#include <algorithm>
#include <limits>
#include "constants.h"
#include <vector>
#include <cmath>

// Helper to create options for stacked boxes
static emscripten_val createStackBoxOptions(float x, float y, float mass = 1.0f) {
    emscripten_val options;
    options.properties["x"] = x;
    options.properties["y"] = y;
    options.properties["mass"] = mass;
    options.properties["type"] = (int)ObjectType::DYNAMIC_OBJECT;
    options.properties["shape"] = (int)ObjectShape::BOX;
    options.properties["width"] = 1.0f;
    options.properties["height"] = 0.5f;
    options.properties["restitution"] = 0.1f;
    options.properties["sFriction"] = 0.5f;
    options.properties["kFriction"] = 0.3f;
    return options;
}

TEST(RegressionStackingTest, TenStackedBoxesStability) {
    World world;
    world.setPositionIterations(8); // Use standard but enabled iterations
    world.setGravity(0.0f, 10.0f);
    world.setTimeStep(1.0f / 60.0f);
    
    // 1. Create Ground
    emscripten_val groundOptions;
    groundOptions.properties["x"] = 5.0f;
    groundOptions.properties["y"] = 9.5f;
    groundOptions.properties["type"] = (int)ObjectType::FIXED_OBJECT;
    groundOptions.properties["shape"] = (int)ObjectShape::BOX;
    groundOptions.properties["width"] = 10.0f;
    groundOptions.properties["height"] = 1.0f;
    world.createBody(1, groundOptions);

    // 2. Create a stack of 10 boxes
    std::vector<Body*> boxes;
    for (int i = 0; i < 10; i++) {
        // Initial y centers: 8.5, 7.9, 7.3, ...
        world.createBody(i + 2, createStackBoxOptions(5.0f, 8.5f - i * 0.6f, 1.0f));
        boxes.push_back(world.getBody(i + 2));
    }

    // Simulate for 3 seconds to let them settle
    for (int step = 0; step < 180; ++step) {
        world.step();
    }

    // Expected final Y positions if NO sinking occurred:
    // Ground top: 9.0
    // Box 0 center: 8.75
    // Box 9 center: 4.25
    
    float expectedBox0Y = 8.75f;
    float expectedBox9Y = 4.25f;

    // We allow some physically reasonable errors for a simple Sequential Impulse solver
    EXPECT_NEAR(boxes[0]->getY(), expectedBox0Y, 0.05f) << "Box 0 (bottom) sunk into the ground or jumped too high!";
    EXPECT_NEAR(boxes[9]->getY(), expectedBox9Y, 0.35f) << "Box 9 (top) sunk significantly or stack expanded too much!";
    
    for (int i = 0; i < 10; i++) {
        EXPECT_NEAR(boxes[i]->getX(), 5.0f, 1.0f) << "Box " << i << " drifted horizontally too much!";
    }
}

namespace {

void measureLoadedPile(bool mixed) {
    World world;
    constexpr float dt = 1.0f / 60.0f;
    world.setTimeStep(dt);
    world.setGravity(0.0f, 10.0f);
    world.setVelocityIterations(8);
    world.setPositionIterations(3);
    world.setVelocitySubSteps(1);

    auto floor = createStackBoxOptions(0.0f, 0.5f);
    floor.properties["type"] = (int)ObjectType::FIXED_OBJECT;
    floor.properties["width"] = 20.0f;
    floor.properties["height"] = 1.0f;
    world.createBody(1, floor);
    std::vector<Body*> bodies{world.getBody(1)};
    std::vector<Vec2> nominal{{0.0f, 0.5f}};
    auto addBody = [&](float x, float y, ObjectShape shape, float width) {
        auto options = createStackBoxOptions(x, y);
        options.properties["shape"] = static_cast<int>(shape);
        options.properties["height"] = 1.0f;
        options.properties["width"] = width;
        if (shape == ObjectShape::CIRCLE) options.properties["radius"] = width / 2;
        options.properties["canSleep"] = false;
        const int id = static_cast<int>(bodies.size()) + 1;
        world.createBody(id, options);
        bodies.push_back(world.getBody(id));
        nominal.emplace_back(x, y);
    };
    if (mixed) {
        // Half the 0.6 m gap and the 0.5 m radius seat each roller
        // 0.4 m above the adjacent base corners. The cap loads both rollers.
        for (float x : {-1.6f, 0.0f, 1.6f}) addBody(x, -0.5f, ObjectShape::BOX, 1.0f);
        for (float x : {-0.8f, 0.8f}) addBody(x, -1.4f, ObjectShape::CIRCLE, 1.0f);
        addBody(0.0f, -2.4f, ObjectShape::BOX, 2.6f);
    } else {
        for (int row = 0; row < 4; ++row) {
            const int count = 4 - row;
            for (int column = 0; column < count; ++column) {
                const float x = (column - (count - 1) * 0.5f) * 1.04f;
                addBody(x, -0.5f - row, ObjectShape::BOX, 1.0f);
            }
        }
    }

    for (int step = 0; step < 300; ++step) world.step();
    std::vector<Vec2> settled;
    for (auto* body : bodies) settled.emplace_back(body->getX(), body->getY());

    CollisionSolver probe(world);
    float minDepth = std::numeric_limits<float>::max(), maxDepth = 0.0f;
    float minMotion = std::numeric_limits<float>::max(), maxMotion = 0.0f;
    for (int step = 0; step < 300; ++step) {
        world.step();
        float depth = 0.0f, motion = 0.0f;
        for (size_t i = 1; i < bodies.size(); ++i) {
            ASSERT_FALSE(bodies[i]->isSleeping);
            const Vec2 position(bodies[i]->getX(), bodies[i]->getY());
            // A collapsed pile could also come to rest. Require each center
            // to remain within half a body width of its intended load path.
            ASSERT_LT((position - nominal[i]).magnitude(), 0.5f) << "body " << i;
            motion = std::max(motion, (position - settled[i]).magnitude());
            for (size_t j = 0; j < i; ++j) {
                probe.clear();
                probe.solve(bodies[j]->fixtures.front()->worldIndex,
                            bodies[i]->fixtures.front()->worldIndex, dt);
                for (const auto& contact : probe.collisions)
                    depth = std::max(depth, contact.penetrationDepth);
            }
        }
        minDepth = std::min(minDepth, depth);
        maxDepth = std::max(maxDepth, depth);
        minMotion = std::min(minMotion, motion);
        maxMotion = std::max(maxMotion, motion);
    }

    ::testing::Test::RecordProperty("min_frame_peak_depth_m", std::to_string(minDepth));
    ::testing::Test::RecordProperty("max_frame_peak_depth_m", std::to_string(maxDepth));
    ::testing::Test::RecordProperty("min_frame_peak_motion_m", std::to_string(minMotion));
    ::testing::Test::RecordProperty("max_frame_peak_motion_m", std::to_string(maxMotion));
    // Allow one slop of residual compression beyond the contact dead band.
    // Once settled, no center should travel even one contact slop.
    EXPECT_LE(maxDepth, 2.0f * PENETRATION_SLOP);
    EXPECT_LE(maxMotion, PENETRATION_SLOP);
}

} // namespace

TEST(RegressionStackingTest, LoadedBoxPyramid) {
    measureLoadedPile(false);
}

TEST(RegressionStackingTest, LoadedMixedPile) {
    measureLoadedPile(true);
}
