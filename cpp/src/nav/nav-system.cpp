// Per-world nav state (PER-871): the grid, its hierarchy, physics-world tracking (dirty-cell bookkeeping
// in the step, re-rasterised once per tick before pathfinding) and the batched request queue.
#include "nav.h"
#include "world.h"
#include "body.h"
#include "fixture.h"
#include "spatial-query.h"
#include <algorithm>
#include <cmath>

namespace nav {

static const int REQ_STRIDE = 8;   // [id, fx, fy, tx, ty, mode, maxExpanded, discCount]
static const int DISC_STRIDE = 3;  // [x, y, r]

static int64_t toBudget(double b) {
    if (!(b == b)) return 0;
    if (b >= (double)(INF_BUDGET / 2)) return INF_BUDGET;
    if (b <= 0) return 0;
    return (int64_t)std::floor(b);
}

void NavSystem::ioBegin() {
    bufPtr[0] = requestIn.data(); bufCap[0] = requestIn.size();
    bufPtr[1] = discIn.data();    bufCap[1] = discIn.size();
    bufPtr[2] = out.data();       bufCap[2] = out.capacity();
}

void NavSystem::ioEnd() {
    if (bufPtr[0] != requestIn.data() || bufCap[0] != requestIn.size() ||
        bufPtr[1] != discIn.data() || bufCap[1] != discIn.size() ||
        bufPtr[2] != out.data() || bufCap[2] != out.capacity()) {
        header[0]++;
    }
    header[1] = (int32_t)out.size();
    header[2] = (int32_t)queue.size();
    header[3] = (int32_t)std::min<int64_t>(lastExpanded, 0x7fffffff);
    header[4] = hierarchy ? hierarchy->nodeCount() : 0;
    header[5] = hierarchy ? hierarchy->edgeCount() : 0;
    header[6] = grid ? (int32_t)grid->staticVersion : 0;
    header[7] = hierarchy ? (int32_t)hierarchy->version : 0;
}

void NavSystem::create(double minX, double minY, double maxX, double maxY, double cell, double clearance, int flags) {
    ioBegin();
    destroy();
    grid.reset(new Grid(minX, minY, maxX, maxY, cell, clearance, flags));
    if (requestIn.empty()) requestIn.resize(64 * REQ_STRIDE, 0.0);
    if (discIn.empty()) discIn.resize(256 * DISC_STRIDE, 0.0);
    if (out.capacity() < 4096) out.reserve(4096);
    ioEnd();
    header[0]++; // new grid: base / blocked views moved
}

void NavSystem::destroy() {
    queue.clear();
    hierarchy.reset();
    grid.reset();
    tracked.clear();
    trackMask = 0;
    anyDirty = false;
    pendingRect[0] = pendingRect[1] = 1 << 30;
    pendingRect[2] = pendingRect[3] = -1;
}

void NavSystem::reserve(int requests, int discs) {
    ioBegin();
    if ((int)requestIn.size() < requests * REQ_STRIDE) requestIn.resize(std::max<size_t>(requests * REQ_STRIDE, requestIn.size() * 2), 0.0);
    if ((int)discIn.size() < discs * DISC_STRIDE) discIn.resize(std::max<size_t>(discs * DISC_STRIDE, discIn.size() * 2), 0.0);
    ioEnd();
}

void NavSystem::growRect(int c0, int r0, int c1, int r1) {
    if (c1 < c0 || r1 < r0) return;
    pendingRect[0] = std::min(pendingRect[0], c0); pendingRect[1] = std::min(pendingRect[1], r0);
    pendingRect[2] = std::max(pendingRect[2], c1); pendingRect[3] = std::max(pendingRect[3], r1);
}

void NavSystem::commitBase(int c0, int r0, int c1, int r1) {
    if (!grid) return;
    if (c0 < 0) { c0 = 0; r0 = 0; c1 = grid->cols - 1; r1 = grid->rows - 1; }
    growRect(c0, r0, c1, r1);
}

void NavSystem::addBox(double x, double y, double w, double h, double angle) {
    if (!grid) return;
    int rect[4] = {1 << 30, 1 << 30, -1, -1};
    grid->addBox(Box{x, y, w, h, angle}, rect);
    growRect(rect[0], rect[1], rect[2], rect[3]);
}

void NavSystem::addDisc(double x, double y, double r, double keepOut) {
    if (!grid) return;
    int rect[4] = {1 << 30, 1 << 30, -1, -1};
    grid->addDisc(Disc{x, y, r}, keepOut, rect);
    growRect(rect[0], rect[1], rect[2], rect[3]);
}

void NavSystem::buildHierarchy(int cluster, int wideEntrance) {
    if (!grid) return;
    ioBegin();
    // in-flight requests start over on the new hierarchy
    for (auto& r : queue) r->dispose(*grid);
    hierarchy.reset();
    sync();
    hierarchy.reset(new Hierarchy(grid.get(), cluster, wideEntrance));
    ioEnd();
}

// ---- physics-world tracking ----------------------------------------------------------------------

bool NavSystem::wantsTrack(const Fixture* f) const {
    if (!f || !f->body || trackMask == 0) return false;
    if ((f->getCategoryBits() & trackMask) == 0) return false;
    if (f->isSensor() && !(trackFlags & 1)) return false;
    return true;
}

static NavSystem::Tracked makeTracked(Fixture* f) {
    NavSystem::Tracked t;
    t.f = f;
    t.x = f->body->getX(); t.y = f->body->getY(); t.r = f->body->getRotation();
    t.minX = f->aabb.min.x; t.minY = f->aabb.min.y; t.maxX = f->aabb.max.x; t.maxY = f->aabb.max.y;
    t.dirty = true;
    t.removed = false;
    return t;
}

void NavSystem::track(uint32_t mask, int flags) {
    for (Tracked& t : tracked) { t.removed = true; t.dirty = true; t.f = nullptr; }
    anyDirty = !tracked.empty();
    trackMask = mask;
    trackFlags = flags;
    if (!grid || mask == 0) return;
    int n = world.getFixtureCount();
    for (int i = 0; i < n; i++) {
        Fixture* f = world.getFixtureAtIndex(i);
        if (wantsTrack(f)) { tracked.push_back(makeTracked(f)); anyDirty = true; }
    }
}

void NavSystem::onFixtureCreated(Fixture* f) {
    if (!grid || !wantsTrack(f)) return;
    tracked.push_back(makeTracked(f));
    anyDirty = true;
}

void NavSystem::onBodyRemoved(Body* b) {
    for (Tracked& t : tracked) {
        if (!t.removed && t.f && t.f->body == b) { t.removed = true; t.dirty = true; t.f = nullptr; anyDirty = true; }
    }
}

void NavSystem::onWorldCleared() {
    for (Tracked& t : tracked) { t.removed = true; t.dirty = true; t.f = nullptr; }
    if (!tracked.empty()) anyDirty = true;
}

// The only nav work inside World::step: note which tracked fixtures moved.
void NavSystem::afterStep() {
    for (Tracked& t : tracked) {
        if (t.removed || !t.f) continue;
        const Fixture* f = t.f;
        float x = f->body->getX(), y = f->body->getY(), r = f->body->getRotation();
        if (x != t.x || y != t.y || r != t.r || f->aabb.min.x != t.minX || f->aabb.min.y != t.minY ||
            f->aabb.max.x != t.maxX || f->aabb.max.y != t.maxY) {
            t.x = x; t.y = y; t.r = r;
            t.minX = f->aabb.min.x; t.minY = f->aabb.min.y; t.maxX = f->aabb.max.x; t.maxY = f->aabb.max.y;
            t.dirty = true;
            anyDirty = true;
        }
    }
}

static float shapeDistance(const QueryShape& s, const Vec2& p, bool& inside) {
    switch (s.kind) {
        case QueryShape::DISC: { float d = std::sqrt((p - s.a).magnitudeSquared()); inside = d <= s.r; return std::max(0.0f, d - s.r); }
        case QueryShape::CAPSULE: { float d = std::sqrt(sq::distSqPointSegment(p, s.a, s.b)); inside = d <= s.r; return std::max(0.0f, d - s.r); }
        case QueryShape::POLY: { inside = sq::pointInConvex(p, s.v, s.n); return inside ? 0.0f : std::sqrt(sq::distSqPointConvex(p, s.v, s.n)); }
    }
    inside = false;
    return 1e30f;
}

void NavSystem::rasterTracked(Tracked& t, bool add) {
    Grid& g = *grid;
    if (!add) {
        for (int c : t.cells) {
            g.trackCount[c]--;
            int cc = c % g.cols, rr = c / g.cols;
            growRect(cc, rr, cc, rr);
        }
        t.cells.clear();
        return;
    }
    if (!t.f) return;
    QueryShape shape;
    t.f->getQueryShape(shape);
    // Bounds of the shape itself (a hand-moved fixed body's broadphase AABB may lag behind its pose).
    float lx, ly, hx, hy;
    if (shape.kind == QueryShape::POLY) {
        lx = hx = shape.v[0].x; ly = hy = shape.v[0].y;
        for (int k = 1; k < shape.n; k++) {
            lx = std::min(lx, shape.v[k].x); hx = std::max(hx, shape.v[k].x);
            ly = std::min(ly, shape.v[k].y); hy = std::max(hy, shape.v[k].y);
        }
    } else {
        Vec2 b = shape.kind == QueryShape::CAPSULE ? shape.b : shape.a;
        lx = std::min(shape.a.x, b.x) - shape.r; hx = std::max(shape.a.x, b.x) + shape.r;
        ly = std::min(shape.a.y, b.y) - shape.r; hy = std::max(shape.a.y, b.y) + shape.r;
    }
    double pad = g.clearance + g.cell;
    int c0, r0, c1, r1;
    g.cellCoords(lx - pad, ly - pad, c0, r0);
    g.cellCoords(hx + pad, hy + pad, c1, r1);
    c0 = std::max(0, c0); r0 = std::max(0, r0); c1 = std::min(g.cols - 1, c1); r1 = std::min(g.rows - 1, r1);
    const float hc = (float)(g.cell / 2), clr = (float)g.clearance;
    for (int r = r0; r <= r1; r++) {
        for (int c = c0; c <= c1; c++) {
            int i = r * g.cols + c;
            Vec cp = g.center(i);
            Vec2 p((float)cp.x, (float)cp.y);
            bool inside = false;
            float d = shapeDistance(shape, p, inside);
            bool hit = inside || d < clr;
            if (!hit && g.touching) hit = sq::overlapsAabb(shape, Vec2(p.x - hc, p.y - hc), Vec2(p.x + hc, p.y + hc));
            if (!hit) continue;
            if (g.trackCount[i] < 0xffff) g.trackCount[i]++;
            t.cells.push_back(i);
            growRect(c, r, c, r);
        }
    }
}

void NavSystem::sync() {
    if (!grid) return;
    if (anyDirty) {
        for (Tracked& t : tracked) {
            if (!t.dirty) continue;
            rasterTracked(t, false);
            if (!t.removed) rasterTracked(t, true);
            t.dirty = false;
        }
        tracked.erase(std::remove_if(tracked.begin(), tracked.end(), [](const Tracked& t) { return t.removed; }), tracked.end());
        anyDirty = false;
    }
    if (pendingRect[2] >= pendingRect[0]) {
        int changed[4] = {1 << 30, 1 << 30, -1, -1};
        grid->refreshBlocked(pendingRect[0], pendingRect[1], pendingRect[2], pendingRect[3], changed);
        pendingRect[0] = pendingRect[1] = 1 << 30;
        pendingRect[2] = pendingRect[3] = -1;
        if (changed[2] >= changed[0]) {
            grid->staticVersion++;
            if (hierarchy) hierarchy->rebuild(changed[0], changed[1], changed[2], changed[3]);
        }
    }
}

// ---- requests ------------------------------------------------------------------------------------

void NavSystem::writeResult(const Request& r) {
    out.push_back((double)r.id);
    out.push_back((double)r.status);
    out.push_back((double)r.used);
    out.push_back(r.status == STATUS_PATH ? r.path.length : 0.0);
    int n = r.status == STATUS_PATH ? (int)r.path.points.size() : 0;
    out.push_back((double)n);
    for (int k = 0; k < n; k++) { out.push_back(r.path.points[k].x); out.push_back(r.path.points[k].y); }
}

int NavSystem::findPaths(double budgetD, double minSliceD, int newCount) {
    ioBegin();
    out.clear();
    out.push_back(0.0);
    if (!grid) { ioEnd(); return 0; }
    sync();
    newCount = std::max(0, std::min(newCount, (int)(requestIn.size() / REQ_STRIDE)));
    size_t discAt = 0;
    for (int k = 0; k < newCount; k++) {
        const double* q = &requestIn[k * REQ_STRIDE];
        std::unique_ptr<Request> r(new Request());
        r->id = (int)q[0];
        r->from = {q[1], q[2]};
        r->to = {q[3], q[4]};
        r->mode = (int)q[5];
        r->maxExpanded = q[6] > 0 ? toBudget(q[6]) : 200000;
        int nd = std::max(0, (int)q[7]);
        for (int d = 0; d < nd && (discAt + 1) * DISC_STRIDE <= discIn.size(); d++, discAt++) {
            const double* dd = &discIn[discAt * DISC_STRIDE];
            r->extra.push_back(Disc{dd[0], dd[1], dd[2]});
        }
        if (r->mode < MODE_GRID || r->mode > MODE_HPA_CORRIDOR) { r->done = true; r->status = STATUS_BAD_REQUEST; }
        queue.push_back(std::move(r));
    }
    const int64_t budget = toBudget(budgetD), minSlice = toBudget(minSliceD);
    const bool infinite = budget >= INF_BUDGET / 2;
    int64_t spent = 0;
    int results = 0;
    for (size_t qi = 0; qi < queue.size();) {
        Request& r = *queue[qi];
        if (!r.done) {
            int64_t leftB = infinite ? INF_BUDGET : budget - spent;
            int64_t slice = std::max(minSlice, leftB);
            if (slice <= 0) break;
            int64_t before = r.used;
            r.step(*grid, hierarchy.get(), slice);
            spent += r.used - before;
        }
        if (r.done) {
            writeResult(r);
            r.dispose(*grid);
            results++;
            queue.erase(queue.begin() + qi);
        } else {
            qi++;
        }
    }
    out[0] = (double)results;
    lastExpanded = spent;
    ioEnd();
    return results;
}

int NavSystem::findPathNow(double fx, double fy, double tx, double ty, int mode, double maxExpanded) {
    ioBegin();
    out.clear();
    out.push_back(0.0);
    if (!grid) { ioEnd(); return STATUS_BAD_REQUEST; }
    sync();
    Request r;
    r.id = 0;
    r.from = {fx, fy};
    r.to = {tx, ty};
    r.mode = mode;
    r.maxExpanded = maxExpanded > 0 ? toBudget(maxExpanded) : 200000;
    if (mode < MODE_GRID || mode > MODE_HPA_CORRIDOR) { r.done = true; r.status = STATUS_BAD_REQUEST; }
    else r.step(*grid, hierarchy.get(), INF_BUDGET);
    r.dispose(*grid);
    writeResult(r);
    out[0] = 1.0;
    lastExpanded = r.used;
    ioEnd();
    return r.status;
}

void NavSystem::cancel(int id) {
    for (size_t k = 0; k < queue.size(); k++) {
        if (queue[k]->id != id) continue;
        if (grid) queue[k]->dispose(*grid);
        queue.erase(queue.begin() + k);
        break;
    }
    header[2] = (int32_t)queue.size();
}

void NavSystem::clearRequests() {
    for (auto& r : queue) if (grid) r->dispose(*grid);
    queue.clear();
    header[2] = 0;
}

} // namespace nav
