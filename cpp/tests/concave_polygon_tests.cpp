#include <gtest/gtest.h>
#include <vector>
#include <algorithm>
#include <cmath>
#include "world.h"
#include "body.h"
#include "fixture.h"
#include "vec2.h"
#include "constants.h"
#include "debug.h"

// Helpers to match TypeScript implementation in polygon-utils.ts
static float crossProduct(Vec2 p0, Vec2 p1, Vec2 p2) {
    return (p1.x - p0.x) * (p2.y - p0.y) - (p1.y - p0.y) * (p2.x - p0.x);
}

static std::vector<Vec2> makeStar(int points, float outerRadius, float innerRadius) {
    std::vector<Vec2> vertices;
    for (int i = 0; i < points * 2; i++) {
        float r = (i % 2 == 0) ? outerRadius : innerRadius;
        float angle = (float)i / (points * 2) * M_PI * 2.0f;
        vertices.push_back(Vec2(std::cos(angle) * r, std::sin(angle) * r));
    }
    return vertices;
}

static emscripten_val convertToMockVal(const std::vector<Vec2>& vertices) {
    emscripten_val v;
    v["length"] = (int)vertices.size();
    for (int i = 0; i < (int)vertices.size(); ++i) {
        v[std::to_string(i)]["x"] = vertices[i].x;
        v[std::to_string(i)]["y"] = vertices[i].y;
    }
    return v;
}

TEST(ConcavePolygonTest, StarCollisions) {
    World world;
    world.setGravity(0.0f, 0.0f);
    world.setTimeStep(1.0f / 60.0f);

    // 1. Create a concave star at (0,0)
    emscripten_val bodyOptions;
    bodyOptions["x"] = 0.0f;
    bodyOptions["y"] = 0.0f;
    bodyOptions["type"] = (int)ObjectType::FIXED_OBJECT;
    
    int starId = 1;
    world.createBody(starId, bodyOptions);
    Body* starBody = world.getBody(starId);

    // Decompose star into convex pieces manually
    // A robust way to decompose a star is to create triangles from each edge to the center
    std::vector<Vec2> starVertices = makeStar(5, 5.0f, 2.0f);
    
    for (size_t i = 0; i < starVertices.size(); ++i) {
        std::vector<Vec2> triangle;
        triangle.push_back(Vec2(0.0f, 0.0f));
        triangle.push_back(starVertices[i]);
        triangle.push_back(starVertices[(i + 1) % starVertices.size()]);
        
        emscripten_val fixtureOptions;
        fixtureOptions["shape"] = (int)ObjectShape::POLYGON;
        fixtureOptions["vertices"] = convertToMockVal(triangle);
        fixtureOptions["density"] = 1.0f;
        starBody->createFixture(fixtureOptions);
    }

    starBody->recomputeMassProperties();
    starBody->setPosition(Vec2(0.0f, 0.0f));

    // 2. Place small circles around the tips of the star
    // Tips are at outerRadius (5.0) at angles 0, 2pi/5, 4pi/5, 6pi/5, 8pi/5
    for (int i = 0; i < 5; ++i) {
        float angle = (float)i / 5.0f * M_PI * 2.0f;
        float tipX = std::cos(angle) * 5.0f;
        float tipY = std::sin(angle) * 5.0f;

        // Place a circle slightly overlapping the tip
        emscripten_val circleOptions;
        circleOptions["x"] = tipX * 1.05f; // Slightly outside
        circleOptions["y"] = tipY * 1.05f;
        circleOptions["shape"] = (int)ObjectShape::CIRCLE;
        circleOptions["radius"] = 0.5f;
        circleOptions["type"] = (int)ObjectType::DYNAMIC_OBJECT;
        circleOptions["vx"] = -tipX * 2.0f; // Moving towards center
        circleOptions["vy"] = -tipY * 2.0f;

        world.createBody(10 + i, circleOptions);
    }

    // 3. Step simulation and verify repel
    for (int i = 0; i < 10; ++i) {
        world.step();
    }

    // Verify that circles have been pushed back or at least aren't deep inside
    for (int i = 0; i < 5; ++i) {
        Body* b = world.getBody(10 + i);
        float dist = b->getPosition().magnitude();
        // Since they were moving in, if collision worked, they should be pushed out or stopped.
        // If collision failed, they'd be near the center.
        EXPECT_GT(dist, 4.0f) << "Circle " << i << " penetrated too deep into the star";
    }
}
