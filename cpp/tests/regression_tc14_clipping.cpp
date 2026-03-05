#include <gtest/gtest.h>
#include "world.h"
#include "body.h"
#include "fixture.h"
#include "constants.h"
#include <vector>
#include <cmath>

// Helper to create options for test objects
static emscripten_val createTC14Options(float x, float y, float mass = 1.0f) {
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

TEST(RegressionTC14Test, TopBoxShouldNotClipThroughBottomBox) {
	World world;
	world.setGravity(0.0f, 20.0f); // Higher gravity as in TC-14
	world.setTimeStep(1.0f / 60.0f);
	
	// Use defaults to see if it fails
	// world.setVelocityIterations(20);
	// world.setPositionIterations(5);
	// world.setVelocitySubSteps(4);
	
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

	// 2. Create a stack of 2 boxes
	// i=0: y = 8.0
	// i=1: y = 6.9
	world.makeBody(2, createTC14Options(5.0f, 8.0f, 1.0f));
	world.makeBody(3, createTC14Options(5.0f, 6.9f, 1.0f));
	
	Body* bottomBox = world.getBody(2);
	Body* topBox = world.getBody(3);

	// Run for 5 seconds (300 steps)
	// We expect the regression to happen where the top box falls through the bottom box
	// when the bottom box goes to sleep.
	
	bool bottomBoxSlept = false;
	bool clippingDetected = false;
	
	for (int step = 0; step < 300; ++step) {
		world.step();
		
		if (bottomBox->isSleeping) {
			bottomBoxSlept = true;
		}
		
		// If top box Y is > bottom box Y + 0.5 (center to center should be 1.0), it's clipping.
		// If top box Y is close to floor (y=8.0), it's a major clip.
		if (topBox->getY() > bottomBox->getY() + 0.1f) {
			clippingDetected = true;
		}
	}

	EXPECT_TRUE(bottomBoxSlept) << "Bottom box failed to go to sleep within 5 seconds";
	
	// Final positions check
	// Floor top: 8.5
	// Bottom box (height 1): center should be 8.0
	// Top box (height 1): center should be 7.0
	
	EXPECT_NEAR(bottomBox->getY(), 8.0f, 0.1f) << "Bottom box sunk into floor";
	EXPECT_LT(topBox->getY(), bottomBox->getY()) << "Top box clipped through bottom box! Top Y: " << topBox->getY() << " Bottom Y: " << bottomBox->getY();
	EXPECT_NEAR(topBox->getY(), 7.0f, 0.1f) << "Top box should be at y=7.0, but is at " << topBox->getY();
	
	EXPECT_FALSE(clippingDetected) << "Clipping was detected during simulation";
}

TEST(RegressionTC14Test, StackShouldStayAsleepWithoutJitter) {
	World world;
	world.setGravity(0.0f, 20.0f);
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

	// 2. Create a stack of 2 boxes
	world.makeBody(2, createTC14Options(5.0f, 8.0f, 1.0f));
	world.makeBody(3, createTC14Options(5.0f, 6.9f, 1.0f));
	
	Body* bottomBox = world.getBody(2);
	Body* topBox = world.getBody(3);

	// Run for 10 seconds to allow everything to settle and stay settled
	int totalSteps = 600;
	int settleSteps = 450; // Boxes should definitely be asleep by 7.5s
	
	int awakeStepsBottom = 0;
	int awakeStepsTop = 0;

	for (int step = 0; step < totalSteps; ++step) {
		world.step();
		
		if (step >= settleSteps) {
			// After settling, they should be sleeping and stay sleeping
			if (!bottomBox->isSleeping) {
				awakeStepsBottom++;
			}
			if (!topBox->isSleeping) {
				awakeStepsTop++;
			}
		}
	}

	// We expect them to be asleep at the end, and to have been asleep for the entire observation period
	EXPECT_TRUE(bottomBox->isSleeping) << "Bottom box is not sleeping after 10 seconds";
	EXPECT_TRUE(topBox->isSleeping) << "Top box is not sleeping after 10 seconds";
	EXPECT_EQ(awakeStepsBottom, 0) << "Bottom box was awake for " << awakeStepsBottom << " steps during the final 2.5 seconds";
	EXPECT_EQ(awakeStepsTop, 0) << "Top box was awake for " << awakeStepsTop << " steps during the final 2.5 seconds";
}
