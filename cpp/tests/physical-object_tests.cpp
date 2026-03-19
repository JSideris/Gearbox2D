#include <gtest/gtest.h>
#include "body.h"
#include "fixture.h"
#include "world.h"

// Helper to create basic options for Body
emscripten_val createOptions(float x = 0.0f, float y = 0.0f, float mass = 1.0f) {
    emscripten_val options;
    options.properties["x"] = x;
    options.properties["y"] = y;
    options.properties["mass"] = mass;
    options.properties["type"] = (int)ObjectType::DYNAMIC_OBJECT;
    options.properties["shape"] = (int)ObjectShape::CIRCLE;
    options.properties["radius"] = 1.0f;
    return options;
}

TEST(BodyTest, CreationAndInitialization) {
    World world;
    emscripten_val options = createOptions(10.0f, 20.0f, 5.0f);
    
    int index = world.createBody(1, options);
    Body* obj = world.getBodyAtIndex(index);
    
    EXPECT_EQ(obj->getId(), 1);
    EXPECT_FLOAT_EQ(obj->getX(), 10.0f);
    EXPECT_FLOAT_EQ(obj->getY(), 20.0f);
    EXPECT_FLOAT_EQ(obj->getMass(), 5.0f);
    EXPECT_FLOAT_EQ(obj->getInverseMass(), 1.0f / 5.0f);
}

TEST(BodyTest, MovementAndSleepState) {
    World world;
    emscripten_val options = createOptions();
    int index = world.createBody(1, options);
    Body* obj = world.getBodyAtIndex(index);
    
    // Initial state
    EXPECT_FALSE(obj->isSleeping);
    
    // Force sleep
    obj->sleep();
    EXPECT_TRUE(obj->isSleeping);
    EXPECT_FLOAT_EQ(obj->getVelocityX(), 0.0f);
    
    // Wake up via velocity change
    obj->setVelocityX(1.0f);
    EXPECT_FALSE(obj->isSleeping);
    
    // Force sleep again
    obj->sleep();
    EXPECT_TRUE(obj->isSleeping);
    
    // Wake up via force
    obj->applyForce(10.0f, 0.0f);
    EXPECT_FALSE(obj->isSleeping);
}

TEST(BodyTest, ContactManagement) {
    World world;
    emscripten_val options = createOptions();
    int indexA = world.createBody(1, options);
    int indexB = world.createBody(2, options);
    Body* objA = world.getBodyAtIndex(indexA);
    Body* objB = world.getBodyAtIndex(indexB);
    
    // Add contact
    objA->addContact(objB);
    objA->sleep();
    objB->sleep();
    
    EXPECT_TRUE(objA->isSleeping);
    EXPECT_TRUE(objB->isSleeping);
    
    // Waking A should wake B due to contact
    objA->wakeUp();
    EXPECT_FALSE(objA->isSleeping);
    EXPECT_FALSE(objB->isSleeping);
    
    // Remove contact
    objA->removeContact(objB);
    objA->sleep();
    objB->sleep();
    
    objA->wakeUp();
    EXPECT_FALSE(objA->isSleeping);
    EXPECT_TRUE(objB->isSleeping); // B should still be sleeping
}

TEST(BodyTest, AabbRecomputation) {
    World world;
    emscripten_val options = createOptions(0, 0);
    options.properties["radius"] = 1.0f;
    int index = world.createBody(1, options);
    Body* obj = world.getBodyAtIndex(index);
    
    // Initial AABB for circle at (0,0) with radius 1 should be (-1,-1) to (1,1)
    obj->recomputeAabb(1); // mode 1: without padding
    EXPECT_FLOAT_EQ(obj->fixtures[0]->aabb.min.x, -1.0f);
    EXPECT_FLOAT_EQ(obj->fixtures[0]->aabb.min.y, -1.0f);
    EXPECT_FLOAT_EQ(obj->fixtures[0]->aabb.max.x, 1.0f);
    EXPECT_FLOAT_EQ(obj->fixtures[0]->aabb.max.y, 1.0f);
    
    // Move and recompute
    obj->setX(5.0f);
    obj->recomputeAabb(1);
    EXPECT_FLOAT_EQ(obj->fixtures[0]->aabb.min.x, 4.0f);
    EXPECT_FLOAT_EQ(obj->fixtures[0]->aabb.max.x, 6.0f);
}
