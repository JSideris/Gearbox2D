#include <gtest/gtest.h>
#include "world.h"
#include "body.h"
#include "fixture.h"
#include "joint.h"
#include "constants.h"
#include <cmath>
#include <algorithm>
#include <functional>
#include <vector>

namespace {

constexpr uint32_t CAT_CHASSIS = 0x0001;
constexpr uint32_t CAT_WHEEL = 0x0002;
constexpr uint32_t CAT_TERRAIN = 0x0004;

constexpr float kCx = 5.0f;
constexpr float kCy = 5.0f;
constexpr float kWheelRadius = 0.4f;
constexpr float kPlatformTopY = 6.5f;
constexpr float kWheelRestY = kPlatformTopY - kWheelRadius; // 6.1

constexpr int kStepsPerSecond = 60;
constexpr int kTotalSteps = 300;
constexpr int kSettleWindow = 60;

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

void configureWorld(World& world) {
	world.setGravity(0.0f, 9.81f);
	world.setTimeStep(1.0f / static_cast<float>(kStepsPerSecond));
	world.setHasRestitution(true);
	world.setHasFriction(true);
}

emscripten_val createBoxBodyOptions(
	float x, float y, float mass, float width, float height,
	uint32_t categoryBits, uint32_t maskBits, bool fixed = false,
	float angularDamping = 0.05f) {
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
	options.properties["canSleep"] = false;
	options.properties["angularDamping"] = angularDamping;
	return options;
}

emscripten_val createCircleBodyOptions(
	float x, float y, float mass, float radius,
	uint32_t categoryBits, uint32_t maskBits,
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
	options.properties["canSleep"] = false;
	options.properties["angularDamping"] = angularDamping;
	return options;
}

float wheelPenetration(const Body* wheel) {
	return std::max(0.0f, wheel->getY() + kWheelRadius - kPlatformTopY);
}

float hingeAnchorError(Joint* joint) {
	Body* a = joint->bodyA;
	Body* b = joint->bodyB;
	Vec2 rA = joint->getLocalAnchorA().rotate(a->getRotation());
	Vec2 rB = joint->getLocalAnchorB().rotate(b->getRotation());
	return (b->getPosition() + rB - (a->getPosition() + rA)).magnitude();
}

float maxAbsOmega(const std::vector<Body*>& bodies) {
	float maxOmega = 0.0f;
	for (Body* body : bodies) {
		maxOmega = std::max(maxOmega, std::abs(body->getAngularVelocity()));
	}
	return maxOmega;
}

struct IdleIsland {
	World* world = nullptr;
	Body* chassis = nullptr;
	Body* rearArm = nullptr;
	Body* rearWheel = nullptr;
	Body* platform = nullptr;
	Joint* hingeChassisArm = nullptr;
	Joint* hingeArmWheel = nullptr;
};

struct IslandOptions {
	bool includeEngine = false;
	bool includeGear = false;
	bool includeSpring = false;
};

constexpr IslandOptions kFullDrivetrain{true, true, true};

struct DrivetrainIsland : IdleIsland {
	Body* engine = nullptr;
	Joint* hingeEngine = nullptr;
	Joint* gearEngineWheel = nullptr;
	Joint* rearSpring = nullptr;
};

struct RunResult {
	float maxPenOverRun = 0.0f;
	float minGapToSurface = 1e9f;
	float maxPenLastWindow = 0.0f;
	float maxHingeChassisArmOverRun = 0.0f;
	float maxHingeArmWheelOverRun = 0.0f;
	float maxHingeChassisArmLastWindow = 0.0f;
	float maxHingeArmWheelLastWindow = 0.0f;
	float maxAbsOmegaLastWindow = 0.0f;
	float maxPenEarly = 0.0f;
};

bool bodyStateFinite(const Body* body) {
	return std::isfinite(body->getX()) && std::isfinite(body->getY()) &&
		std::isfinite(body->getRotation()) &&
		std::isfinite(body->getVelocityX()) && std::isfinite(body->getVelocityY()) &&
		std::isfinite(body->getAngularVelocity());
}

RunResult runSimulation(
	World& world,
	const IdleIsland& island,
	int totalSteps,
	Body* engine,
	const std::function<void(int stepIdx)>& perStep = {}) {
	RunResult result;
	const int settleStart = totalSteps - kSettleWindow;

	for (int step = 0; step < totalSteps; ++step) {
		if (perStep) {
			perStep(step);
		}
		world.step();

		EXPECT_EQ(world.getLastChainResidual().appliedPathCount, 0);

		EXPECT_TRUE(bodyStateFinite(island.chassis));
		EXPECT_TRUE(bodyStateFinite(island.rearArm));
		EXPECT_TRUE(bodyStateFinite(island.rearWheel));
		if (engine) {
			EXPECT_TRUE(bodyStateFinite(engine));
		}

		const float pen = wheelPenetration(island.rearWheel);
		const float hingeChassisArm = hingeAnchorError(island.hingeChassisArm);
		const float hingeArmWheel = hingeAnchorError(island.hingeArmWheel);
		result.maxPenOverRun = std::max(result.maxPenOverRun, pen);
		result.maxHingeChassisArmOverRun = std::max(result.maxHingeChassisArmOverRun, hingeChassisArm);
		result.maxHingeArmWheelOverRun = std::max(result.maxHingeArmWheelOverRun, hingeArmWheel);
		result.minGapToSurface = std::min(result.minGapToSurface, kWheelRestY - island.rearWheel->getY());

		if (step >= 60 && step <= 120) {
			result.maxPenEarly = std::max(result.maxPenEarly, pen);
		}

		if (step >= settleStart) {
			result.maxPenLastWindow = std::max(result.maxPenLastWindow, pen);
			result.maxHingeChassisArmLastWindow = std::max(
				result.maxHingeChassisArmLastWindow, hingeChassisArm);
			result.maxHingeArmWheelLastWindow = std::max(
				result.maxHingeArmWheelLastWindow, hingeArmWheel);

			std::vector<Body*> omegaBodies = {island.chassis, island.rearArm, island.rearWheel};
			if (engine) {
				omegaBodies.push_back(engine);
			}
			result.maxAbsOmegaLastWindow = std::max(result.maxAbsOmegaLastWindow, maxAbsOmega(omegaBodies));
		}
	}

	return result;
}

void assertContactOccurred(const RunResult& result) {
	const bool madeContact = result.maxPenOverRun > 0.0f ||
		result.minGapToSurface <= PENETRATION_SLOP;
	EXPECT_TRUE(madeContact);
}

void assertFailFirstBounds(const RunResult& result) {
	EXPECT_LE(result.maxPenLastWindow, PENETRATION_SLOP);
	EXPECT_LE(result.maxHingeChassisArmLastWindow, PENETRATION_SLOP);
	EXPECT_LE(result.maxHingeArmWheelLastWindow, PENETRATION_SLOP);
}

void recordIdleMetrics(const RunResult& result) {
	::testing::Test::RecordProperty("max_pen_over_run", result.maxPenOverRun);
	::testing::Test::RecordProperty("max_pen_last_window", result.maxPenLastWindow);
	::testing::Test::RecordProperty("max_hinge_chassis_arm_last_window", result.maxHingeChassisArmLastWindow);
	::testing::Test::RecordProperty("max_hinge_arm_wheel_last_window", result.maxHingeArmWheelLastWindow);
	::testing::Test::RecordProperty("max_abs_omega_last_window", result.maxAbsOmegaLastWindow);
}

void recordThrottleMetrics(const RunResult& result) {
	::testing::Test::RecordProperty("max_pen_over_run", result.maxPenOverRun);
	::testing::Test::RecordProperty("max_pen_last_window", result.maxPenLastWindow);
	::testing::Test::RecordProperty("max_pen_early", result.maxPenEarly);
	::testing::Test::RecordProperty("max_abs_omega_last_window", result.maxAbsOmegaLastWindow);
}

void assertThrottlePenBounds(const RunResult& result) {
	EXPECT_LE(result.maxPenLastWindow, PENETRATION_SLOP);
	EXPECT_LE(result.maxPenLastWindow, result.maxPenEarly + PENETRATION_SLOP);
}

std::function<void(int)> makeThrottleCallback(Body* engine) {
	const float dt = 1.0f / static_cast<float>(kStepsPerSecond);
	return [engine, dt](int step) {
		if (step >= 60 && step < 240) {
			engine->applyAngularImpulse(-75.0f * dt);
		}
	};
}

IdleIsland buildIdleLandingIsland(World& world) {
	configureWorld(world);

	IdleIsland island;
	island.world = &world;

	world.createBody(kIdPlatform, createBoxBodyOptions(
		kCx, kCy + 2.0f, 0.0f, 20.0f, 1.0f,
		CAT_TERRAIN, CAT_CHASSIS | CAT_WHEEL, true));

	world.createBody(kIdChassis, createBoxBodyOptions(
		kCx, kCy, 10.0f, 1.2f, 0.4f,
		CAT_CHASSIS, CAT_TERRAIN, false, 1.0f));

	world.createBody(kIdRearArm, createBoxBodyOptions(
		kCx - 0.6f, kCy + 0.2f, 1.0f, 0.6f, 0.1f,
		CAT_CHASSIS, CAT_TERRAIN, false, 1.0f));

	world.createBody(kIdRearWheel, createCircleBodyOptions(
		kCx - 0.9f, kCy + 0.2f, 2.0f, kWheelRadius,
		CAT_WHEEL, CAT_TERRAIN, 3.0f, 2.5f, 0.5f));

	world.createHingeJoint(kHingeChassisArm, kIdChassis, kIdRearArm, -0.4f, 0.1f, 0.3f, 0.0f);
	world.createHingeJoint(kHingeArmWheel, kIdRearArm, kIdRearWheel, -0.3f, 0.0f, 0.0f, 0.0f);

	island.platform = world.getBody(kIdPlatform);
	island.chassis = world.getBody(kIdChassis);
	island.rearArm = world.getBody(kIdRearArm);
	island.rearWheel = world.getBody(kIdRearWheel);
	island.hingeChassisArm = world.getJoint(kHingeChassisArm);
	island.hingeArmWheel = world.getJoint(kHingeArmWheel);

	return island;
}

DrivetrainIsland buildDrivetrainIsland(World& world, IslandOptions opts = kFullDrivetrain) {
	IdleIsland base = buildIdleLandingIsland(world);
	DrivetrainIsland island;
	static_cast<IdleIsland&>(island) = base;
	island.world = base.world;

	if (opts.includeEngine) {
		world.createBody(kIdEngine, createCircleBodyOptions(
			kCx, kCy - 0.15f, 5.0f, 0.25f, 0, 0, 0.0f, 0.0f, 0.05f));
		world.createHingeJoint(kHingeEngine, kIdChassis, kIdEngine, 0.0f, -0.15f, 0.0f, 0.0f);
		island.engine = world.getBody(kIdEngine);
		island.hingeEngine = world.getJoint(kHingeEngine);
	}

	if (opts.includeGear) {
		if (!opts.includeEngine) {
			ADD_FAILURE() << "includeGear requires includeEngine";
		} else {
			world.createGearJoint(kGearEngineWheel, kHingeEngine, kHingeArmWheel, 2.0f);
			island.gearEngineWheel = world.getJoint(kGearEngineWheel);
		}
	}

	if (opts.includeSpring) {
		const float springAnchorAx = -0.7f;
		const float springAnchorAy = -0.2f;
		const float springAnchorBx = -0.3f;
		const float springAnchorBy = 0.0f;
		Vec2 worldA = island.chassis->getPosition() +
			Vec2(springAnchorAx, springAnchorAy).rotate(island.chassis->getRotation());
		Vec2 worldB = island.rearArm->getPosition() +
			Vec2(springAnchorBx, springAnchorBy).rotate(island.rearArm->getRotation());
		const float springLength = (worldB - worldA).magnitude();

		world.createSpringJoint(
			kSpringChassisArm, kIdChassis, kIdRearArm,
			springAnchorAx, springAnchorAy, springAnchorBx, springAnchorBy,
			springLength, 25.0f, 0.8f);
		island.rearSpring = world.getJoint(kSpringChassisArm);
	}

	return island;
}

} // namespace

TEST(MotorcycleIsland, IdleLandingPenetrationAndAnchorsBounded) {
	World world;
	IdleIsland island = buildIdleLandingIsland(world);

	RunResult result = runSimulation(world, island, kTotalSteps, nullptr);
	assertContactOccurred(result);
	assertFailFirstBounds(result);
	recordIdleMetrics(result);
}

TEST(MotorcycleIsland, IdleEngineHingeOnlyPenetrationAndAnchorsBounded) {
	World world;
	DrivetrainIsland island = buildDrivetrainIsland(world, {true, false, false});

	RunResult result = runSimulation(world, island, kTotalSteps, island.engine);
	assertContactOccurred(result);
	assertFailFirstBounds(result);
	recordIdleMetrics(result);
}

TEST(MotorcycleIsland, IdleSpringOnlyPenetrationAndAnchorsBounded) {
	World world;
	DrivetrainIsland island = buildDrivetrainIsland(world, {false, false, true});

	RunResult result = runSimulation(world, island, kTotalSteps, nullptr);
	assertContactOccurred(result);
	assertFailFirstBounds(result);
	recordIdleMetrics(result);
}

TEST(MotorcycleIsland, IdleGearOnlyPenetrationAndAnchorsBounded) {
	World world;
	DrivetrainIsland island = buildDrivetrainIsland(world, {true, true, false});

	RunResult result = runSimulation(world, island, kTotalSteps, island.engine);
	assertContactOccurred(result);
	assertFailFirstBounds(result);
	recordIdleMetrics(result);
}

TEST(MotorcycleIsland, IdleDrivetrainPenetrationAndAnchorsBounded) {
	World world;
	DrivetrainIsland island = buildDrivetrainIsland(world);

	RunResult result = runSimulation(world, island, kTotalSteps, island.engine);
	assertContactOccurred(result);
	assertFailFirstBounds(result);
	recordIdleMetrics(result);
}

TEST(MotorcycleIsland, ThrottleEngineHingeOnlyDoesNotProgressivelySink) {
	World world;
	DrivetrainIsland island = buildDrivetrainIsland(world, {true, false, false});

	RunResult result = runSimulation(
		world, island, kTotalSteps, island.engine, makeThrottleCallback(island.engine));
	assertContactOccurred(result);
	assertThrottlePenBounds(result);
	recordThrottleMetrics(result);
}

TEST(MotorcycleIsland, ThrottleGearOnlyDoesNotProgressivelySink) {
	World world;
	DrivetrainIsland island = buildDrivetrainIsland(world, {true, true, false});

	RunResult result = runSimulation(
		world, island, kTotalSteps, island.engine, makeThrottleCallback(island.engine));
	assertContactOccurred(result);
	assertThrottlePenBounds(result);
	recordThrottleMetrics(result);
}

TEST(MotorcycleIsland, ThrottleSpringAndEngineNoGearDoesNotProgressivelySink) {
	World world;
	DrivetrainIsland island = buildDrivetrainIsland(world, {true, false, true});

	RunResult result = runSimulation(
		world, island, kTotalSteps, island.engine, makeThrottleCallback(island.engine));
	assertContactOccurred(result);
	assertThrottlePenBounds(result);
	recordThrottleMetrics(result);
}

TEST(MotorcycleIsland, ThrottleDoesNotProgressivelySink) {
	World world;
	DrivetrainIsland island = buildDrivetrainIsland(world);

	RunResult result = runSimulation(
		world, island, kTotalSteps, island.engine, makeThrottleCallback(island.engine));
	assertContactOccurred(result);
	assertThrottlePenBounds(result);
	recordThrottleMetrics(result);
}

TEST(MotorcycleIsland, CauseIsolationRanking) {
	World controlWorld;
	IdleIsland controlIsland = buildIdleLandingIsland(controlWorld);
	RunResult controlResult = runSimulation(controlWorld, controlIsland, kTotalSteps, nullptr);

	World springWorld;
	DrivetrainIsland springIsland = buildDrivetrainIsland(springWorld, {false, false, true});
	RunResult springResult = runSimulation(springWorld, springIsland, kTotalSteps, nullptr);

	World gearWorld;
	DrivetrainIsland gearIsland = buildDrivetrainIsland(gearWorld, {true, true, false});
	RunResult gearResult = runSimulation(gearWorld, gearIsland, kTotalSteps, gearIsland.engine);

	World fullIdleWorld;
	DrivetrainIsland fullIdleIsland = buildDrivetrainIsland(fullIdleWorld);
	RunResult fullIdleResult = runSimulation(
		fullIdleWorld, fullIdleIsland, kTotalSteps, fullIdleIsland.engine);

	World throttleGearWorld;
	DrivetrainIsland throttleGearIsland = buildDrivetrainIsland(throttleGearWorld, {true, true, false});
	RunResult throttleGearResult = runSimulation(
		throttleGearWorld, throttleGearIsland, kTotalSteps, throttleGearIsland.engine,
		makeThrottleCallback(throttleGearIsland.engine));

	World throttleSpringEngineWorld;
	DrivetrainIsland throttleSpringEngineIsland =
		buildDrivetrainIsland(throttleSpringEngineWorld, {true, false, true});
	RunResult throttleSpringEngineResult = runSimulation(
		throttleSpringEngineWorld, throttleSpringEngineIsland, kTotalSteps,
		throttleSpringEngineIsland.engine,
		makeThrottleCallback(throttleSpringEngineIsland.engine));

	World throttleFullWorld;
	DrivetrainIsland throttleFullIsland = buildDrivetrainIsland(throttleFullWorld);
	RunResult throttleFullResult = runSimulation(
		throttleFullWorld, throttleFullIsland, kTotalSteps, throttleFullIsland.engine,
		makeThrottleCallback(throttleFullIsland.engine));

	const float idleControlPen = controlResult.maxPenLastWindow;
	const float idleSpringPen = springResult.maxPenLastWindow;
	const float idleGearPen = gearResult.maxPenLastWindow;
	const float idleFullPen = fullIdleResult.maxPenLastWindow;
	const float throttleGearPen = throttleGearResult.maxPenLastWindow;
	const float throttleSpringEnginePen = throttleSpringEngineResult.maxPenLastWindow;
	const float throttleFullPen = throttleFullResult.maxPenLastWindow;

	::testing::Test::RecordProperty("idle_control_pen", idleControlPen);
	::testing::Test::RecordProperty("idle_spring_pen", idleSpringPen);
	::testing::Test::RecordProperty("idle_gear_pen", idleGearPen);
	::testing::Test::RecordProperty("idle_full_pen", idleFullPen);
	::testing::Test::RecordProperty("throttle_gear_pen", throttleGearPen);
	::testing::Test::RecordProperty("throttle_spring_engine_pen", throttleSpringEnginePen);
	::testing::Test::RecordProperty("throttle_full_pen", throttleFullPen);

	EXPECT_LE(idleControlPen, PENETRATION_SLOP);
	EXPECT_GT(idleFullPen, PENETRATION_SLOP);
	EXPECT_GT(throttleFullPen, idleFullPen + 1.0f);
}
