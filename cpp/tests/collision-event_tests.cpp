#include <gtest/gtest.h>
#include "world.h"
#include "physical-object.h"

// Helper to create options with wantsEvents
emscripten_val createEventOptions(float x, float y, bool wantsEvents = true) {
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

TEST(CollisionEventTest, StartAndEndEvents) {
    World world;
    world.setGravity(0.0f, 0.0f);
    
    // 1. Create two objects that are NOT colliding initially
    // Radius is 1.0, so they touch at distance 2.0.
    world.makeObject(1, createEventOptions(0.0f, 0.0f, true));
    world.makeObject(2, createEventOptions(5.0f, 0.0f, true));
    
    world.step();
    
    // No events should have been generated yet
    EXPECT_EQ(world.getEventCount(), 0);
    
    // 2. Move object 2 so it overlaps with object 1
    PhysicalObject* obj2 = world.getObject(2);
    obj2->setX(1.5f); // Overlap!
    
    world.step();
    
    // We should have 1 event (Collision Start)
    EXPECT_EQ(world.getEventCount(), 1);
    
    // Read the event data
    // Format: [type, idA, idB, impulse]
    // Since we can't easily access the memory view in native C++, 
    // we'll check the internal eventData vector if it's accessible or if we can mock it.
    // Wait, getEventData() in world.cpp uses emscripten_val. 
    // In native C++, it's not defined or returns emscripten_val (MockVal).
    
    // Let's check how many events we have.
    // I added a public method getEventCount() to World.
    
    // 3. Move object 2 away
    obj2->setX(10.0f);
    
    world.step();
    
    // We should have 1 event in this step (Collision End)
    EXPECT_EQ(world.getEventCount(), 1);
}

TEST(CollisionEventTest, OptInMechanism) {
    World world;
    world.setGravity(0.0f, 0.0f);
    
    // One object wants events, the other doesn't.
    world.makeObject(1, createEventOptions(0.0f, 0.0f, true));
    world.makeObject(2, createEventOptions(5.0f, 0.0f, false));
    
    world.step();
    EXPECT_EQ(world.getEventCount(), 0);
    
    // Collide them
    world.getObject(2)->setX(1.0f);
    world.step();
    
    // Should still get an event because object 1 opted in
    EXPECT_EQ(world.getEventCount(), 1);
    
    world.clear();
    
    // Neither wants events
    world.makeObject(3, createEventOptions(0.0f, 0.0f, false));
    world.makeObject(4, createEventOptions(5.0f, 0.0f, false));
    
    world.getObject(4)->setX(1.0f);
    world.step();
    
    // No events should be generated
    EXPECT_EQ(world.getEventCount(), 0);
}

