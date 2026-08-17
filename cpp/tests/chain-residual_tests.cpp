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

TEST(ChainResidual, FloorBounceNotAChain) {
	World world;
	world.setGravity(0.0f, 10.0f);
	world.setTimeStep(1.0f / 60.0f);

	emscripten_val floorOptions = createBoxOptions(0.0f, 10.0f, 0.0f, true);
	floorOptions.properties["restitution"] = 1.0f;
	world.createBody(1, floorOptions);

	emscripten_val ballOptions = createBoxOptions(0.0f, 0.0f, 1.0f);
	ballOptions.properties["shape"] = (int)ObjectShape::CIRCLE;
	ballOptions.properties["radius"] = 0.5f;
	ballOptions.properties["restitution"] = 1.0f;
	ballOptions.properties["sFriction"] = 0.0f;
	ballOptions.properties["kFriction"] = 0.0f;
	ballOptions.properties["linearDamping"] = 0.0f;
	ballOptions.properties["angularDamping"] = 0.0f;
	ballOptions.properties["canSleep"] = false;
	world.createBody(2, ballOptions);

	Body* ball = world.getBody(2);
	ASSERT_NE(ball, nullptr);

	for (int i = 0; i < 20; ++i) {
		world.step();
		EXPECT_TRUE(std::isfinite(ball->getX()));
		EXPECT_TRUE(std::isfinite(ball->getY()));
		EXPECT_EQ(world.getLastChainResidual().pathCount, 0);
	}
}

TEST(ChainResidual, RestingStackNotEligible) {
	World world;
	world.setGravity(0.0f, 10.0f);
	world.setTimeStep(1.0f / 60.0f);

	world.createBody(1, createBoxOptions(0.0f, 5.0f, 0.0f, true));
	world.createBody(2, createBoxOptions(0.0f, 3.5f, 1.0f));
	world.createBody(3, createBoxOptions(0.0f, 2.0f, 1.0f));

	for (int i = 0; i < 20; ++i) {
		world.step();
	}

	ChainResidualStats stats = world.getLastChainResidual();
	EXPECT_EQ(stats.eligibleContactCount, 0);
	EXPECT_EQ(stats.pathCount, 0);
}

TEST(ChainResidual, SpeculativeGapSkipped) {
	World world;
	world.setGravity(0.0f, 10.0f);
	world.setTimeStep(1.0f / 60.0f);

	world.createBody(1, createBoxOptions(0.0f, 0.0f, 0.0f, true));
	world.createBody(2, createCircleOptions(0.0f, 2.0f, 1.0f));
	world.createDistanceJoint(10, 1, 2, 0.0f, 0.0f, 0.0f, 0.0f, 2.0f);

	world.createBody(3, createCircleOptions(5.0f, 2.0f, 1.0f));

	for (int i = 0; i < 30; ++i) {
		world.step();
		EXPECT_EQ(world.getLastChainResidual().pathCount, 0);
	}

	Body* neighbor = world.getBody(3);
	ASSERT_NE(neighbor, nullptr);
	EXPECT_TRUE(std::isfinite(neighbor->getX()));
	EXPECT_TRUE(std::isfinite(neighbor->getY()));
}

TEST(ChainResidual, IdleE1ChainCanReportPath) {
	World world;
	world.setGravity(0.0f, 9.8f);
	world.setTimeStep(1.0f / 60.0f);

	const float radius = 0.4f;
	const float spacing = radius * 2.01f;
	const int count = 3;

	world.createBody(1, createBoxOptions(-spacing, 0.0f, 0.0f, true));
	world.createBody(2, createBoxOptions(0.0f, 0.0f, 0.0f, true));
	world.createBody(3, createBoxOptions(spacing, 0.0f, 0.0f, true));

	for (int i = 0; i < count; ++i) {
		float x = (i - 1) * spacing;
		int ballId = 10 + i;
		int anchorId = 100 + i;
		world.createBody(anchorId, createBoxOptions(x, 0.0f, 0.0f, true));
		world.createBody(ballId, createCircleOptions(x, 1.2f, 1.0f));
		world.createDistanceJoint(200 + i, anchorId, ballId, 0.0f, 0.0f, 0.0f, 0.0f, 1.2f);
	}

	Body* driver = world.getBody(10);
	ASSERT_NE(driver, nullptr);
	driver->setVelocityX(-4.0f);

	bool sawSignal = false;
	for (int i = 0; i < 120; ++i) {
		world.step();
		ChainResidualStats stats = world.getLastChainResidual();
		EXPECT_TRUE(std::isfinite(stats.maxApproachingVn));
		if (stats.pathCount >= 1 ||
		    (stats.eligibleContactCount >= 2 && stats.maxApproachingVn > 0.0f)) {
			sawSignal = true;
		}
	}

	EXPECT_TRUE(sawSignal);
}

TEST(ChainResidual, PassNoOpOnFloorBounce) {
	World world;
	world.setGravity(0.0f, 10.0f);
	world.setTimeStep(1.0f / 60.0f);

	emscripten_val floorOptions = createBoxOptions(0.0f, 10.0f, 0.0f, true);
	floorOptions.properties["restitution"] = 1.0f;
	world.createBody(1, floorOptions);

	emscripten_val ballOptions = createBoxOptions(0.0f, 0.0f, 1.0f);
	ballOptions.properties["shape"] = (int)ObjectShape::CIRCLE;
	ballOptions.properties["radius"] = 0.5f;
	ballOptions.properties["restitution"] = 1.0f;
	ballOptions.properties["sFriction"] = 0.0f;
	ballOptions.properties["kFriction"] = 0.0f;
	ballOptions.properties["linearDamping"] = 0.0f;
	ballOptions.properties["angularDamping"] = 0.0f;
	ballOptions.properties["canSleep"] = false;
	world.createBody(2, ballOptions);

	Body* ball = world.getBody(2);
	ASSERT_NE(ball, nullptr);

	for (int i = 0; i < 20; ++i) {
		world.step();
		ChainResidualStats stats = world.getLastChainResidual();
		EXPECT_TRUE(std::isfinite(ball->getX()));
		EXPECT_TRUE(std::isfinite(ball->getY()));
		EXPECT_EQ(stats.pathCount, 0);
		EXPECT_EQ(stats.visitedPathCount, 0);
		EXPECT_EQ(stats.appliedPathCount, 0);
	}
}

TEST(ChainResidual, PassNoOpOnRestingStack) {
	World world;
	world.setGravity(0.0f, 10.0f);
	world.setTimeStep(1.0f / 60.0f);

	world.createBody(1, createBoxOptions(0.0f, 5.0f, 0.0f, true));
	world.createBody(2, createBoxOptions(0.0f, 3.5f, 1.0f));
	world.createBody(3, createBoxOptions(0.0f, 2.0f, 1.0f));

	for (int i = 0; i < 20; ++i) {
		world.step();
	}

	ChainResidualStats stats = world.getLastChainResidual();
	EXPECT_EQ(stats.eligibleContactCount, 0);
	EXPECT_EQ(stats.pathCount, 0);
	EXPECT_EQ(stats.visitedPathCount, 0);
	EXPECT_EQ(stats.appliedPathCount, 0);
}

TEST(ChainResidual, PassVisitsIdleE1ChainWithoutMovingDecayContract) {
	World world;
	world.setGravity(0.0f, 9.8f);
	world.setTimeStep(1.0f / 60.0f);

	const float radius = 0.4f;
	const float spacing = radius * 2.01f;
	const int count = 3;

	world.createBody(1, createBoxOptions(-spacing, 0.0f, 0.0f, true));
	world.createBody(2, createBoxOptions(0.0f, 0.0f, 0.0f, true));
	world.createBody(3, createBoxOptions(spacing, 0.0f, 0.0f, true));

	for (int i = 0; i < count; ++i) {
		float x = (i - 1) * spacing;
		int ballId = 10 + i;
		int anchorId = 100 + i;
		world.createBody(anchorId, createBoxOptions(x, 0.0f, 0.0f, true));
		world.createBody(ballId, createCircleOptions(x, 1.2f, 1.0f));
		world.createDistanceJoint(200 + i, anchorId, ballId, 0.0f, 0.0f, 0.0f, 0.0f, 1.2f);
	}

	Body* driver = world.getBody(10);
	ASSERT_NE(driver, nullptr);
	driver->setVelocityX(-4.0f);

	bool sawSignal = false;
	for (int i = 0; i < 120; ++i) {
		world.step();
		ChainResidualStats stats = world.getLastChainResidual();
		EXPECT_EQ(stats.appliedPathCount, 0);
		EXPECT_TRUE(std::isfinite(stats.maxApproachingVn));
		if (stats.visitedPathCount >= 1 ||
		    stats.pathCount >= 1 ||
		    (stats.eligibleContactCount >= 2 && stats.maxApproachingVn > 0.0f)) {
			sawSignal = true;
		}
	}

	EXPECT_TRUE(sawSignal);
}
