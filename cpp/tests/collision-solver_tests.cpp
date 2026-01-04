#include <gtest/gtest.h>
#include "world.h"
#include "physical-object.h"
#include "collision-solver.h"

// Helper to create options for PhysicalObject
emscripten_val createSimpleOptions(float x, float y, ObjectShape shape, float size) {
    emscripten_val options;
    options.properties["x"] = x;
    options.properties["y"] = y;
    options.properties["shape"] = (int)shape;
    options.properties["type"] = (int)ObjectType::RIGID_BODY;
    if (shape == ObjectShape::CIRCLE) {
        options.properties["radius"] = size;
    } else {
        options.properties["width"] = size;
        options.properties["height"] = size;
    }
    return options;
}

TEST(CollisionSolverTest, CirclesCollide) {
    World world;
    
    // Circle 1 at (0,0) radius 1
    int id1 = world.makeObject(1, createSimpleOptions(0.0f, 0.0f, ObjectShape::CIRCLE, 1.0f));
    // Circle 2 at (1.5, 0) radius 1
    int id2 = world.makeObject(2, createSimpleOptions(1.5f, 0.0f, ObjectShape::CIRCLE, 1.0f));
    
    CollisionSolver solver(world.liveIntData, world.liveFloatData);
    bool colliding = solver.solve(id1, id2);
    
    EXPECT_TRUE(colliding);
    ASSERT_EQ(solver.collisions.size(), 1);
    EXPECT_FLOAT_EQ(solver.collisions[0].penetrationDepth, 0.5f);
}

TEST(CollisionSolverTest, CirclesDoNotCollide) {
    World world;
    
    int id1 = world.makeObject(1, createSimpleOptions(0.0f, 0.0f, ObjectShape::CIRCLE, 1.0f));
    int id2 = world.makeObject(2, createSimpleOptions(3.0f, 0.0f, ObjectShape::CIRCLE, 1.0f));
    
    CollisionSolver solver(world.liveIntData, world.liveFloatData);
    bool colliding = solver.solve(id1, id2);
    
    EXPECT_FALSE(colliding);
}

TEST(CollisionSolverTest, AabbsCollide) {
    World world;
    
    // AABB 1 at (0,0) size 2 (half-extents 1)
    int id1 = world.makeObject(1, createSimpleOptions(0.0f, 0.0f, ObjectShape::AABB, 2.0f));
    // AABB 2 at (1.5, 0) size 2
    int id2 = world.makeObject(2, createSimpleOptions(1.5f, 0.0f, ObjectShape::AABB, 2.0f));
    
    CollisionSolver solver(world.liveIntData, world.liveFloatData);
    bool colliding = solver.solve(id1, id2);
    
    EXPECT_TRUE(colliding);
    ASSERT_EQ(solver.collisions.size(), 1);
    EXPECT_FLOAT_EQ(solver.collisions[0].penetrationDepth, 0.5f);
}

TEST(CollisionSolverTest, CircleAabbCollide) {
    World world;
    
    // Circle at (0,0) radius 1
    int id1 = world.makeObject(1, createSimpleOptions(0.0f, 0.0f, ObjectShape::CIRCLE, 1.0f));
    // AABB at (1.5, 0) size 2
    int id2 = world.makeObject(2, createSimpleOptions(1.5f, 0.0f, ObjectShape::AABB, 2.0f));
    
    CollisionSolver solver(world.liveIntData, world.liveFloatData);
    bool colliding = solver.solve(id1, id2);
    
    EXPECT_TRUE(colliding);
}
