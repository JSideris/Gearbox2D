#include <gtest/gtest.h>
#include "world.h"
#include "body.h"
#include "fixture.h"
#include <cmath>
#include <algorithm>

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

	for (int i = 0; i < 20; ++i) {
		world.step();
		ChainResidualStats stats = world.getLastChainResidual();
		EXPECT_EQ(stats.pathCount, 0);
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
	EXPECT_EQ(stats.appliedPathCount, 0);
	EXPECT_EQ(stats.pathCount, 0);
}

TEST(ChainResidual, UnequalMassPathSkipped) {
	World world;
	world.setGravity(0.0f, 0.0f);
	world.setTimeStep(1.0f / 60.0f);

	const float radius = 0.5f;
	emscripten_val a = createCircleOptions(0.0f, 0.0f, 1.0f);
	a.properties["radius"] = radius;
	emscripten_val b = createCircleOptions(0.99f, 0.0f, 2.0f);
	b.properties["radius"] = radius;
	emscripten_val c = createCircleOptions(1.98f, 0.0f, 1.0f);
	c.properties["radius"] = radius;
	world.createBody(1, a);
	world.createBody(2, b);
	world.createBody(3, c);

	Body* driver = world.getBody(1);
	ASSERT_NE(driver, nullptr);
	driver->setVelocityX(4.0f);

	int maxVisited = 0;
	for (int i = 0; i < 30; ++i) {
		world.step();
		ChainResidualStats stats = world.getLastChainResidual();
		maxVisited = std::max(maxVisited, stats.visitedPathCount);
		EXPECT_EQ(stats.appliedPathCount, 0);
		EXPECT_TRUE(std::isfinite(driver->getVelocityX()));
	}

	EXPECT_GE(maxVisited, 0);
}

TEST(ChainResidual, TwoBallEqualMassPairAppliesOnImpact) {
	World world;
	world.setGravity(0.0f, 0.0f);
	world.setTimeStep(1.0f / 60.0f);

	emscripten_val a = createCircleOptions(0.0f, 0.0f, 1.0f);
	emscripten_val b = createCircleOptions(0.95f, 0.0f, 1.0f);
	world.createBody(1, a);
	world.createBody(2, b);

	Body* driver = world.getBody(1);
	Body* target = world.getBody(2);
	ASSERT_NE(driver, nullptr);
	ASSERT_NE(target, nullptr);
	driver->setVelocityX(4.0f);

	bool applied = false;
	for (int i = 0; i < 30; ++i) {
		world.step();
		EXPECT_TRUE(std::isfinite(driver->getVelocityX()));
		EXPECT_TRUE(std::isfinite(target->getVelocityX()));
		if (world.getLastChainResidual().appliedPathCount >= 1) {
			applied = true;
		}
	}

	EXPECT_TRUE(applied);
}

TEST(ChainResidual, MappedSubspaceKeDoesNotIncrease) {
	World world;
	world.setGravity(0.0f, 0.0f);
	world.setTimeStep(1.0f / 60.0f);

	emscripten_val a = createCircleOptions(0.0f, 0.0f, 1.0f);
	emscripten_val b = createCircleOptions(0.95f, 0.0f, 1.0f);
	world.createBody(1, a);
	world.createBody(2, b);

	Body* bodyA = world.getBody(1);
	Body* bodyB = world.getBody(2);
	ASSERT_NE(bodyA, nullptr);
	ASSERT_NE(bodyB, nullptr);
	bodyA->setVelocityX(3.0f);
	bodyB->setVelocityX(1.0f);

	auto keN = [&]() {
		float u0 = bodyA->getVelocityX();
		float u1 = bodyB->getVelocityX();
		return 0.5f * (u0 * u0 + u1 * u1);
	};

	float keBefore = keN();
	world.step();
	float keAfter = keN();

	EXPECT_TRUE(std::isfinite(keAfter));
	EXPECT_LE(keAfter, keBefore + 1e-3f);
}

TEST(ChainResidual, FloorBounceStillNoApplyAfterJointReproject) {
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
		EXPECT_EQ(stats.appliedPathCount, 0);
		EXPECT_EQ(stats.reprojectedJointCount, 0);
	}
}

TEST(ChainResidual, RestingStackStillNoApplyAfterJointReproject) {
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
	EXPECT_EQ(stats.appliedPathCount, 0);
	EXPECT_EQ(stats.pathCount, 0);
	EXPECT_EQ(stats.reprojectedJointCount, 0);
}

TEST(ChainResidual, MappedCradleKeepsFiniteRodLength) {
	const int count = 5;
	const float radius = 0.4f;
	const float startY = -2.0f;
	const float length = 4.0f;
	const float spacing = radius * 2.01f;

	World world;
	world.setGravity(0.0f, 9.8f);
	world.setTimeStep(1.0f / 60.0f);

	Body* anchors[count] = {nullptr};
	Body* balls[count] = {nullptr};

	for (int i = 0; i < count; ++i) {
		float x = (i - (count - 1) / 2.0f) * spacing;
		int anchorId = 100 + i;
		int ballId = 200 + i;

		world.createBody(anchorId, createBoxOptions(x, startY, 0.0f, true));
		anchors[i] = world.getBody(anchorId);

		float ballX = (i == 0) ? x - 3.0f : x;
		float ballY = (i == 0) ? startY + std::sqrt(length * length - 9.0f) : startY + length;

		emscripten_val ballOpts = createCircleOptions(ballX, ballY, 1.0f);
		ballOpts.properties["radius"] = radius;
		world.createBody(ballId, ballOpts);
		balls[i] = world.getBody(ballId);
		world.createDistanceJoint(300 + i, anchorId, ballId, 0.0f, 0.0f, 0.0f, 0.0f, length);
	}

	bool sawApply = false;
	for (int step = 0; step < 120; ++step) {
		world.step();
		ChainResidualStats stats = world.getLastChainResidual();
		if (stats.appliedPathCount >= 1) {
			sawApply = true;
		}
		for (int i = 0; i < count; ++i) {
			ASSERT_NE(anchors[i], nullptr);
			ASSERT_NE(balls[i], nullptr);
			float dx = balls[i]->getX() - anchors[i]->getX();
			float dy = balls[i]->getY() - anchors[i]->getY();
			float dist = std::sqrt(dx * dx + dy * dy);
			EXPECT_NEAR(dist, length, 0.05f);
			EXPECT_TRUE(std::isfinite(balls[i]->getX()));
			EXPECT_TRUE(std::isfinite(balls[i]->getY()));
		}
	}

	EXPECT_TRUE(sawApply);
}

TEST(ChainResidual, CradleFarEndReceivesIncomingSpeed) {
	const int count = 5;
	const float radius = 0.4f;
	const float startY = -2.0f;
	const float length = 4.0f;
	const float spacing = radius * 2.01f;

	World world;
	world.setGravity(0.0f, 9.8f);
	world.setTimeStep(1.0f / 60.0f);

	Body* balls[count] = {nullptr};

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
		balls[i] = world.getBody(ballId);
		world.createDistanceJoint(300 + i, anchorId, ballId, 0.0f, 0.0f, 0.0f, 0.0f, length);
	}

	auto speed = [](Body* b) {
		float vx = b->getVelocityX();
		float vy = b->getVelocityY();
		return std::sqrt(vx * vx + vy * vy);
	};

	const float restingY = startY + length;
	const float releaseHeight = restingY - (startY + std::sqrt(length * length - 9.0f));
	float peakOuterHeight = releaseHeight;
	float latePeak = -1e30f;
	bool checked = false;
	int applyFrames = 0;
	for (int step = 0; step < 600; ++step) {
		float incomingBefore = speed(balls[0]);
		world.step();
		for (int i = 0; i < count; ++i) {
			ASSERT_NE(balls[i], nullptr);
			EXPECT_TRUE(std::isfinite(balls[i]->getX()));
		}
		if (world.getLastChainResidual().appliedPathCount >= 1) {
			applyFrames++;
		}
		float h0 = restingY - balls[0]->getY();
		float hFar = restingY - balls[count - 1]->getY();
		float h = std::max(h0, hFar);
		peakOuterHeight = std::max(peakOuterHeight, h);
		if (step >= 480) {
			latePeak = std::max(latePeak, h);
		}
		if (!checked && world.getLastChainResidual().appliedPathCount >= 1) {
			float farSpeed = speed(balls[count - 1]);
			float incomingSpeed = speed(balls[0]);
			float midSpeed = 0.0f;
			for (int i = 1; i < count - 1; ++i) {
				midSpeed = std::max(midSpeed, speed(balls[i]));
			}
			EXPECT_GT(farSpeed, midSpeed + 0.5f)
				<< "s=[" << speed(balls[0]) << ", " << speed(balls[1]) << ", "
				<< speed(balls[2]) << ", " << speed(balls[3]) << ", " << speed(balls[4]) << "]";
			EXPECT_GT(farSpeed, incomingSpeed);
			EXPECT_GE(farSpeed, incomingBefore * 0.85f)
				<< "far=" << farSpeed << " incomingBefore=" << incomingBefore;
			EXPECT_LE(farSpeed, incomingBefore * 1.25f + 0.5f)
				<< "far=" << farSpeed << " incomingBefore=" << incomingBefore;
			checked = true;
		}
	}

	EXPECT_TRUE(checked);
	EXPECT_GE(applyFrames, 2) << "applyFrames=" << applyFrames;
	EXPECT_LT(peakOuterHeight, releaseHeight + 0.20f)
		<< "peakOuterHeight=" << peakOuterHeight << " releaseHeight=" << releaseHeight;
	EXPECT_LT(peakOuterHeight - latePeak, 0.05f)
		<< "decay=" << (peakOuterHeight - latePeak) << " latePeak=" << latePeak;
}

TEST(ChainResidual, CradleFarEndReceivesIncomingSpeedWithSleep) {
	const int count = 5;
	const float radius = 0.4f;
	const float startY = -2.0f;
	const float length = 4.0f;
	const float spacing = radius * 2.01f;

	World world;
	world.setGravity(0.0f, 9.8f);
	world.setTimeStep(1.0f / 60.0f);

	Body* balls[count] = {nullptr};

	for (int i = 0; i < count; ++i) {
		float x = (i - (count - 1) / 2.0f) * spacing;
		int anchorId = 100 + i;
		int ballId = 200 + i;

		world.createBody(anchorId, createBoxOptions(x, startY, 0.0f, true));

		float ballX = (i == 0) ? x - 3.0f : x;
		float ballY = (i == 0) ? startY + std::sqrt(length * length - 9.0f) : startY + length;

		emscripten_val ballOpts = createCircleOptions(ballX, ballY, 1.0f);
		ballOpts.properties["radius"] = radius;
		ballOpts.properties["canSleep"] = true;
		world.createBody(ballId, ballOpts);
		balls[i] = world.getBody(ballId);
		world.createDistanceJoint(300 + i, anchorId, ballId, 0.0f, 0.0f, 0.0f, 0.0f, length);
	}

	auto speed = [](Body* b) {
		float vx = b->getVelocityX();
		float vy = b->getVelocityY();
		return std::sqrt(vx * vx + vy * vy);
	};

	const float restingY = startY + length;
	const float releaseHeight = restingY - (startY + std::sqrt(length * length - 9.0f));
	float peakOuterHeight = releaseHeight;
	float latePeak = -1e30f;
	bool checked = false;
	int applyFrames = 0;
	for (int step = 0; step < 600; ++step) {
		float incomingBefore = speed(balls[0]);
		world.step();
		for (int i = 0; i < count; ++i) {
			ASSERT_NE(balls[i], nullptr);
			EXPECT_TRUE(std::isfinite(balls[i]->getX()));
		}
		if (world.getLastChainResidual().appliedPathCount >= 1) {
			applyFrames++;
		}
		float h0 = restingY - balls[0]->getY();
		float hFar = restingY - balls[count - 1]->getY();
		float h = std::max(h0, hFar);
		peakOuterHeight = std::max(peakOuterHeight, h);
		if (step >= 480) {
			latePeak = std::max(latePeak, h);
		}
		if (!checked && world.getLastChainResidual().appliedPathCount >= 1) {
			float farSpeed = speed(balls[count - 1]);
			float incomingSpeed = speed(balls[0]);
			float midSpeed = 0.0f;
			for (int i = 1; i < count - 1; ++i) {
				midSpeed = std::max(midSpeed, speed(balls[i]));
			}
			EXPECT_GT(farSpeed, midSpeed + 0.5f)
				<< "s=[" << speed(balls[0]) << ", " << speed(balls[1]) << ", "
				<< speed(balls[2]) << ", " << speed(balls[3]) << ", " << speed(balls[4]) << "]";
			EXPECT_GT(farSpeed, incomingSpeed);
			EXPECT_GE(farSpeed, incomingBefore * 0.85f)
				<< "far=" << farSpeed << " incomingBefore=" << incomingBefore;
			EXPECT_LE(farSpeed, incomingBefore * 1.25f + 0.5f)
				<< "far=" << farSpeed << " incomingBefore=" << incomingBefore;
			checked = true;
		}
	}

	EXPECT_TRUE(checked);
	EXPECT_GE(applyFrames, 2) << "applyFrames=" << applyFrames;
	EXPECT_LT(peakOuterHeight, releaseHeight + 0.20f)
		<< "peakOuterHeight=" << peakOuterHeight << " releaseHeight=" << releaseHeight;
	EXPECT_LT(peakOuterHeight - latePeak, 0.05f)
		<< "decay=" << (peakOuterHeight - latePeak) << " latePeak=" << latePeak;
}

TEST(ChainResidual, CradleReprojectDoesNotIncreaseIslandKe) {
	World world;
	world.setGravity(0.0f, 0.0f);
	world.setTimeStep(1.0f / 60.0f);

	world.createBody(1, createBoxOptions(0.0f, 0.0f, 0.0f, true));
	world.createBody(2, createCircleOptions(0.0f, 2.0f, 1.0f));
	world.createDistanceJoint(10, 1, 2, 0.0f, 0.0f, 0.0f, 0.0f, 2.0f);

	emscripten_val targetOpts = createCircleOptions(1.9f, 0.0f, 1.0f);
	world.createBody(3, targetOpts);

	Body* driver = world.getBody(2);
	Body* target = world.getBody(3);
	ASSERT_NE(driver, nullptr);
	ASSERT_NE(target, nullptr);
	driver->setVelocityX(4.0f);

	auto dynamicKe = [&]() {
		float ke = 0.0f;
		for (Body* b : {driver, target}) {
			float im = b->getInverseMass();
			if (im <= 0.0f) {
				continue;
			}
			float m = 1.0f / im;
			float vx = b->getVelocityX();
			float vy = b->getVelocityY();
			float w = b->getAngularVelocity();
			ke += 0.5f * m * (vx * vx + vy * vy);
			float iI = b->getInverseInertia();
			if (iI > 0.0f) {
				ke += 0.5f * (1.0f / iI) * w * w;
			}
		}
		return ke;
	};

	bool checked = false;
	for (int i = 0; i < 60; ++i) {
		float keBefore = dynamicKe();
		world.step();
		float keAfter = dynamicKe();
		ChainResidualStats stats = world.getLastChainResidual();

		EXPECT_TRUE(std::isfinite(keAfter));
		if (stats.appliedPathCount >= 1) {
			EXPECT_LE(keAfter, keBefore + 1e-3f);
			checked = true;
		}
	}

	EXPECT_TRUE(checked);
}

TEST(ChainResidual, FrictionDominatedPathSkipped) {
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
		emscripten_val ballOpts = createCircleOptions(x, 1.2f, 1.0f);
		ballOpts.properties["sFriction"] = 1.0f;
		ballOpts.properties["kFriction"] = 1.0f;
		world.createBody(ballId, ballOpts);
		world.createDistanceJoint(200 + i, anchorId, ballId, 0.0f, 0.0f, 0.0f, 0.0f, 1.2f);
	}

	Body* driver = world.getBody(10);
	ASSERT_NE(driver, nullptr);
	driver->setVelocityX(-4.0f);

	for (int i = 0; i < 120; ++i) {
		world.step();
		ChainResidualStats stats = world.getLastChainResidual();
		EXPECT_EQ(stats.appliedPathCount, 0);
		EXPECT_TRUE(std::isfinite(driver->getX()));
		EXPECT_TRUE(std::isfinite(driver->getY()));
	}
}

TEST(ChainResidual, BranchedGraphNotApplied) {
	World world;
	world.setGravity(0.0f, 9.8f);
	world.setTimeStep(1.0f / 60.0f);

	const float radius = 0.4f;
	const float spacing = radius * 2.0f;
	const float overlap = 0.02f;

	world.createBody(10, createCircleOptions(0.0f, 1.2f, 1.0f));
	world.createBody(11, createCircleOptions(-spacing + overlap, 1.2f, 1.0f));
	world.createBody(12, createCircleOptions(spacing - overlap, 1.2f, 1.0f));
	world.createBody(13, createCircleOptions(0.0f, 1.2f - spacing + overlap, 1.0f));

	for (int i = 0; i < 5; ++i) {
		world.step();
	}

	Body* driver = world.getBody(13);
	ASSERT_NE(driver, nullptr);
	driver->setVelocityY(4.0f);

	for (int i = 0; i < 120; ++i) {
		world.step();
		ChainResidualStats stats = world.getLastChainResidual();
		EXPECT_EQ(stats.appliedPathCount, 0);
		EXPECT_TRUE(std::isfinite(world.getBody(10)->getX()));
		EXPECT_TRUE(std::isfinite(world.getBody(11)->getY()));
	}
}

TEST(ChainResidual, LowRestitutionLineNeverApplies) {
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
		emscripten_val ballOpts = createCircleOptions(x, 1.2f, 1.0f);
		ballOpts.properties["restitution"] = 0.2f;
		world.createBody(ballId, ballOpts);
		world.createDistanceJoint(200 + i, anchorId, ballId, 0.0f, 0.0f, 0.0f, 0.0f, 1.2f);
	}

	Body* driver = world.getBody(10);
	ASSERT_NE(driver, nullptr);
	driver->setVelocityX(-4.0f);

	for (int i = 0; i < 120; ++i) {
		world.step();
		EXPECT_EQ(world.getLastChainResidual().appliedPathCount, 0);
		EXPECT_TRUE(std::isfinite(driver->getX()));
	}
}
