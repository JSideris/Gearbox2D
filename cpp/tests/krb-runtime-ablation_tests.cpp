#include <gtest/gtest.h>
#include "world.h"
#include "body.h"
#include "fixture.h"
#include <cmath>

namespace {

emscripten_val bodyOptions(float x, float y, float mass) {
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

float floorBounceEnergyRatio(bool krbOn, int steps) {
	const float gy = 10.0f;
	const float mass = 1.0f;
	const float startY = 0.0f;
	const float floorY = 10.0f;
	const float floorH = 1.0f;
	const float radius = 0.5f;
	const float yContact = floorY - floorH / 2.0f - radius;

	World world;
	world.setHasKrb(krbOn);
	world.setGravity(0.0f, gy);
	world.setTimeStep(1.0f / 60.0f);

	emscripten_val floor = bodyOptions(0.0f, floorY, 0.0f);
	floor.properties["type"] = (int)ObjectType::FIXED_OBJECT;
	floor.properties["width"] = 20.0f;
	floor.properties["height"] = floorH;
	floor.properties["restitution"] = 1.0f;
	world.createBody(1, floor);

	emscripten_val ballOpts = bodyOptions(0.0f, startY, mass);
	ballOpts.properties["shape"] = (int)ObjectShape::CIRCLE;
	ballOpts.properties["radius"] = radius;
	ballOpts.properties["restitution"] = 1.0f;
	ballOpts.properties["sFriction"] = 0.0f;
	ballOpts.properties["kFriction"] = 0.0f;
	ballOpts.properties["linearDamping"] = 0.0f;
	ballOpts.properties["angularDamping"] = 0.0f;
	ballOpts.properties["canSleep"] = false;
	world.createBody(2, ballOpts);

	Body* ball = world.getBody(2);
	if (ball == nullptr) {
		return 0.0f;
	}

	const float e0 = mass * gy * (yContact - startY);
	for (int i = 0; i < steps; ++i) {
		world.step();
	}

	const float vx = ball->getVelocityX();
	const float vy = ball->getVelocityY();
	const float ke = 0.5f * mass * (vx * vx + vy * vy);
	const float pe = mass * gy * (yContact - ball->getY());
	return e0 > 0.0f ? (ke + pe) / e0 : 0.0f;
}

} // namespace

TEST(KrbRuntimeAblation, FloorBounceOffGainsRelativeToOn) {
#ifdef GEARBOX_DISABLE_KRB
	GTEST_SKIP() << "compile-time KRB off; runtime flag is a no-op";
#else
	const float on = floorBounceEnergyRatio(true, 300);
	const float off = floorBounceEnergyRatio(false, 300);
	EXPECT_NEAR(on, 1.0f, 0.2f) << "KRB on should stay near E/E0 = 1";
	EXPECT_GT(off, on + 0.05f) << "KRB off must gain energy relative to KRB on";
#endif
}
