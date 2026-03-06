#include <gtest/gtest.h>
#include "world.h"
#include "body.h"
#include "fixture.h"
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
    world.makeBody(1, groundOptions);

    // 2. Create a stack of 10 boxes
    std::vector<Body*> boxes;
    for (int i = 0; i < 10; i++) {
        // Initial y centers: 8.5, 7.9, 7.3, ...
        world.makeBody(i + 2, createStackBoxOptions(5.0f, 8.5f - i * 0.6f, 1.0f));
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
