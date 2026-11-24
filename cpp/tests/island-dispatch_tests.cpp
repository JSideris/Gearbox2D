#include <gtest/gtest.h>
#include "body.h"
#include "world.h"
#include <array>
#include <vector>

namespace {
// A longer chain between runs of pairs, followed by a partial final batch.
int addChain(World& world, int group, bool mixed) {
    const int count = mixed && group == 17 ? 6 : 2;
    const int first = 1 + group * 8;
    for (int i = 0; i < count; ++i) {
        emscripten_val options;
        options.properties["shape"] = static_cast<int>(ObjectShape::CIRCLE);
        options.properties["radius"] = 0.2f;
        options.properties["x"] = i * 1.05f;
        options.properties["y"] = group * 4.0f;
        options.properties["vy"] = i % 2 ? 1.f : -1.f;
        options.properties["canSleep"] = false;
        world.createBody(first + i, options);
        if (i > 0) {
            world.createDistanceJoint(first + i, first + i - 1, first + i, 0, 0, 0, 0, 1);
        }
    }
    return count;
}

std::array<float, 4> state(Body* body) {
    return {body->getX(), body->getY(), body->getVelocityX(), body->getVelocityY()};
}
}

static void checkIndependentChains(bool mixed) {
    World combined;
    combined.setGravity(0, 0);
    constexpr int groups = 35;
    constexpr int frames = 8;
    std::vector<std::vector<std::array<float, 4>>> expected(frames);
    std::vector<int> ids;
    for (int group = 0; group < groups; ++group) {
        World single;
        single.setGravity(0, 0);
        const int count = addChain(single, group, mixed);
        addChain(combined, group, mixed);
        for (int i = 0; i < count; ++i) ids.push_back(1 + group * 8 + i);
        for (int frame = 0; frame < frames; ++frame) {
            single.step();
            for (int i = 0; i < count; ++i) {
                expected[frame].push_back(state(single.getBody(1 + group * 8 + i)));
            }
        }
    }
    for (int frame = 0; frame < frames; ++frame) {
        combined.step();
        for (size_t i = 0; i < ids.size(); ++i) {
            ASSERT_EQ(expected[frame][i], state(combined.getBody(ids[i])))
                << "frame " << frame << ", body " << ids[i];
        }
    }
}

TEST(IslandDispatch, SmallChainsMatchTheirSingleIslandTrajectory) {
    checkIndependentChains(false);
}

TEST(IslandDispatch, MixedChainsMatchTheirSingleIslandTrajectory) {
    checkIndependentChains(true);
}

#if defined(GEARBOX_MT) && defined(GEARBOX_BROWSER_BENCH)
TEST(IslandDispatch, SmallChainsShareWorkerTasks) {
    World world;
    world.setGravity(0, 0);
    constexpr unsigned groups = 35;
    for (unsigned group = 0; group < groups; ++group) addChain(world, group, false);
    const unsigned before = world.benchWorkerTasks();
    world.step();
    const unsigned completed = world.benchWorkerTasks() - before;
    EXPECT_GT(completed, 0u);
    EXPECT_LT(completed, 2 * groups);
}
#endif
