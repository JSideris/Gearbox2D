// PER-856: opt-in sensor-vs-sensor contacts. Off by default (existing behaviour unchanged);
// when both sensors opt in they get the normal COLLISION_START / COLLISION_END events.
#include <gtest/gtest.h>
#include <random>
#include <cstring>
#include "world.h"
#include "body.h"
#include "fixture.h"
#include "constants.h"

// Mixed-scene tripwire. The 0.5.1 pin (9484880583803729980) moved in 0.7.1:
// fat bounds are refit before broadphase, so the first step's pairs include
// this step's travel. Threaded and single-threaded narrow phases order those
// pairs differently, so each build has its own pin. `make test` is threaded.
#ifdef GEARBOX_MT
#define GOLDEN_DEFAULT_SCENE_HASH 18374170494446402228ull
#else
#define GOLDEN_DEFAULT_SCENE_HASH 8627616186565530714ull
#endif

namespace {

emscripten_val sensorCircle(float x, float y, bool optIn, uint32_t category = 1, uint32_t mask = 0xFFFFFFFFu) {
    emscripten_val o;
    o["x"] = x; o["y"] = y; o["mass"] = 1.0f;
    o["type"] = (int)ObjectType::DYNAMIC_OBJECT;
    o["shape"] = (int)ObjectShape::CIRCLE; o["radius"] = 1.0f;
    o["isSensor"] = true; o["wantsEvents"] = true; o["canSleep"] = false;
    o["categoryBits"] = (int)category; o["maskBits"] = (int)mask;
    if (optIn) o["sensorContacts"] = true;
    return o;
}

int countEvents(const World& w, int type) {
    int n = 0;
    const auto& e = w.getEventBuffer();
    for (size_t i = 0; i + 5 < e.size(); i += 6) n += (int)e[i] == type;
    return n;
}

} // namespace

TEST(SensorContactsTest, OffByDefault) {
    World world;
    world.createBody(1, sensorCircle(0, 0, false));
    world.createBody(2, sensorCircle(1, 0, false));
    world.step();
    EXPECT_EQ(world.getEventCount(), 0);
}

TEST(SensorContactsTest, BothOptedInGetBeginAndEnd) {
    World world;
    world.createBody(1, sensorCircle(0, 0, true));
    world.createBody(2, sensorCircle(5, 0, true));
    world.step();
    EXPECT_EQ(world.getEventCount(), 0);

    world.getBody(2)->setX(1.5f);
    world.step();
    ASSERT_EQ(countEvents(world, (int)EventType::COLLISION_START), 1);
    const auto& e = world.getEventBuffer();
    EXPECT_EQ(std::min((int)e[1], (int)e[2]), 1);
    EXPECT_EQ(std::max((int)e[1], (int)e[2]), 2);

    world.step(); // still overlapping: no new events
    EXPECT_EQ(world.getEventCount(), 0);
    // Sensors never push each other.
    EXPECT_FLOAT_EQ(world.getBody(1)->getX(), 0.0f);

    world.getBody(2)->setX(10.0f);
    world.step();
    EXPECT_EQ(countEvents(world, (int)EventType::COLLISION_END), 1);
    EXPECT_EQ(countEvents(world, (int)EventType::COLLISION_START), 0);
}

TEST(SensorContactsTest, OneSidedOptInIsNotEnough) {
    World world;
    world.createBody(1, sensorCircle(0, 0, true));
    world.createBody(2, sensorCircle(1, 0, false));
    world.step();
    EXPECT_EQ(world.getEventCount(), 0);
}

TEST(SensorContactsTest, FiltersStillApply) {
    World world;
    world.createBody(1, sensorCircle(0, 0, true, 0x1, 0x1));
    world.createBody(2, sensorCircle(1, 0, true, 0x2, 0x2));
    world.step();
    EXPECT_EQ(world.getEventCount(), 0);
    // Matching filters: contact.
    world.createBody(3, sensorCircle(0.5f, 0, true, 0x1, 0x1));
    world.step();
    EXPECT_EQ(countEvents(world, (int)EventType::COLLISION_START), 1);
}

TEST(SensorContactsTest, RuntimeToggle) {
    World world;
    world.createBody(1, sensorCircle(0, 0, false));
    world.createBody(2, sensorCircle(1, 0, false));
    world.step();
    EXPECT_EQ(world.getEventCount(), 0);
    world.getBody(1)->fixtures[0]->setSensorContacts(true);
    world.getBody(2)->fixtures[0]->setSensorContacts(true);
    EXPECT_TRUE(world.getBody(1)->fixtures[0]->getSensorContacts());
    world.step();
    EXPECT_EQ(countEvents(world, (int)EventType::COLLISION_START), 1);
    world.getBody(2)->fixtures[0]->setSensorContacts(false);
    world.step();
    EXPECT_EQ(countEvents(world, (int)EventType::COLLISION_END), 1);
}

TEST(SensorContactsTest, ManySensorsMatchBruteForcePairs) {
    // 150 opted-in sensors: begin events over the first step equal the overlapping pairs.
    World world;
    std::mt19937 rng(5);
    std::uniform_real_distribution<float> pos(-20.0f, 20.0f);
    std::vector<Vec2> p;
    for (int id = 1; id <= 150; ++id) {
        Vec2 v(pos(rng), pos(rng));
        p.push_back(v);
        world.createBody(id, sensorCircle(v.x, v.y, true));
    }
    world.step();
    int expected = 0;
    for (size_t i = 0; i < p.size(); ++i)
        for (size_t j = i + 1; j < p.size(); ++j)
            if ((p[i] - p[j]).magnitudeSquared() < 4.0f) expected++;
    EXPECT_GT(expected, 20);
    EXPECT_EQ(countEvents(world, (int)EventType::COLLISION_START), expected);
}

// State hash of a mixed scene (rigid bodies + overlapping, non-opted sensors).
// Default sensor behaviour stays bit-identical to the pin for this build.
// Only circles (no local offsets) and an AABB floor: rotation never feeds back into positions or
// velocities, so the hashed state doesn't depend on libm sin/cos.
TEST(SensorContactsTest, DefaultSceneIsBitIdenticalToBaseline) {
    World world;
    world.setGravity(0.0f, -9.8f);
    std::mt19937 rng(77);
    std::uniform_real_distribution<float> pos(-15.0f, 15.0f), u(0.0f, 1.0f);
    emscripten_val ground;
    ground["x"] = 0.0f; ground["y"] = -20.0f; ground["type"] = (int)ObjectType::FIXED_OBJECT;
    ground["shape"] = (int)ObjectShape::AABB; ground["width"] = 60.0f; ground["height"] = 2.0f;
    ground["sFriction"] = 0.0f; ground["kFriction"] = 0.0f;
    world.createBody(1, ground);
    for (int id = 2; id <= 120; ++id) {
        emscripten_val o;
        o["x"] = pos(rng); o["y"] = pos(rng); o["mass"] = 1.0f;
        o["type"] = (int)ObjectType::DYNAMIC_OBJECT;
        o["shape"] = (int)ObjectShape::CIRCLE;
        o["radius"] = 0.4f + 0.4f * u(rng);
        o["sFriction"] = 0.0f; o["kFriction"] = 0.0f;
        o["wantsEvents"] = true;
        if (u(rng) < 0.3f) o["isSensor"] = true;
        world.createBody(id, o);
    }
    uint64_t h = 1469598103934665603ull;
    auto mix = [&h](float f) { uint32_t b; std::memcpy(&b, &f, 4); h = (h ^ b) * 1099511628211ull; };
    int events = 0;
    for (int s = 0; s < 240; ++s) {
        world.step();
        events += world.getEventCount();
        mix((float)world.getEventCount());
    }
    for (int id = 2; id <= 120; ++id) {
        Body* b = world.getBody(id);
        mix(b->getX()); mix(b->getY()); mix(b->getVelocityX()); mix(b->getVelocityY());
    }
    EXPECT_GT(events, 50); // the scene really has contacts (incl. sensor/rigid)
    EXPECT_EQ(h, GOLDEN_DEFAULT_SCENE_HASH) << "hash " << h;
}
