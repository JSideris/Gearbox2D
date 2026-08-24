#include <gtest/gtest.h>
#include <vector>
#include <cmath>
#include "world.h"
#include "body.h"
#include "fixture.h"
#include "collision-solver.h"
#include "vec2.h"
#include "constants.h"
#include "debug.h"

namespace {

static emscripten_val convertToMockVal(const std::vector<Vec2>& vertices) {
	emscripten_val v;
	v["length"] = (int)vertices.size();
	for (int i = 0; i < (int)vertices.size(); ++i) {
		v[std::to_string(i)]["x"] = vertices[i].x;
		v[std::to_string(i)]["y"] = vertices[i].y;
	}
	return v;
}

static std::vector<Vec2> unitSquareVertices() {
	return {
		Vec2(-1.0f, -1.0f),
		Vec2(1.0f, -1.0f),
		Vec2(1.0f, 1.0f),
		Vec2(-1.0f, 1.0f),
	};
}

static void createFixedPolygon(World& world, int bodyId) {
	emscripten_val bodyOptions;
	bodyOptions["x"] = 0.0f;
	bodyOptions["y"] = 0.0f;
	bodyOptions["type"] = (int)ObjectType::FIXED_OBJECT;

	world.createBody(bodyId, bodyOptions);
	Body* polyBody = world.getBody(bodyId);

	emscripten_val fixtureOptions;
	fixtureOptions["shape"] = (int)ObjectShape::POLYGON;
	fixtureOptions["vertices"] = convertToMockVal(unitSquareVertices());
	polyBody->createFixture(fixtureOptions);
}

static Body* createDynamicPoint(World& world, int bodyId, float x, float y, float vx) {
	emscripten_val pointOptions;
	pointOptions["x"] = x;
	pointOptions["y"] = y;
	pointOptions["vx"] = vx;
	pointOptions["vy"] = 0.0f;
	pointOptions["mass"] = 1.0f;
	pointOptions["type"] = (int)ObjectType::DYNAMIC_OBJECT;
	pointOptions["canSleep"] = false;
	pointOptions["shape"] = (int)ObjectShape::POINT;
	pointOptions["radius"] = 0.05f;

	world.createBody(bodyId, pointOptions);
	return world.getBody(bodyId);
}

} // namespace

TEST(PolygonPointSatTest, NarrowPhaseNormalPointsOutward) {
	World world;
	world.setGravity(0.0f, 0.0f);
	world.setTimeStep(1.0f / 60.0f);

	createFixedPolygon(world, 1);
	Body* pointBody = createDynamicPoint(world, 2, -0.9f, 0.0f, -5.0f);

	int polyFixtureIdx = world.getBody(1)->fixtures[0]->worldIndex;
	int pointFixtureIdx = pointBody->fixtures[0]->worldIndex;

	// Populate world-space polygon vertices/normals used by _solvePolygonPoint.
	world.step();

	CollisionSolver solver(world);
	ASSERT_TRUE(solver.solve(polyFixtureIdx, pointFixtureIdx, world.getTimeStep()));
	ASSERT_EQ(solver.collisions.size(), 1u);

	Vec2 pointPos = pointBody->getPosition();
	Vec2 centroid(0.0f, 0.0f);
	Vec2 toPoint = pointPos - centroid;
	Vec2 normal = solver.collisions[0].normal;

	EXPECT_GT(normal.dot(toPoint), 0.0f)
		<< "Contact normal must point from polygon toward the point (outward)";
}

TEST(PolygonPointSatTest, StepRepelsPointAwayFromCentroid) {
	World world;
	world.setGravity(0.0f, 0.0f);
	world.setTimeStep(1.0f / 60.0f);

	createFixedPolygon(world, 1);
	Body* pointBody = createDynamicPoint(world, 2, -0.9f, 0.0f, -5.0f);

	const float initialDist = pointBody->getPosition().magnitude();

	for (int i = 0; i < 5; ++i) {
		world.step();
	}

	const float finalDist = pointBody->getPosition().magnitude();
	EXPECT_GE(finalDist, initialDist - 1e-3f)
		<< "Point must not be sucked toward the polygon centroid";
}
