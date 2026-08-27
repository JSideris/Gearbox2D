#include <gtest/gtest.h>
#include "world.h"
#include "body.h"
#include "fixture.h"
#include "joint.h"
#include "constants.h"
#include <cmath>
#include <vector>

// Sleeping vs awake mouse-grab burst regressions for
// .decomposer/bugs/20260826-195414-sleeping-pile-grab-explosion.md

namespace {

constexpr int kFloorId = 1;
constexpr int kGrabId = 10;
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
constexpr float kPileSpringHz = 3.0f;
constexpr float kBikeMouseSpringHz = 5.0f;
constexpr float kSpringDamping = 1.0f;
constexpr float kStackX = 0.0f;
constexpr float kBottomY = 1.25f;
constexpr float kStrideY = 0.35f;
constexpr int kStackAbove = 5;

constexpr int kPreSleepSteps = 20;
constexpr int kSleepHoldSteps = 120;
constexpr int kObserveSteps = 20;
constexpr int kPileAwakeSettleSteps = 720;
constexpr int kBikeAwakeSettleSteps = 300;

constexpr float kBurstMultiple = 10.0f;
constexpr float kKeFloor = 1e-4f;
constexpr float kDispFloor = 1e-4f;
constexpr float kVelFloor = 1e-4f;

constexpr uint32_t CAT_CHASSIS = 0x0001;
constexpr uint32_t CAT_WHEEL = 0x0002;
constexpr uint32_t CAT_TERRAIN = 0x0004;

constexpr float kCx = 5.0f;
constexpr float kCy = 5.0f;
constexpr float kWheelRadius = 0.4f;

constexpr int kIdChassis = 1;
constexpr int kIdRearArm = 2;
constexpr int kIdRearWheel = 3;
constexpr int kIdPlatform = 4;
constexpr int kIdEngine = 5;

constexpr int kHingeChassisArm = 10;
constexpr int kHingeArmWheel = 11;
constexpr int kHingeEngine = 12;
constexpr int kGearEngineWheel = 13;
constexpr int kSpringChassisArm = 14;

static const float kCrossNeighborPositions[4][2] = {
	{-0.5f, kTargetY},
	{0.5f, kTargetY},
	{0.0f, kTargetY - 0.5f},
	{0.0f, kTargetY + 0.5f},
};

struct PileGrabMetrics {
	float peakKe = 0.0f;
	float maxNeighborDisp = 0.0f;
	bool allDynamicSleepingAtGrab = false;
	bool grabAwakeAfterFirstStep = false;
};

struct BikeGrabMetrics {
	float maxSpeed = 0.0f;
	bool allDynamicSleepingAtGrab = false;
	bool grabAwakeAfterFirstStep = false;
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

static emscripten_val makeBoxOptions(float x, float y, bool canSleep) {
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
	options.properties["canSleep"] = canSleep;
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

static bool isDynamicBody(const Body* body) {
	return body != nullptr && body->type == ObjectType::DYNAMIC_OBJECT;
}

static float islandKe(const World& world) {
	float ke = 0.0f;
	const int n = world.getBodyCount();
	for (int i = 0; i < n; ++i) {
		Body* body = world.getBodyAtIndex(i);
		if (!isDynamicBody(body)) {
			continue;
		}
		const float mass = body->getMass();
		const float vx = body->getVelocityX();
		const float vy = body->getVelocityY();
		ke += 0.5f * mass * (vx * vx + vy * vy);
		const float invI = body->getInverseInertia();
		if (invI > 0.0f) {
			const float w = body->getAngularVelocity();
			ke += 0.5f * (1.0f / invI) * w * w;
		}
	}
	return ke;
}

static bool allDynamicSleeping(const World& world) {
	const int n = world.getBodyCount();
	int dynamicCount = 0;
	for (int i = 0; i < n; ++i) {
		Body* body = world.getBodyAtIndex(i);
		if (!isDynamicBody(body)) {
			continue;
		}
		++dynamicCount;
		if (!body->isSleeping) {
			return false;
		}
	}
	return dynamicCount > 0;
}

static void sleepAllDynamic(World& world) {
	const int n = world.getBodyCount();
	for (int i = 0; i < n; ++i) {
		Body* body = world.getBodyAtIndex(i);
		if (!isDynamicBody(body) || body->isSleeping) {
			continue;
		}
		body->sleep();
	}
}

static bool bodyStateFinite(const Body* body) {
	return body != nullptr &&
		std::isfinite(body->getX()) && std::isfinite(body->getY()) &&
		std::isfinite(body->getRotation()) &&
		std::isfinite(body->getVelocityX()) && std::isfinite(body->getVelocityY()) &&
		std::isfinite(body->getAngularVelocity());
}

static void settleWorld(World& world, bool canSleep) {
	if (canSleep) {
		for (int i = 0; i < kPreSleepSteps; ++i) {
			world.step();
		}
		sleepAllDynamic(world);
		for (int i = 0; i < kSleepHoldSteps; ++i) {
			world.step();
		}
		return;
	}

	for (int i = 0; i < kPileAwakeSettleSteps; ++i) {
		world.step();
	}
}

static void attachComMouseSpring(World& world, Body* target, float springHz) {
	const float clickX = target->getX();
	const float clickY = target->getY();
	world.createBody(kMouseId, makeMouseAnchorOptions(clickX, clickY));
	world.createSpringJoint(
		kSpringId, kMouseId, target->getId(),
		0.0f, 0.0f, 0.0f, 0.0f,
		0.0f, springHz, kSpringDamping);
	target->forceWakeUp();
}

static PileGrabMetrics runPileGrab(
	bool canSleep,
	int grabId,
	const std::vector<int>& neighborIds,
	float springHz) {
	World world;
	world.setTimeStep(kDt);
	world.setGravity(0.0f, kGravityY);
	world.setHasFriction(true);
	world.setHasRestitution(false);

	world.createBody(kFloorId, makeFloorOptions());
	world.createBody(kGrabId, makeBoxOptions(kStackX, kBottomY, canSleep));
	for (int i = 0; i < kStackAbove; ++i) {
		const float y = kBottomY - kStrideY * static_cast<float>(i + 1);
		world.createBody(kNeighborBaseId + i, makeBoxOptions(kStackX, y, canSleep));
	}

	settleWorld(world, canSleep);

	PileGrabMetrics metrics;
	metrics.allDynamicSleepingAtGrab = allDynamicSleeping(world);

	Body* target = world.getBody(grabId);
	if (target == nullptr) {
		return metrics;
	}

	struct Pos {
		int id;
		float x;
		float y;
	};
	std::vector<Pos> neighborStart;
	for (int id : neighborIds) {
		Body* neighbor = world.getBody(id);
		if (neighbor == nullptr) {
			continue;
		}
		neighborStart.push_back({id, neighbor->getX(), neighbor->getY()});
	}

	attachComMouseSpring(world, target, springHz);

	for (int step = 0; step < kObserveSteps; ++step) {
		world.step();
		if (step == 0) {
			metrics.grabAwakeAfterFirstStep = !target->isSleeping;
		}
		metrics.peakKe = std::max(metrics.peakKe, islandKe(world));

		float maxDisp = 0.0f;
		for (const Pos& start : neighborStart) {
			Body* neighbor = world.getBody(start.id);
			if (neighbor == nullptr) {
				continue;
			}
			const float dx = neighbor->getX() - start.x;
			const float dy = neighbor->getY() - start.y;
			maxDisp = std::max(maxDisp, std::sqrt(dx * dx + dy * dy));
		}
		metrics.maxNeighborDisp = std::max(metrics.maxNeighborDisp, maxDisp);
	}

	EXPECT_TRUE(bodyStateFinite(target));
	for (int id : neighborIds) {
		EXPECT_TRUE(bodyStateFinite(world.getBody(id)));
	}

	return metrics;
}

static PileGrabMetrics runFourNeighborGrab(bool canSleep, int grabId, float springHz) {
	World world;
	world.setTimeStep(kDt);
	world.setGravity(0.0f, kGravityY);
	world.setHasFriction(true);
	world.setHasRestitution(false);

	world.createBody(kFloorId, makeFloorOptions());
	world.createBody(kGrabId, makeBoxOptions(0.0f, kTargetY, canSleep));
	for (int i = 0; i < 4; ++i) {
		world.createBody(
			kNeighborBaseId + i,
			makeBoxOptions(kCrossNeighborPositions[i][0], kCrossNeighborPositions[i][1], canSleep));
	}

	settleWorld(world, canSleep);

	PileGrabMetrics metrics;
	metrics.allDynamicSleepingAtGrab = allDynamicSleeping(world);

	Body* target = world.getBody(grabId);
	if (target == nullptr) {
		return metrics;
	}

	std::vector<int> neighborIds;
	const int allIds[] = {
		kGrabId,
		kNeighborBaseId + 0,
		kNeighborBaseId + 1,
		kNeighborBaseId + 2,
		kNeighborBaseId + 3,
	};
	for (int id : allIds) {
		if (id != grabId) {
			neighborIds.push_back(id);
		}
	}

	struct Pos {
		int id;
		float x;
		float y;
	};
	std::vector<Pos> neighborStart;
	for (int id : neighborIds) {
		Body* neighbor = world.getBody(id);
		if (neighbor == nullptr) {
			continue;
		}
		neighborStart.push_back({id, neighbor->getX(), neighbor->getY()});
	}

	attachComMouseSpring(world, target, springHz);

	for (int step = 0; step < kObserveSteps; ++step) {
		world.step();
		if (step == 0) {
			metrics.grabAwakeAfterFirstStep = !target->isSleeping;
		}
		metrics.peakKe = std::max(metrics.peakKe, islandKe(world));

		float maxDisp = 0.0f;
		for (const Pos& start : neighborStart) {
			Body* neighbor = world.getBody(start.id);
			if (neighbor == nullptr) {
				continue;
			}
			const float dx = neighbor->getX() - start.x;
			const float dy = neighbor->getY() - start.y;
			maxDisp = std::max(maxDisp, std::sqrt(dx * dx + dy * dy));
		}
		metrics.maxNeighborDisp = std::max(metrics.maxNeighborDisp, maxDisp);
	}

	EXPECT_TRUE(bodyStateFinite(target));
	for (int id : neighborIds) {
		EXPECT_TRUE(bodyStateFinite(world.getBody(id)));
	}

	return metrics;
}

static void assertPileBurstWithinAwakeOrder(const PileGrabMetrics& awake, const PileGrabMetrics& sleep) {
	ASSERT_TRUE(sleep.allDynamicSleepingAtGrab) << "sleep arm must be sleeping before grab";
	ASSERT_TRUE(sleep.grabAwakeAfterFirstStep) << "grab target must wake on first observe step";

	const float keLimit = kBurstMultiple * std::max(awake.peakKe, kKeFloor);
	const float dispLimit = kBurstMultiple * std::max(awake.maxNeighborDisp, kDispFloor);
	EXPECT_LE(sleep.peakKe, keLimit);
	EXPECT_LE(sleep.maxNeighborDisp, dispLimit);
}

struct BikeIsland {
	Body* chassis = nullptr;
	Body* rearArm = nullptr;
	Body* rearWheel = nullptr;
	Body* engine = nullptr;
};

static emscripten_val createBikeBoxOptions(
	float x, float y, float mass, float width, float height,
	uint32_t categoryBits, uint32_t maskBits, bool canSleep,
	bool fixed = false, float angularDamping = 0.05f) {
	emscripten_val options;
	options.properties["x"] = x;
	options.properties["y"] = y;
	options.properties["mass"] = mass;
	options.properties["type"] = fixed ? (int)ObjectType::FIXED_OBJECT : (int)ObjectType::DYNAMIC_OBJECT;
	options.properties["shape"] = (int)ObjectShape::BOX;
	options.properties["width"] = width;
	options.properties["height"] = height;
	options.properties["categoryBits"] = (int)categoryBits;
	options.properties["maskBits"] = (int)maskBits;
	options.properties["canSleep"] = canSleep;
	options.properties["angularDamping"] = angularDamping;
	return options;
}

static emscripten_val createBikeCircleOptions(
	float x, float y, float mass, float radius,
	uint32_t categoryBits, uint32_t maskBits, bool canSleep,
	float sFriction, float kFriction, float angularDamping) {
	emscripten_val options;
	options.properties["x"] = x;
	options.properties["y"] = y;
	options.properties["mass"] = mass;
	options.properties["type"] = (int)ObjectType::DYNAMIC_OBJECT;
	options.properties["shape"] = (int)ObjectShape::CIRCLE;
	options.properties["radius"] = radius;
	options.properties["categoryBits"] = (int)categoryBits;
	options.properties["maskBits"] = (int)maskBits;
	options.properties["sFriction"] = sFriction;
	options.properties["kFriction"] = kFriction;
	options.properties["canSleep"] = canSleep;
	options.properties["angularDamping"] = angularDamping;
	return options;
}

static BikeIsland buildSleepGrabBikeIsland(World& world, bool canSleep) {
	world.setGravity(0.0f, 9.81f);
	world.setTimeStep(kDt);
	world.setHasRestitution(true);
	world.setHasFriction(true);

	BikeIsland island;

	world.createBody(kIdPlatform, createBikeBoxOptions(
		kCx, kCy + 2.0f, 0.0f, 20.0f, 1.0f,
		CAT_TERRAIN, CAT_CHASSIS | CAT_WHEEL, false, true));

	world.createBody(kIdChassis, createBikeBoxOptions(
		kCx, kCy, 10.0f, 1.2f, 0.4f,
		CAT_CHASSIS, CAT_TERRAIN, canSleep, false, 1.0f));

	world.createBody(kIdRearArm, createBikeBoxOptions(
		kCx - 0.6f, kCy + 0.2f, 1.0f, 0.6f, 0.1f,
		CAT_CHASSIS, CAT_TERRAIN, canSleep, false, 1.0f));

	world.createBody(kIdRearWheel, createBikeCircleOptions(
		kCx - 0.9f, kCy + 0.2f, 2.0f, kWheelRadius,
		CAT_WHEEL, CAT_TERRAIN, canSleep, 3.0f, 2.5f, 0.5f));

	world.createBody(kIdEngine, createBikeCircleOptions(
		kCx, kCy - 0.15f, 5.0f, 0.25f,
		0, 0, canSleep, 0.0f, 0.0f, 0.05f));

	world.createHingeJoint(kHingeChassisArm, kIdChassis, kIdRearArm, -0.4f, 0.1f, 0.3f, 0.0f);
	world.createHingeJoint(kHingeArmWheel, kIdRearArm, kIdRearWheel, -0.3f, 0.0f, 0.0f, 0.0f);
	world.createHingeJoint(kHingeEngine, kIdChassis, kIdEngine, 0.0f, -0.15f, 0.0f, 0.0f);
	world.createGearJoint(kGearEngineWheel, kHingeEngine, kHingeArmWheel, 2.0f);

	const float springAnchorAx = -0.7f;
	const float springAnchorAy = -0.2f;
	const float springAnchorBx = -0.3f;
	const float springAnchorBy = 0.0f;
	Body* chassis = world.getBody(kIdChassis);
	Body* rearArm = world.getBody(kIdRearArm);
	Vec2 worldA = chassis->getPosition() +
		Vec2(springAnchorAx, springAnchorAy).rotate(chassis->getRotation());
	Vec2 worldB = rearArm->getPosition() +
		Vec2(springAnchorBx, springAnchorBy).rotate(rearArm->getRotation());
	const float springLength = (worldB - worldA).magnitude();
	world.createSpringJoint(
		kSpringChassisArm, kIdChassis, kIdRearArm,
		springAnchorAx, springAnchorAy, springAnchorBx, springAnchorBy,
		springLength, 25.0f, 0.8f);

	island.chassis = chassis;
	island.rearArm = rearArm;
	island.rearWheel = world.getBody(kIdRearWheel);
	island.engine = world.getBody(kIdEngine);
	return island;
}

static float maxBikeSpeed(const BikeIsland& island) {
	float maxSpeed = 0.0f;
	for (Body* body : {island.chassis, island.rearArm, island.rearWheel, island.engine}) {
		if (!body) {
			continue;
		}
		const float vx = body->getVelocityX();
		const float vy = body->getVelocityY();
		maxSpeed = std::max(maxSpeed, std::hypot(vx, vy));
	}
	return maxSpeed;
}

static BikeGrabMetrics runBikeGrab(bool canSleep, Body* (*pickGrabBody)(const BikeIsland&)) {
	World world;
	BikeIsland island = buildSleepGrabBikeIsland(world, canSleep);

	if (canSleep) {
		for (int i = 0; i < kPreSleepSteps; ++i) {
			world.step();
		}
		sleepAllDynamic(world);
		for (int i = 0; i < kSleepHoldSteps; ++i) {
			world.step();
		}
	} else {
		for (int i = 0; i < kBikeAwakeSettleSteps; ++i) {
			world.step();
		}
	}

	BikeGrabMetrics metrics;
	metrics.allDynamicSleepingAtGrab = allDynamicSleeping(world);

	Body* target = pickGrabBody(island);
	if (target == nullptr) {
		return metrics;
	}

	attachComMouseSpring(world, target, kBikeMouseSpringHz);

	for (int step = 0; step < kObserveSteps; ++step) {
		world.step();
		if (step == 0) {
			metrics.grabAwakeAfterFirstStep = !target->isSleeping;
		}
		metrics.maxSpeed = std::max(metrics.maxSpeed, maxBikeSpeed(island));
	}

	EXPECT_TRUE(bodyStateFinite(island.chassis));
	EXPECT_TRUE(bodyStateFinite(island.rearArm));
	EXPECT_TRUE(bodyStateFinite(island.rearWheel));
	EXPECT_TRUE(bodyStateFinite(island.engine));

	return metrics;
}

static void assertBikeBurstWithinAwakeOrder(const BikeGrabMetrics& awake, const BikeGrabMetrics& sleep) {
	ASSERT_TRUE(sleep.allDynamicSleepingAtGrab) << "bike must sleep before grab";
	ASSERT_TRUE(sleep.grabAwakeAfterFirstStep) << "grab target must wake on first observe step";

	const float speedLimit = kBurstMultiple * std::max(awake.maxSpeed, kVelFloor);
	EXPECT_LE(sleep.maxSpeed, speedLimit);
}

static bool aabbOverlaps(const Aabb& a, const Aabb& b) {
	return a.min.x <= b.max.x && a.max.x >= b.min.x &&
		a.min.y <= b.max.y && a.max.y >= b.min.y;
}

static bool dynamicOverlapsFloor(const Body* body, const Aabb& floorAabb) {
	if (!isDynamicBody(body) || body->fixtures.empty()) {
		return false;
	}
	for (Fixture* fixture : body->fixtures) {
		if (fixture && aabbOverlaps(fixture->aabb, floorAabb)) {
			return true;
		}
	}
	return false;
}

static int countSleepingDynamics(const World& world) {
	int count = 0;
	const int n = world.getBodyCount();
	for (int i = 0; i < n; ++i) {
		Body* body = world.getBodyAtIndex(i);
		if (isDynamicBody(body) && body->isSleeping) {
			++count;
		}
	}
	return count;
}

static int countFloorOverlappingDynamicsWithPhysicalCollision(const World& world, int floorId) {
	Body* floor = world.getBody(floorId);
	if (floor == nullptr || floor->fixtures.empty()) {
		return 0;
	}
	const Aabb floorAabb = floor->fixtures[0]->aabb;
	int count = 0;
	const int n = world.getBodyCount();
	for (int i = 0; i < n; ++i) {
		Body* body = world.getBodyAtIndex(i);
		if (!dynamicOverlapsFloor(body, floorAabb)) {
			continue;
		}
		const int flags = world.liveBodyIntData[GET_BODY_IDATA_INDEX(body->worldIndex, BODY_IDATA_FLAGS)];
		if ((flags & HAS_PHYSICAL_COLLISION) != 0) {
			++count;
		}
	}
	return count;
}

struct PileFirstStepReconstruction {
	bool allDynamicSleepingAtGrab = false;
	bool grabAwakeAfterFirstStep = false;
	int stillSleepingDynamics = 0;
	int floorPhysicalCount = 0;
};

static PileFirstStepReconstruction runPileGrabFirstStep(bool canSleep, int grabId) {
	World world;
	world.setTimeStep(kDt);
	world.setGravity(0.0f, kGravityY);
	world.setHasFriction(true);
	world.setHasRestitution(false);

	world.createBody(kFloorId, makeFloorOptions());
	world.createBody(kGrabId, makeBoxOptions(kStackX, kBottomY, canSleep));
	for (int i = 0; i < kStackAbove; ++i) {
		const float y = kBottomY - kStrideY * static_cast<float>(i + 1);
		world.createBody(kNeighborBaseId + i, makeBoxOptions(kStackX, y, canSleep));
	}

	settleWorld(world, canSleep);

	PileFirstStepReconstruction metrics;
	metrics.allDynamicSleepingAtGrab = allDynamicSleeping(world);

	Body* target = world.getBody(grabId);
	if (target == nullptr) {
		return metrics;
	}

	attachComMouseSpring(world, target, kPileSpringHz);
	// Undo contact-graph cascade from forceWakeUp so only the grab target is
	// BVH-awake before step 0 (matches the sleep-skip gap under test).
	const int n = world.getBodyCount();
	for (int i = 0; i < n; ++i) {
		Body* body = world.getBodyAtIndex(i);
		if (!isDynamicBody(body) || body->getId() == grabId) {
			continue;
		}
		if (!body->isSleeping) {
			body->sleep();
		}
	}
	world.step();

	metrics.grabAwakeAfterFirstStep = !target->isSleeping;
	metrics.stillSleepingDynamics = countSleepingDynamics(world);
	metrics.floorPhysicalCount = countFloorOverlappingDynamicsWithPhysicalCollision(world, kFloorId);
	return metrics;
}

} // namespace

TEST(SleepingGrabBurst, SandboxPileComGrabStaysNearAwake) {
	std::vector<int> neighborIds;
	for (int i = 0; i < kStackAbove; ++i) {
		neighborIds.push_back(kNeighborBaseId + i);
	}

	const PileGrabMetrics awake = runPileGrab(false, kGrabId, neighborIds, kPileSpringHz);
	const PileGrabMetrics sleep = runPileGrab(true, kGrabId, neighborIds, kPileSpringHz);
	assertPileBurstWithinAwakeOrder(awake, sleep);
}

TEST(SleepingGrabBurst, FourNeighborBottomGrabDoesNotExplodeVsAwake) {
	const int bottomGrabId = kNeighborBaseId + 3;
	const PileGrabMetrics awake = runFourNeighborGrab(false, bottomGrabId, kPileSpringHz);
	const PileGrabMetrics sleep = runFourNeighborGrab(true, bottomGrabId, kPileSpringHz);
	assertPileBurstWithinAwakeOrder(awake, sleep);
}

TEST(SleepingGrabBurst, MotorcycleChassisGrabNoVelocitySpikeVsAwake) {
	const BikeGrabMetrics awake = runBikeGrab(false, [](const BikeIsland& island) { return island.chassis; });
	const BikeGrabMetrics sleep = runBikeGrab(true, [](const BikeIsland& island) { return island.chassis; });
	assertBikeBurstWithinAwakeOrder(awake, sleep);
}

TEST(SleepingGrabBurst, MotorcycleWheelGrabNoVelocitySpikeVsAwake) {
	const BikeGrabMetrics awake = runBikeGrab(false, [](const BikeIsland& island) { return island.rearWheel; });
	const BikeGrabMetrics sleep = runBikeGrab(true, [](const BikeIsland& island) { return island.rearWheel; });
	assertBikeBurstWithinAwakeOrder(awake, sleep);
}

TEST(SleepingGrabBurst, PileWakeReconstructsFloorContactsVsAwakeTwin) {
	// Grab the top box with target-only BVH wake (no contact-graph cascade) so
	// flooded lower boxes need expandSleepingImpactChain floor synthesis.
	const int topGrabId = kNeighborBaseId + (kStackAbove - 1);
	const PileFirstStepReconstruction awake = runPileGrabFirstStep(false, topGrabId);
	const PileFirstStepReconstruction sleep = runPileGrabFirstStep(true, topGrabId);

	ASSERT_TRUE(sleep.allDynamicSleepingAtGrab) << "sleep arm must be sleeping before grab";
	ASSERT_TRUE(sleep.grabAwakeAfterFirstStep) << "grab target must wake on first step";
	EXPECT_EQ(sleep.stillSleepingDynamics, 0) << "flood wake should clear sleepers";

	EXPECT_GT(awake.floorPhysicalCount, 0) << "awake twin must have floor physical contacts";
	EXPECT_EQ(sleep.floorPhysicalCount, awake.floorPhysicalCount)
		<< "sleep grab must reconstruct the same floor contact coverage as awake grab";
}
