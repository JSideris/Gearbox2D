// World-side entry points for native navigation (PER-871). See nav.h and docs/navigation.md.
#include "world.h"
#include "nav.h"

nav::NavSystem& World::navSystem() {
    if (!navSys) navSys.reset(new nav::NavSystem(*this));
    return *navSys;
}

void World::navCreate(double minX, double minY, double maxX, double maxY, double cell, double clearance, int flags) {
    navSystem().create(minX, minY, maxX, maxY, cell, clearance, flags);
}
void World::navDestroy() { if (navSys) navSys->destroy(); }
bool World::navHasGrid() const { return navSys && navSys->grid; }
int World::navCols() const { return navHasGrid() ? navSys->grid->cols : 0; }
int World::navRows() const { return navHasGrid() ? navSys->grid->rows : 0; }
void World::navAddBox(double x, double y, double w, double h, double angle) { navSystem().addBox(x, y, w, h, angle); }
void World::navAddDisc(double x, double y, double r, double keepOut) { navSystem().addDisc(x, y, r, keepOut); }
void World::navCommitBase(int c0, int r0, int c1, int r1) { navSystem().commitBase(c0, r0, c1, r1); }
void World::navTrack(uint32_t mask, int flags) { navSystem().track(mask, flags); }

static void navDiscs(nav::NavSystem& n, int count, std::vector<nav::Disc>& out) {
    count = std::max(0, std::min(count, (int)(n.discIn.size() / 3)));
    out.resize(count);
    for (int i = 0; i < count; i++) out[i] = nav::Disc{n.discIn[i * 3], n.discIn[i * 3 + 1], n.discIn[i * 3 + 2]};
}

void World::navSetDynamic(int count) {
    nav::NavSystem& n = navSystem();
    if (!n.grid) return;
    std::vector<nav::Disc> d;
    navDiscs(n, count, d);
    n.grid->setDynamic(d.data(), (int)d.size());
}
void World::navPushDynamic(int count) {
    nav::NavSystem& n = navSystem();
    if (!n.grid) return;
    std::vector<nav::Disc> d;
    navDiscs(n, count, d);
    n.grid->pushDynamic(d.data(), (int)d.size());
}
void World::navPopDynamic() { if (navHasGrid()) navSys->grid->popDynamic(); }
int World::navDynamicLayers() const { return navHasGrid() ? navSys->grid->dynamicLayers() : 0; }
void World::navBuildHierarchy(int cluster, int wideEntrance) { navSystem().buildHierarchy(cluster, wideEntrance); }
void World::navSync() { navSystem().syncAndPublish(); }
void World::navReserve(int requests, int discs) { navSystem().reserve(requests, discs); }
int World::findPaths(double budget, double minSlice, int newCount) { return navSystem().findPaths(budget, minSlice, newCount); }
int World::navFindPath(double fx, double fy, double tx, double ty, int mode, double maxExpanded) {
    return navSystem().findPathNow(fx, fy, tx, ty, mode, maxExpanded);
}
void World::navCancel(int id) { navSystem().cancel(id); }
void World::navClearRequests() { navSystem().clearRequests(); }

#ifdef __EMSCRIPTEN__
emscripten_val World::navGetHeader() { auto& n = navSystem(); return emscripten_val(emscripten::typed_memory_view(n.header.size(), n.header.data())); }
emscripten_val World::navGetRequestView() { auto& n = navSystem(); return emscripten_val(emscripten::typed_memory_view(n.requestIn.size(), n.requestIn.data())); }
emscripten_val World::navGetDiscView() { auto& n = navSystem(); return emscripten_val(emscripten::typed_memory_view(n.discIn.size(), n.discIn.data())); }
emscripten_val World::navGetOutView() { auto& n = navSystem(); return emscripten_val(emscripten::typed_memory_view(n.out.capacity(), n.out.data())); }
emscripten_val World::navGetBaseView() {
    auto& n = navSystem();
    if (!n.grid) return emscripten_val(emscripten::typed_memory_view((size_t)0, (uint8_t*)nullptr));
    return emscripten_val(emscripten::typed_memory_view(n.grid->base.size(), n.grid->base.data()));
}
emscripten_val World::navGetBlockedView() {
    auto& n = navSystem();
    if (!n.grid) return emscripten_val(emscripten::typed_memory_view((size_t)0, (uint8_t*)nullptr));
    return emscripten_val(emscripten::typed_memory_view(n.grid->blocked.size(), n.grid->blocked.data()));
}
emscripten_val World::navGetDynamicView() {
    auto& n = navSystem();
    if (!n.grid) return emscripten_val(emscripten::typed_memory_view((size_t)0, (uint8_t*)nullptr));
    return emscripten_val(emscripten::typed_memory_view(n.grid->dyn.size(), n.grid->dyn.data()));
}
#endif
