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
		EXPECT_TRUE(std::isfinite(stats.maxApproachingVn));
		if (stats.visitedPathCount >= 1 ||
		    stats.pathCount >= 1 ||
		    (stats.eligibleContactCount >= 2 && stats.maxApproachingVn > 0.0f)) {
			sawSignal = true;
		}
	}

	EXPECT_TRUE(sawSignal);
}

TEST(ChainResidual, FloorBounceStillNoApply) {
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

TEST(ChainResidual, RestingStackStillNoApply) {
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

TEST(ChainResidual, UnequalMassPathSkipped) {
	World world;
	world.setGravity(0.0f, 9.8f);
	world.setTimeStep(1.0f / 60.0f);

	const float radius = 0.4f;
	const float spacing = radius * 2.01f;

	world.createBody(1, createBoxOptions(-spacing, 0.0f, 0.0f, true));
	world.createBody(2, createBoxOptions(0.0f, 0.0f, 0.0f, true));
	world.createBody(3, createBoxOptions(spacing, 0.0f, 0.0f, true));

	for (int i = 0; i < 3; ++i) {
		float x = (i - 1) * spacing;
		int ballId = 10 + i;
		int anchorId = 100 + i;
		float mass = (i == 1) ? 5.0f : 1.0f;
		world.createBody(anchorId, createBoxOptions(x, 0.0f, 0.0f, true));
		emscripten_val ballOpts = createCircleOptions(x, 1.2f, mass);
		world.createBody(ballId, ballOpts);
		world.createDistanceJoint(200 + i, anchorId, ballId, 0.0f, 0.0f, 0.0f, 0.0f, 1.2f);
	}

	Body* driver = world.getBody(10);
	ASSERT_NE(driver, nullptr);
	driver->setVelocityX(-4.0f);

	for (int i = 0; i < 120; ++i) {
		world.step();
		EXPECT_EQ(world.getLastChainResidual().appliedPathCount, 0);
	}
}

TEST(ChainResidual, EqualMassIdleChainTransfersToFreeEnd) {
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
	Body* exitBall = world.getBody(12);
	ASSERT_NE(driver, nullptr);
	ASSERT_NE(exitBall, nullptr);
	driver->setVelocityX(-4.0f);

	bool sawTransfer = false;
	for (int i = 0; i < 120; ++i) {
		world.step();
		ChainResidualStats stats = world.getLastChainResidual();
		EXPECT_TRUE(std::isfinite(driver->getX()));
		EXPECT_TRUE(std::isfinite(exitBall->getX()));
		if (stats.appliedPathCount >= 1) {
			float driverVx = std::abs(driver->getVelocityX());
			float exitVx = std::abs(exitBall->getVelocityX());
			if (exitVx > driverVx || (driverVx < 0.1f && exitVx > 0.5f)) {
				sawTransfer = true;
			}
		}
	}

	EXPECT_TRUE(sawTransfer);
}

TEST(ChainResidual, TwoBallEqualMassPairAppliesOnImpact) {
	World world;
	world.setGravity(0.0f, 9.8f);
	world.setTimeStep(1.0f / 60.0f);

	const float radius = 0.4f;
	const float spacing = radius * 2.01f;

	world.createBody(1, createBoxOptions(-spacing, 0.0f, 0.0f, true));
	world.createBody(2, createBoxOptions(spacing, 0.0f, 0.0f, true));

	for (int i = 0; i < 2; ++i) {
		float x = (i == 0) ? -spacing : spacing;
		int ballId = 10 + i;
		int anchorId = 100 + i;
		world.createBody(anchorId, createBoxOptions(x, 0.0f, 0.0f, true));
		world.createBody(ballId, createCircleOptions(x, 1.2f, 1.0f));
		world.createDistanceJoint(200 + i, anchorId, ballId, 0.0f, 0.0f, 0.0f, 0.0f, 1.2f);
	}

	Body* driver = world.getBody(10);
	ASSERT_NE(driver, nullptr);
	driver->setVelocityX(-4.0f);

	bool sawApply = false;
	for (int i = 0; i < 120; ++i) {
		world.step();
		if (world.getLastChainResidual().appliedPathCount >= 1) {
			sawApply = true;
			break;
		}
	}

	EXPECT_TRUE(sawApply);
}

TEST(ChainResidual, CradleStyleFiveBallMapEngages) {
	const int count = 5;
	const float radius = 0.4f;
	const float startY = -2.0f;
	const float length = 4.0f;
	const float spacing = radius * 2.01f;

	World world;
	world.setGravity(0.0f, 9.8f);
	world.setTimeStep(1.0f / 60.0f);

	for (int i = 0; i < count; ++i) {
		float x = (i - (count - 1) / 2.0f) * spacing;
		int anchorId = 100 + i;
		int ballId = 200 + i;

		world.createBody(anchorId, createBoxOptions(x, startY, 0.0f, true));

		float ballX = (i == 0) ? x - 3.0f : x;
		float ballY = (i == 0) ? startY + std::sqrt(length * length - 9.0f) : startY + length;

		emscripten_val ballOpts = createCircleOptions(ballX, ballY, 1.0f);
		ballOpts.properties["radius"] = radius;
		world.createBody(ballId, ballOpts);
		world.createDistanceJoint(300 + i, anchorId, ballId, 0.0f, 0.0f, 0.0f, 0.0f, length);
	}

	bool sawApply = false;
	for (int step = 0; step < 120; ++step) {
		world.step();
		if (world.getLastChainResidual().appliedPathCount >= 1) {
			sawApply = true;
			break;
		}
	}

	EXPECT_TRUE(sawApply);
}
