// PER-582 (Saucers: ships pass through some walls at any speed). Narrow-phase pairs are sorted by first fixture and
// second shape; a run of four circle-vs-same-shape pairs used to enter the 1-vs-4 SIMD path, which only exists for
// circle-vs-circle and circle-vs-point. For boxes (or any other shape) it solved nothing and skipped all four pairs,
// so a circle overlapping four or more boxes at once (walls plus overlapping sensor zones) lost those contacts.
// Invariant: a circle driven into a solid box stops on it, whatever else overlaps it and in any creation order.
#include <gtest/gtest.h>
#include "world.h"
#include "body.h"
#include "fixture.h"
#include "constants.h"

namespace {

emscripten_val box(float x, float y, float w, float h, bool sensor) {
    emscripten_val o;
    o["x"] = x; o["y"] = y; o["type"] = (int)ObjectType::FIXED_OBJECT;
    o["shape"] = (int)ObjectShape::BOX; o["width"] = w; o["height"] = h;
    o["isSensor"] = sensor; o["wantsEvents"] = true; o["canSleep"] = false;
    return o;
}

emscripten_val circle(float x, float y, float vy) {
    emscripten_val o;
    o["x"] = x; o["y"] = y; o["vx"] = 0.0f; o["vy"] = vy; o["mass"] = 7.07f;
    o["type"] = (int)ObjectType::DYNAMIC_OBJECT;
    o["shape"] = (int)ObjectShape::CIRCLE; o["radius"] = 1.5f;
    o["wantsEvents"] = true; o["canSleep"] = false;
    return o;
}

/** The lowest y the circle reaches when dropped at `speed` onto a 2.4 m thick wall at y = 0 with `sensors` 40 x 40
 *  sensor boxes over it (created before the walls when `sensorsFirst`). */
float lowest(int sensors, float speed, bool sensorsFirst, int steps = 120) {
    World w;
    w.setGravity(0, 0);
    w.setTimeStep(1.0f / 60.0f);
    int id = 1;
    auto addSensors = [&] { for (int k = 0; k < sensors; ++k) w.createBody(id++, box(0, 5, 40, 40, true)); };
    if (sensorsFirst) addSensors();
    w.createBody(id++, box(0, 0, 10.715f, 2.4f, false));
    w.createBody(id++, box(13, 0, 10.715f, 2.4f, false));
    if (!sensorsFirst) addSensors();
    int c = id++;
    w.createBody(c, circle(0, 6, -speed));
    float minY = 1e9f;
    for (int i = 0; i < steps; ++i) { w.step(); minY = std::min(minY, w.getBody(c)->getY()); }
    return minY;
}

} // namespace

TEST(CircleBoxSimdRun, CircleStopsOnWallWithAnyNumberOfOverlappingSensors) {
    const float rest = 1.2f + 1.5f - 0.15f; // wall top + radius, with a little penetration slop
    for (int k = 0; k <= 16; ++k) {
        for (bool first : {true, false}) {
            EXPECT_GT(lowest(k, 10.0f, first), rest) << "sensors " << k << (first ? " (created first)" : " (created last)");
        }
    }
}

TEST(CircleBoxSimdRun, SlowAndFastCirclesStopToo) {
    const float rest = 1.2f + 1.5f - 0.15f;
    EXPECT_GT(lowest(5, 0.5f, true, 1200), rest);
    EXPECT_GT(lowest(5, 60.0f, true), rest - 0.5f); // fast: one step of speculative slop allowed
}

TEST(CircleBoxSimdRun, CircleInsideFourSolidBoxesIsPushedOut) {
    // Four solid boxes overlapping the same spot: a circle dropped through them must not pass straight through.
    World w;
    w.setGravity(0, 0);
    w.setTimeStep(1.0f / 60.0f);
    for (int k = 0; k < 4; ++k) w.createBody(k + 1, box(0.01f * k, 0, 10, 2.4f, false));
    w.createBody(10, circle(0, 6, -10));
    float minY = 1e9f;
    for (int i = 0; i < 120; ++i) { w.step(); minY = std::min(minY, w.getBody(10)->getY()); }
    EXPECT_GT(minY, 1.2f + 1.5f - 0.15f);
}
