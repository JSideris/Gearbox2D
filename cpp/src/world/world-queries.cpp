#include "world.h"
#include "fixture.h"
#include "body.h"
#include <vector>
#include <unordered_set>

std::vector<int> World::queryBodiesAtPoint(float x, float y, uint32_t mask) {
    std::vector<int> hitIds;
    std::unordered_set<int> uniqueBodyIds;
    Aabb pointBox(Vec2(x - 0.001f, y - 0.001f), Vec2(x + 0.001f, y + 0.001f));
    std::vector<BvhNode*> candidates;
    bvh.query(pointBox, candidates);
    for (auto node : candidates) {
        Fixture* fixture = static_cast<Fixture*>(node->data);
        if (fixture->getCategoryBits() & mask) {
            if (fixture->testPoint(x, y)) {
                uniqueBodyIds.insert(fixture->body->id);
            }
        }
    }
    for (int id : uniqueBodyIds) hitIds.push_back(id);
    return hitIds;
}

std::vector<int> World::queryFixturesAtPoint(float x, float y, uint32_t mask) {
    std::vector<int> hitIds;
    Aabb pointBox(Vec2(x - 0.001f, y - 0.001f), Vec2(x + 0.001f, y + 0.001f));
    std::vector<BvhNode*> candidates;
    bvh.query(pointBox, candidates);
    for (auto node : candidates) {
        Fixture* fixture = static_cast<Fixture*>(node->data);
        if (fixture->getCategoryBits() & mask) {
            if (fixture->testPoint(x, y)) {
                hitIds.push_back(fixture->id);
            }
        }
    }
    return hitIds;
}
