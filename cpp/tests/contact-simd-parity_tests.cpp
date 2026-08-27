#include <gtest/gtest.h>
#include "world.h"
#include "body.h"
#include "fixture.h"
#include "constants.h"
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

struct ContactPreSolveSnapshot {
	float bias;
	float krbPositionScale;
	float normalMass;
	float tangentMass;
	float normalImpulse;
};

struct ContactSolveSnapshot {
	SolverData sA;
	SolverData sB;
	float normalImpulse;
	float frictionImpulse;
};

void configureContactWorld(World& world) {
	world.setTimeStep(kDt);
	world.setGravity(0.0f, 9.81f);
	world.setHasRestitution(true);
	world.setHasFriction(true);
}

void stampSupportedWake(Body* a, Body* b) {
	a->sleptOnSupport = true;
	b->sleptOnSupport = true;
	a->timeSinceWake = 0.0f;
	b->timeSinceWake = 0.0f;
}

ContactConstraint makeContact(
	Body* dynamicA,
	Body* otherB,
	float depth,
	float restitution,
	float staticFriction,
	float kineticFriction) {
	ContactConstraint c;
	c.a = dynamicA;
	c.b = otherB;
	c.fA = dynamicA->fixtures.empty() ? nullptr : dynamicA->fixtures[0];
	c.fB = otherB->fixtures.empty() ? nullptr : otherB->fixtures[0];
	c.point = Vec2(dynamicA->getX(), dynamicA->getY() - 0.5f);
	c.normal = Vec2(0.0f, 1.0f);
	c.depth = depth;
	c.restitution = restitution;
	c.staticFriction = staticFriction;
	c.kineticFriction = kineticFriction;
	c.normalImpulse = 0.0f;
	c.frictionImpulse = 0.0f;
	return c;
}

ContactPreSolveSnapshot capturePreSolve(const ContactConstraint& c) {
	ContactPreSolveSnapshot snap;
	snap.bias = c.bias;
	snap.krbPositionScale = c.krbPositionScale;
	snap.normalMass = c.normalMass;
	snap.tangentMass = c.tangentMass;
	snap.normalImpulse = c.normalImpulse;
	return snap;
}

void expectPreSolveNear(const ContactPreSolveSnapshot& scalar, const ContactPreSolveSnapshot& simd, int lane) {
	EXPECT_NEAR(scalar.bias, simd.bias, kTol) << "lane " << lane << " bias";
	EXPECT_NEAR(scalar.krbPositionScale, simd.krbPositionScale, kTol) << "lane " << lane << " krb";
	EXPECT_NEAR(scalar.normalMass, simd.normalMass, kTol) << "lane " << lane << " normalMass";
	EXPECT_NEAR(scalar.tangentMass, simd.tangentMass, kTol) << "lane " << lane << " tangentMass";
	EXPECT_NEAR(scalar.normalImpulse, simd.normalImpulse, kTol) << "lane " << lane << " normalImpulse";
}

ContactSolveSnapshot runContactScalar(ContactConstraint& c, const ContactSolveSnapshot& initial) {
	c.context.a = const_cast<SolverData*>(&initial.sA);
	c.context.b = const_cast<SolverData*>(&initial.sB);
	c.normalImpulse = initial.normalImpulse;
	c.frictionImpulse = initial.frictionImpulse;
	c.rA = c.point - c.a->getPosition();
	c.rB = c.point - c.b->getPosition();
	c.solveFast();
	ContactSolveSnapshot out;
	out.sA = *static_cast<SolverData*>(c.context.a);
	out.sB = *static_cast<SolverData*>(c.context.b);
	out.normalImpulse = c.normalImpulse;
	out.frictionImpulse = c.frictionImpulse;
	return out;
}

void expectSolveNear(const ContactSolveSnapshot& scalar, const ContactSolveSnapshot& simd, int lane) {
	EXPECT_NEAR(scalar.sA.v.x, simd.sA.v.x, kTol) << "lane " << lane << " vAx";
	EXPECT_NEAR(scalar.sA.v.y, simd.sA.v.y, kTol) << "lane " << lane << " vAy";
	EXPECT_NEAR(scalar.sA.w, simd.sA.w, kTol) << "lane " << lane << " wA";
	EXPECT_NEAR(scalar.sB.v.x, simd.sB.v.x, kTol) << "lane " << lane << " vBx";
	EXPECT_NEAR(scalar.sB.v.y, simd.sB.v.y, kTol) << "lane " << lane << " vBy";
	EXPECT_NEAR(scalar.sB.w, simd.sB.w, kTol) << "lane " << lane << " wB";
	EXPECT_NEAR(scalar.normalImpulse, simd.normalImpulse, kTol) << "lane " << lane << " nImp";
	EXPECT_NEAR(scalar.frictionImpulse, simd.frictionImpulse, kTol) << "lane " << lane << " fImp";
}

void setupSimdLane(World& world, int lane, ContactConstraint& c) {
	const int floorId = 100 + lane * 10;
	const int bodyId = floorId + 1;

	world.createBody(floorId, makeBoxOptions(0.0f, 0.0f, 0.0f, ObjectType::FIXED_OBJECT));

	if (lane == 3) {
		world.createBody(bodyId, makeBoxOptions(0.5f, 1.0f, 1.0f, ObjectType::DYNAMIC_OBJECT));
		Body* a = world.getBody(floorId);
		Body* b = world.getBody(bodyId);
		a->setVelocity(Vec2(0.0f, 0.3f));
		b->setVelocity(Vec2(0.0f, -0.2f));
		stampSupportedWake(a, b);
		c = makeContact(a, b, 0.012f, 0.2f, 0.5f, 0.3f);
		return;
	}

	world.createBody(bodyId, makeBoxOptions(0.0f, 1.0f, 1.0f, ObjectType::DYNAMIC_OBJECT));
	Body* dynamic = world.getBody(bodyId);
	Body* floor = world.getBody(floorId);

	if (lane == 0) {
		dynamic->setVelocity(Vec2(0.0f, 0.4f));
		stampSupportedWake(dynamic, floor);
		c = makeContact(dynamic, floor, 0.012f, 0.2f, 0.5f, 0.3f);
	} else if (lane == 1) {
		dynamic->setVelocity(Vec2(0.0f, 0.5f));
		dynamic->timeSinceWake = 1e9f;
		dynamic->sleptOnSupport = false;
		floor->timeSinceWake = 1e9f;
		floor->sleptOnSupport = false;
		c = makeContact(dynamic, floor, 0.012f, 0.2f, 0.5f, 0.3f);
	} else if (lane == 2) {
		dynamic->setVelocity(Vec2(0.0f, -0.1f));
		stampSupportedWake(dynamic, floor);
		c = makeContact(dynamic, floor, -0.008f, 0.2f, 0.0f, 0.0f);
	}
}

void setupScalarLane(World& world, int lane, ContactConstraint& c) {
	setupSimdLane(world, lane, c);
}

} // namespace

TEST(ContactSimdParity, PreSolveSupportedWakeOverlapMatchesScalar) {
	ContactConstraint simdContacts[4];
	World simdWorld;
	configureContactWorld(simdWorld);
	for (int i = 0; i < 4; ++i) {
		setupSimdLane(simdWorld, i, simdContacts[i]);
	}

	ContactPreSolveSnapshot scalarOut[4];
	for (int i = 0; i < 4; ++i) {
		World scalarWorld;
		configureContactWorld(scalarWorld);
		ContactConstraint scalarContact;
		setupScalarLane(scalarWorld, i, scalarContact);
		scalarContact.preSolve(kDt, true, true, true);
		scalarOut[i] = capturePreSolve(scalarContact);
		if (i == 1) {
			EXPECT_NE(scalarOut[i].bias, 0.0f) << "lane 1 must take bounce path";
		}
		if (i == 0 || i == 2) {
			EXPECT_NEAR(scalarOut[i].bias, 0.0f, kTol) << "supported wake lane " << i;
		}
		if (i == 0) {
			EXPECT_NEAR(scalarOut[i].krbPositionScale, 0.0f, kTol) << "supported overlap lane " << i;
		}
	}

	ContactConstraint* batch[4] = {
		&simdContacts[0], &simdContacts[1], &simdContacts[2], &simdContacts[3]
	};
	ContactConstraint::preSolveSIMD(batch, kDt, true, true, true);

	for (int i = 0; i < 4; ++i) {
		expectPreSolveNear(scalarOut[i], capturePreSolve(simdContacts[i]), i);
	}
}

TEST(ContactSimdParity, SolveFastSupportedWakeOverlapMatchesScalar) {
	ContactConstraint simdContacts[4];
	World simdWorld;
	configureContactWorld(simdWorld);
	for (int i = 0; i < 4; ++i) {
		setupSimdLane(simdWorld, i, simdContacts[i]);
	}

	ContactPreSolveSnapshot scalarPre[4];
	ContactSolveSnapshot scalarOut[4];
	ContactSolveSnapshot initial[4];

	for (int i = 0; i < 4; ++i) {
		World scalarWorld;
		configureContactWorld(scalarWorld);
		ContactConstraint scalarContact;
		setupScalarLane(scalarWorld, i, scalarContact);
		scalarContact.preSolve(kDt, true, true, true);
		scalarPre[i] = capturePreSolve(scalarContact);

		initial[i].sA = scalarContact.a->getSolverData();
		initial[i].sB = scalarContact.b->getSolverData();
		initial[i].sA.v.x += 0.15f * static_cast<float>(i);
		initial[i].sB.v.y -= 0.1f * static_cast<float>(i);
		initial[i].sA.w = 0.2f;
		initial[i].sB.w = -0.15f;
		initial[i].normalImpulse = 0.05f * static_cast<float>(i);
		initial[i].frictionImpulse = 0.0f;

		const ContactSolveSnapshot input = initial[i];
		scalarOut[i] = runContactScalar(scalarContact, input);
	}

	ContactConstraint* batch[4] = {
		&simdContacts[0], &simdContacts[1], &simdContacts[2], &simdContacts[3]
	};
	ContactConstraint::preSolveSIMD(batch, kDt, true, true, true);

	for (int i = 0; i < 4; ++i) {
		EXPECT_NEAR(simdContacts[i].bias, scalarPre[i].bias, kTol) << "lane " << i;
		simdContacts[i].context.a = const_cast<SolverData*>(&initial[i].sA);
		simdContacts[i].context.b = const_cast<SolverData*>(&initial[i].sB);
		simdContacts[i].normalImpulse = initial[i].normalImpulse;
		simdContacts[i].frictionImpulse = initial[i].frictionImpulse;
		simdContacts[i].rA = simdContacts[i].point - simdContacts[i].a->getPosition();
		simdContacts[i].rB = simdContacts[i].point - simdContacts[i].b->getPosition();
	}

	ContactConstraint::solveFastSIMD(batch);

	for (int i = 0; i < 4; ++i) {
		ContactSolveSnapshot simdOut;
		simdOut.sA = *static_cast<SolverData*>(simdContacts[i].context.a);
		simdOut.sB = *static_cast<SolverData*>(simdContacts[i].context.b);
		simdOut.normalImpulse = simdContacts[i].normalImpulse;
		simdOut.frictionImpulse = simdContacts[i].frictionImpulse;
		expectSolveNear(scalarOut[i], simdOut, i);
	}
}
