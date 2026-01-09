#include <gtest/gtest.h>
#include "world.h"
#include "physical-object.h"

// Helper to create options with wantsEvents
emscripten_val createSleepEventOptions(float x, float y, bool wantsEvents = true) {
    emscripten_val options;
    options.properties["x"] = x;
    options.properties["y"] = y;
    options.properties["mass"] = 1.0f;
    options.properties["type"] = (int)ObjectType::RIGID_BODY;
    options.properties["shape"] = (int)ObjectShape::CIRCLE;
    options.properties["radius"] = 1.0f;
    options.properties["wantsEvents"] = wantsEvents;
    return options;
}

TEST(SleepEventTest, SleepAndWakeEvents) {
    World world;
    world.setGravity(0.0f, 0.0f);
    
    // Create an object that wants events
    world.makeObject(1, createSleepEventOptions(0.0f, 0.0f, true));
    PhysicalObject* obj = world.getObject(1);
    
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
    world.makeObject(1, options);
    PhysicalObject* obj = world.getObject(1);
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
    world.makeObject(1, createSleepEventOptions(0.0f, 0.0f, false));
    PhysicalObject* obj = world.getObject(1);
    
    obj->sleep();
    EXPECT_EQ(world.getEventCount(), 0);
    
    obj->wakeUp();
    EXPECT_EQ(world.getEventCount(), 0);
}

