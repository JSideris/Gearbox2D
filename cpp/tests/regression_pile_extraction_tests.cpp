#include <gtest/gtest.h>
#include "world.h"
#include "body.h"
#include "fixture.h"
#include "constants.h"
#include <cmath>

// PILE_MOUSE_EXTRACTION_AC — frozen after red-on-HEAD 64b50ef
// Report environment: gravity on, floor, default mu 0.2, BOX pile, 3 Hz mouse spring, pull world-up (-Y).
// Hunt winner: cross4_Y (compact cross on floor); four-neighbor body stuck at ~0 while isolated moves ~2 m.

namespace {

constexpr int kFloorId = 1;
constexpr int kDraggedId = 10;
constexpr int kNeighborBaseId = 20;
constexpr int kMouseId = 999999;
constexpr int kSpringId = 999998;

constexpr float kGravityY = 9.8f;
constexpr float kDt = 1.0f / 60.0f;
constexpr float kTargetY = 1.25f;
constexpr float kBoxWidth = 0.5f;
constexpr float kBoxHeight = 0.5f;
constexpr float kMass = 1.0f;
constexpr float kMu = 0.2f;
constexpr float kSpringHz = 3.0f;
constexpr float kSpringDamping = 1.0f;
constexpr int kSettleSteps = 180;
constexpr float kPullDelta = 2.0f;
constexpr int kPullSteps = 60;
constexpr float kNeighborGeoRadius = 1.2f;
constexpr float kMinIsoMove = 0.05f;
constexpr float kOrderOfMagRatio = 0.1f;

static const float kCrossNeighborPositions[4][2] = {
	{-0.5f, kTargetY},
	{0.5f, kTargetY},
	{0.0f, kTargetY - 0.5f},
	{0.0f, kTargetY + 0.5f},
};

static const float kOneNeighborPosition[1][2] = {
	{-0.5f, kTargetY},
};

static emscripten_val makeFloorOptions() {
	emscripten_val options;
	options.properties["x"] = 0.0f;
	options.properties["y"] = 2.0f;
	options.properties["type"] = (int)ObjectType::FIXED_OBJECT;
	options.properties["shape"] = (int)ObjectShape::BOX;
	options.properties["width"] = 20.0f;
	options.properties["height"] = 1.0f;
	options.properties["sFriction"] = kMu;
	options.properties["kFriction"] = kMu;
	return options;
}

static emscripten_val makeBoxOptions(float x, float y) {
	emscripten_val options;
	options.properties["x"] = x;
	options.properties["y"] = y;
	options.properties["mass"] = kMass;
	options.properties["type"] = (int)ObjectType::DYNAMIC_OBJECT;
	options.properties["shape"] = (int)ObjectShape::BOX;
	options.properties["width"] = kBoxWidth;
	options.properties["height"] = kBoxHeight;
	options.properties["sFriction"] = kMu;
	options.properties["kFriction"] = kMu;
	options.properties["restitution"] = 0.0f;
	options.properties["canSleep"] = false;
	return options;
}

static emscripten_val makeMouseAnchorOptions(float x, float y) {
	emscripten_val options;
	options.properties["x"] = x;
	options.properties["y"] = y;
	options.properties["type"] = (int)ObjectType::FIXED_OBJECT;
	options.properties["shape"] = (int)ObjectShape::CIRCLE;
	options.properties["radius"] = 0.05f;
	options.properties["maskBits"] = 0;
	return options;
}

struct ExtractionResult {
	float displacement = 0.0f;
	int neighborsAtPullStart = 0;
};

static int countGeometricNeighbors(Body* target, const World& world, int neighborCount) {
	int count = 0;
	const float maxDistSq = kNeighborGeoRadius * kNeighborGeoRadius;
	for (int i = 0; i < neighborCount; ++i) {
		Body* neighbor = world.getBody(kNeighborBaseId + i);
		if (!neighbor || neighbor->type != ObjectType::DYNAMIC_OBJECT) {
			continue;
		}
		const float dx = neighbor->getX() - target->getX();
		const float dy = neighbor->getY() - target->getY();
		if (dx * dx + dy * dy <= maxDistSq) {
			++count;
		}
	}
	return count;
}

static ExtractionResult runExtractionScene(int neighborCount, const float positions[][2]) {
	World world;
	world.setTimeStep(kDt);
	world.setGravity(0.0f, kGravityY);
	world.setHasFriction(true);
	world.setHasRestitution(false);

	world.createBody(kFloorId, makeFloorOptions());
	world.createBody(kDraggedId, makeBoxOptions(0.0f, kTargetY));
	for (int i = 0; i < neighborCount; ++i) {
		world.createBody(kNeighborBaseId + i, makeBoxOptions(positions[i][0], positions[i][1]));
	}

	for (int step = 0; step < kSettleSteps; ++step) {
		world.step();
	}

	Body* target = world.getBody(kDraggedId);
	if (!target) {
		return {};
	}

	const int neighborsAtPullStart = countGeometricNeighbors(target, world, neighborCount);
	const float y0 = target->getY();

	world.createBody(kMouseId, makeMouseAnchorOptions(target->getX(), target->getY()));
	world.createSpringJoint(
		kSpringId, kMouseId, kDraggedId,
		0.0f, 0.0f, 0.0f, 0.0f,
		0.0f, kSpringHz, kSpringDamping);

	Body* mouseAnchor = world.getBody(kMouseId);
	if (!mouseAnchor) {
		return {};
	}
	mouseAnchor->setY(mouseAnchor->getY() - kPullDelta);

	for (int step = 0; step < kPullSteps; ++step) {
		world.step();
	}

	ExtractionResult result;
	result.displacement = y0 - target->getY();
	result.neighborsAtPullStart = neighborsAtPullStart;
	return result;
}

} // namespace

TEST(RegressionPileExtractionTest, DefaultMuBodyExtractableFromFourNeighborPile) {
	const ExtractionResult isolated = runExtractionScene(0, kCrossNeighborPositions);
	const ExtractionResult oneNeighbor = runExtractionScene(1, kOneNeighborPosition);
	const ExtractionResult fourNeighbors = runExtractionScene(4, kCrossNeighborPositions);

	EXPECT_GT(std::abs(isolated.displacement), kMinIsoMove)
		<< "Isolated body should move under sandbox-equivalent 3 Hz spring pull";

	EXPECT_GE(fourNeighbors.neighborsAtPullStart, 4)
		<< "Four-neighbor scene must have four geometric neighbors at pull start";

	EXPECT_GE(std::abs(fourNeighbors.displacement), kOrderOfMagRatio * std::abs(isolated.displacement))
		<< "Four-neighbor extraction should stay within an order of magnitude of isolated pull";

	EXPECT_LT(std::abs(fourNeighbors.displacement), std::abs(isolated.displacement))
		<< "Packed neighbors should add some resistance versus isolated pull";

	EXPECT_GT(std::abs(oneNeighbor.displacement), std::abs(fourNeighbors.displacement))
		<< "One-neighbor pull should remain easier than four-neighbor pull";
}
