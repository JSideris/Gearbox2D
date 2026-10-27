// Native grid A* and HPA* (PER-871). A line-for-line port of gear3engine g3e-ai astar.ts, nav-grid.ts and
// nav-hierarchy.ts (gear3engine develop 339add4): same edge order, heuristic, tie rules, snapping and string
// pulling, in double precision, so results are bit-identical to the JS planner on the same grid.
#if defined(__clang__)
#pragma clang fp contract(off)
#elif defined(__GNUC__)
#pragma GCC optimize("fp-contract=off")
#endif

#include "nav.h"
#include <algorithm>
#include <cmath>
#include <limits>

namespace nav {

static const double INF = std::numeric_limits<double>::infinity();

double jsHypot(double a, double b) {
    a = std::fabs(a);
    b = std::fabs(b);
    if (a == INF || b == INF) return INF;
    double m = a > b ? a : b;
    if (std::isnan(a) || std::isnan(b)) return std::numeric_limits<double>::quiet_NaN();
    if (m == 0) return 0;
    double x = a / m, y = b / m;
    double xx = x * x, yy = y * y;
    return std::sqrt(xx + yy) * m;
}

static inline int floorDivInt(int a, int b) { return (a >= 0) ? a / b : -((-a + b - 1) / b); }

// ---- OpenHeap ----------------------------------------------------------------------------------

void OpenHeap::push(int id, double f, double h) {
    if (plain) {
        if ((size_t)(2 * n) >= e.size()) e.resize(std::max<size_t>(128, e.size() * 2));
        double* E = e.data();
        int i = n++;
        while (i > 0) {
            int p = (i - 1) >> 1;
            double kp = E[2 * p];
            if (kp <= f) break;
            E[2 * i] = kp;
            E[2 * i + 1] = E[2 * p + 1];
            i = p;
        }
        E[2 * i] = f;
        E[2 * i + 1] = (double)id;
        return;
    }
    if ((size_t)n >= ids.size()) {
        size_t cap = std::max<size_t>(64, ids.size() * 2);
        ids.resize(cap); fv.resize(cap); hv.resize(cap); ov.resize(cap);
    }
    int* I = ids.data();
    double *F = fv.data(), *H = hv.data(), *O = ov.data();
    double o = counter++;
    int i = n++;
    while (i > 0) {
        int p = (i - 1) >> 1;
        double fp = F[p];
        if (f > fp || (f == fp && (h > H[p] || (h == H[p] && o > O[p])))) break;
        I[i] = I[p]; F[i] = fp; H[i] = H[p]; O[i] = O[p];
        i = p;
    }
    I[i] = id; F[i] = f; H[i] = h; O[i] = o;
}

int OpenHeap::pop() {
    if (plain) {
        double* E = e.data();
        int top = (int)E[1];
        int m = --n;
        double key = E[2 * m], id = E[2 * m + 1];
        if (m > 0) {
            int i = 0;
            for (;;) {
                int c = 2 * i + 1;
                if (c >= m) break;
                double kc = E[2 * c];
                if (c + 1 < m) { double k2 = E[2 * c + 2]; if (k2 < kc) { c++; kc = k2; } }
                if (kc >= key) break;
                E[2 * i] = kc;
                E[2 * i + 1] = E[2 * c + 1];
                i = c;
            }
            E[2 * i] = key;
            E[2 * i + 1] = id;
        }
        return top;
    }
    int* I = ids.data();
    double *F = fv.data(), *H = hv.data(), *O = ov.data();
    int top = I[0];
    int m = --n;
    if (m > 0) {
        int id = I[m];
        double f = F[m], h = H[m], o = O[m];
        int i = 0;
        for (;;) {
            int l = 2 * i + 1;
            if (l >= m) break;
            int mm = l;
            int r = l + 1;
            if (r < m && (F[r] < F[l] || (F[r] == F[l] && (H[r] < H[l] || (H[r] == H[l] && O[r] < O[l]))))) mm = r;
            if (!(F[mm] < f || (F[mm] == f && (H[mm] < h || (H[mm] == h && O[mm] < o))))) break;
            I[i] = I[mm]; F[i] = F[mm]; H[i] = H[mm]; O[i] = O[mm];
            i = mm;
        }
        I[i] = id; F[i] = f; H[i] = h; O[i] = o;
    }
    return top;
}

// ---- Search ------------------------------------------------------------------------------------

template <class G> static int maxDegreeOf(const G&) { return 8; }
static int maxDegreeOf(const AbstractQuery& q) {
    int d = q.hq->maxDeg + 1;
    return std::max(d, (int)q.startTo.size());
}

template <class G>
void Search<G>::start(const G* g, Scratch* s, int startNode, int goalNode, int64_t maxExp, bool plainTies) {
    graph = g;
    scratch = s;
    goal = goalNode;
    maxExpanded = maxExp;
    expanded = 0;
    result = -1;
    cost = 0;
    path.clear();
    s->heap->plain = plainTies;
    s->heap->clear();
    Book& b = *s->book;
    b.g[startNode] = 0; b.came[startNode] = -1; b.stamp[startNode] = b.gen;
    double h0 = g->heuristic(startNode, goalNode);
    s->heap->push(startNode, h0, h0);
}

template <class G>
int Search<G>::run(int64_t slice) {
    if (result != -1) return result;
    if (slice < 1) slice = 1;
    const G& g = *graph;
    Book& b = *scratch->book;
    OpenHeap& open = *scratch->heap;
    double* Gv = b.g.data();
    int* came = b.came.data();
    uint32_t* stamp = b.stamp.data();
    const uint32_t gen = b.gen, closedGen = gen + 1;
    int deg = maxDegreeOf(g);
    int nodesBuf[64];
    double costsBuf[64];
    std::vector<int> nodesV;
    std::vector<double> costsV;
    int* nodes = nodesBuf;
    double* costs = costsBuf;
    if (deg > 64) { nodesV.resize(deg); costsV.resize(deg); nodes = nodesV.data(); costs = costsV.data(); }
    int64_t done = 0;
    while (open.size()) {
        if (done >= slice) return -1;
        int cur = open.pop();
        if (stamp[cur] == closedGen) continue;
        if (cur == goal) {
            path.clear();
            path.push_back(cur);
            for (int n = came[cur]; n >= 0; n = came[n]) path.push_back(n);
            std::reverse(path.begin(), path.end());
            cost = Gv[goal];
            return result = 1;
        }
        stamp[cur] = closedGen;
        done++;
        if (++expanded > maxExpanded) return result = 0;
        double gc = Gv[cur];
        int k = g.neighborsInto(cur, nodes, costs);
        for (int e = 0; e < k; e++) {
            int node = nodes[e];
            double c = costs[e];
            uint32_t sn = stamp[node];
            if (sn == closedGen) continue;
            double t = gc + c;
            if (t < (sn >= gen ? Gv[node] : INF)) {
                Gv[node] = t; came[node] = cur; stamp[node] = gen;
                double h = g.heuristic(node, goal);
                open.push(node, t + h, h);
            }
        }
    }
    return result = 0;
}

template struct Search<GridGraph>;
template struct Search<RegionGraph>;
template struct Search<AbstractQuery>;
template struct Search<CorridorGraph>;

// ---- Graphs ------------------------------------------------------------------------------------

int GridGraph::size() const { return g->size(); }
int GridGraph::neighborsInto(int i, int* nodes, double* costs) const { return g->neighborsInto(i, nodes, costs); }
double GridGraph::heuristic(int a, int b) const { return g->heuristic(a, b); }

bool RegionGraph::freeAt(int lc, int lr) const {
    return lc >= 0 && lr >= 0 && lc < w && lr < h && g->blocked[(lr + r0) * cols + lc + c0] != 1;
}

int RegionGraph::neighborsInto(int i, int* nodes, double* costs) const {
    int lr = i / w, lc = i - lr * w;
    double straight = cell, diag = SQRT2 * cell;
    bool up = freeAt(lc, lr - 1), down = freeAt(lc, lr + 1), left = freeAt(lc - 1, lr), right = freeAt(lc + 1, lr);
    int k = 0;
    if (up) {
        if (left && freeAt(lc - 1, lr - 1)) { nodes[k] = i - w - 1; costs[k++] = diag; }
        nodes[k] = i - w; costs[k++] = straight;
        if (right && freeAt(lc + 1, lr - 1)) { nodes[k] = i - w + 1; costs[k++] = diag; }
    }
    if (left) { nodes[k] = i - 1; costs[k++] = straight; }
    if (right) { nodes[k] = i + 1; costs[k++] = straight; }
    if (down) {
        if (left && freeAt(lc - 1, lr + 1)) { nodes[k] = i + w - 1; costs[k++] = diag; }
        nodes[k] = i + w; costs[k++] = straight;
        if (right && freeAt(lc + 1, lr + 1)) { nodes[k] = i + w + 1; costs[k++] = diag; }
    }
    return k;
}

double RegionGraph::heuristic(int a, int b) const {
    int ra = a / w, rb = b / w;
    double dx = std::abs((a - ra * w) - (b - rb * w)), dy = std::abs(ra - rb);
    return (std::max(dx, dy) + (SQRT2 - 1) * std::min(dx, dy)) * cell;
}

void AbstractQuery::init(const Hierarchy* h) {
    hq = h;
    startId = h->nodeCount();
    goalId = h->nodeCount() + 1;
    goalAt.assign(h->nodeCount(), -1);
    goalNodes.clear();
}

void AbstractQuery::reset(int s, int g) {
    sc = s; gc = g;
    for (int n : goalNodes) goalAt[n] = -1;
    startTo.clear(); startCost.clear(); startPath.clear();
    goalNodes.clear(); goalCost.clear(); goalPath.clear();
}

void AbstractQuery::addStart(int to, double cost, std::vector<int>&& path) {
    startTo.push_back(to); startCost.push_back(cost); startPath.push_back(std::move(path));
}

void AbstractQuery::addGoal(int from, double cost, std::vector<int>&& path) {
    goalAt[from] = (int)goalNodes.size();
    goalNodes.push_back(from); goalCost.push_back(cost); goalPath.push_back(std::move(path));
}

int AbstractQuery::cellOf(int n) const { return n == startId ? sc : n == goalId ? gc : hq->nodeCell[n]; }

double AbstractQuery::heuristic(int a, int b) const { return hq->grid->heuristic(cellOf(a), cellOf(b)); }

int AbstractQuery::neighborsInto(int n, int* nodes, double* costs) const {
    if (n == startId) {
        for (size_t e = 0; e < startTo.size(); e++) { nodes[e] = startTo[e]; costs[e] = startCost[e]; }
        return (int)startTo.size();
    }
    if (n == goalId) return 0;
    int s = hq->adjStart[n], e = hq->adjStart[n + 1], k = 0;
    for (int i = s; i < e; i++) { nodes[k] = hq->adjNode[i]; costs[k++] = hq->adjCost[i]; }
    int gi = goalAt[n];
    if (gi >= 0) { nodes[k] = goalId; costs[k++] = goalCost[gi]; }
    return k;
}

void AbstractQuery::stitch(const std::vector<int>& path, std::vector<int>& cells) const {
    cells.clear();
    cells.push_back(sc);
    auto add = [&](const int* seg, int len) { for (int i = 1; i < len; i++) cells.push_back(seg[i]); };
    for (size_t p = 0; p + 1 < path.size(); p++) {
        int a = path[p], b = path[p + 1];
        if (a == startId) {
            size_t idx = std::find(startTo.begin(), startTo.end(), b) - startTo.begin();
            add(startPath[idx].data(), (int)startPath[idx].size());
            continue;
        }
        if (b == goalId) { const auto& gp = goalPath[goalAt[a]]; add(gp.data(), (int)gp.size()); continue; }
        for (int i = hq->adjStart[a]; i < hq->adjStart[a + 1]; i++) {
            if (hq->adjNode[i] != b) continue;
            if (hq->adjPathLen[i] > 0) add(&hq->adjPathCells[hq->adjPathStart[i]], hq->adjPathLen[i]);
            else cells.push_back(hq->nodeCell[b]);
            break;
        }
    }
}

int CorridorGraph::size() const { return g->size(); }

void CorridorGraph::open(const std::vector<int>& cells) {
    for (int c : cells) hq->markAround(mask, c);
}

int CorridorGraph::neighborsInto(int i, int* nodes, double* costs) const {
    int k = g->neighborsInto(i, nodes, costs), m = 0;
    for (int e = 0; e < k; e++) if (mask[hq->clusterOf(nodes[e])] == 1) { nodes[m] = nodes[e]; costs[m++] = costs[e]; }
    return m;
}

double CorridorGraph::heuristic(int a, int b) const { return g->heuristic(a, b); }

// ---- Geometry (g3e-ai geometry2.ts) --------------------------------------------------------------

static double distToBox(Vec p, const Box& b) {
    double c = std::cos(-b.angle), s = std::sin(-b.angle);
    double dx = p.x - b.x, dy = p.y - b.y;
    double lx = std::fabs(dx * c - dy * s) - b.w / 2;
    double ly = std::fabs(dx * s + dy * c) - b.h / 2;
    return jsHypot(std::max(0.0, lx), std::max(0.0, ly)) + std::min(0.0, std::max(lx, ly));
}

static bool boxOverlapsRect(const Box& b, double minX, double minY, double maxX, double maxY) {
    double c = std::cos(b.angle), s = std::sin(b.angle);
    double hw = b.w / 2, hh = b.h / 2;
    double ex = std::fabs(c) * hw + std::fabs(s) * hh, ey = std::fabs(s) * hw + std::fabs(c) * hh;
    if (b.x + ex < minX || b.x - ex > maxX || b.y + ey < minY || b.y - ey > maxY) return false;
    double rx = (maxX - minX) / 2, ry = (maxY - minY) / 2, cx = (minX + maxX) / 2 - b.x, cy = (minY + maxY) / 2 - b.y;
    const double axes[2][3] = {{c, s, hw}, {-s, c, hh}};
    for (const auto& ax : axes) {
        double d = std::fabs(cx * ax[0] + cy * ax[1]), r = rx * std::fabs(ax[0]) + ry * std::fabs(ax[1]);
        if (d > ax[2] + r) return false;
    }
    return true;
}

static bool discOverlapsRect(const Disc& d, double minX, double minY, double maxX, double maxY) {
    double nx = std::max(minX, std::min(maxX, d.x)), ny = std::max(minY, std::min(maxY, d.y));
    return jsHypot(d.x - nx, d.y - ny) <= d.r;
}

// ---- Grid --------------------------------------------------------------------------------------

Grid::Grid(double mnX, double mnY, double mxX, double mxY, double cl, double clr, int flags)
    : minX(mnX), minY(mnY), maxX(mxX), maxY(mxY), cell(cl), clearance(clr) {
    cols = (int)std::ceil((maxX - minX) / cell);
    rows = (int)std::ceil((maxY - minY) / cell);
    touching = (flags & GRID_RASTER_CENTERS) == 0;
    atGoalEmpty = (flags & GRID_AT_GOAL_EMPTY) != 0;
    outsidePoint = (flags & GRID_NEAREST_OUTSIDE_POINT) != 0;
    plainTies = (flags & GRID_TIES_HEAP) != 0;
    int n = size();
    base.assign(n, 0);
    trackCount.assign(n, 0);
    dyn.assign(n, 0);
    dynList.reserve(64);
    if ((flags & GRID_NO_BLOCK_EDGES) == 0) {
        for (int i = 0; i < n; i++) {
            Vec p = center(i);
            if (p.x < minX + clearance || p.x > maxX - clearance || p.y < minY + clearance || p.y > maxY - clearance) base[i] = 1;
        }
    }
    blocked = base;
}

void Grid::cellCoords(double x, double y, int& c, int& r) const {
    double fc = std::floor((x - minX) / cell), fr = std::floor((y - minY) / cell);
    // clamp far-away points into int range; anything outside the grid is out of range either way
    const double lim = 1e9;
    c = (int)std::max(-lim, std::min(lim, fc));
    r = (int)std::max(-lim, std::min(lim, fr));
}

int Grid::indexOf(double x, double y) const {
    int c, r;
    cellCoords(x, y, c, r);
    if (c < 0 || r < 0 || c >= cols || r >= rows) return -1;
    return r * cols + c;
}

Vec Grid::center(int i) const {
    int c = i % cols, r = i / cols;
    return {minX + (c + 0.5) * cell, minY + (r + 0.5) * cell};
}

static void growRect4(int rect[4], int c, int r) {
    rect[0] = std::min(rect[0], c); rect[1] = std::min(rect[1], r);
    rect[2] = std::max(rect[2], c); rect[3] = std::max(rect[3], r);
}

void Grid::addBox(const Box& b, int rect[4]) {
    double R = jsHypot(b.w, b.h) / 2 + clearance;
    int c0, r0, c1, r1;
    cellCoords(b.x - R, b.y - R, c0, r0);
    cellCoords(b.x + R, b.y + R, c1, r1);
    double hc = cell / 2;
    for (int r = std::max(0, r0); r <= std::min(rows - 1, r1); r++) {
        for (int c = std::max(0, c0); c <= std::min(cols - 1, c1); c++) {
            int i = r * cols + c;
            Vec p = center(i);
            if (distToBox(p, b) < clearance || (touching && boxOverlapsRect(b, p.x - hc, p.y - hc, p.x + hc, p.y + hc))) {
                if (base[i] != 1) { base[i] = 1; growRect4(rect, c, r); }
            }
        }
    }
}

void Grid::addDisc(const Disc& d, double keepOut, int rect[4]) {
    double R = d.r + keepOut + clearance;
    int c0, r0, c1, r1;
    cellCoords(d.x - R, d.y - R, c0, r0);
    cellCoords(d.x + R, d.y + R, c1, r1);
    double hc = cell / 2;
    for (int r = std::max(0, r0); r <= std::min(rows - 1, r1); r++) {
        for (int c = std::max(0, c0); c <= std::min(cols - 1, c1); c++) {
            int i = r * cols + c;
            Vec p = center(i);
            if (jsHypot(p.x - d.x, p.y - d.y) < R || (touching && discOverlapsRect(d, p.x - hc, p.y - hc, p.x + hc, p.y + hc))) {
                if (base[i] != 1) { base[i] = 1; growRect4(rect, c, r); }
            }
        }
    }
}

void Grid::refreshBlocked(int c0, int r0, int c1, int r1, int changed[4]) {
    c0 = std::max(0, c0); r0 = std::max(0, r0); c1 = std::min(cols - 1, c1); r1 = std::min(rows - 1, r1);
    for (int r = r0; r <= r1; r++) {
        for (int c = c0; c <= c1; c++) {
            int i = r * cols + c;
            uint8_t v = (base[i] == 1 || trackCount[i] > 0) ? 1 : 0;
            if (v != blocked[i]) { blocked[i] = v; growRect4(changed, c, r); }
        }
    }
}

void Grid::rasterDynamic(const Disc& d) {
    double R = d.r + clearance;
    int c0, r0, c1, r1;
    cellCoords(d.x - R, d.y - R, c0, r0);
    cellCoords(d.x + R, d.y + R, c1, r1);
    int rEnd = std::min(rows - 1, r1), cEnd = std::min(cols - 1, c1), cStart = std::max(0, c0);
    double hc = cell / 2;
    for (int r = std::max(0, r0); r <= rEnd; r++) {
        double py = minY + (r + 0.5) * cell;
        for (int c = cStart; c <= cEnd; c++) {
            int i = r * cols + c;
            if (dyn[i] == 1) continue;
            double px = minX + (c + 0.5) * cell;
            if (jsHypot(px - d.x, py - d.y) < R || (touching && discOverlapsRect(d, px - hc, py - hc, px + hc, py + hc))) {
                dyn[i] = 1;
                dynList.push_back(i);
            }
        }
    }
}

void Grid::setDynamic(const Disc* d, int n) {
    for (int k : dynList) dyn[k] = 0;
    dynList.clear();
    layerStarts.clear();
    for (int i = 0; i < n; i++) rasterDynamic(d[i]);
    dynVersion++;
}

void Grid::pushDynamic(const Disc* d, int n) {
    layerStarts.push_back((int)dynList.size());
    for (int i = 0; i < n; i++) rasterDynamic(d[i]);
    dynVersion++;
}

void Grid::popDynamic() {
    if (layerStarts.empty()) return;
    int start = layerStarts.back();
    layerStarts.pop_back();
    for (size_t k = start; k < dynList.size(); k++) dyn[dynList[k]] = 0;
    dynList.resize(start);
    dynVersion++;
}

bool Grid::nearestFree(Vec p, int maxRadius, bool staticOnly, Vec& out) const {
    auto isB = [&](int i) { return staticOnly ? blocked[i] == 1 : isBlocked(i); };
    int pc, pr;
    cellCoords(p.x, p.y, pc, pr);
    int c0 = std::max(0, std::min(cols - 1, pc)), r0 = std::max(0, std::min(rows - 1, pr));
    if (pc == c0 && pr == r0 && !isB(r0 * cols + c0)) { out = p; return true; }
    if (!isB(r0 * cols + c0)) { out = outsidePoint ? p : center(r0 * cols + c0); return true; }
    for (int rad = 1; rad <= maxRadius; rad++) {
        int best = -1;
        double bestD = INF;
        for (int dr = -rad; dr <= rad; dr++) {
            for (int dc = -rad; dc <= rad; dc++) {
                if (std::max(std::abs(dr), std::abs(dc)) != rad) continue;
                int r = r0 + dr, c = c0 + dc;
                if (r < 0 || c < 0 || r >= rows || c >= cols) continue;
                int i = r * cols + c;
                if (isB(i)) continue;
                double d = dr * dr + dc * dc;
                if (d < bestD) { bestD = d; best = i; }
            }
        }
        if (best >= 0) { out = center(best); return true; }
    }
    return false;
}

bool Grid::walkable(Vec a, Vec b, bool staticOnly) const {
    double d = jsHypot(b.x - a.x, b.y - a.y);
    double nd = std::max(1.0, std::ceil(d / (cell * 0.25)));
    int64_t n = (int64_t)nd;
    const uint8_t* B = blocked.data();
    const uint8_t* D = dyn.data();
    for (int64_t k = 0; k <= n; k++) {
        double t = (double)k / nd;
        double fc = std::floor((a.x + (b.x - a.x) * t - minX) / cell), fr = std::floor((a.y + (b.y - a.y) * t - minY) / cell);
        if (fc < 0 || fr < 0 || fc >= cols || fr >= rows) return false;
        int i = (int)fr * cols + (int)fc;
        if (B[i] == 1) return false;
        if (!staticOnly && D[i] == 1) return false;
    }
    return true;
}

void Grid::smoothBy(const std::vector<Vec>& pts, bool staticOnly, std::vector<Vec>& out) const {
    out.clear();
    if (pts.size() <= 2) { out = pts; return; }
    out.push_back(pts[0]);
    size_t i = 0;
    while (i < pts.size() - 1) {
        size_t j = i + 1;
        while (j + 1 < pts.size() && walkable(pts[i], pts[j + 1], staticOnly)) j++;
        out.push_back(pts[j]);
        i = j;
    }
}

void Grid::smoothGallop(const std::vector<Vec>& pts, bool staticOnly, std::vector<Vec>& out) const {
    out.clear();
    int n = (int)pts.size();
    if (n <= 2) { out = pts; return; }
    out.push_back(pts[0]);
    int i = 0;
    while (i < n - 1) {
        int ok = i + 1, bad = -1;
        int64_t step = 2;
        for (;;) {
            int j = (int)std::min<int64_t>(n - 1, i + step);
            if (walkable(pts[i], pts[j], staticOnly)) { ok = j; if (j == n - 1) break; step *= 2; }
            else { bad = j; break; }
        }
        if (bad > 0) {
            int lo = ok, hi = bad;
            while (hi - lo > 1) { int m = (lo + hi) >> 1; if (walkable(pts[i], pts[m], staticOnly)) lo = m; else hi = m; }
            ok = lo;
        }
        out.push_back(pts[ok]);
        i = ok;
    }
}

void Grid::finishCells(const std::vector<int>& cellsIn, Vec from, Vec s, Vec g, bool staticOnly, bool gallop, NavPath& out) const {
    std::vector<Vec> raw(cellsIn.size());
    for (size_t k = 0; k < cellsIn.size(); k++) raw[k] = center(cellsIn[k]);
    raw[0] = s;
    raw[raw.size() - 1] = g;
    std::vector<Vec> pts;
    if (gallop) smoothGallop(raw, staticOnly, pts); else smoothBy(raw, staticOnly, pts);
    out.points.assign(pts.begin() + (pts.empty() ? 0 : 1), pts.end());
    if (out.points.empty() && !atGoalEmpty) out.points.push_back(g);
    double length = 0;
    Vec prev = from;
    for (const Vec& p : out.points) { length += jsHypot(p.x - prev.x, p.y - prev.y); prev = p; }
    out.length = length;
}

double Grid::heuristic(int a, int b) const {
    int ra = a / cols, rb = b / cols;
    double dx = std::abs((a - ra * cols) - (b - rb * cols));
    double dy = std::abs(ra - rb);
    return (std::max(dx, dy) + (SQRT2 - 1) * std::min(dx, dy)) * cell;
}

int Grid::neighborsInto(int i, int* nodes, double* costs) const {
    const uint8_t* B = blocked.data();
    const uint8_t* D = dyn.data();
    int c = i % cols, r = i / cols;
    double straight = cell, diag = SQRT2 * cell;
    int k = 0;
    bool hasUp = r > 0, hasDown = r + 1 < rows, hasLeft = c > 0, hasRight = c + 1 < cols;
    int iu = i - cols, id = i + cols;
    bool up = hasUp && B[iu] != 1 && D[iu] != 1;
    bool down = hasDown && B[id] != 1 && D[id] != 1;
    bool left = hasLeft && B[i - 1] != 1 && D[i - 1] != 1;
    bool right = hasRight && B[i + 1] != 1 && D[i + 1] != 1;
    if (up) {
        if (left && B[iu - 1] != 1 && D[iu - 1] != 1) { nodes[k] = iu - 1; costs[k++] = diag; }
        nodes[k] = iu; costs[k++] = straight;
        if (right && B[iu + 1] != 1 && D[iu + 1] != 1) { nodes[k] = iu + 1; costs[k++] = diag; }
    }
    if (left) { nodes[k] = i - 1; costs[k++] = straight; }
    if (right) { nodes[k] = i + 1; costs[k++] = straight; }
    if (down) {
        if (left && B[id - 1] != 1 && D[id - 1] != 1) { nodes[k] = id - 1; costs[k++] = diag; }
        nodes[k] = id; costs[k++] = straight;
        if (right && B[id + 1] != 1 && D[id + 1] != 1) { nodes[k] = id + 1; costs[k++] = diag; }
    }
    return k;
}

Scratch* Grid::takeScratch(int n) {
    size_t best = pool.size();
    for (size_t k = 0; k < pool.size(); k++) {
        int cap = pool[k]->book->capacity();
        if (cap >= n && (best == pool.size() || cap < pool[best]->book->capacity())) best = k;
    }
    std::unique_ptr<Scratch> s;
    if (best < pool.size()) {
        s = std::move(pool[best]);
        pool.erase(pool.begin() + best);
    } else {
        s.reset(new Scratch());
        s->book.reset(new Book(n));
        s->heap.reset(new OpenHeap());
    }
    s->book->begin();
    s->heap->clear();
    Scratch* raw = s.get();
    lent.push_back(std::move(s));
    return raw;
}

void Grid::giveScratch(Scratch* s) {
    if (!s) return;
    for (size_t k = 0; k < lent.size(); k++) {
        if (lent[k].get() != s) continue;
        std::unique_ptr<Scratch> own = std::move(lent[k]);
        lent.erase(lent.begin() + k);
        if (pool.size() < 16) pool.push_back(std::move(own));
        return;
    }
}

// ---- Hierarchy ---------------------------------------------------------------------------------

Hierarchy::Hierarchy(Grid* g, int clusterSize, int wideEntrance) : grid(g) {
    cluster = std::max(2, clusterSize);
    wide = std::max(1, wideEntrance);
    ccols = (g->cols + cluster - 1) / cluster;
    crows = (g->rows + cluster - 1) / cluster;
    nodeOf.assign(g->size(), -1);
    intra.assign(ccols * crows, IntraCache());
    regions.assign(ccols * crows, RegionGraph());
    regionMade.assign(ccols * crows, 0);
    build(nullptr);
}

const RegionGraph& Hierarchy::region(int cl) {
    if (!regionMade[cl]) {
        RegionGraph& r = regions[cl];
        r.g = grid;
        r.c0 = (cl % ccols) * cluster;
        r.r0 = (cl / ccols) * cluster;
        r.w = std::min(cluster, grid->cols - r.c0);
        r.h = std::min(cluster, grid->rows - r.r0);
        r.cols = grid->cols;
        r.cell = grid->cell;
        regionMade[cl] = 1;
    }
    return regions[cl];
}

void Hierarchy::markAround(std::vector<uint8_t>& mask, int cell) const {
    int cl = clusterOf(cell), cc = cl % ccols, cr = cl / ccols;
    for (int r = std::max(0, cr - 1); r <= std::min(crows - 1, cr + 1); r++)
        for (int c = std::max(0, cc - 1); c <= std::min(ccols - 1, cc + 1); c++) mask[r * ccols + c] = 1;
}

void Hierarchy::rebuild(int c0, int r0, int c1, int r1) {
    int n = ccols * crows;
    std::vector<uint8_t> mask(n, 0);
    if (c0 < 0) {
        std::fill(mask.begin(), mask.end(), 1);
    } else {
        int k = cluster;
        int cc0 = std::max(0, floorDivInt(c0 - 1, k)), cc1 = std::min(ccols - 1, floorDivInt(c1 + 1, k));
        int cr0 = std::max(0, floorDivInt(r0 - 1, k)), cr1 = std::min(crows - 1, floorDivInt(r1 + 1, k));
        for (int cr = cr0; cr <= cr1; cr++) for (int cc = cc0; cc <= cc1; cc++) mask[cr * ccols + cc] = 1;
    }
    build(&mask);
    version++;
}

void Hierarchy::build(const std::vector<uint8_t>* dirty) {
    Grid& g = *grid;
    const int k = cluster, cols = g.cols, rows = g.rows;
    const uint8_t* blocked = g.blocked.data();
    for (int c : nodeCell) nodeOf[c] = -1;
    std::vector<int> cells;
    std::vector<int> inter;
    auto node = [&](int cell) {
        int id = nodeOf[cell];
        if (id < 0) { id = nodeOf[cell] = (int)cells.size(); cells.push_back(cell); }
        return id;
    };
    auto transitions = [&](int len, auto at) {
        int t = 0;
        while (t < len) {
            int a0, b0;
            at(t, a0, b0);
            if (blocked[a0] == 1 || blocked[b0] == 1) { t++; continue; }
            int e = t;
            while (e + 1 < len) { int a, b; at(e + 1, a, b); if (blocked[a] == 1 || blocked[b] == 1) break; e++; }
            int run = e - t + 1;
            int picks[2], np = 0;
            if (run >= wide) { if (run == 1) picks[np++] = t; else { picks[np++] = t; picks[np++] = e; } }
            else picks[np++] = t + ((run - 1) >> 1);
            for (int q = 0; q < np; q++) {
                int a, b;
                at(picks[q], a, b);
                int na = node(a);
                int nb = node(b);
                inter.push_back(na);
                inter.push_back(nb);
            }
            t = e + 1;
        }
    };
    for (int cr = 0; cr < crows; cr++) {
        for (int cc = 0; cc < ccols; cc++) {
            int c0 = cc * k, r0 = cr * k, w = std::min(k, cols - c0), h = std::min(k, rows - r0);
            if (c0 + w < cols) {
                int ca = c0 + w - 1;
                transitions(h, [&](int t, int& a, int& b) { a = (r0 + t) * cols + ca; b = (r0 + t) * cols + ca + 1; });
            }
            if (r0 + h < rows) {
                int ra = r0 + h - 1;
                transitions(w, [&](int t, int& a, int& b) { a = ra * cols + c0 + t; b = (ra + 1) * cols + c0 + t; });
            }
        }
    }
    const int N = (int)cells.size();
    nodeCell = cells;
    const int ncl = ccols * crows;
    std::vector<int> clCount(ncl + 1, 0), nodeCl(N);
    for (int i = 0; i < N; i++) { nodeCl[i] = clusterOf(cells[i]); clCount[nodeCl[i] + 1]++; }
    for (int c = 0; c < ncl; c++) clCount[c + 1] += clCount[c];
    clStart = clCount;
    std::vector<int> fill(clCount.begin(), clCount.begin() + ncl);
    clNodes.assign(N, 0);
    for (int i = 0; i < N; i++) clNodes[fill[nodeCl[i]]++] = i;

    struct OutEdge { int to; double cost; int cl; int pair; bool rev; };
    std::vector<std::vector<OutEdge>> out(N);
    const double straight = g.cell;
    for (size_t e = 0; e < inter.size(); e += 2) {
        int a = inter[e], b = inter[e + 1];
        out[a].push_back({b, straight, -1, -1, false});
        out[b].push_back({a, straight, -1, -1, false});
    }
    const bool plain = g.plainTies;
    Scratch* sc = nullptr;
    Search<RegionGraph> search;
    for (int cl = 0; cl < ncl; cl++) {
        int s = clStart[cl], e = clStart[cl + 1];
        std::vector<int> here;
        here.reserve(e - s);
        for (int q = s; q < e; q++) here.push_back(cells[clNodes[q]]);
        IntraCache& cache = intra[cl];
        if (!cache.valid || (dirty && (*dirty)[cl]) || cache.cells != here) {
            const RegionGraph& reg = region(cl);
            if (!sc) sc = g.takeScratch(cluster * cluster);
            std::vector<IntraPair> pairs;
            for (size_t i = 0; i < here.size(); i++) {
                for (size_t j = i + 1; j < here.size(); j++) {
                    sc->book->begin();
                    search.start(&reg, sc, reg.local(here[i]), reg.local(here[j]), 200000, plain);
                    int r = search.run(INF_BUDGET);
                    buildExpanded += search.expanded;
                    if (r == 1) {
                        IntraPair p{(int)i, (int)j, search.cost, {}};
                        p.path.reserve(search.path.size());
                        for (int l : search.path) p.path.push_back(reg.global(l));
                        pairs.push_back(std::move(p));
                    }
                }
            }
            cache.valid = true;
            cache.cells = here;
            cache.pairs = std::move(pairs);
        }
        for (size_t p = 0; p < cache.pairs.size(); p++) {
            const IntraPair& ip = cache.pairs[p];
            int a = clNodes[s + ip.i], b = clNodes[s + ip.j];
            out[a].push_back({b, ip.cost, cl, (int)p, false});
            out[b].push_back({a, ip.cost, cl, (int)p, true});
        }
    }
    if (sc) g.giveScratch(sc);
    adjStart.assign(N + 1, 0);
    for (int i = 0; i < N; i++) adjStart[i + 1] = adjStart[i] + (int)out[i].size();
    int M = adjStart[N];
    adjNode.assign(M, 0);
    adjCost.assign(M, 0);
    adjPathStart.assign(M, 0);
    adjPathLen.assign(M, 0);
    adjPathCells.clear();
    maxDeg = 0;
    for (int i = 0; i < N; i++) {
        maxDeg = std::max(maxDeg, (int)out[i].size());
        for (size_t e = 0; e < out[i].size(); e++) {
            const OutEdge& x = out[i][e];
            int at = adjStart[i] + (int)e;
            adjNode[at] = x.to;
            adjCost[at] = x.cost;
            if (x.cl >= 0) {
                const std::vector<int>& path = intra[x.cl].pairs[x.pair].path;
                adjPathStart[at] = (int)adjPathCells.size();
                adjPathLen[at] = (int)path.size();
                if (x.rev) adjPathCells.insert(adjPathCells.end(), path.rbegin(), path.rend());
                else adjPathCells.insert(adjPathCells.end(), path.begin(), path.end());
            }
        }
    }
}

// ---- Request -----------------------------------------------------------------------------------

void Request::finish(int st) {
    done = true;
    status = st;
}

void Request::releaseScratch(Grid& g) {
    if (gScratch) { g.giveScratch(gScratch); gScratch = nullptr; }
    if (hScratch) { g.giveScratch(hScratch); hScratch = nullptr; }
}

void Request::dispose(Grid& g) {
    releaseScratch(g);
    gStarted = false;
    phase = 0;
    active = 0;
}

bool Request::step(Grid& g, Hierarchy* h, int64_t budget) {
    if (done) return true;
    if (budget < 1) budget = 1;
    if (mode != MODE_GRID && !h) { finish(STATUS_NO_HIERARCHY); return true; }
    // The request's own obstacles are a layer pushed only while it searches; they do not count as a
    // change of the moving obstacles (which restarts an in-flight grid search).
    uint32_t ver = g.dynVersion;
    bool layered = !extra.empty();
    if (layered) g.pushDynamic(extra.data(), (int)extra.size());
    bool fin;
    if (mode == MODE_GRID) {
        if (gStarted && (gVersion != ver || gStatic != g.staticVersion)) {
            if (gScratch) { g.giveScratch(gScratch); gScratch = nullptr; }
            gStarted = false;
        }
        fin = gridStep(g, budget);
        if (gStarted) gVersion = ver;
    } else {
        fin = hpaStep(g, *h, budget);
    }
    if (layered) { g.popDynamic(); g.dynVersion = ver; }
    if (fin) releaseScratch(g);
    return fin;
}

bool Request::gridStep(Grid& g, int64_t budget) {
    if (!gStarted) {
        gStarted = true;
        gStatic = g.staticVersion;
        bool okS = g.nearestFree(from, 30, false, gs);
        bool okG = g.nearestFree(to, 30, false, gg);
        if (!okS || !okG) { finish(STATUS_NO_PATH); return true; }
        gGraph.g = &g;
        gScratch = g.takeScratch(g.size());
        gSearch.start(&gGraph, gScratch, g.indexOf(gs.x, gs.y), g.indexOf(gg.x, gg.y), maxExpanded, g.plainTies);
    }
    int64_t before = gSearch.expanded;
    int r = gSearch.run(budget);
    used += gSearch.expanded - before;
    if (r == -1) return false;
    if (r == 1) { g.finishCells(gSearch.path, from, gs, gg, false, false, path); finish(STATUS_PATH); }
    else finish(STATUS_NO_PATH);
    return true;
}

void Request::hpaReset(Grid& g) {
    if (hScratch) { g.giveScratch(hScratch); hScratch = nullptr; }
    phase = 0;
    active = 0;
}

enum { P_IDLE = 0, P_START_LINKS, P_GOAL_LINKS, P_SAME, P_ABSTRACT, P_CORRIDOR };

bool Request::hpaStep(Grid& g, Hierarchy& h, int64_t budget) {
    if (phase != P_IDLE && hVersion != h.version) hpaReset(g);
    left = std::max<int64_t>(1, budget);
    const bool infinite = left >= INF_BUDGET / 2;
    const bool plain = g.plainTies;
    // Runs the active search on the remaining budget like NavHierarchy.plan's run(): -1 = out of budget.
    auto runActive = [&](auto& search) -> int {
        for (;;) {
            if (left <= 0) return -1;
            int64_t slice = left, before = search.expanded;
            int r = search.run(slice);
            int64_t u = r == -1 ? search.expanded - before : r == 1 ? search.expanded - before : (infinite ? 0 : slice);
            if (!infinite) left -= u;
            used += u;
            if (r != -1) return r;
        }
    };
    auto startSearch = [&](auto& search, const auto* graph, int s, int t) {
        if (hScratch) g.giveScratch(hScratch);
        hScratch = g.takeScratch(graph->size());
        search.start(graph, hScratch, s, t, maxExpanded, plain);
    };
    auto toGlobal = [](const RegionGraph& reg, const std::vector<int>& p) {
        std::vector<int> out;
        out.reserve(p.size());
        for (int l : p) out.push_back(reg.global(l));
        return out;
    };
    if (phase == P_IDLE) {
        hVersion = h.version;
        if (!g.nearestFree(from, 30, true, hs) || !g.nearestFree(to, 30, true, hgoal)) { finish(STATUS_NO_PATH); return true; }
        sc = g.indexOf(hs.x, hs.y);
        gc = g.indexOf(hgoal.x, hgoal.y);
        scl = h.clusterOf(sc);
        gcl = h.clusterOf(gc);
        if (!q) q.reset(new AbstractQuery());
        q->init(&h);
        q->reset(sc, gc);
        phase = P_START_LINKS;
        linkIdx = h.clStart[scl];
        active = 0;
    }
    for (;;) {
        switch (phase) {
        case P_START_LINKS: {
            if (linkIdx >= h.clStart[scl + 1]) { phase = P_GOAL_LINKS; linkIdx = h.clStart[gcl]; active = 0; break; }
            const RegionGraph& sreg = h.region(scl);
            int n = h.clNodes[linkIdx];
            if (!active) { startSearch(rSearch, &sreg, sreg.local(sc), sreg.local(h.nodeCell[n])); active = 1; }
            int r = runActive(rSearch);
            if (r == -1) return false;
            if (r == 1) q->addStart(n, rSearch.cost, toGlobal(sreg, rSearch.path));
            linkIdx++;
            active = 0;
            break;
        }
        case P_GOAL_LINKS: {
            if (linkIdx >= h.clStart[gcl + 1]) { phase = P_SAME; active = 0; break; }
            const RegionGraph& greg = h.region(gcl);
            int n = h.clNodes[linkIdx];
            if (!active) { startSearch(rSearch, &greg, greg.local(h.nodeCell[n]), greg.local(gc)); active = 1; }
            int r = runActive(rSearch);
            if (r == -1) return false;
            if (r == 1) q->addGoal(n, rSearch.cost, toGlobal(greg, rSearch.path));
            linkIdx++;
            active = 0;
            break;
        }
        case P_SAME: {
            if (scl != gcl) { phase = P_ABSTRACT; active = 0; break; }
            const RegionGraph& sreg = h.region(scl);
            if (!active) { startSearch(rSearch, &sreg, sreg.local(sc), sreg.local(gc)); active = 1; }
            int r = runActive(rSearch);
            if (r == -1) return false;
            if (r == 1) q->addStart(q->goalId, rSearch.cost, toGlobal(sreg, rSearch.path));
            phase = P_ABSTRACT;
            active = 0;
            break;
        }
        case P_ABSTRACT: {
            if (!active) { startSearch(aSearch, q.get(), q->startId, q->goalId); active = 2; }
            int r = runActive(aSearch);
            if (r == -1) return false;
            active = 0;
            if (r != 1) { finish(STATUS_NO_PATH); return true; }
            q->stitch(aSearch.path, cells);
            if (mode != MODE_HPA_CORRIDOR) {
                g.finishCells(cells, from, hs, hgoal, true, true, path);
                finish(STATUS_PATH);
                return true;
            }
            if (!g.nearestFree(from, 30, false, ds) || !g.nearestFree(to, 30, false, dg)) { finish(STATUS_NO_PATH); return true; }
            if (!corridor) corridor.reset(new CorridorGraph());
            corridor->g = &g;
            corridor->hq = &h;
            corridor->mask.assign(h.ccols * h.crows, 0);
            corridor->open(cells);
            std::vector<int> ends{g.indexOf(ds.x, ds.y), g.indexOf(dg.x, dg.y)};
            corridor->open(ends);
            phase = P_CORRIDOR;
            break;
        }
        case P_CORRIDOR: {
            if (!active) { startSearch(cSearch, corridor.get(), g.indexOf(ds.x, ds.y), g.indexOf(dg.x, dg.y)); active = 3; }
            int r = runActive(cSearch);
            if (r == -1) return false;
            active = 0;
            if (r == 1) { g.finishCells(cSearch.path, from, ds, dg, false, true, path); finish(STATUS_PATH); }
            else finish(STATUS_NO_PATH);
            return true;
        }
        default:
            finish(STATUS_BAD_REQUEST);
            return true;
        }
    }
}

} // namespace nav
