// Spatial queries over the BVH broadphase (PER-856): box, radius, ray and batched radius.
// No query iterates every body: candidates come from the tree, then get an exact shape test.
#include "world.h"
#include "fixture.h"
#include "body.h"
#include "spatial-query.h"
#include <algorithm>

Fixture* World::getFixtureAtIndex(int index) const {
    if (index < 0 || index >= (int)fixturesList.size()) return nullptr;
    return fixturesList[index];
}

void World::_queryBegin() {
    queryBufPtr[0] = queryHits.data();    queryBufCap[0] = queryHits.capacity();
    queryBufPtr[1] = rayHits.data();      queryBufCap[1] = rayHits.capacity();
    queryBufPtr[2] = batchOffsets.data(); queryBufCap[2] = batchOffsets.capacity();
    queryHits.clear();
    rayHits.clear();
    if (queryBodyStamp.size() < bodiesList.size()) queryBodyStamp.resize(bodiesList.size() * 2 + 16, 0);
}

int World::_queryEnd(int count) {
    if (queryBufPtr[0] != queryHits.data() || queryBufCap[0] != queryHits.capacity() ||
        queryBufPtr[1] != rayHits.data() || queryBufCap[1] != rayHits.capacity() ||
        queryBufPtr[2] != batchOffsets.data() || queryBufCap[2] != batchOffsets.capacity()) {
        queryHeader[0]++;
    }
    queryHeader[1] = count;
    return count;
}

void World::_queryNewStamp() {
    if (++queryStampCounter == 0) { // wrapped: reset so stale stamps can't match
        std::fill(queryBodyStamp.begin(), queryBodyStamp.end(), 0);
        queryStampCounter = 1;
    }
}

bool World::_queryAccepts(const Fixture* f, uint32_t mask, int flags, int excludeBodyId) const {
    if (!f || !f->body) return false;
    if ((f->getCategoryBits() & mask) == 0) return false;
    if ((flags & QUERY_FLAG_SKIP_SENSORS) && f->isSensor()) return false;
    if (excludeBodyId != -1 && f->body->id == excludeBodyId) return false;
    return true;
}

// Sorts this query's accepted fixtures by id (independent of tree shape) and appends them,
// keeping one fixture per body when QUERY_FLAG_UNIQUE_BODIES is set.
void World::_emitAccepted(int flags) {
    std::sort(queryAccepted.begin(), queryAccepted.end(), [](const Fixture* a, const Fixture* b) { return a->id < b->id; });
    const bool unique = (flags & QUERY_FLAG_UNIQUE_BODIES) != 0;
    if (unique) _queryNewStamp();
    for (Fixture* f : queryAccepted) {
        if (unique) {
            uint32_t& stamp = queryBodyStamp[f->body->worldIndex];
            if (stamp == queryStampCounter) continue;
            stamp = queryStampCounter;
        }
        queryHits.push_back(f->id);
        queryHits.push_back(f->body->id);
    }
}

void World::_collectAabb(const Vec2& lo, const Vec2& hi, uint32_t mask, int flags) {
    queryAccepted.clear();
    bvh.query(Aabb(lo, hi), queryCandidates);
    QueryShape shape;
    for (BvhNode* node : queryCandidates) {
        Fixture* f = static_cast<Fixture*>(node->data);
        if (!_queryAccepts(f, mask, flags, -1)) continue;
        f->getQueryShape(shape);
        if (sq::overlapsAabb(shape, lo, hi)) queryAccepted.push_back(f);
    }
    _emitAccepted(flags);
}

void World::_collectRadius(const Vec2& c, float radius, uint32_t mask, int flags, int excludeBodyId) {
    queryAccepted.clear();
    if (!(radius >= 0.0f)) return;
    bvh.query(Aabb(Vec2(c.x - radius, c.y - radius), Vec2(c.x + radius, c.y + radius)), queryCandidates);
    QueryShape shape;
    for (BvhNode* node : queryCandidates) {
        Fixture* f = static_cast<Fixture*>(node->data);
        if (!_queryAccepts(f, mask, flags, excludeBodyId)) continue;
        f->getQueryShape(shape);
        if (sq::overlapsCircle(shape, c, radius)) queryAccepted.push_back(f);
    }
    _emitAccepted(flags);
}

int World::queryAABB(float minX, float minY, float maxX, float maxY, uint32_t mask, int flags) {
    _queryBegin();
    Vec2 lo(std::min(minX, maxX), std::min(minY, maxY));
    Vec2 hi(std::max(minX, maxX), std::max(minY, maxY));
    _collectAabb(lo, hi, mask, flags);
    return _queryEnd((int)queryHits.size() / 2);
}

int World::queryRadius(float x, float y, float radius, uint32_t mask, int flags) {
    _queryBegin();
    _collectRadius(Vec2(x, y), radius, mask, flags, -1);
    return _queryEnd((int)queryHits.size() / 2);
}

void World::reserveQueryBatch(int count) {
    if (count < 0) count = 0;
    size_t need = (size_t)count;
    if (batchExclude.size() >= need && batchInput.size() >= need * 3) return;
    size_t cap = std::max(need, batchExclude.size() * 2);
    batchInput.resize(cap * 3, 0.0f);
    batchExclude.resize(cap, -1);
    queryHeader[0]++;
}

int World::queryRadiusBatch(int count, uint32_t mask, int flags) {
    _queryBegin();
    if (count < 0) count = 0;
    if ((size_t)count > batchExclude.size()) count = (int)batchExclude.size();
    if (batchOffsets.size() < (size_t)count + 1) batchOffsets.resize(std::max((size_t)count + 1, batchOffsets.size() * 2), 0);
    for (int i = 0; i < count; ++i) {
        batchOffsets[i] = (int32_t)(queryHits.size() / 2);
        _collectRadius(Vec2(batchInput[i * 3], batchInput[i * 3 + 1]), batchInput[i * 3 + 2], mask, flags, batchExclude[i]);
    }
    batchOffsets[count] = (int32_t)(queryHits.size() / 2);
    return _queryEnd((int)queryHits.size() / 2);
}

int World::raycast(float x1, float y1, float x2, float y2, uint32_t mask, int flags, int excludeBodyId) {
    _queryBegin();
    BvhNode* root = bvh.getRoot();
    if (!root) return _queryEnd(0);
    const Vec2 p(x1, y1);
    const Vec2 d(x2 - x1, y2 - y1);
    const bool all = (flags & QUERY_FLAG_RAY_ALL) != 0;
    float tMax = 1.0f;
    rayScratch.clear();
    RayHit best{}; Fixture* bestF = nullptr;
    QueryShape shape;
    RayHit h;

    queryStack.clear();
    queryStack.push_back(root);
    while (!queryStack.empty()) {
        BvhNode* node = queryStack.back();
        queryStack.pop_back();
        if (sq::rayAabb(p, d, node->bounds.min, node->bounds.max, tMax) < 0.0f) continue;
        if (node->isLeaf) {
            Fixture* f = static_cast<Fixture*>(node->data);
            if (!_queryAccepts(f, mask, flags, excludeBodyId)) continue;
            f->getQueryShape(shape);
            if (!sq::raycastShape(shape, p, d, tMax, h)) continue;
            if (all) {
                rayScratch.push_back({h, f});
            } else if (!bestF || h.t < best.t || (h.t == best.t && f->id < bestF->id)) {
                best = h; bestF = f; tMax = h.t;
            }
        } else {
            // Push children that the ray reaches, farthest first, so the nearest is popped next
            // and a closest hit shrinks tMax before the far subtrees are visited.
            float tc[BvhNode::MAX_CHILDREN];
            BvhNode* ch[BvhNode::MAX_CHILDREN];
            int k = 0;
            for (int i = 0; i < node->childCount; ++i) {
                BvhNode* c = node->children[i];
                if (!c) continue;
                float t = sq::rayAabb(p, d, c->bounds.min, c->bounds.max, tMax);
                if (t < 0.0f) continue;
                int j = k++;
                while (j > 0 && tc[j - 1] < t) { tc[j] = tc[j - 1]; ch[j] = ch[j - 1]; --j; }
                tc[j] = t; ch[j] = c;
            }
            for (int i = 0; i < k; ++i) queryStack.push_back(ch[i]);
        }
    }

    auto emit = [this](const RayHit& hit, const Fixture* f) {
        queryHits.push_back(f->id);
        queryHits.push_back(f->body->id);
        rayHits.push_back(hit.t);
        rayHits.push_back(hit.point.x); rayHits.push_back(hit.point.y);
        rayHits.push_back(hit.normal.x); rayHits.push_back(hit.normal.y);
    };
    if (!all) {
        if (bestF) emit(best, bestF);
    } else {
        std::sort(rayScratch.begin(), rayScratch.end(), [](const auto& a, const auto& b) {
            if (a.first.t != b.first.t) return a.first.t < b.first.t;
            return a.second->id < b.second->id;
        });
        const bool unique = (flags & QUERY_FLAG_UNIQUE_BODIES) != 0;
        if (unique) _queryNewStamp();
        for (const auto& e : rayScratch) {
            if (unique) {
                uint32_t& stamp = queryBodyStamp[e.second->body->worldIndex];
                if (stamp == queryStampCounter) continue;
                stamp = queryStampCounter;
            }
            emit(e.first, e.second);
        }
    }
    return _queryEnd((int)queryHits.size() / 2);
}

#ifdef __EMSCRIPTEN__
emscripten_val World::getQueryHeader() { return emscripten_val(emscripten::typed_memory_view(queryHeader.size(), queryHeader.data())); }
emscripten_val World::getQueryHitsView() { return emscripten_val(emscripten::typed_memory_view(queryHits.capacity(), queryHits.data())); }
emscripten_val World::getRayHitsView() { return emscripten_val(emscripten::typed_memory_view(rayHits.capacity(), rayHits.data())); }
emscripten_val World::getBatchOffsetsView() { return emscripten_val(emscripten::typed_memory_view(batchOffsets.capacity(), batchOffsets.data())); }
emscripten_val World::getBatchInputView() { return emscripten_val(emscripten::typed_memory_view(batchInput.size(), batchInput.data())); }
emscripten_val World::getBatchExcludeView() { return emscripten_val(emscripten::typed_memory_view(batchExclude.size(), batchExclude.data())); }
#endif
