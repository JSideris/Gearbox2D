// PER-856: spatial queries (box / radius / ray / batched radius) must match brute force
// over every fixture, on randomized worlds that have stepped (so the BVH has churned).
#include <gtest/gtest.h>
#include <random>
#include <set>
#include <algorithm>
#include "world.h"
#include "body.h"
#include "fixture.h"
#include "constants.h"
#include "spatial-query.h"

namespace {

emscripten_val sqVerts(const std::vector<Vec2>& vs) {
    emscripten_val v;
    v["length"] = (int)vs.size();
    for (int i = 0; i < (int)vs.size(); ++i) {
        v[std::to_string(i)]["x"] = vs[i].x;
        v[std::to_string(i)]["y"] = vs[i].y;
    }
    return v;
}

void sqShape(emscripten_val& o, int kind, std::mt19937& rng) {
    std::uniform_real_distribution<float> size(0.3f, 3.0f);
    switch (kind) {
        case 0: o["shape"] = (int)ObjectShape::CIRCLE; o["radius"] = size(rng); break;
        case 1: o["shape"] = (int)ObjectShape::BOX; o["width"] = size(rng); o["height"] = size(rng); break;
        case 2: o["shape"] = (int)ObjectShape::AABB; o["width"] = size(rng); o["height"] = size(rng); break;
        case 3: { float r = size(rng) * 0.5f; o["shape"] = (int)ObjectShape::CAPSULE; o["radius"] = r; o["height"] = 2 * r + size(rng); break; }
        case 4: { float s = size(rng); o["shape"] = (int)ObjectShape::POLYGON;
                  o["vertices"] = sqVerts({Vec2(-s, -s * 0.6f), Vec2(s, -s * 0.4f), Vec2(s * 0.3f, s), Vec2(-s * 0.8f, s * 0.5f)}); break; }
        default: o["shape"] = (int)ObjectShape::POINT; break;
    }
}

struct RandomWorld {
    World world;
    explicit RandomWorld(unsigned seed, int bodies = 400, float extent = 120.0f) {
        world.setGravity(0.0f, 0.0f);
        std::mt19937 rng(seed);
        std::uniform_real_distribution<float> pos(-extent, extent), vel(-8.0f, 8.0f), ang(-3.14f, 3.14f), u(0.0f, 1.0f);
        std::uniform_int_distribution<int> kind(0, 5), cat(0, 2);
        int fixtureId = 1;
        for (int id = 1; id <= bodies; ++id) {
            emscripten_val o;
            o["x"] = pos(rng); o["y"] = pos(rng); o["r"] = ang(rng);
            bool fixed = u(rng) < 0.25f;
            o["type"] = (int)(fixed ? ObjectType::FIXED_OBJECT : ObjectType::DYNAMIC_OBJECT);
            if (!fixed) { o["mass"] = 1.0f; o["vx"] = vel(rng); o["vy"] = vel(rng); o["rs"] = vel(rng) * 0.2f; }
            o["canSleep"] = false;
            o["fixtureId"] = fixtureId++;
            o["categoryBits"] = 1 << cat(rng);
            if (u(rng) < 0.15f) o["isSensor"] = true;
            sqShape(o, kind(rng), rng);
            world.createBody(id, o);
            if (u(rng) < 0.2f) { // second fixture, offset
                emscripten_val f;
                f["localX"] = 1.5f; f["localY"] = -0.5f; f["localR"] = 0.7f;
                f["categoryBits"] = 1 << cat(rng);
                sqShape(f, kind(rng) % 5, rng);
                world.createFixture(id, fixtureId++, f);
            }
        }
        for (int i = 0; i < 30; ++i) world.step();
        // Teleport a few bodies between steps: queries must see them at the new spot.
        for (int id = 1; id <= bodies; id += 37) world.getBody(id)->setPosition(Vec2(pos(rng), pos(rng)));
    }

    bool accepts(const Fixture* f, uint32_t mask, int flags, int exclude = -1) const {
        if ((f->getCategoryBits() & mask) == 0) return false;
        if ((flags & QUERY_FLAG_SKIP_SENSORS) && f->isSensor()) return false;
        if (exclude != -1 && f->body->id == exclude) return false;
        return true;
    }

    template <typename Pred>
    std::vector<std::pair<int, int>> brute(uint32_t mask, int flags, int exclude, Pred pred) const {
        std::vector<Fixture*> hits;
        for (int i = 0; i < world.getFixtureCount(); ++i) {
            Fixture* f = world.getFixtureAtIndex(i);
            if (!accepts(f, mask, flags, exclude)) continue;
            QueryShape s; f->getQueryShape(s);
            if (pred(s)) hits.push_back(f);
        }
        std::sort(hits.begin(), hits.end(), [](Fixture* a, Fixture* b) { return a->id < b->id; });
        std::vector<std::pair<int, int>> out;
        std::set<int> seen;
        for (Fixture* f : hits) {
            if ((flags & QUERY_FLAG_UNIQUE_BODIES) && !seen.insert(f->body->id).second) continue;
            out.push_back({f->id, f->body->id});
        }
        return out;
    }

    std::vector<std::pair<int, int>> hits(int count, int offset = 0) const {
        const auto& h = world.getQueryHits();
        std::vector<std::pair<int, int>> out;
        for (int i = offset; i < offset + count; ++i) out.push_back({h[i * 2], h[i * 2 + 1]});
        return out;
    }
};

const uint32_t kMasks[] = {0xFFFFFFFFu, 1u, 2u, 4u, 3u, 6u};

} // namespace

TEST(SpatialQueryTest, AabbMatchesBruteForce) {
    for (unsigned seed : {1u, 2u, 3u}) {
        RandomWorld rw(seed);
        std::mt19937 rng(seed * 101);
        std::uniform_real_distribution<float> pos(-130.0f, 130.0f), size(0.0f, 40.0f);
        int nonEmpty = 0;
        for (int q = 0; q < 300; ++q) {
            Vec2 lo(pos(rng), pos(rng));
            Vec2 hi(lo.x + size(rng), lo.y + size(rng));
            uint32_t mask = kMasks[q % 6];
            int flags = q % 4; // unique bodies / skip sensors combinations
            int n = rw.world.queryAABB(lo.x, lo.y, hi.x, hi.y, mask, flags);
            auto expected = rw.brute(mask, flags, -1, [&](const QueryShape& s) { return sq::overlapsAabb(s, lo, hi); });
            ASSERT_EQ(rw.hits(n), expected) << "seed " << seed << " query " << q;
            nonEmpty += n > 0;
        }
        EXPECT_GT(nonEmpty, 100);
    }
}

TEST(SpatialQueryTest, RadiusMatchesBruteForce) {
    for (unsigned seed : {4u, 5u, 6u}) {
        RandomWorld rw(seed);
        std::mt19937 rng(seed * 103);
        std::uniform_real_distribution<float> pos(-130.0f, 130.0f), rad(0.0f, 25.0f);
        int nonEmpty = 0;
        for (int q = 0; q < 300; ++q) {
            Vec2 c(pos(rng), pos(rng));
            float r = rad(rng);
            uint32_t mask = kMasks[q % 6];
            int flags = q % 4;
            int n = rw.world.queryRadius(c.x, c.y, r, mask, flags);
            auto expected = rw.brute(mask, flags, -1, [&](const QueryShape& s) { return sq::overlapsCircle(s, c, r); });
            ASSERT_EQ(rw.hits(n), expected) << "seed " << seed << " query " << q;
            nonEmpty += n > 0;
        }
        EXPECT_GT(nonEmpty, 100);
    }
}

TEST(SpatialQueryTest, RaycastMatchesBruteForce) {
    for (unsigned seed : {7u, 8u, 9u}) {
        RandomWorld rw(seed);
        std::mt19937 rng(seed * 107);
        std::uniform_real_distribution<float> pos(-130.0f, 130.0f);
        int hitsSeen = 0;
        for (int q = 0; q < 300; ++q) {
            Vec2 p(pos(rng), pos(rng)), p2(pos(rng), pos(rng));
            Vec2 d = p2 - p;
            uint32_t mask = kMasks[q % 6];
            int baseFlags = (q % 2) ? QUERY_FLAG_SKIP_SENSORS : 0;
            int exclude = (q % 5 == 0) ? 1 + (q % 400) : -1;

            // Brute force: every hit, sorted by (t, fixture id).
            std::vector<std::pair<RayHit, Fixture*>> all;
            for (int i = 0; i < rw.world.getFixtureCount(); ++i) {
                Fixture* f = rw.world.getFixtureAtIndex(i);
                if (!rw.accepts(f, mask, baseFlags, exclude)) continue;
                QueryShape s; f->getQueryShape(s);
                RayHit h;
                if (sq::raycastShape(s, p, d, 1.0f, h)) all.push_back({h, f});
            }
            std::sort(all.begin(), all.end(), [](const auto& a, const auto& b) {
                return a.first.t != b.first.t ? a.first.t < b.first.t : a.second->id < b.second->id;
            });

            // Closest
            int n = rw.world.raycast(p.x, p.y, p2.x, p2.y, mask, baseFlags, exclude);
            ASSERT_EQ(n, all.empty() ? 0 : 1) << "seed " << seed << " ray " << q;
            if (n) {
                EXPECT_EQ(rw.world.getQueryHits()[0], all[0].second->id);
                EXPECT_FLOAT_EQ(rw.world.getRayHits()[0], all[0].first.t);
                hitsSeen++;
            }

            // All (optionally one per body)
            for (int unique : {0, QUERY_FLAG_UNIQUE_BODIES}) {
                int na = rw.world.raycast(p.x, p.y, p2.x, p2.y, mask, baseFlags | QUERY_FLAG_RAY_ALL | unique, exclude);
                std::vector<int> expIds; std::vector<float> expT; std::set<int> seen;
                for (auto& e : all) {
                    if (unique && !seen.insert(e.second->body->id).second) continue;
                    expIds.push_back(e.second->id); expT.push_back(e.first.t);
                }
                ASSERT_EQ(na, (int)expIds.size()) << "seed " << seed << " ray " << q;
                for (int i = 0; i < na; ++i) {
                    EXPECT_EQ(rw.world.getQueryHits()[i * 2], expIds[i]);
                    EXPECT_FLOAT_EQ(rw.world.getRayHits()[i * 5], expT[i]);
                }
            }
        }
        EXPECT_GT(hitsSeen, 50);
    }
}

TEST(SpatialQueryTest, BatchMatchesSingleQueries) {
    RandomWorld rw(11);
    std::mt19937 rng(1234);
    std::uniform_real_distribution<float> pos(-130.0f, 130.0f), rad(0.0f, 20.0f);
    const int N = 200;
    rw.world.reserveQueryBatch(N);
    auto& in = rw.world.getBatchInputBuffer();
    auto& ex = rw.world.getBatchExcludeBuffer();
    for (int i = 0; i < N; ++i) {
        in[i * 3] = pos(rng); in[i * 3 + 1] = pos(rng); in[i * 3 + 2] = rad(rng);
        ex[i] = (i % 3 == 0) ? 1 + i : -1;
    }
    for (int flags : {0, QUERY_FLAG_UNIQUE_BODIES | QUERY_FLAG_SKIP_SENSORS}) {
        int total = rw.world.queryRadiusBatch(N, 0xFFFFFFFFu, flags);
        std::vector<int32_t> offsets(rw.world.getBatchOffsets().begin(), rw.world.getBatchOffsets().begin() + N + 1);
        auto batchHits = rw.hits(total);
        ASSERT_EQ(offsets[N], total);
        for (int i = 0; i < N; ++i) {
            Vec2 c(in[i * 3], in[i * 3 + 1]);
            float r = in[i * 3 + 2];
            auto expected = rw.brute(0xFFFFFFFFu, flags, ex[i], [&](const QueryShape& s) { return sq::overlapsCircle(s, c, r); });
            std::vector<std::pair<int, int>> got(batchHits.begin() + offsets[i], batchHits.begin() + offsets[i + 1]);
            ASSERT_EQ(got, expected) << "batch query " << i;
        }
    }
}

TEST(SpatialQueryTest, BufferGenerationTracksReallocation) {
    RandomWorld rw(12, 100);
    int g0 = rw.world.getQueryBufferGeneration();
    rw.world.queryAABB(-1000, -1000, 1000, 1000); // grows the hit buffer
    int g1 = rw.world.getQueryBufferGeneration();
    EXPECT_GT(g1, g0);
    rw.world.queryAABB(-1000, -1000, 1000, 1000); // same size: no reallocation
    EXPECT_EQ(rw.world.getQueryBufferGeneration(), g1);
    rw.world.queryRadius(0, 0, 1); // smaller: no reallocation
    EXPECT_EQ(rw.world.getQueryBufferGeneration(), g1);
}

TEST(SpatialQueryTest, ShapeGeometryAgreesWithTestPoint) {
    // Sample points: wherever the existing testPoint says "inside", the radius-0 query must hit.
    RandomWorld rw(13, 120, 30.0f);
    std::mt19937 rng(99);
    std::uniform_real_distribution<float> pos(-35.0f, 35.0f);
    int inside = 0;
    for (int k = 0; k < 4000; ++k) {
        Vec2 p(pos(rng), pos(rng));
        for (int i = 0; i < rw.world.getFixtureCount(); ++i) {
            Fixture* f = rw.world.getFixtureAtIndex(i);
            if (f->shape == ObjectShape::POINT) continue;
            if (!f->testPoint(p.x, p.y)) continue;
            QueryShape s; f->getQueryShape(s);
            ASSERT_TRUE(sq::overlapsCircle(s, p, 1e-4f)) << "fixture " << f->id;
            ASSERT_TRUE(sq::overlapsAabb(s, p - Vec2(1e-4f, 1e-4f), p + Vec2(1e-4f, 1e-4f))) << "fixture " << f->id;
            inside++;
        }
    }
    EXPECT_GT(inside, 100);
}

TEST(SpatialQueryTest, RayHandCases) {
    World world;
    emscripten_val box;
    box["x"] = 10.0f; box["y"] = 0.0f; box["type"] = (int)ObjectType::FIXED_OBJECT;
    box["shape"] = (int)ObjectShape::BOX; box["width"] = 2.0f; box["height"] = 2.0f;
    world.createBody(1, box);
    emscripten_val circle;
    circle["x"] = 20.0f; circle["y"] = 0.0f; circle["type"] = (int)ObjectType::FIXED_OBJECT;
    circle["shape"] = (int)ObjectShape::CIRCLE; circle["radius"] = 1.0f;
    world.createBody(2, circle);

    ASSERT_EQ(world.raycast(0, 0, 30, 0), 1);
    EXPECT_EQ(world.getQueryHits()[1], 1);
    EXPECT_NEAR(world.getRayHits()[0], 9.0f / 30.0f, 1e-6f);
    EXPECT_NEAR(world.getRayHits()[1], 9.0f, 1e-5f);
    EXPECT_NEAR(world.getRayHits()[3], -1.0f, 1e-6f); // normal faces the ray

    ASSERT_EQ(world.raycast(0, 0, 30, 0, 0xFFFFFFFFu, QUERY_FLAG_RAY_ALL), 2);
    EXPECT_EQ(world.getQueryHits()[3], 2);
    EXPECT_NEAR(world.getRayHits()[5], 19.0f / 30.0f, 1e-6f);

    // Excluding the box finds the circle; a short ray finds nothing.
    ASSERT_EQ(world.raycast(0, 0, 30, 0, 0xFFFFFFFFu, 0, 1), 1);
    EXPECT_EQ(world.getQueryHits()[1], 2);
    EXPECT_EQ(world.raycast(0, 0, 5, 0), 0);
    // Starting inside reports t = 0.
    ASSERT_EQ(world.raycast(10, 0, 30, 0), 1);
    EXPECT_EQ(world.getRayHits()[0], 0.0f);
}
