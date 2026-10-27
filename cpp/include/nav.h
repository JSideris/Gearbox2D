#ifndef GEARBOX_NAV_H
#define GEARBOX_NAV_H

// Native grid pathfinding (PER-871): 8-connected A* and hierarchical A* (HPA*) over an occupancy
// grid, ported from gear3engine g3e-ai NavGrid / NavHierarchy (PER-870 typed-array A*, PER-877 HPA*)
// with the same edges, heuristic, tie rules and string pulling, so paths match the JS planner exactly.
//
// The grid lives next to a World (World::nav*). The physics step only does bookkeeping: it notes
// which tracked fixtures moved, appeared or disappeared. Pathfinding is a separate call, once per tick
// (World::findPaths), that runs every queued request within a node budget and writes the results
// into one output buffer, so a whole tick of path requests is a single JS -> WASM call.
//
// All nav math is double precision (JS numbers), so the same inputs give bit-identical results to
// the JS implementation.

#include <cstdint>
#include <memory>
#include <vector>

class World;
class Fixture;
class Body;

namespace nav {

constexpr double SQRT2 = 1.4142135623730951;   // Math.SQRT2
constexpr int64_t INF_BUDGET = (int64_t)1 << 60; // stands for Infinity in budgets and slices

// Math.hypot(a, b) exactly as V8 computes it for two arguments (normalised by the larger one).
double jsHypot(double a, double b);

struct Vec { double x = 0, y = 0; };
struct Disc { double x = 0, y = 0, r = 0; };
struct Box { double x = 0, y = 0, w = 0, h = 0, angle = 0; };

// navCreate flags
enum GridFlags : int {
    GRID_RASTER_CENTERS = 1,      // rasterize: "centers" (default "touching")
    GRID_NO_BLOCK_EDGES = 2,      // blockEdges: false
    GRID_AT_GOAL_EMPTY = 4,       // atGoal: "empty"
    GRID_NEAREST_OUTSIDE_POINT = 8, // nearestFreeOutside: "point"
    GRID_TIES_HEAP = 16,          // astarTies: "heap"
};

// Request modes
enum Mode : int {
    MODE_GRID = 0,       // NavGrid.findPath: plain A*, moving obstacles included
    MODE_HPA = 1,        // NavHierarchy.findPath: walls only
    MODE_HPA_CORRIDOR = 2, // NavHierarchy.findPath({ dynamic: "corridor" })
};

// Result status codes
enum Status : int {
    STATUS_NO_PATH = 0,
    STATUS_PATH = 1,
    STATUS_NO_HIERARCHY = -2, // an HPA request before navBuildHierarchy
    STATUS_BAD_REQUEST = -3,
};

// ---- A* building blocks ------------------------------------------------------------------------

// Open list. lowerH (default): binary heap ordered by (f, h, insertion order), a strict total order,
// identical to g3e-ai AStarHeap. heap: g3e-ai PlainAStarHeap, keyed by f only, same sifts.
class OpenHeap {
public:
    bool plain = false;
    int size() const { return n; }
    void clear() { n = 0; counter = 0; }
    void push(int id, double f, double h);
    int pop();
private:
    // lowerH
    std::vector<int> ids;
    std::vector<double> fv, hv, ov;
    // plain: [key, id] interleaved
    std::vector<double> e;
    int n = 0;
    double counter = 0;
};

// Per-search g / came-from / closed bookkeeping, reused via a generation stamp.
struct Book {
    std::vector<double> g;
    std::vector<int> came;
    std::vector<uint32_t> stamp;
    uint32_t gen = 0;
    int capacity() const { return (int)g.size(); }
    explicit Book(int n) : g(n), came(n), stamp(n, 0) {}
    void begin() {
        gen += 2;
        if (gen >= 0xfffffff0u) { std::fill(stamp.begin(), stamp.end(), 0u); gen = 2; }
    }
};

struct Scratch {
    std::unique_ptr<Book> book;
    std::unique_ptr<OpenHeap> heap;
};

class Grid;
class Hierarchy;

// A time-sliced A* on one dense graph. run(slice) expands at most `slice` nodes.
template <class G>
struct Search {
    const G* graph = nullptr;
    Scratch* scratch = nullptr;
    int goal = 0;
    int64_t maxExpanded = 200000;
    int64_t expanded = 0;
    int result = -1; // -1 running, 0 no path, 1 found
    double cost = 0;
    std::vector<int> path;
    void start(const G* g, Scratch* s, int start, int goal, int64_t maxExpanded, bool plainTies);
    // Returns -1 while unfinished, else result.
    int run(int64_t slice);
};

// ---- Graphs ------------------------------------------------------------------------------------

struct GridGraph {
    const Grid* g;
    int size() const;
    int neighborsInto(int i, int* nodes, double* costs) const;
    double heuristic(int a, int b) const;
};

struct RegionGraph {
    const Grid* g = nullptr;
    int c0 = 0, r0 = 0, w = 0, h = 0, cols = 0;
    double cell = 1;
    int size() const { return w * h; }
    int local(int cell) const { int r = cell / cols, c = cell - r * cols; return (r - r0) * w + (c - c0); }
    int global(int l) const { int r = l / w, c = l - r * w; return (r + r0) * cols + c + c0; }
    int neighborsInto(int i, int* nodes, double* costs) const;
    double heuristic(int a, int b) const;
private:
    bool freeAt(int lc, int lr) const;
};

struct AbstractQuery {
    const Hierarchy* hq = nullptr;
    int startId = 0, goalId = 0, sc = 0, gc = 0;
    std::vector<int> startTo;
    std::vector<double> startCost;
    std::vector<std::vector<int>> startPath;
    std::vector<int> goalAt; // node -> index into goal*, or -1
    std::vector<int> goalNodes;
    std::vector<double> goalCost;
    std::vector<std::vector<int>> goalPath;
    void init(const Hierarchy* h);
    void reset(int sc, int gc);
    void addStart(int to, double cost, std::vector<int>&& path);
    void addGoal(int from, double cost, std::vector<int>&& path);
    int size() const { return goalId + 1; }
    int cellOf(int n) const;
    int neighborsInto(int n, int* nodes, double* costs) const;
    double heuristic(int a, int b) const;
    void stitch(const std::vector<int>& path, std::vector<int>& cells) const;
};

struct CorridorGraph {
    const Grid* g = nullptr;
    const Hierarchy* hq = nullptr;
    std::vector<uint8_t> mask;
    int size() const;
    void clear() { std::fill(mask.begin(), mask.end(), 0); }
    void open(const std::vector<int>& cells);
    int neighborsInto(int i, int* nodes, double* costs) const;
    double heuristic(int a, int b) const;
};

// ---- Grid --------------------------------------------------------------------------------------

struct NavPath {
    std::vector<Vec> points;
    double length = 0;
};

class Grid {
public:
    double minX = 0, minY = 0, maxX = 1, maxY = 1, cell = 1, clearance = 0;
    int cols = 1, rows = 1;
    bool touching = true, atGoalEmpty = false, outsidePoint = false, plainTies = false;
    // base: edge margin + static shapes + cells written through the base view.
    std::vector<uint8_t> base;
    // tracked physics fixtures covering each cell (World::navTrack).
    std::vector<uint16_t> trackCount;
    // blocked = base | trackCount > 0: what A* sees as static.
    std::vector<uint8_t> blocked;
    // moving obstacles (dynList[0..dynLen) each once) and their pushed layers
    std::vector<uint8_t> dyn;
    std::vector<int> dynList;
    std::vector<int> layerStarts;
    uint32_t dynVersion = 0;
    uint32_t staticVersion = 0;

    Grid(double minX, double minY, double maxX, double maxY, double cell, double clearance, int flags);

    int size() const { return cols * rows; }
    void cellCoords(double x, double y, int& c, int& r) const;
    int indexOf(double x, double y) const;
    Vec center(int i) const;
    bool isBlocked(int i) const { return blocked[i] == 1 || dyn[i] == 1; }

    // Static shapes, rasterised like NavGrid's constructor. Returns the cell rect they touched.
    void addBox(const Box& b, int rect[4]);
    void addDisc(const Disc& d, double keepOut, int rect[4]);
    // Recomputes blocked over [c0..c1] x [r0..r1]; grows `changed` to the cells that flipped.
    void refreshBlocked(int c0, int r0, int c1, int r1, int changed[4]);

    void setDynamic(const Disc* d, int n);
    void pushDynamic(const Disc* d, int n);
    void popDynamic();
    int dynamicLayers() const { return (int)layerStarts.size(); }

    bool nearestFree(Vec p, int maxRadius, bool staticOnly, Vec& out) const;
    bool walkable(Vec a, Vec b, bool staticOnly) const;
    void smoothBy(const std::vector<Vec>& pts, bool staticOnly, std::vector<Vec>& out) const;
    void smoothGallop(const std::vector<Vec>& pts, bool staticOnly, std::vector<Vec>& out) const;
    void finishCells(const std::vector<int>& cells, Vec from, Vec s, Vec g, bool staticOnly, bool gallop, NavPath& out) const;
    double heuristic(int a, int b) const;
    int neighborsInto(int i, int* nodes, double* costs) const;

    // Scratch pool (books with capacity >= n and heaps), shared by all searches on this grid.
    Scratch* takeScratch(int n);
    void giveScratch(Scratch* s);

private:
    void rasterDynamic(const Disc& d);
    std::vector<std::unique_ptr<Scratch>> pool;
    std::vector<std::unique_ptr<Scratch>> lent;
};

// ---- Hierarchy (HPA*) --------------------------------------------------------------------------

class Hierarchy {
public:
    Grid* grid;
    int cluster, ccols, crows, wide;
    uint32_t version = 0;
    std::vector<int> nodeCell, nodeOf;
    std::vector<int> adjStart, adjNode;
    std::vector<double> adjCost;
    std::vector<int> adjPathStart, adjPathLen; // into adjPathCells; len 0 = no path (inter edge)
    std::vector<int> adjPathCells;
    int maxDeg = 0;
    std::vector<int> clStart, clNodes;
    struct IntraPair { int i, j; double cost; std::vector<int> path; };
    struct IntraCache { bool valid = false; std::vector<int> cells; std::vector<IntraPair> pairs; };
    std::vector<IntraCache> intra;
    std::vector<RegionGraph> regions;
    std::vector<uint8_t> regionMade;
    int64_t buildExpanded = 0;

    Hierarchy(Grid* grid, int cluster, int wideEntrance);
    int nodeCount() const { return (int)nodeCell.size(); }
    int edgeCount() const { return (int)adjNode.size(); }
    int clusterOf(int cell) const {
        int cols = grid->cols, r = cell / cols, c = cell - r * cols;
        return (r / cluster) * ccols + (c / cluster);
    }
    // Cells [c0..c1] x [r0..r1] changed (c0 < 0: everything): re-find entrances, re-search touched clusters.
    void rebuild(int c0, int r0, int c1, int r1);
    const RegionGraph& region(int cl);
    void markAround(std::vector<uint8_t>& mask, int cell) const;
private:
    void build(const std::vector<uint8_t>* dirty);
};

// ---- Requests ----------------------------------------------------------------------------------

// One findPath in progress, run a budget at a time. Mirrors g3e-ai NavPathSearch (grid mode) and
// NavHierarchySearch (HPA modes), including when they start over.
class Request {
public:
    int id = 0;
    int mode = MODE_GRID;
    Vec from, to;
    int64_t maxExpanded = 200000;
    std::vector<Disc> extra; // pushed as a layer only while this request searches
    bool done = false;
    int status = STATUS_NO_PATH;
    NavPath path;
    int64_t used = 0; // nodes expanded so far (restarts included)

    // Expands up to `budget` nodes (at least 1). Returns true when finished.
    bool step(Grid& g, Hierarchy* h, int64_t budget);
    void dispose(Grid& g);
private:
    // grid mode
    bool gStarted = false;
    uint32_t gVersion = 0, gStatic = 0;
    Vec gs, gg;
    bool gSnapOk = false;
    Search<GridGraph> gSearch;
    GridGraph gGraph{nullptr};
    Scratch* gScratch = nullptr;
    // hpa mode
    int phase = 0; // 0 not started
    uint32_t hVersion = 0;
    int64_t left = 0;
    Vec hs, hgoal, ds, dg;
    int sc = 0, gc = 0, scl = 0, gcl = 0, linkIdx = 0;
    std::unique_ptr<AbstractQuery> q;
    std::unique_ptr<CorridorGraph> corridor;
    std::vector<int> cells;
    Search<RegionGraph> rSearch;
    Search<AbstractQuery> aSearch;
    Search<CorridorGraph> cSearch;
    int active = 0; // 0 none, 1 region, 2 abstract, 3 corridor
    Scratch* hScratch = nullptr;
    int linkTarget = 0;
    bool gridStep(Grid& g, int64_t budget);
    bool hpaStep(Grid& g, Hierarchy& h, int64_t budget);
    void hpaReset(Grid& g);
    void finish(int status);
    void releaseScratch(Grid& g);
};

// ---- Per-world nav state -----------------------------------------------------------------------

class NavSystem {
public:
    explicit NavSystem(World& world) : world(world) {}
    World& world;
    std::unique_ptr<Grid> grid;
    std::unique_ptr<Hierarchy> hierarchy;

    // I/O buffers shared with JS (typed-array views; header[0] bumps when any of them moves).
    std::vector<int32_t> header = std::vector<int32_t>(8, 0);
    std::vector<double> requestIn;   // [id, fx, fy, tx, ty, mode, maxExpanded, discCount] per request
    std::vector<double> discIn;      // [x, y, r] per disc
    std::vector<double> out;         // per result: [id, status, expanded, length, nPoints, x0, y0, ...]

    std::vector<std::unique_ptr<Request>> queue;
    int64_t lastExpanded = 0;

    // physics-world tracking
    uint32_t trackMask = 0;
    int trackFlags = 0;
    struct Tracked {
        Fixture* f;
        float x, y, r, minX, minY, maxX, maxY;
        std::vector<int> cells; // cells this fixture currently counts in trackCount
        bool dirty;
        bool removed;
    };
    std::vector<Tracked> tracked;
    bool anyDirty = false;
    int pendingRect[4] = {1 << 30, 1 << 30, -1, -1}; // static cells changed since the last sync

    void create(double minX, double minY, double maxX, double maxY, double cell, double clearance, int flags);
    void destroy();
    void reserve(int requests, int discs);
    void commitBase(int c0, int r0, int c1, int r1);
    void addBox(double x, double y, double w, double h, double angle);
    void addDisc(double x, double y, double r, double keepOut);
    void track(uint32_t mask, int flags);
    void buildHierarchy(int cluster, int wideEntrance);
    void sync(); // applies tracked-fixture changes and pending static changes (hierarchy rebuild)

    int findPaths(double budget, double minSlice, int newCount);
    int findPathNow(double fx, double fy, double tx, double ty, int mode, double maxExpanded);
    void cancel(int id);
    void clearRequests();

    // physics hooks
    void onFixtureCreated(Fixture* f);
    void onBodyRemoved(Body* b);
    void onWorldCleared();
    void afterStep();

private:
    std::vector<double*> bufPtr = std::vector<double*>(3, nullptr);
    std::vector<size_t> bufCap = std::vector<size_t>(3, 0);
    void ioBegin();
    void ioEnd();
    void writeResult(const Request& r);
    void growRect(int c0, int r0, int c1, int r1);
    void rasterTracked(Tracked& t, bool add);
    bool wantsTrack(const Fixture* f) const;
};

} // namespace nav

#endif
