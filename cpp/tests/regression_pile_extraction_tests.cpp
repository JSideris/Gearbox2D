#include <gtest/gtest.h>
#define private public
#include "world.h"
#undef private
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

// Frozen after Phase 2 measurement on HEAD (4dec47bb+).
constexpr float kMinConeBudgetDelta = 0.05f;
constexpr float kMinSpringCapDelta = 0.03f;
constexpr float kSpringCapEpsilon = 0.01f;
constexpr bool kSideNormalDominance = true; // |normal.x| > |normal.y| => side (lift is tangent)

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

struct ContactTotals {
	int overlappingContactCount = 0;
	int contactPointCount = 0;
	float sumAbsNormalImpulse = 0.0f;
	float sumAbsFrictionImpulse = 0.0f;
	float sumConeBudget = 0.0f;
	float floorSumAbsNormalImpulse = 0.0f;
	float floorSumAbsFrictionImpulse = 0.0f;
	float floorSumConeBudget = 0.0f;
	float sideSumAbsNormalImpulse = 0.0f;
	float sideSumAbsFrictionImpulse = 0.0f;
	float sideSumConeBudget = 0.0f;
};

struct CouplingSnapshot {
	float displacement = 0.0f;
	int neighborsAtPullStart = 0;
	float springImpulseProxy = 0.0f;
	float springImpulseDuringPull = 0.0f;
	ContactTotals contactsAtSettle;
	ContactTotals contactsDuringPull;
};

static bool isSideContact(const ContactConstraint& contact) {
	return kSideNormalDominance
		? std::abs(contact.normal.x) > std::abs(contact.normal.y)
		: std::abs(contact.normal.y) > std::abs(contact.normal.x);
}

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

static ContactTotals snapshotContactTotals(World& world, int draggedBodyId) {
	ContactTotals totals;
	for (const ContactConstraint& contact : world.contactConstraints) {
		if (!contact.a || !contact.b) {
			continue;
		}
		if (contact.a->getId() != draggedBodyId && contact.b->getId() != draggedBodyId) {
			continue;
		}
		if (contact.depth < 0.0f) {
			continue;
		}

		++totals.overlappingContactCount;
		++totals.contactPointCount;

		const float absNormalImpulse = std::abs(contact.normalImpulse);
		const float absFrictionImpulse = std::abs(contact.frictionImpulse);
		const float coneBudget = contact.staticFriction * contact.normalImpulse;

		totals.sumAbsNormalImpulse += absNormalImpulse;
		totals.sumAbsFrictionImpulse += absFrictionImpulse;
		totals.sumConeBudget += coneBudget;

		if (isSideContact(contact)) {
			totals.sideSumAbsNormalImpulse += absNormalImpulse;
			totals.sideSumAbsFrictionImpulse += absFrictionImpulse;
			totals.sideSumConeBudget += coneBudget;
		} else {
			totals.floorSumAbsNormalImpulse += absNormalImpulse;
			totals.floorSumAbsFrictionImpulse += absFrictionImpulse;
			totals.floorSumConeBudget += coneBudget;
		}
	}
	return totals;
}

static float snapshotSpringImpulseProxy(World& world) {
	Joint* joint = world.getJoint(kSpringId);
	if (!joint) {
		return 0.0f;
	}
	const float invDt = 1.0f / kDt;
	return joint->getReactionForce(invDt).magnitude() / invDt;
}

static CouplingSnapshot runExtractionSceneWithSnapshot(int neighborCount, const float positions[][2]) {
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
	const ContactTotals contactsAtSettle = snapshotContactTotals(world, kDraggedId);

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

	ContactTotals contactsDuringPull;
	float springImpulseDuringPull = 0.0f;
	for (int step = 0; step < kPullSteps; ++step) {
		world.step();
		if (step == 0) {
			contactsDuringPull = snapshotContactTotals(world, kDraggedId);
			springImpulseDuringPull = snapshotSpringImpulseProxy(world);
		}
	}

	CouplingSnapshot snapshot;
	snapshot.displacement = y0 - target->getY();
	snapshot.neighborsAtPullStart = neighborsAtPullStart;
	snapshot.springImpulseProxy = snapshotSpringImpulseProxy(world);
	snapshot.springImpulseDuringPull = springImpulseDuringPull;
	snapshot.contactsAtSettle = contactsAtSettle;
	snapshot.contactsDuringPull = contactsDuringPull;
	return snapshot;
}

static ExtractionResult runExtractionScene(int neighborCount, const float positions[][2]) {
	const CouplingSnapshot snapshot = runExtractionSceneWithSnapshot(neighborCount, positions);
	ExtractionResult result;
	result.displacement = snapshot.displacement;
	result.neighborsAtPullStart = snapshot.neighborsAtPullStart;
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

TEST(RegressionPileExtractionTest, CouplingSplitOnFrozenCross4Y) {
	const CouplingSnapshot isolated = runExtractionSceneWithSnapshot(0, kCrossNeighborPositions);
	const CouplingSnapshot oneNeighbor = runExtractionSceneWithSnapshot(1, kOneNeighborPosition);
	const CouplingSnapshot fourNeighbors = runExtractionSceneWithSnapshot(4, kCrossNeighborPositions);

	EXPECT_GE(isolated.contactsAtSettle.overlappingContactCount, 1)
		<< "Isolated body should rest on the floor with overlapping contact";

	EXPECT_GT(fourNeighbors.contactsAtSettle.overlappingContactCount,
		isolated.contactsAtSettle.overlappingContactCount)
		<< "Four-neighbor pile should have more overlapping contacts than isolated at settle";

	EXPECT_GE(fourNeighbors.neighborsAtPullStart, 4)
		<< "Four-neighbor scene must retain four geometric neighbors at pull start";

	EXPECT_GT(fourNeighbors.contactsAtSettle.sumConeBudget,
		isolated.contactsAtSettle.sumConeBudget + kMinConeBudgetDelta)
		<< "Total friction cone budget should grow materially with packed neighbors";

	EXPECT_GT(fourNeighbors.contactsAtSettle.sideSumConeBudget,
		isolated.contactsAtSettle.sideSumConeBudget)
		<< "Packed neighbors should add side friction cone budget";

	EXPECT_GT(isolated.springImpulseDuringPull, 0.0f);
	EXPECT_GT(fourNeighbors.springImpulseDuringPull, 0.0f);
	EXPECT_GT(oneNeighbor.springImpulseDuringPull, 0.0f);

	EXPECT_GE(fourNeighbors.springImpulseDuringPull, MAX_POSITION_CORRECTION - kSpringCapEpsilon)
		<< "Packed case should hit the spring weaken cap on the first pull step";

	EXPECT_GE(isolated.springImpulseDuringPull, MAX_POSITION_CORRECTION - kSpringCapEpsilon)
		<< "Isolated case also hits the cap on the first pull step when anchor jumps";

	EXPECT_GT(isolated.springImpulseProxy, 0.0f);
	EXPECT_GT(fourNeighbors.springImpulseProxy, 0.0f);

	EXPECT_GE(fourNeighbors.springImpulseProxy, MAX_POSITION_CORRECTION - kSpringCapEpsilon)
		<< "Packed case should remain at the spring weaken cap after pull";

	EXPECT_LT(isolated.springImpulseProxy, MAX_POSITION_CORRECTION - kSpringCapEpsilon)
		<< "Isolated case should relax below the spring weaken cap after extraction";

	EXPECT_GT(fourNeighbors.springImpulseProxy,
		isolated.springImpulseProxy + kMinSpringCapDelta)
		<< "Packed spring impulse should exceed isolated after pull";

	EXPECT_GT(std::abs(oneNeighbor.displacement), std::abs(fourNeighbors.displacement))
		<< "One-neighbor pull should remain easier than four-neighbor pull";
}
