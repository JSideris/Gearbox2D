#include <gtest/gtest.h>
#include "world.h"
#include "body.h"
#include "fixture.h"
#include "constants.h"
#include <vector>
#include <cmath>

// Helper to create options for test objects
static emscripten_val createPileTestOptions(float x, float y, float mass = 1.0f) {
    emscripten_val options;
    options.properties["x"] = x;
    options.properties["y"] = y;
    options.properties["mass"] = mass;
    options.properties["type"] = (int)ObjectType::DYNAMIC_OBJECT;
    options.properties["shape"] = (int)ObjectShape::BOX;
    options.properties["width"] = 2.0f;
    options.properties["height"] = 1.0f;
    options.properties["sFriction"] = 10.0f;
    options.properties["kFriction"] = 10.0f;
    return options;
}

TEST(RegressionPileTest, StackOfBoxesShouldSleepAndNotSlide) {
    World world;
    world.setGravity(0.0f, 20.0f); // Higher gravity as in TC-14
    world.setTimeStep(1.0f / 60.0f);
    
    // 1. Create a fixed floor at y=9
    emscripten_val floorOptions;
    floorOptions.properties["x"] = 5.0f;
    floorOptions.properties["y"] = 9.0f;
    floorOptions.properties["type"] = (int)ObjectType::FIXED_OBJECT;
    floorOptions.properties["shape"] = (int)ObjectShape::BOX;
    floorOptions.properties["width"] = 10.0f;
    floorOptions.properties["height"] = 1.0f;
    floorOptions.properties["sFriction"] = 10.0f;
    floorOptions.properties["kFriction"] = 10.0f;
    world.makeBody(1, floorOptions);

    // 2. Create a stack of 4 boxes
    // We'll place them slightly overlapping or just touching to trigger resolution
    std::vector<Body*> boxes;
    for (int i = 0; i < 4; ++i) {
        // Initial Y: 7.0, 5.9, 4.8, 3.7
        // They will fall and stack.
        int id = world.makeBody(i + 2, createPileTestOptions(5.0f, 7.0f - i * 1.1f, 1.0f));
        boxes.push_back(world.getBody(i + 2));
    }

    // Capture initial X positions
    std::vector<float> initialX;
    for (auto* box : boxes) initialX.push_back(box->getX());

    // Run for 5 seconds (300 frames). They should definitely sleep by then.
    // Default sleepTimeRequired is 1.0s.
    for (int i = 0; i < 300; ++i) {
        world.step();
    }

    // Check for regression:
    
    // 1. All boxes should be sleeping.
    for (size_t i = 0; i < boxes.size(); ++i) {
        EXPECT_TRUE(boxes[i]->isSleeping) << "Box " << i << " (id " << boxes[i]->id << ") failed to go to sleep after 5 seconds.";
    }
    
    // 2. No box should have drifted significantly in X (sliding).
    for (size_t i = 0; i < boxes.size(); ++i) {
        float drift = std::abs(boxes[i]->getX() - initialX[i]);
        EXPECT_LT(drift, 0.001f) << "Box " << i << " drifted horizontally by " << drift << " despite high friction.";
    }

    // 3. No box should have sunk significantly (clipping).
    // Expected final Y positions (approximate):
    // Floor top at 8.5
    // Box 0 (height 1): center at 8.0
    // Box 1 (height 1): center at 7.0
    // Box 2 (height 1): center at 6.0
    // Box 3 (height 1): center at 5.0
    
    EXPECT_NEAR(boxes[0]->getY(), 8.0f, 0.02f) << "Box 0 sunk too much into floor";
    EXPECT_NEAR(boxes[1]->getY(), 7.0f, 0.02f) << "Box 1 sunk too much into Box 0";
    EXPECT_NEAR(boxes[2]->getY(), 6.0f, 0.02f) << "Box 2 sunk too much into Box 1";
    EXPECT_NEAR(boxes[3]->getY(), 5.0f, 0.02f) << "Box 3 sunk too much into Box 2";
}

TEST(RegressionPileTest, SlidingThreshold) {
    World world;
    world.setGravity(0.0f, 10.0f);
    world.setTimeStep(1.0f / 60.0f);
    
    // Create a tilted floor
    emscripten_val floorOptions;
    floorOptions.properties["x"] = 5.0f;
    floorOptions.properties["y"] = 9.0f;
    floorOptions.properties["r"] = 0.1f; // Small tilt
    floorOptions.properties["type"] = (int)ObjectType::FIXED_OBJECT;
    floorOptions.properties["shape"] = (int)ObjectShape::BOX;
    floorOptions.properties["width"] = 10.0f;
    floorOptions.properties["height"] = 1.0f;
    floorOptions.properties["sFriction"] = 10.0f;
    floorOptions.properties["kFriction"] = 10.0f;
    world.makeBody(1, floorOptions);

    // Box on the tilted floor
    int id = world.makeBody(2, createPileTestOptions(5.0f, 7.5f, 1.0f));
    Body* box = world.getBody(2);
    box->setRotation(0.1f);

    // Run for 3 seconds
    for (int i = 0; i < 180; ++i) {
        world.step();
    }

    // With friction 10, it should NOT be sliding. 
    // If it slides, it's the regression.
    EXPECT_TRUE(box->isSleeping) << "Box on tilted high-friction surface failed to sleep";
    
    // Check velocity is zero (or very close)
    EXPECT_NEAR(box->getVelocityX(), 0.0f, 0.001f);
    EXPECT_NEAR(box->getVelocityY(), 0.0f, 0.001f);
}
