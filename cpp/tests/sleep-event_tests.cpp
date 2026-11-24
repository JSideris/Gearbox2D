#include <algorithm>
#include <cmath>
#include <string>
#include <vector>
#include <gtest/gtest.h>
#include "world.h"
#include "body.h"
#include "fixture.h"

// Helper to create options with wantsEvents
emscripten_val createSleepEventOptions(float x, float y, bool wantsEvents = true) {
    emscripten_val options;
    options.properties["x"] = x;
    options.properties["y"] = y;
    options.properties["mass"] = 1.0f;
    options.properties["type"] = (int)ObjectType::DYNAMIC_OBJECT;
    options.properties["shape"] = (int)ObjectShape::CIRCLE;
    options.properties["radius"] = 1.0f;
    options.properties["wantsEvents"] = wantsEvents;
    return options;
}

TEST(SleepEventTest, SleepAndWakeEvents) {
    World world;
    world.setGravity(0.0f, 0.0f);
    
    // Create an object that wants events
    world.createBody(1, createSleepEventOptions(0.0f, 0.0f, true));
    Body* obj = world.getBody(1);
    
    // Initially awake
    EXPECT_FALSE(obj->isSleeping);
    
    world.step();
    EXPECT_EQ(world.getEventCount(), 0);
    
    // Force sleep
    obj->sleep();
    EXPECT_TRUE(obj->isSleeping);
    
    // Step to see the event
    // Wait, sleep() emits the event immediately via world.addEvent.
    // However, eventData is cleared at the start of World::step().
    // So if we call sleep() BEFORE step(), the event will be cleared.
    // If we call it AFTER or DURING step (which is what usually happens), it will be in the buffer.
    
    // Let's call sleep and then check without calling step() if we want to see it now.
    // But World::step() is what handles the event cycle.
    
    // In our implementation:
    // sleep() -> addEvent(SLEEP)
    // step() -> clear() -> _doKinematics() -> _doBroadPhase() ...
    
    // So we should call sleep() and then we can check eventData BEFORE step() clears it, 
    // OR call sleep() during a phase of step().
    
    // Let's test the state transition in a normal flow.
    obj->wakeUp();
    world.step(); // clears any previous
    obj->sleep(); 
    EXPECT_EQ(world.getEventCount(), 1); 
    
    // Now step again - event should be cleared
    world.step();
    EXPECT_EQ(world.getEventCount(), 0);
    
    // Wake up
    obj->wakeUp();
    EXPECT_FALSE(obj->isSleeping);
    EXPECT_EQ(world.getEventCount(), 1); // Should have a wake event
}

TEST(SleepEventTest, AutomaticSleepEvent) {
    World world;
    world.setGravity(0.0f, 0.0f);
    
    // Create an object with a very short sleep time required
    emscripten_val options = createSleepEventOptions(0.0f, 0.0f, true);
    world.createBody(1, options);
    Body* obj = world.getBody(1);
    obj->sleepTimeRequired = 0.02f; // Longer than one step (0.0166s), shorter than two (0.0333s)
    
    world.step(); // First step, timer = 0.0166
    EXPECT_FALSE(obj->isSleeping);
    EXPECT_EQ(world.getEventCount(), 0);
    
    world.step(); // Second step, timer = 0.0333 > 0.02
    EXPECT_TRUE(obj->isSleeping);
    // The sleep event should be in the buffer because it happened during _doKinematics() 
    // which is AFTER the clear() in step().
    EXPECT_EQ(world.getEventCount(), 1);
}

TEST(SleepEventTest, OptInMechanism) {
    World world;
    world.setGravity(0.0f, 0.0f);
    
    // Object that doesn't want events
    world.createBody(1, createSleepEventOptions(0.0f, 0.0f, false));
    Body* obj = world.getBody(1);
    
    obj->sleep();
    EXPECT_EQ(world.getEventCount(), 0);
    
    obj->wakeUp();
    EXPECT_EQ(world.getEventCount(), 0);
}


TEST(SleepEventTest, TC9RestingBoxWakesOnlyWhenDisturbed) {
    World world;
    world.setGravity(0.0f, 1.0f);
    world.setTimeStep(1.0f / 60.0f);
    // Reproduce the rotated platform and offset resting box from site TC-9.
    emscripten_val platform;
    platform["x"] = 5.0f;
    platform["y"] = 6.0f;
    platform["r"] = std::acos(-1.0f) / 2.0f;
    platform["type"] = static_cast<int>(ObjectType::FIXED_OBJECT);
    platform["shape"] = static_cast<int>(ObjectShape::BOX);
    platform["width"] = 1.0f;
    platform["height"] = 8.0f;
    world.createBody(1, platform);

    emscripten_val options;
    options["x"] = 7.0f;
    options["y"] = 5.0f;
    options["type"] = static_cast<int>(ObjectType::DYNAMIC_OBJECT);
    options["shape"] = static_cast<int>(ObjectShape::BOX);
    options["width"] = 1.0f;
    options["height"] = 1.0f;
    options["mass"] = 0.2f;
    options["wantsEvents"] = true;
    world.createBody(2, options);
    Body* box = world.getBody(2);

    for (bool disturbed : {false, true}) {
        SCOPED_TRACE(disturbed ? "after lift" : "undisturbed");
        const float startAngle = box->getRotation();
        float peakTravel = 0.0f, peakRotation = 0.0f;
        std::vector<int> sleeps, wakes;
        auto recordEvents = [&](int step, size_t offset) {
            const auto& events = world.getEventBuffer();
            for (size_t i = offset; i + 5 < events.size(); i += 6) {
                if (events[i + 1] != box->id) continue;
                auto type = static_cast<EventType>(static_cast<int>(events[i]));
                if (type == EventType::SLEEP) sleeps.push_back(step);
                if (type == EventType::WAKE) wakes.push_back(step);
            }
        };

        if (disturbed) {
            // The wake is emitted synchronously. step() will clear it.
            const auto offset = world.getEventBuffer().size();
            box->setY(box->getY() - 0.25f);
            recordEvents(0, offset);
        }
        const Vec2 start(box->getX(), box->getY());
        for (int step = 1; step <= 300; ++step) {
            world.step();
            recordEvents(step, 0);
            const Vec2 position(box->getX(), box->getY());
            peakTravel = std::max(peakTravel, (position - start).magnitude());
            peakRotation = std::max(peakRotation, std::abs(box->getRotation() - startAngle));
        }

        const std::string prefix = disturbed ? "lift_" : "rest_";
        RecordProperty(prefix + "sleep_steps", ::testing::PrintToString(sleeps));
        RecordProperty(prefix + "wake_steps", ::testing::PrintToString(wakes));
        RecordProperty(prefix + "peak_travel_m", std::to_string(peakTravel));
        RecordProperty(prefix + "peak_rotation_rad", std::to_string(peakRotation));
        EXPECT_TRUE(box->isSleeping);
        EXPECT_EQ(sleeps.size(), 1u);
        if (disturbed) {
            EXPECT_EQ(wakes, std::vector<int>{0});
            EXPECT_NEAR(box->getY() - start.y, 0.25f, PENETRATION_SLOP);
        } else {
            EXPECT_TRUE(wakes.empty());
            EXPECT_LT(peakTravel, PENETRATION_SLOP);
        }
    }
}
