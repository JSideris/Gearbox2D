#include <gtest/gtest.h>
#include "world.h"
#include "body.h"
#include "gear-joint.h"
#include "spring-joint.h"
#include "hinge-joint.h"
#include "solver-data.h"
#include <cmath>

namespace {

constexpr float kDt = 1.0f / 60.0f;
constexpr float kTol = 1e-4f;

emscripten_val makeBoxOptions(float x, float y, float mass, ObjectType type) {
	emscripten_val options;
	options.properties["x"] = x;
	options.properties["y"] = y;
	options.properties["mass"] = mass;
	options.properties["type"] = static_cast<int>(type);
	options.properties["shape"] = static_cast<int>(ObjectShape::BOX);
	options.properties["width"] = 1.0f;
	options.properties["height"] = 1.0f;
	return options;
}

emscripten_val makeCircleOptions(float x, float y, float mass, ObjectType type) {
	emscripten_val options;
	options.properties["x"] = x;
	options.properties["y"] = y;
	options.properties["mass"] = mass;
	options.properties["type"] = static_cast<int>(type);
	options.properties["shape"] = static_cast<int>(ObjectShape::CIRCLE);
	options.properties["radius"] = 0.5f;
	return options;
}

struct GearSolveSnapshot {
	SolverData sA;
	SolverData sB;
	SolverData sC;
	SolverData sD;
};

void wireGearContext(GearJoint* gear, SolverData& sA, SolverData& sB, SolverData& sC, SolverData& sD) {
	gear->context.a = &sA;
	gear->context.b = &sB;
	gear->context.c = &sC;
	gear->context.d = &sD;
}

GearJoint* createGearAssembly(
	World& world,
	int baseId,
	bool fixedEngineWheel,
	bool fixedDrivenWheel,
	float ratio,
	float wA, float wB, float wC, float wD) {
	const int staticId = baseId;
	const int engineId = baseId + 1;
	const int drivenId = baseId + 2;
	const int hinge1Id = baseId + 10;
	const int hinge2Id = baseId + 11;
	const int gearId = baseId + 20;

	world.createBody(staticId, makeBoxOptions(0.0f, 0.0f, 0.0f, ObjectType::FIXED_OBJECT));
	world.createBody(
		engineId,
		makeBoxOptions(1.0f, 0.0f, fixedEngineWheel ? 0.0f : 1.0f,
			fixedEngineWheel ? ObjectType::FIXED_OBJECT : ObjectType::DYNAMIC_OBJECT));
	world.createBody(
		drivenId,
		makeBoxOptions(-1.0f, 0.0f, fixedDrivenWheel ? 0.0f : 1.0f,
			fixedDrivenWheel ? ObjectType::FIXED_OBJECT : ObjectType::DYNAMIC_OBJECT));

	world.createHingeJoint(hinge1Id, staticId, engineId, 0.0f, 0.0f, 0.0f, 0.0f);
	world.createHingeJoint(hinge2Id, staticId, drivenId, 0.0f, 0.0f, 0.0f, 0.0f);
	world.createGearJoint(gearId, hinge1Id, hinge2Id, ratio);

	GearJoint* gear = static_cast<GearJoint*>(world.getJoint(gearId));
	gear->preSolve(kDt);

	gear->joint1->bodyA->setAngularVelocity(wA);
	gear->joint1->bodyB->setAngularVelocity(wB);
	gear->joint2->bodyA->setAngularVelocity(wC);
	gear->joint2->bodyB->setAngularVelocity(wD);

	return gear;
}

GearSolveSnapshot captureGearState(GearJoint* gear) {
	GearSolveSnapshot snap;
	snap.sA = gear->joint1->bodyA->getSolverData();
	snap.sB = gear->joint1->bodyB->getSolverData();
	snap.sC = gear->joint2->bodyA->getSolverData();
	snap.sD = gear->joint2->bodyB->getSolverData();
	return snap;
}

GearSolveSnapshot runGearScalar(GearJoint* gear, const GearSolveSnapshot& initial) {
	wireGearContext(gear,
		const_cast<SolverData&>(initial.sA),
		const_cast<SolverData&>(initial.sB),
		const_cast<SolverData&>(initial.sC),
		const_cast<SolverData&>(initial.sD));
	gear->solveFast();
	GearSolveSnapshot out;
	out.sA = *static_cast<SolverData*>(gear->context.a);
	out.sB = *static_cast<SolverData*>(gear->context.b);
	out.sC = *static_cast<SolverData*>(gear->context.c);
	out.sD = *static_cast<SolverData*>(gear->context.d);
	return out;
}

struct SpringBodySnapshot {
	float vAx;
	float vAy;
	float wA;
	float vBx;
	float vBy;
	float wB;
};

struct SpringSolveSnapshot {
	SolverData sA;
	SolverData sB;
};

SpringJoint* createSpringPair(
	World& world,
	int baseId,
	float frequencyHz,
	float anchorBx,
	float armSpin) {
	const int fixedId = baseId;
	const int dynamicId = baseId + 1;
	const int springId = baseId + 10;

	world.createBody(fixedId, makeBoxOptions(0.0f, 0.0f, 0.0f, ObjectType::FIXED_OBJECT));
	world.createBody(dynamicId, makeCircleOptions(2.0f, 0.0f, 1.0f, ObjectType::DYNAMIC_OBJECT));
	world.getBody(dynamicId)->setAngularVelocity(armSpin);

	world.createSpringJoint(
		springId, fixedId, dynamicId,
		0.0f, 0.0f, anchorBx, 0.0f,
		2.0f, frequencyHz, 0.8f);

	return static_cast<SpringJoint*>(world.getJoint(springId));
}

SpringBodySnapshot captureSpringBodies(SpringJoint* spring) {
	SpringBodySnapshot snap;
	Body* bodyA = spring->bodyA;
	Body* bodyB = spring->bodyB;
	snap.vAx = bodyA->getVelocity().x;
	snap.vAy = bodyA->getVelocity().y;
	snap.wA = bodyA->getAngularVelocity();
	snap.vBx = bodyB->getVelocity().x;
	snap.vBy = bodyB->getVelocity().y;
	snap.wB = bodyB->getAngularVelocity();
	return snap;
}

SpringSolveSnapshot captureSpringSolveState(SpringJoint* spring) {
	SpringSolveSnapshot snap;
	snap.sA = spring->bodyA->getSolverData();
	snap.sB = spring->bodyB->getSolverData();
	return snap;
}

SpringSolveSnapshot runSpringScalar(SpringJoint* spring, const SpringSolveSnapshot& initial) {
	spring->context.a = const_cast<SolverData*>(&initial.sA);
	spring->context.b = const_cast<SolverData*>(&initial.sB);
	spring->solveFast();
	SpringSolveSnapshot out;
	out.sA = *static_cast<SolverData*>(spring->context.a);
	out.sB = *static_cast<SolverData*>(spring->context.b);
	return out;
}

void expectSpringBodiesNear(const SpringBodySnapshot& a, const SpringBodySnapshot& b, int lane) {
	EXPECT_NEAR(a.vAx, b.vAx, kTol) << "lane " << lane;
	EXPECT_NEAR(a.vAy, b.vAy, kTol) << "lane " << lane;
	EXPECT_NEAR(a.wA, b.wA, kTol) << "lane " << lane;
	EXPECT_NEAR(a.vBx, b.vBx, kTol) << "lane " << lane;
	EXPECT_NEAR(a.vBy, b.vBy, kTol) << "lane " << lane;
	EXPECT_NEAR(a.wB, b.wB, kTol) << "lane " << lane;
}

} // namespace

TEST(JointSimdParity, GearSolveFastMatchesScalar) {
	const float ratios[4] = { 2.0f, 2.0f, 2.0f, 0.0f };
	const bool fixedEngine[4] = { false, true, false, false };
	const bool fixedDriven[4] = { false, false, true, false };
	const float wInit[4][4] = {
		{ 0.2f, 1.5f, -0.3f, 3.0f },
		{ -1.0f, 0.0f, 0.4f, 2.5f },
		{ 0.5f, 2.0f, -0.2f, 0.0f },
		{ 1.0f, -0.5f, 0.25f, -1.5f },
	};

	GearSolveSnapshot initial[4];
	GearSolveSnapshot scalarOut[4];
	World scalarWorlds[4];
	GearJoint* scalarGears[4];

	for (int i = 0; i < 4; ++i) {
		scalarGears[i] = createGearAssembly(
			scalarWorlds[i], 100, fixedEngine[i], fixedDriven[i], ratios[i],
			wInit[i][0], wInit[i][1], wInit[i][2], wInit[i][3]);
		initial[i] = captureGearState(scalarGears[i]);
		const GearSolveSnapshot input = initial[i];
		scalarOut[i] = runGearScalar(scalarGears[i], input);
	}

	World simdWorld;
	GearJoint* simdGears[4];
	for (int i = 0; i < 4; ++i) {
		simdGears[i] = createGearAssembly(
			simdWorld, 200 + i * 30, fixedEngine[i], fixedDriven[i], ratios[i],
			wInit[i][0], wInit[i][1], wInit[i][2], wInit[i][3]);
		wireGearContext(simdGears[i],
			const_cast<SolverData&>(initial[i].sA),
			const_cast<SolverData&>(initial[i].sB),
			const_cast<SolverData&>(initial[i].sC),
			const_cast<SolverData&>(initial[i].sD));
	}
	GearJoint::solveFastSIMD(simdGears);

	for (int i = 0; i < 4; ++i) {
		EXPECT_NEAR(static_cast<SolverData*>(simdGears[i]->context.a)->w, scalarOut[i].sA.w, kTol) << "lane " << i;
		EXPECT_NEAR(static_cast<SolverData*>(simdGears[i]->context.b)->w, scalarOut[i].sB.w, kTol) << "lane " << i;
		EXPECT_NEAR(static_cast<SolverData*>(simdGears[i]->context.c)->w, scalarOut[i].sC.w, kTol) << "lane " << i;
		EXPECT_NEAR(static_cast<SolverData*>(simdGears[i]->context.d)->w, scalarOut[i].sD.w, kTol) << "lane " << i;
	}
}

TEST(JointSimdParity, SpringPreSolveMatchesScalar) {
	const float frequencies[4] = { 25.0f, 25.0f, 25.0f, 0.0f };
	const float armSpins[4] = { 0.0f, 50.0f, 250.0f, 0.0f };
	const float anchorBx[4] = { 0.0f, 0.2f, -0.3f, 0.1f };

	World scalarWorld;
	SpringJoint* scalarSprings[4];
	for (int i = 0; i < 4; ++i) {
		scalarSprings[i] = createSpringPair(scalarWorld, 200 + i * 20, frequencies[i], anchorBx[i], armSpins[i]);
	}

	SpringBodySnapshot scalarOut[4];
	for (int i = 0; i < 4; ++i) {
		scalarSprings[i]->preSolve(kDt);
		scalarOut[i] = captureSpringBodies(scalarSprings[i]);
	}

	World simdWorld;
	SpringJoint* simdSprings[4];
	for (int i = 0; i < 4; ++i) {
		simdSprings[i] = createSpringPair(simdWorld, 300 + i * 20, frequencies[i], anchorBx[i], armSpins[i]);
	}
	SpringJoint::preSolveSIMD(simdSprings, kDt);

	for (int i = 0; i < 4; ++i) {
		expectSpringBodiesNear(captureSpringBodies(simdSprings[i]), scalarOut[i], i);
	}
}

TEST(JointSimdParity, SpringSolveFastMatchesScalar) {
	const float frequencies[4] = { 25.0f, 25.0f, 0.0f, 25.0f };
	const float armSpins[4] = { 10.0f, 120.0f, 0.0f, 80.0f };

	SpringSolveSnapshot initial[4];
	SpringSolveSnapshot scalarOut[4];
	World scalarWorlds[4];
	SpringJoint* scalarSprings[4];

	for (int i = 0; i < 4; ++i) {
		scalarSprings[i] = createSpringPair(scalarWorlds[i], 400 + i * 20, frequencies[i], 0.0f, armSpins[i]);
		scalarSprings[i]->preSolve(kDt);
		initial[i] = captureSpringSolveState(scalarSprings[i]);
		initial[i].sA.v.x += 0.3f * static_cast<float>(i);
		initial[i].sB.v.y -= 0.2f * static_cast<float>(i);
		initial[i].sA.w += 0.1f;
		initial[i].sB.w = armSpins[i];
		const SpringSolveSnapshot input = initial[i];
		scalarOut[i] = runSpringScalar(scalarSprings[i], input);
	}

	World simdWorld;
	SpringJoint* simdSprings[4];
	for (int i = 0; i < 4; ++i) {
		simdSprings[i] = createSpringPair(simdWorld, 500 + i * 20, frequencies[i], 0.0f, armSpins[i]);
		simdSprings[i]->preSolve(kDt);
		simdSprings[i]->context.a = const_cast<SolverData*>(&initial[i].sA);
		simdSprings[i]->context.b = const_cast<SolverData*>(&initial[i].sB);
	}
	SpringJoint::solveFastSIMD(simdSprings);

	for (int i = 0; i < 4; ++i) {
		EXPECT_NEAR(static_cast<SolverData*>(simdSprings[i]->context.a)->v.x, scalarOut[i].sA.v.x, kTol) << "lane " << i;
		EXPECT_NEAR(static_cast<SolverData*>(simdSprings[i]->context.a)->v.y, scalarOut[i].sA.v.y, kTol) << "lane " << i;
		EXPECT_NEAR(static_cast<SolverData*>(simdSprings[i]->context.a)->w, scalarOut[i].sA.w, kTol) << "lane " << i;
		EXPECT_NEAR(static_cast<SolverData*>(simdSprings[i]->context.b)->v.x, scalarOut[i].sB.v.x, kTol) << "lane " << i;
		EXPECT_NEAR(static_cast<SolverData*>(simdSprings[i]->context.b)->v.y, scalarOut[i].sB.v.y, kTol) << "lane " << i;
		EXPECT_NEAR(static_cast<SolverData*>(simdSprings[i]->context.b)->w, scalarOut[i].sB.w, kTol) << "lane " << i;
	}
}

TEST(JointSimdParity, FourSoftSpringsWorldStepStaysFinite) {
	World world;
	world.setGravity(0.0f, 10.0f);
	world.setTimeStep(kDt);

	world.createBody(1, makeBoxOptions(0.0f, 5.0f, 0.0f, ObjectType::FIXED_OBJECT));
	world.createBody(2, makeBoxOptions(-3.0f, 0.0f, 0.0f, ObjectType::FIXED_OBJECT));

	for (int i = 0; i < 4; ++i) {
		const int ballId = 10 + i;
		world.createBody(ballId, makeCircleOptions(0.5f + static_cast<float>(i), 3.0f, 1.0f, ObjectType::DYNAMIC_OBJECT));
		world.createSpringJoint(
			100 + i, 1, ballId,
			0.0f, 0.0f, 0.0f, 0.0f,
			3.5f, 25.0f, 0.8f);
	}

	for (int step = 0; step < 30; ++step) {
		world.step();
		for (int i = 0; i < 4; ++i) {
			Body* ball = world.getBody(10 + i);
			EXPECT_TRUE(std::isfinite(ball->getX()));
			EXPECT_TRUE(std::isfinite(ball->getY()));
			EXPECT_TRUE(std::isfinite(ball->getAngularVelocity()));
		}
	}
}
