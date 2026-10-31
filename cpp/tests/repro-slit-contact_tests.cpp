#include <gtest/gtest.h>
#include "world.h"
#include "body.h"
#include "debug.h"

#include <algorithm>
#include <string>

// A ship-sized circle misses a wall entirely when enough sensor boxes overlap it.
// The contact is never created, so the circle free-falls. This is the Saucers
// slit report (repro/slit-tunneling, 92a5e6c): the hull is wider than the gap.
//
// Recipe, defaults otherwise (gravity 0, dt 1/60), creation order:
//   1. N fixed sensor boxes, 40 x 40, at (0, 5)
//   2. fixed solid box, 10.715 x 2.4, at (0, 0)   <- wall under test
//   3. fixed solid box, 10.715 x 2.4, at (13, 0)
//   4. dynamic circle, r 1.5, mass 7.07, at (0, 6), velocity (0, -speed)
// Wall top is y = 1.2, so a real contact keeps the center near y = 2.7
// (measured minimum about 2.67). With no contact, speed 10 ends at y = -13.858
// after 120 steps.
//
// N = 5 is the Saucers scene. It misses on the single-threaded narrow phase,
// which is the wasm module Saucers loads. `make test` defines GEARBOX_MT and
// splits this small pair list across four threads, so five sensors still hold.
// Twelve sensors make one of those batches long enough to drop the wall, and
// the circle lands at the same y = -13.858. Four sensors, creating the wall
// first, or moving the second wall away all keep the contact.

static const float kRestY = 2.6f;

struct SlitRecipe {
    int sensorCount;
    bool wallBeforeSensors;
    float secondWallX;
    float speed;
    int steps;
};

struct SlitRun {
    float minY;
    float finalY;
};

static emscripten_val fixedBox(float x, float y, float width, float height, bool sensor) {
    emscripten_val options;
    options["x"] = x;
    options["y"] = y;
    options["r"] = 0.0f;
    options["type"] = (int)ObjectType::FIXED_OBJECT;
    options["shape"] = (int)ObjectShape::BOX;
    options["width"] = width;
    options["height"] = height;
    options["isSensor"] = sensor;
    options["wantsEvents"] = true;
    options["canSleep"] = false;
    return options;
}

static emscripten_val fallingCircle(float speed) {
    emscripten_val options;
    options["x"] = 0.0f;
    options["y"] = 6.0f;
    options["vx"] = 0.0f;
    options["vy"] = -speed;
    options["r"] = 0.0f;
    options["type"] = (int)ObjectType::DYNAMIC_OBJECT;
    options["shape"] = (int)ObjectShape::CIRCLE;
    options["radius"] = 1.5f;
    options["mass"] = 7.07f;
    options["canSleep"] = false;
    options["wantsEvents"] = true;
    return options;
}

static SlitRun runRecipe(const SlitRecipe& recipe) {
    World world;
    world.setGravity(0.0f, 0.0f);
    world.setTimeStep(1.0f / 60.0f);

    int id = 1;
    auto addSensors = [&]() {
        for (int i = 0; i < recipe.sensorCount; ++i) {
            world.createBody(id++, fixedBox(0.0f, 5.0f, 40.0f, 40.0f, true));
        }
    };
    auto addWall = [&]() {
        world.createBody(id++, fixedBox(0.0f, 0.0f, 10.715f, 2.4f, false));
    };

    if (recipe.wallBeforeSensors) addWall();
    addSensors();
    if (!recipe.wallBeforeSensors) addWall();
    world.createBody(id++, fixedBox(recipe.secondWallX, 0.0f, 10.715f, 2.4f, false));

    int circleId = id;
    world.createBody(circleId, fallingCircle(recipe.speed));
    Body* circle = world.getBody(circleId);
    EXPECT_NE(circle, nullptr);
    if (!circle) return {0.0f, 0.0f};

    float minY = circle->getY();
    for (int step = 0; step < recipe.steps; ++step) {
        world.step();
        minY = std::min(minY, circle->getY());
    }
    return {minY, circle->getY()};
}

static void expectHeld(const SlitRecipe& recipe) {
    SlitRun run = runRecipe(recipe);
    EXPECT_GT(run.minY, kRestY)
        << "sensors=" << recipe.sensorCount
        << " wallBeforeSensors=" << recipe.wallBeforeSensors
        << " secondWallX=" << recipe.secondWallX
        << " speed=" << recipe.speed
        << " minY=" << run.minY
        << " finalY=" << run.finalY;
}

// Saucers recipe. Fails without GEARBOX_MT. The multithreaded test build keeps it.
TEST(SlitContactRepro, FiveSensorsDropTheWall) {
    const float speeds[] = {10.0f, 0.5f, 60.0f};
    const int steps[] = {120, 1200, 120};
    std::string misses;
    for (int i = 0; i < 3; ++i) {
        SlitRun run = runRecipe({5, false, 13.0f, speeds[i], steps[i]});
        if (!(run.minY > kRestY)) {
            misses += "speed=" + std::to_string(speeds[i])
                + " minY=" + std::to_string(run.minY)
                + " finalY=" + std::to_string(run.finalY) + "\n";
        }
    }
    EXPECT_TRUE(misses.empty()) << misses;
}

// Same order as the recipe, with enough sensors that a 4-thread narrow phase
// also drops the wall. Speed 10 lands at y = -13.858, the same free-fall.
TEST(SlitContactRepro, TwelveSensorsDropTheWall) {
    expectHeld({12, false, 13.0f, 10.0f, 120});
}

TEST(SlitContactRepro, FourSensorsWallHolds) {
    expectHeld({4, false, 13.0f, 10.0f, 120});
}

TEST(SlitContactRepro, WallCreatedBeforeSensorsHolds) {
    expectHeld({5, true, 13.0f, 10.0f, 120});
}

TEST(SlitContactRepro, DistantSecondWallHolds) {
    expectHeld({5, false, 1000.0f, 10.0f, 120});
}

TEST(SlitContactRepro, TwelveSensorsWallCreatedFirstHolds) {
    expectHeld({12, true, 13.0f, 10.0f, 120});
}
