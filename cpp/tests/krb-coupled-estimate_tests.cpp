#include <gtest/gtest.h>
#include "world.h"
#include "body.h"
#include "fixture.h"
#include <cmath>

static emscripten_val createBoxOptions(float x, float y, float mass, bool fixed = false) {
	emscripten_val options;
	options.properties["x"] = x;
	options.properties["y"] = y;
	options.properties["mass"] = mass;
	options.properties["type"] = fixed ? (int)ObjectType::FIXED_OBJECT : (int)ObjectType::DYNAMIC_OBJECT;
	options.properties["shape"] = (int)ObjectShape::BOX;
	options.properties["width"] = 1.0f;
	options.properties["height"] = 1.0f;
	return options;
}

static emscripten_val createCircleOptions(float x, float y, float mass, bool fixed = false) {
	emscripten_val options;
	options.properties["x"] = x;
	options.properties["y"] = y;
	options.properties["mass"] = mass;
	options.properties["type"] = fixed ? (int)ObjectType::FIXED_OBJECT : (int)ObjectType::DYNAMIC_OBJECT;
	options.properties["shape"] = (int)ObjectShape::CIRCLE;
	options.properties["radius"] = 0.5f;
	options.properties["restitution"] = 1.0f;
	options.properties["sFriction"] = 0.0f;
	options.properties["kFriction"] = 0.0f;
	options.properties["linearDamping"] = 0.0f;
	options.properties["angularDamping"] = 0.0f;
	options.properties["canSleep"] = false;
	return options;
}

TEST(KrbCoupledEstimate, ContactsOnlyStack) {
	World world;
	world.setGravity(0.0f, 10.0f);
	world.setTimeStep(1.0f / 60.0f);

	emscripten_val floorOptions = createBoxOptions(0.0f, 5.0f, 0.0f, true);
	world.createBody(1, floorOptions);

	emscripten_val lowerOptions = createBoxOptions(0.0f, 3.5f, 1.0f);
	world.createBody(2, lowerOptions);

	emscripten_val upperOptions = createBoxOptions(0.0f, 2.0f, 1.0f);
	world.createBody(3, upperOptions);

	for (int i = 0; i < 10; ++i) {
		world.step();
	}

	float work = world.getLastCoupledGravitationalWork();
	EXPECT_TRUE(std::isfinite(work));
	EXPECT_NEAR(work, 0.0f, 1e-6f);
}

TEST(KrbCoupledEstimate, JointsOnlyPendulum) {
	World world;
	world.setGravity(0.0f, 10.0f);
	world.setTimeStep(1.0f / 60.0f);

	world.createBody(1, createBoxOptions(0.0f, 0.0f, 0.0f, true));
	world.createBody(2, createBoxOptions(0.0f, 2.0f, 1.0f));
	world.createDistanceJoint(10, 1, 2, 0.0f, 0.0f, 0.0f, 0.0f, 2.0f);

	for (int i = 0; i < 10; ++i) {
		world.step();
	}

	float work = world.getLastCoupledGravitationalWork();
	EXPECT_TRUE(std::isfinite(work));
	EXPECT_NEAR(work, 0.0f, 1e-6f);
}

TEST(KrbCoupledEstimate, SpeculativeOrSeparated) {
	World world;
	world.setGravity(0.0f, 10.0f);
	world.setTimeStep(1.0f / 60.0f);

	world.createBody(1, createBoxOptions(0.0f, 0.0f, 0.0f, true));
	world.createBody(2, createCircleOptions(0.0f, 2.0f, 1.0f));
	world.createDistanceJoint(10, 1, 2, 0.0f, 0.0f, 0.0f, 0.0f, 2.0f);

	world.createBody(3, createCircleOptions(5.0f, 2.0f, 1.0f));

	for (int i = 0; i < 5; ++i) {
		world.step();
	}

	float work = world.getLastCoupledGravitationalWork();
	EXPECT_TRUE(std::isfinite(work));
	EXPECT_NEAR(work, 0.0f, 1e-6f);
}

TEST(KrbCoupledEstimate, HungHorizontalBounce) {
	World world;
	world.setGravity(0.0f, 9.8f);
	world.setTimeStep(1.0f / 60.0f);

	world.createBody(1, createBoxOptions(0.0f, 0.0f, 0.0f, true));
	world.createBody(2, createBoxOptions(1.5f, 0.0f, 0.0f, true));

	world.createBody(10, createCircleOptions(-0.3f, 1.2f, 1.0f));
	world.createBody(11, createCircleOptions(0.3f, 1.2f, 1.0f));

	world.createDistanceJoint(20, 1, 10, 0.0f, 0.0f, 0.0f, 0.0f, 1.2f);
	world.createDistanceJoint(21, 2, 11, 0.0f, 0.0f, 0.0f, 0.0f, 1.2f);

	Body* ballA = world.getBody(10);
	Body* ballB = world.getBody(11);
	ASSERT_NE(ballA, nullptr);
	ASSERT_NE(ballB, nullptr);
	ballA->setVelocityX(-3.0f);
	ballB->setVelocityX(0.0f);

	float observed = 0.0f;
	for (int i = 0; i < 3; ++i) {
		world.step();
		float work = world.getLastCoupledGravitationalWork();
		EXPECT_TRUE(std::isfinite(work));
		if (std::abs(work) > 1e-8f) {
			observed = work;
			break;
		}
	}

	EXPECT_NE(observed, 0.0f);
}

TEST(KrbCoupledEstimate, LaunchTaxDoesNotTouchStack) {
	World world;
	world.setGravity(0.0f, 10.0f);
	world.setTimeStep(1.0f / 60.0f);

	world.createBody(1, createBoxOptions(0.0f, 5.0f, 0.0f, true));
	world.createBody(2, createBoxOptions(0.0f, 3.5f, 1.0f));
	world.createBody(3, createBoxOptions(0.0f, 2.0f, 1.0f));

	for (int i = 0; i < 20; ++i) {
		world.step();
	}

	Body* lower = world.getBody(2);
	Body* upper = world.getBody(3);
	ASSERT_NE(lower, nullptr);
	ASSERT_NE(upper, nullptr);

	EXPECT_TRUE(std::isfinite(lower->getPosition().x));
	EXPECT_TRUE(std::isfinite(lower->getPosition().y));
	EXPECT_TRUE(std::isfinite(upper->getPosition().x));
	EXPECT_TRUE(std::isfinite(upper->getPosition().y));
	EXPECT_TRUE(std::isfinite(lower->getVelocity().x));
	EXPECT_TRUE(std::isfinite(lower->getVelocity().y));
	EXPECT_TRUE(std::isfinite(upper->getVelocity().x));
	EXPECT_TRUE(std::isfinite(upper->getVelocity().y));

	float work = world.getLastCoupledGravitationalWork();
	EXPECT_TRUE(std::isfinite(work));
	EXPECT_NEAR(work, 0.0f, 1e-6f);
}

TEST(KrbCoupledEstimate, LaunchTaxDoesNotTouchSpeculative) {
	World world;
	world.setGravity(0.0f, 10.0f);
	world.setTimeStep(1.0f / 60.0f);

	world.createBody(1, createBoxOptions(0.0f, 0.0f, 0.0f, true));
	world.createBody(2, createCircleOptions(0.0f, 2.0f, 1.0f));
	world.createDistanceJoint(10, 1, 2, 0.0f, 0.0f, 0.0f, 0.0f, 2.0f);

	world.createBody(3, createCircleOptions(5.0f, 2.0f, 1.0f));

	for (int i = 0; i < 30; ++i) {
		world.step();
	}

	Body* neighbor = world.getBody(3);
	ASSERT_NE(neighbor, nullptr);
	EXPECT_TRUE(std::isfinite(neighbor->getPosition().x));
	EXPECT_TRUE(std::isfinite(neighbor->getPosition().y));
	EXPECT_NEAR(neighbor->getVelocity().x, 0.0f, 0.1f);

	float work = world.getLastCoupledGravitationalWork();
	EXPECT_TRUE(std::isfinite(work));
	EXPECT_NEAR(work, 0.0f, 1e-6f);
}
