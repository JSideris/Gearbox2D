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

static bool segmentsIntersect(Vec2 a, Vec2 b, Vec2 c, Vec2 d) {
    float det = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x);
    if (std::abs(det) < 1e-6f) return false;

    float u = ((c.x - a.x) * (d.y - c.y) - (c.y - a.y) * (d.x - c.x)) / det;
    float v = ((c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x)) / det;

    return u > 0 && u < 1 && v > 0 && v < 1;
}

static bool isVisible(const std::vector<Vec2>& vertices, int idx1, int idx2) {
    Vec2 p1 = vertices[idx1];
    Vec2 p2 = vertices[idx2];
    int n = (int)vertices.size();

    for (int i = 0; i < n; i++) {
        Vec2 v1 = vertices[i];
        Vec2 v2 = vertices[(i + 1) % n];

        if (i == idx1 || i == idx2 || (i + 1) % n == idx1 || (i + 1) % n == idx2) continue;

        if (segmentsIntersect(p1, p2, v1, v2)) {
            return false;
        }
    }
    return true;
}

static std::vector<std::vector<Vec2>> decompose(std::vector<Vec2> vertices) {
    int n = (int)vertices.size();
    if (n < 3) return {};

    // 1. Ensure CCW order
    float area = 0;
    for (int i = 0; i < n; i++) {
        Vec2 p1 = vertices[i];
        Vec2 p2 = vertices[(i + 1) % n];
        area += (p1.x * p2.y - p2.x * p1.y);
    }
    if (area < 0) {
        std::reverse(vertices.begin(), vertices.end());
    }

    std::vector<int> reflexVertices;
    for (int i = 0; i < n; i++) {
        Vec2 p0 = vertices[(i - 1 + n) % n];
        Vec2 p1 = vertices[i];
        Vec2 p2 = vertices[(i + 1) % n];
        if (crossProduct(p0, p1, p2) < 0) {
            reflexVertices.push_back(i);
        }
    }

    if (reflexVertices.empty()) {
        return {vertices};
    }

    int reflexIdx = reflexVertices[0];
    Vec2 p0 = vertices[(reflexIdx - 1 + n) % n];
    Vec2 p1 = vertices[reflexIdx];
    Vec2 p2 = vertices[(reflexIdx + 1) % n];

    int bestSplitIdx = -1;
    float minDistanceSq = 1e30f;

    for (int i = 0; i < n; i++) {
        if (i == reflexIdx || i == (reflexIdx - 1 + n) % n || i == (reflexIdx + 1) % n) continue;

        Vec2 p = vertices[i];
        float cp1 = crossProduct(p1, p0, p);
        float cp2 = crossProduct(p1, p2, p);

        if (cp1 <= 0 && cp2 >= 0) {
            if (isVisible(vertices, reflexIdx, i)) {
                float distSq = (p.x - p1.x) * (p.x - p1.x) + (p.y - p1.y) * (p.y - p1.y);
                if (distSq < minDistanceSq) {
                    minDistanceSq = distSq;
                    bestSplitIdx = i;
                }
            }
        }
    }

    if (bestSplitIdx != -1) {
        std::vector<Vec2> poly1, poly2;

        int i = reflexIdx;
        while (i != bestSplitIdx) {
            poly1.push_back(vertices[i]);
            i = (i + 1) % n;
        }
        poly1.push_back(vertices[bestSplitIdx]);

        i = bestSplitIdx;
        while (i != reflexIdx) {
            poly2.push_back(vertices[i]);
            i = (i + 1) % n;
        }
        poly2.push_back(vertices[reflexIdx]);

        auto d1 = decompose(poly1);
        auto d2 = decompose(poly2);
        d1.insert(d1.end(), d2.begin(), d2.end());
        return d1;
    }

    return {vertices};
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
    bodyOptions["type"] = (int)ObjectType::DYNAMIC_OBJECT;
    
    int starId = 1;
    world.makeBody(starId, bodyOptions);
    Body* starBody = world.getBody(starId);

    // Decompose star into convex pieces
    std::vector<Vec2> starVertices = makeStar(5, 5.0f, 2.0f);
    auto pieces = decompose(starVertices);

    for (const auto& piece : pieces) {
        emscripten_val fixtureOptions;
        fixtureOptions["shape"] = (int)ObjectShape::POLYGON;
        fixtureOptions["vertices"] = convertToMockVal(piece);
        fixtureOptions["density"] = 1.0f;
        starBody->createFixture(fixtureOptions);
    }

    starBody->recomputeMassProperties();

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

        world.makeBody(10 + i, circleOptions);
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
