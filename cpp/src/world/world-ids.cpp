#include "world.h"
#include "body.h"
#include "fixture.h"
#include "joint.h"
#include <algorithm>

void World::updateBodyId(int oldId, int newId) {
    if (oldId == newId) return;
    auto it = bodiesMap.find(oldId);
    if (it != bodiesMap.end()) {
        Body* b = it->second;
        bodiesMap.erase(it);
        if (oldId < (int)_idToBody.size()) _idToBody[oldId] = nullptr;
        b->id = newId;
        bodiesMap[newId] = b;
        if (newId >= (int)_idToBody.size()) _idToBody.resize(newId + 1, nullptr);
        _idToBody[newId] = b;
        tempBodyIdMap[oldId] = newId;
    }
}

void World::updateFixtureId(int oldId, int newId) {
    if (oldId == newId) return;
    auto it = fixturesMap.find(oldId);
    if (it != fixturesMap.end()) {
        Fixture* f = it->second;
        fixturesMap.erase(it);
        if (oldId < (int)_idToFixture.size()) _idToFixture[oldId] = nullptr;
        f->id = newId;
        fixturesMap[newId] = f;
        if (newId >= (int)_idToFixture.size()) _idToFixture.resize(newId + 1, nullptr);
        _idToFixture[newId] = f;
        tempFixtureIdMap[oldId] = newId;
    }
}

void World::updateJointId(int oldId, int newId) {
    if (oldId == newId) return;
    auto it = jointsMap.find(oldId);
    if (it != jointsMap.end()) {
        std::unique_ptr<Joint> j = std::move(it->second);
        jointsMap.erase(it);
        j->id = newId;
        jointsMap[newId] = std::move(j);
    }
}

void World::syncDefragmentedIds() {
    if (!tempBodyIdMap.empty()) {
        // Update disabledPairs
        if (!disabledPairs.empty()) {
            std::unordered_set<std::pair<int, int>, PairHash, PairEqual> nextSet;
            nextSet.reserve(disabledPairs.size());
            for (const auto& pair : disabledPairs) {
                int id1 = pair.first;
                int id2 = pair.second;
                auto it1 = tempBodyIdMap.find(id1);
                if (it1 != tempBodyIdMap.end()) id1 = it1->second;
                auto it2 = tempBodyIdMap.find(id2);
                if (it2 != tempBodyIdMap.end()) id2 = it2->second;
                nextSet.insert({id1, id2});
            }
            disabledPairs = std::move(nextSet);
        }

        // Rebuild per-body _disabledBodyIds from the new disabledPairs
        for (auto* body : bodiesList) {
            body->_disabledBodyIds.clear();
        }
        for (const auto& pair : disabledPairs) {
            Body* bA = getBody(pair.first);
            Body* bB = getBody(pair.second);
            if (bA && bB) {
                bA->disableCollisionWith(bB->id);
                bB->disableCollisionWith(bA->id);
            }
        }

        // Update bodyContactCounts
        if (!bodyContactCounts.empty()) {
            std::unordered_map<std::pair<int, int>, int, PairHash, PairEqual> nextMap;
            nextMap.reserve(bodyContactCounts.size());
            for (const auto& entry : bodyContactCounts) {
                int id1 = entry.first.first;
                int id2 = entry.first.second;
                auto it1 = tempBodyIdMap.find(id1);
                if (it1 != tempBodyIdMap.end()) id1 = it1->second;
                auto it2 = tempBodyIdMap.find(id2);
                if (it2 != tempBodyIdMap.end()) id2 = it2->second;
                nextMap[{id1, id2}] = entry.second;
            }
            bodyContactCounts = std::move(nextMap);
        }
    }

    if (!tempFixtureIdMap.empty()) {
        // Update currentPairs
        if (!currentPairs.empty()) {
            std::unordered_set<std::pair<int, int>, PairHash, PairEqual> nextSet;
            nextSet.reserve(currentPairs.size());
            for (const auto& pair : currentPairs) {
                int id1 = pair.first;
                int id2 = pair.second;
                auto it1 = tempFixtureIdMap.find(id1);
                if (it1 != tempFixtureIdMap.end()) id1 = it1->second;
                auto it2 = tempFixtureIdMap.find(id2);
                if (it2 != tempFixtureIdMap.end()) id2 = it2->second;
                nextSet.insert({id1, id2});
            }
            currentPairs = std::move(nextSet);
        }

        // Update prevPairs
        if (!prevPairs.empty()) {
            std::unordered_set<std::pair<int, int>, PairHash, PairEqual> nextSet;
            nextSet.reserve(prevPairs.size());
            for (const auto& pair : prevPairs) {
                int id1 = pair.first;
                int id2 = pair.second;
                auto it1 = tempFixtureIdMap.find(id1);
                if (it1 != tempFixtureIdMap.end()) id1 = it1->second;
                auto it2 = tempFixtureIdMap.find(id2);
                if (it2 != tempFixtureIdMap.end()) id2 = it2->second;
                nextSet.insert({id1, id2});
            }
            prevPairs = std::move(nextSet);
        }

        // Update resolvedImpulses
        if (!resolvedImpulses.empty()) {
            std::unordered_map<std::pair<int, int>, float, PairHash, PairEqual> nextMap;
            nextMap.reserve(resolvedImpulses.size());
            for (const auto& entry : resolvedImpulses) {
                int id1 = entry.first.first;
                int id2 = entry.first.second;
                auto it1 = tempFixtureIdMap.find(id1);
                if (it1 != tempFixtureIdMap.end()) id1 = it1->second;
                auto it2 = tempFixtureIdMap.find(id2);
                if (it2 != tempFixtureIdMap.end()) id2 = it2->second;
                nextMap[{id1, id2}] = entry.second;
            }
            resolvedImpulses = std::move(nextMap);
        }

        // Update warmStartImpulses
        if (!warmStartImpulses.empty()) {
            std::unordered_map<std::pair<int, int>, WarmStartData, PairHash, PairEqual> nextMap;
            nextMap.reserve(warmStartImpulses.size());
            for (const auto& entry : warmStartImpulses) {
                int id1 = entry.first.first;
                int id2 = entry.first.second;
                auto it1 = tempFixtureIdMap.find(id1);
                if (it1 != tempFixtureIdMap.end()) id1 = it1->second;
                auto it2 = tempFixtureIdMap.find(id2);
                if (it2 != tempFixtureIdMap.end()) id2 = it2->second;
                nextMap[{id1, id2}] = entry.second;
            }
            warmStartImpulses = std::move(nextMap);
        }
    }

    tempBodyIdMap.clear();
    tempFixtureIdMap.clear();
}
