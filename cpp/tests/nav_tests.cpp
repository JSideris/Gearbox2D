// PER-871: native grid A* / HPA* (World::nav*, findPaths). Parity with the gear3engine JS planner is
// checked through the real WASM module in scripts/nav-parity-test.mjs; these tests pin the invariants
// that don't need JS: determinism, sliced == one-shot, budgets, carry-over, push/pop layers, partial
// hierarchy rebuilds and physics-world tracking (the step only marks cells dirty).
#include <gtest/gtest.h>
#include <random>
#include <vector>
#include <array>
#include <cmath>
#include "world.h"
#include "body.h"
#include "fixture.h"
#include "constants.h"
#include "nav.h"

namespace {

using nav::NavSystem;

struct Scene {
    World world;
    NavSystem* n;
    std::vector<nav::Disc> rocks;
    Scene(unsigned seed, double half, double cell, double clearance, int flags, int boxes, int discs, int rockCount = 0) {
        world.setGravity(0.0f, 0.0f);
        n = &world.navSystem();
        n->create(-half, -half, half, half, cell, clearance, flags);
        std::mt19937 rng(seed);
        std::uniform_real_distribution<double> pos(-half * 0.9, half * 0.9), len(2.0, half * 0.5), thin(0.3, 2.5), ang(-3.1, 3.1), rad(0.5, 4.0);
        for (int i = 0; i < boxes; i++) n->addBox(pos(rng), pos(rng), len(rng), thin(rng), ang(rng));
        for (int i = 0; i < discs; i++) n->addDisc(pos(rng), pos(rng), rad(rng), i % 3 == 0 ? 1.0 : 0.0);
        for (int i = 0; i < rockCount; i++) rocks.push_back({pos(rng), pos(rng), rad(rng) * 0.6});
        if (!rocks.empty()) n->grid->setDynamic(rocks.data(), (int)rocks.size());
        n->sync();
    }
};

struct Result {
    int status;
    double length;
    std::vector<double> pts;
    bool operator==(const Result& o) const { return status == o.status && length == o.length && pts == o.pts; }
};

std::vector<Result> readResults(const NavSystem& n, std::vector<int>* ids = nullptr) {
    std::vector<Result> out;
    int count = (int)n.out[0];
    size_t at = 1;
    for (int k = 0; k < count; k++) {
        Result r;
        if (ids) ids->push_back((int)n.out[at]);
        r.status = (int)n.out[at + 1];
        r.length = n.out[at + 3];
        int np = (int)n.out[at + 4];
        r.pts.assign(n.out.begin() + at + 5, n.out.begin() + at + 5 + 2 * np);
        at += 5 + 2 * np;
        out.push_back(r);
    }
    return out;
}

Result oneShot(NavSystem& n, double fx, double fy, double tx, double ty, int mode) {
    n.findPathNow(fx, fy, tx, ty, mode, 0);
    return readResults(n)[0];
}

void queue(NavSystem& n, const std::vector<std::array<double, 4>>& routes, int mode) {
    n.reserve((int)routes.size(), 0);
    for (size_t k = 0; k < routes.size(); k++) {
        double* q = &n.requestIn[k * 8];
        q[0] = (double)k; q[1] = routes[k][0]; q[2] = routes[k][1]; q[3] = routes[k][2]; q[4] = routes[k][3];
        q[5] = mode; q[6] = 0; q[7] = 0;
    }
}

std::vector<std::array<double, 4>> routesFor(unsigned seed, double half, int count) {
    std::mt19937 rng(seed);
    std::uniform_real_distribution<double> pos(-half, half);
    std::vector<std::array<double, 4>> r;
    for (int i = 0; i < count; i++) r.push_back({pos(rng), pos(rng), pos(rng), pos(rng)});
    return r;
}

const int FLAG_SETS[] = {0, nav::GRID_RASTER_CENTERS | nav::GRID_AT_GOAL_EMPTY | nav::GRID_NEAREST_OUTSIDE_POINT | nav::GRID_TIES_HEAP,
                         nav::GRID_TIES_HEAP, nav::GRID_RASTER_CENTERS | nav::GRID_NO_BLOCK_EDGES};

} // namespace

TEST(Nav, OpenGridGoesStraight) {
    Scene s(1, 20, 1, 0, 0, 0, 0);
    Result r = oneShot(*s.n, -10.2, 0.3, 10.7, 0.3, nav::MODE_GRID);
    ASSERT_EQ(r.status, nav::STATUS_PATH);
    ASSERT_EQ(r.pts.size(), 2u);
    EXPECT_DOUBLE_EQ(r.pts[0], 10.7);
    EXPECT_NEAR(r.length, 20.9, 1e-9);
}

TEST(Nav, WalledInHasNoPath) {
    Scene s(2, 20, 1, 0.5, 0, 0, 0);
    s.n->addBox(0, 0, 40, 1, 0); // full-width wall
    s.n->sync();
    EXPECT_EQ(oneShot(*s.n, 0, -10, 0, 10, nav::MODE_GRID).status, nav::STATUS_NO_PATH);
    s.n->buildHierarchy(8, 6);
    EXPECT_EQ(oneShot(*s.n, 0, -10, 0, 10, nav::MODE_HPA).status, nav::STATUS_NO_PATH);
    EXPECT_EQ(oneShot(*s.n, 0, -10, 2, -9, nav::MODE_HPA).status, nav::STATUS_PATH);
}

TEST(Nav, HpaWithoutHierarchyReportsIt) {
    Scene s(3, 20, 1, 0, 0, 3, 3);
    EXPECT_EQ(oneShot(*s.n, -5, -5, 5, 5, nav::MODE_HPA).status, nav::STATUS_NO_HIERARCHY);
}

// Same inputs, separately built systems: identical results (and identical hierarchies).
TEST(Nav, Deterministic) {
    for (int flags : FLAG_SETS) {
        Scene a(11, 60, 1, 1.5, flags, 25, 15, 20), b(11, 60, 1, 1.5, flags, 25, 15, 20);
        a.n->buildHierarchy(8, 6);
        b.n->buildHierarchy(8, 6);
        ASSERT_EQ(a.n->hierarchy->adjNode, b.n->hierarchy->adjNode);
        ASSERT_EQ(a.n->hierarchy->adjCost, b.n->hierarchy->adjCost);
        for (auto& rt : routesFor(5, 60, 30)) {
            for (int mode : {0, 1, 2}) {
                EXPECT_TRUE(oneShot(*a.n, rt[0], rt[1], rt[2], rt[3], mode) == oneShot(*b.n, rt[0], rt[1], rt[2], rt[3], mode));
            }
        }
    }
}

// findPaths in small budgets (requests carried over tick to tick) gives exactly the one-shot answers,
// never spends more than the budget in a call, and finishes every request.
TEST(Nav, BudgetedBatchMatchesOneShot) {
    for (int flags : FLAG_SETS) {
        Scene s(21, 80, 1, 1.0, flags, 30, 20, 25);
        s.n->buildHierarchy(16, 6);
        auto routes = routesFor(9, 80, 24);
        for (int mode : {0, 1, 2}) {
            std::vector<Result> want;
            for (auto& rt : routes) want.push_back(oneShot(*s.n, rt[0], rt[1], rt[2], rt[3], mode));
            for (int64_t budget : {int64_t(1), int64_t(37), int64_t(500)}) {
                queue(*s.n, routes, mode);
                std::vector<Result> got(routes.size());
                std::vector<bool> seen(routes.size(), false);
                int newCount = (int)routes.size(), done = 0, ticks = 0;
                while (done < (int)routes.size()) {
                    ASSERT_LT(++ticks, 2000000);
                    s.n->findPaths((double)budget, 0, newCount);
                    newCount = 0;
                    EXPECT_LE(s.n->lastExpanded, budget);
                    std::vector<int> ids;
                    auto rs = readResults(*s.n, &ids);
                    for (size_t k = 0; k < rs.size(); k++) { ASSERT_FALSE(seen[ids[k]]); seen[ids[k]] = true; got[ids[k]] = rs[k]; done++; }
                }
                for (size_t k = 0; k < routes.size(); k++) EXPECT_TRUE(got[k] == want[k]) << "mode " << mode << " budget " << budget << " route " << k;
            }
        }
    }
}

// minSlice: every queued request moves each tick even when the budget is spent.
TEST(Nav, MinSliceAdvancesEveryRequest) {
    Scene s(31, 60, 1, 1.0, 0, 20, 10);
    auto routes = routesFor(3, 60, 10);
    queue(*s.n, routes, nav::MODE_GRID);
    s.n->findPaths(0, 5, (int)routes.size());
    for (auto& r : s.n->queue) EXPECT_GT(r->used, 0);
}

// A grid request whose moving obstacles change mid-search starts over on the new grid (NavPathSearch).
TEST(Nav, GridRequestRestartsWhenObstaclesChange) {
    Scene s(41, 60, 1, 1.0, 0, 20, 10, 15);
    auto rt = routesFor(77, 60, 1)[0];
    queue(*s.n, {rt}, nav::MODE_GRID);
    s.n->findPaths(3, 0, 1);
    ASSERT_EQ((int)s.n->out[0], 0);
    std::vector<nav::Disc> moved = s.rocks;
    for (auto& d : moved) d.x += 3;
    s.n->grid->setDynamic(moved.data(), (int)moved.size());
    Result want = oneShot(*s.n, rt[0], rt[1], rt[2], rt[3], nav::MODE_GRID);
    s.n->findPaths(1e18, 0, 0);
    ASSERT_EQ((int)s.n->out[0], 1);
    EXPECT_TRUE(readResults(*s.n)[0] == want);
}

// push then pop leaves the grid exactly as before; a push equals set() with the union of discs.
TEST(Nav, DynamicLayers) {
    Scene s(51, 50, 1, 1.0, 0, 10, 5, 12);
    std::vector<uint8_t> before = s.n->grid->dyn;
    std::vector<nav::Disc> extra{{3, 4, 2}, {-10, 7, 1.5}, {20, 20, 3}};
    s.n->grid->pushDynamic(extra.data(), 3);
    std::vector<uint8_t> pushed = s.n->grid->dyn;
    EXPECT_EQ(s.n->grid->dynamicLayers(), 1);
    s.n->grid->popDynamic();
    EXPECT_EQ(s.n->grid->dyn, before);
    EXPECT_EQ(s.n->grid->dynamicLayers(), 0);
    s.n->grid->popDynamic(); // no-op without a layer
    EXPECT_EQ(s.n->grid->dyn, before);
    std::vector<nav::Disc> all = s.rocks;
    all.insert(all.end(), extra.begin(), extra.end());
    s.n->grid->setDynamic(all.data(), (int)all.size());
    EXPECT_EQ(s.n->grid->dyn, pushed);
}

// A request's own discs block only that request, and only while it searches.
TEST(Nav, RequestDiscsAreScoped) {
    Scene s(61, 40, 1, 0.5, 0, 0, 0);
    std::vector<uint8_t> before = s.n->grid->dyn;
    s.n->reserve(2, 1);
    double* q = s.n->requestIn.data();
    double a[8] = {1, -20, 0, 20, 0, 0, 0, 1}, b[8] = {2, -20, 0, 20, 0, 0, 0, 0};
    std::copy(a, a + 8, q);
    std::copy(b, b + 8, q + 8);
    s.n->discIn[0] = 0; s.n->discIn[1] = 0; s.n->discIn[2] = 5;
    s.n->findPaths(1e18, 0, 2);
    std::vector<int> ids;
    auto rs = readResults(*s.n, &ids);
    ASSERT_EQ(rs.size(), 2u);
    EXPECT_GT(rs[0].length, rs[1].length + 1); // the first detours around its disc
    EXPECT_EQ(s.n->grid->dyn, before);
    EXPECT_EQ(s.n->grid->dynamicLayers(), 0);
}

// rebuild over a changed area gives the same hierarchy as building from scratch, and restarts HPA
// requests in flight.
TEST(Nav, PartialRebuildMatchesScratch) {
    for (int flags : FLAG_SETS) {
        Scene s(71, 70, 1, 1.0, flags, 25, 10);
        s.n->buildHierarchy(8, 6);
        auto rt = routesFor(13, 70, 1)[0];
        queue(*s.n, {rt}, nav::MODE_HPA);
        s.n->findPaths(2, 0, 1);
        uint32_t v = s.n->hierarchy->version;
        s.n->addBox(5, 5, 20, 2, 0.4);
        s.n->addDisc(-20, 12, 3, 0);
        s.n->sync();
        EXPECT_GT(s.n->hierarchy->version, v);
        Scene fresh(71, 70, 1, 1.0, flags, 25, 10);
        fresh.n->addBox(5, 5, 20, 2, 0.4);
        fresh.n->addDisc(-20, 12, 3, 0);
        fresh.n->buildHierarchy(8, 6);
        const auto &A = *s.n->hierarchy, &B = *fresh.n->hierarchy;
        EXPECT_EQ(A.nodeCell, B.nodeCell);
        EXPECT_EQ(A.adjStart, B.adjStart);
        EXPECT_EQ(A.adjNode, B.adjNode);
        EXPECT_EQ(A.adjCost, B.adjCost);
        EXPECT_EQ(A.adjPathCells, B.adjPathCells);
        Result want = oneShot(*fresh.n, rt[0], rt[1], rt[2], rt[3], nav::MODE_HPA);
        s.n->findPaths(1e18, 0, 0);
        ASSERT_EQ((int)s.n->out[0], 1);
        EXPECT_TRUE(readResults(*s.n)[0] == want);
    }
}

namespace {
int addWall(World& w, int id, float x, float y, float width, float height, float angle, uint32_t cat, int type = (int)ObjectType::FIXED_OBJECT) {
    emscripten_val o;
    o["x"] = x; o["y"] = y; o["r"] = angle;
    o["type"] = type;
    o["fixtureId"] = id;
    o["categoryBits"] = (int)cat;
    o["shape"] = (int)ObjectShape::BOX; o["width"] = width; o["height"] = height;
    if (type != (int)ObjectType::FIXED_OBJECT) { o["mass"] = 1.0f; o["canSleep"] = false; }
    return w.createBody(id, o);
}
}

// Physics-world tracking: fixtures in the nav mask block their cells. The step only marks them dirty;
// the grid (and hierarchy) change at the next sync / findPaths, and a partial rebuild matches scratch.
TEST(Nav, TrackedFixtures) {
    World w;
    w.setGravity(0.0f, 0.0f);
    NavSystem& n = w.navSystem();
    n.create(-40, -40, 40, 40, 1, 1.0, 0);
    addWall(w, 1, 0, 0, 30, 2, 0, 2);
    addWall(w, 2, 0, 20, 10, 2, 0, 4); // not in the mask
    n.track(2, 0);
    n.buildHierarchy(8, 6);
    const int mid = n.grid->indexOf(0, 0), side = n.grid->indexOf(0, 20);
    EXPECT_EQ(n.grid->blocked[mid], 1);
    EXPECT_EQ(n.grid->blocked[side], 0);
    // created after track(): picked up too
    addWall(w, 3, -20, -20, 4, 4, 0.3f, 2);
    n.sync();
    EXPECT_EQ(n.grid->blocked[n.grid->indexOf(-20, -20)], 1);
    // hand-move the wall: nothing changes until a step marks it, and the step itself leaves the grid alone
    Body* wall = w.getBody(1);
    w.liveBodyFloatData[GET_BODY_FDATA_INDEX(wall->worldIndex, BODY_FDATA_Y)] = 10.0f;
    std::vector<uint8_t> blockedBefore = n.grid->blocked;
    w.step();
    EXPECT_EQ(n.grid->blocked, blockedBefore);
    EXPECT_TRUE(n.anyDirty);
    uint32_t hv = n.hierarchy->version;
    n.sync();
    EXPECT_EQ(n.grid->blocked[mid], 0);
    EXPECT_EQ(n.grid->blocked[n.grid->indexOf(0, 10)], 1);
    EXPECT_GT(n.hierarchy->version, hv);
    // removal frees the cells
    w.removeObject(3);
    n.sync();
    EXPECT_EQ(n.grid->blocked[n.grid->indexOf(-20, -20)], 0);
    // incremental result == a world built with the wall at its new place from the start
    World w2;
    w2.setGravity(0.0f, 0.0f);
    NavSystem& n2 = w2.navSystem();
    n2.create(-40, -40, 40, 40, 1, 1.0, 0);
    addWall(w2, 1, 0, 10, 30, 2, 0, 2);
    n2.track(2, 0);
    n2.buildHierarchy(8, 6);
    EXPECT_EQ(n.grid->blocked, n2.grid->blocked);
    EXPECT_EQ(n.hierarchy->adjNode, n2.hierarchy->adjNode);
    EXPECT_EQ(n.hierarchy->adjCost, n2.hierarchy->adjCost);
    // untrack: back to the bare grid
    n.track(0, 0);
    n.sync();
    for (int i = 0; i < n.grid->size(); i++) ASSERT_EQ(n.grid->blocked[i], n.grid->base[i]);
}

// A world that never touches nav has no nav state, so the step does nothing extra.
TEST(Nav, OffByDefault) {
    World w;
    EXPECT_FALSE(w.navHasGrid());
    w.step();
    EXPECT_FALSE(w.navHasGrid());
}

// maxExpanded: a search that would need more nodes gives up (no path), like the JS planner.
TEST(Nav, MaxExpanded) {
    Scene s(81, 60, 1, 1.0, 0, 0, 0);
    s.n->findPathNow(-50, -50, 50, 50, nav::MODE_GRID, 10);
    EXPECT_EQ((int)s.n->out[2], nav::STATUS_NO_PATH);
    s.n->findPathNow(-50, -50, 50, 50, nav::MODE_GRID, 0);
    EXPECT_EQ((int)s.n->out[2], nav::STATUS_PATH);
}

TEST(Nav, JsHypot) {
    EXPECT_EQ(nav::jsHypot(3, 4), 5);
    EXPECT_EQ(nav::jsHypot(0, 0), 0);
    EXPECT_EQ(nav::jsHypot(-1e300, 1e300), std::sqrt(2.0) * 1e300);
}
