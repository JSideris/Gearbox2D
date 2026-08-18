#include <gtest/gtest.h>
#include "world.h"
#include "body.h"
#include "fixture.h"
#include <cmath>
#include <fstream>
#include <filesystem>

static const char* MEASURE_PATH = ".decomposer/iterate/20260817-0e55b7/measure.json";
static const float kCradlePeakHeightDecayTol = 0.05f;

static emscripten_val createBodyOptions(float x, float y, float mass = 1.0f) {
	emscripten_val options;
	options.properties["x"] = x;
	options.properties["y"] = y;
	options.properties["mass"] = mass;
	options.properties["type"] = (int)ObjectType::DYNAMIC_OBJECT;
	options.properties["shape"] = (int)ObjectShape::BOX;
	options.properties["width"] = 1.0f;
	options.properties["height"] = 1.0f;
	return options;
}

static float outerBallHeight(Body* ball, float restingY) {
	return restingY - ball->getY();
}

static void writeMeasureJson(const char* path, float peak2s, float decay10s, float shortfall) {
	std::filesystem::path p(path);
	if (p.has_parent_path()) {
		std::filesystem::create_directories(p.parent_path());
	}
	std::ofstream out(path, std::ios::trunc);
	out << "{\n"
	    << "  \"scores\": {\n"
	    << "    \"peak_height_2s\": " << peak2s << ",\n"
	    << "    \"peak_height_decay_10s\": " << decay10s << ",\n"
	    << "    \"restitution_bounce_shortfall\": " << shortfall << "\n"
	    << "  }\n"
	    << "}\n";
}

static void runCradle(float& peakHeight2s, float& peakHeight8to10, float& peakHeightDecay10s) {
	const int count = 5;
	const float radius = 0.4f;
	const float startY = -2.0f;
	const float length = 4.0f;
	const float spacing = radius * 2.01f;
	const float restingY = startY + length;
	const int stepsPerSecond = 60;
	const int totalSteps = 10 * stepsPerSecond;

	World world;
	world.setGravity(0.0f, 9.8f);
	world.setTimeStep(1.0f / (float)stepsPerSecond);

	Body* outerBalls[2] = {nullptr, nullptr};

	for (int i = 0; i < count; ++i) {
		float x = (i - (count - 1) / 2.0f) * spacing;
		int anchorId = 100 + i;
		int ballId = 200 + i;

		emscripten_val anchorOpts = createBodyOptions(x, startY, 0.0f);
		anchorOpts.properties["type"] = (int)ObjectType::FIXED_OBJECT;
		anchorOpts.properties["width"] = 0.2f;
		anchorOpts.properties["height"] = 0.2f;
		world.createBody(anchorId, anchorOpts);

		float ballX = (i == 0) ? x - 3.0f : x;
		float ballY = (i == 0) ? startY + std::sqrt(length * length - 9.0f) : startY + length;

		emscripten_val ballOpts = createBodyOptions(ballX, ballY, 1.0f);
		ballOpts.properties["shape"] = (int)ObjectShape::CIRCLE;
		ballOpts.properties["radius"] = radius;
		ballOpts.properties["restitution"] = 1.0f;
		ballOpts.properties["sFriction"] = 0.0f;
		ballOpts.properties["kFriction"] = 0.0f;
		ballOpts.properties["linearDamping"] = 0.0f;
		ballOpts.properties["angularDamping"] = 0.0f;
		ballOpts.properties["canSleep"] = false;
		world.createBody(ballId, ballOpts);

		world.createDistanceJoint(300 + i, anchorId, ballId, 0.0f, 0.0f, 0.0f, 0.0f, length);

		if (i == 0) outerBalls[0] = world.getBody(ballId);
		if (i == count - 1) outerBalls[1] = world.getBody(ballId);
	}

	ASSERT_NE(outerBalls[0], nullptr);
	ASSERT_NE(outerBalls[1], nullptr);

	float peak2s = -1e30f;
	float peak8to10 = -1e30f;

	for (int step = 0; step <= totalSteps; ++step) {
		float h = std::max(outerBallHeight(outerBalls[0], restingY),
		                   outerBallHeight(outerBalls[1], restingY));

		if (step <= 2 * stepsPerSecond) {
			peak2s = std::max(peak2s, h);
		}
		if (step >= 8 * stepsPerSecond && step <= 10 * stepsPerSecond) {
			peak8to10 = std::max(peak8to10, h);
		}

		EXPECT_TRUE(std::isfinite(outerBalls[0]->getX()));
		EXPECT_TRUE(std::isfinite(outerBalls[0]->getY()));
		EXPECT_TRUE(std::isfinite(outerBalls[1]->getX()));
		EXPECT_TRUE(std::isfinite(outerBalls[1]->getY()));

		if (step < totalSteps) {
			world.step();
		}
	}

	peakHeight2s = peak2s;
	peakHeight8to10 = peak8to10;
	peakHeightDecay10s = std::max(0.0f, peak2s - peak8to10);
}

static float runBounceShortfall() {
	World world;
	world.setGravity(0.0f, 10.0f);
	world.setTimeStep(1.0f / 60.0f);

	emscripten_val floorOptions = createBodyOptions(0.0f, 10.0f, 0.0f);
	floorOptions.properties["type"] = (int)ObjectType::FIXED_OBJECT;
	floorOptions.properties["width"] = 20.0f;
	floorOptions.properties["height"] = 1.0f;
	floorOptions.properties["restitution"] = 1.0f;
	world.createBody(1, floorOptions);

	emscripten_val ballOptions = createBodyOptions(0.0f, 0.0f, 1.0f);
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
	if (ball == nullptr) {
		ADD_FAILURE() << "bounce ball missing";
		return 0.0f;
	}

	float yInitial = ball->getY();
	float peakUp = 0.0f;

	for (int i = 0; i < 600; ++i) {
		float up = yInitial - ball->getY();
		peakUp = std::max(peakUp, up);
		EXPECT_TRUE(std::isfinite(ball->getX()));
		EXPECT_TRUE(std::isfinite(ball->getY()));
		world.step();
	}

	return std::max(0.0f, 0.0f - peakUp);
}

TEST(EnergyHarness, NewtonsCradleBenchmark) {
	float peakHeight2s = 0.0f;
	float peakHeight8to10 = 0.0f;
	float peakHeightDecay10s = 0.0f;
	runCradle(peakHeight2s, peakHeight8to10, peakHeightDecay10s);

	float restitutionShortfall = runBounceShortfall();

	writeMeasureJson(MEASURE_PATH, peakHeight2s, peakHeightDecay10s, restitutionShortfall);

	EXPECT_TRUE(std::filesystem::exists(MEASURE_PATH));
	EXPECT_LT(peakHeightDecay10s, kCradlePeakHeightDecayTol);
	EXPECT_LT(peakHeight8to10 - peakHeight2s, kCradlePeakHeightDecayTol);
	EXPECT_LE(restitutionShortfall, 0.0f);
}
