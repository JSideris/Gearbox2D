// PER-856 micro-benchmark: BVH spatial queries vs brute force over every fixture, 400 bodies.
// Build + run: make bench-queries
#include <chrono>
#include <cstdio>
#include <random>
#include <vector>
#include "world.h"
#include "body.h"
#include "fixture.h"
#include "spatial-query.h"

static emscripten_val shapeOpts(std::mt19937& rng, int id, float extent) {
    std::uniform_real_distribution<float> pos(-extent, extent), vel(-5.0f, 5.0f), u(0.0f, 1.0f);
    emscripten_val o;
    o["x"] = pos(rng); o["y"] = pos(rng); o["r"] = u(rng) * 6.28f;
    bool fixed = u(rng) < 0.3f;
    o["type"] = (int)(fixed ? ObjectType::FIXED_OBJECT : ObjectType::DYNAMIC_OBJECT);
    if (!fixed) { o["mass"] = 1.0f; o["vx"] = vel(rng); o["vy"] = vel(rng); }
    o["canSleep"] = false;
    o["fixtureId"] = id;
    if (u(rng) < 0.6f) { o["shape"] = (int)ObjectShape::CIRCLE; o["radius"] = 0.5f + u(rng) * 2.0f; }
    else { o["shape"] = (int)ObjectShape::BOX; o["width"] = 1.0f + u(rng) * 3.0f; o["height"] = 1.0f + u(rng) * 3.0f; }
    return o;
}

template <typename F>
static double timeUs(F fn, int reps, long& sink) {
    for (int i = 0; i < 20; ++i) sink += fn();
    auto t0 = std::chrono::steady_clock::now();
    for (int i = 0; i < reps; ++i) sink += fn();
    auto t1 = std::chrono::steady_clock::now();
    return std::chrono::duration<double, std::micro>(t1 - t0).count() / reps;
}

int main(int argc, char** argv) {
    const int N = argc > 1 ? std::atoi(argv[1]) : 400;
    const float EXTENT = 200.0f, RADIUS = 15.0f;
    World world;
    world.setGravity(0.0f, 0.0f);
    std::mt19937 rng(7);
    for (int id = 1; id <= N; ++id) world.createBody(id, shapeOpts(rng, id, EXTENT));
    for (int i = 0; i < 30; ++i) world.step();

    std::vector<Vec2> centres(N);
    for (int i = 0; i < N; ++i) centres[i] = Vec2(world.getBody(i + 1)->getX(), world.getBody(i + 1)->getY());
    const int F = world.getFixtureCount();
    long sink = 0;
    const int reps = 300;

    auto bruteRadius = [&]() {
        long hits = 0;
        QueryShape s;
        for (int q = 0; q < N; ++q)
            for (int i = 0; i < F; ++i) {
                Fixture* f = world.getFixtureAtIndex(i);
                f->getQueryShape(s);
                hits += sq::overlapsCircle(s, centres[q], RADIUS);
            }
        return hits;
    };
    auto bvhRadius = [&]() {
        long hits = 0;
        for (int q = 0; q < N; ++q) hits += world.queryRadius(centres[q].x, centres[q].y, RADIUS);
        return hits;
    };
    world.reserveQueryBatch(N);
    for (int q = 0; q < N; ++q) {
        world.getBatchInputBuffer()[q * 3] = centres[q].x;
        world.getBatchInputBuffer()[q * 3 + 1] = centres[q].y;
        world.getBatchInputBuffer()[q * 3 + 2] = RADIUS;
        world.getBatchExcludeBuffer()[q] = -1;
    }
    auto bvhBatch = [&]() { return (long)world.queryRadiusBatch(N); };
    auto bruteAabb = [&]() {
        long hits = 0;
        QueryShape s;
        for (int q = 0; q < N; ++q) {
            Vec2 lo(centres[q].x - RADIUS, centres[q].y - RADIUS), hi(centres[q].x + RADIUS, centres[q].y + RADIUS);
            for (int i = 0; i < F; ++i) { world.getFixtureAtIndex(i)->getQueryShape(s); hits += sq::overlapsAabb(s, lo, hi); }
        }
        return hits;
    };
    auto bvhAabb = [&]() {
        long hits = 0;
        for (int q = 0; q < N; ++q) hits += world.queryAABB(centres[q].x - RADIUS, centres[q].y - RADIUS, centres[q].x + RADIUS, centres[q].y + RADIUS);
        return hits;
    };
    auto bruteRay = [&]() {
        long hits = 0;
        QueryShape s; RayHit h;
        for (int q = 0; q < N; ++q) {
            Vec2 p = centres[q], d = centres[(q * 7 + 3) % N] - p;
            float best = 2.0f;
            for (int i = 0; i < F; ++i) {
                Fixture* f = world.getFixtureAtIndex(i);
                if (f->body->id == q + 1) continue;
                f->getQueryShape(s);
                if (sq::raycastShape(s, p, d, 1.0f, h) && h.t < best) best = h.t;
            }
            hits += best <= 1.0f;
        }
        return hits;
    };
    auto bvhRay = [&]() {
        long hits = 0;
        for (int q = 0; q < N; ++q) {
            Vec2 p = centres[q], p2 = centres[(q * 7 + 3) % N];
            hits += world.raycast(p.x, p.y, p2.x, p2.y, 0xFFFFFFFFu, 0, q + 1);
        }
        return hits;
    };

    std::printf("bodies=%d fixtures=%d extent=±%.0f radius=%.0f; µs per pass of %d queries (native, -O3)\n", N, F, EXTENT, RADIUS, N);
    double a = timeUs(bruteRadius, reps / 10, sink), b = timeUs(bvhRadius, reps, sink), c = timeUs(bvhBatch, reps, sink);
    std::printf("radius  brute %9.1f  bvh %8.1f  batch %8.1f  (%.0fx)\n", a, b, c, a / c);
    a = timeUs(bruteAabb, reps / 10, sink); b = timeUs(bvhAabb, reps, sink);
    std::printf("aabb    brute %9.1f  bvh %8.1f  (%.0fx)\n", a, b, a / b);
    a = timeUs(bruteRay, reps / 10, sink); b = timeUs(bvhRay, reps, sink);
    std::printf("ray     brute %9.1f  bvh %8.1f  (%.0fx)\n", a, b, a / b);
    std::printf("(sink %ld)\n", sink);
    return 0;
}
