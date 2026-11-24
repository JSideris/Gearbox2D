#include <gtest/gtest.h>
#include "world.h"
#include "body.h"
#include "fixture.h"
#include "collision-solver.h"

// Helper to create options for Body
emscripten_val createSimpleOptions(float x, float y, ObjectShape shape, float size) {
    emscripten_val options;
    options.properties["x"] = x;
    options.properties["y"] = y;
    options.properties["shape"] = (int)shape;
    options.properties["type"] = (int)ObjectType::DYNAMIC_OBJECT;
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
    int id1 = world.createBody(1, createSimpleOptions(0.0f, 0.0f, ObjectShape::CIRCLE, 1.0f));
    // Circle 2 at (1.5, 0) radius 1
    int id2 = world.createBody(2, createSimpleOptions(1.5f, 0.0f, ObjectShape::CIRCLE, 1.0f));
    
    CollisionSolver solver(world);
    bool colliding = solver.solve(id1, id2, world.getTimeStep());
    
    EXPECT_TRUE(colliding);
    ASSERT_EQ(solver.collisions.size(), 1);
    EXPECT_FLOAT_EQ(solver.collisions[0].penetrationDepth, 0.5f);
}

TEST(CollisionSolverTest, CirclesDoNotCollide) {
    World world;
    
    int id1 = world.createBody(1, createSimpleOptions(0.0f, 0.0f, ObjectShape::CIRCLE, 1.0f));
    int id2 = world.createBody(2, createSimpleOptions(3.0f, 0.0f, ObjectShape::CIRCLE, 1.0f));
    
    CollisionSolver solver(world);
    bool colliding = solver.solve(id1, id2, world.getTimeStep());
    
    EXPECT_FALSE(colliding);
}

TEST(CollisionSolverTest, AabbsCollide) {
    World world;
    
    // AABB 1 at (0,0) size 2 (half-extents 1)
    int id1 = world.createBody(1, createSimpleOptions(0.0f, 0.0f, ObjectShape::AABB, 2.0f));
    // AABB 2 at (1.5, 0) size 2
    int id2 = world.createBody(2, createSimpleOptions(1.5f, 0.0f, ObjectShape::AABB, 2.0f));
    
    CollisionSolver solver(world);
    bool colliding = solver.solve(id1, id2, world.getTimeStep());
    
    EXPECT_TRUE(colliding);
    ASSERT_EQ(solver.collisions.size(), 1);
    EXPECT_FLOAT_EQ(solver.collisions[0].penetrationDepth, 0.5f);
}

TEST(CollisionSolverTest, CircleAabbCollide) {
    World world;
    
    // Circle at (0,0) radius 1
    int id1 = world.createBody(1, createSimpleOptions(0.0f, 0.0f, ObjectShape::CIRCLE, 1.0f));
    // AABB at (1.5, 0) size 2
    int id2 = world.createBody(2, createSimpleOptions(1.5f, 0.0f, ObjectShape::AABB, 2.0f));
    
    CollisionSolver solver(world);
    bool colliding = solver.solve(id1, id2, world.getTimeStep());
    
    EXPECT_TRUE(colliding);
}

TEST(CollisionSolverTest, FallingCapsuleAnticipatesDrivenPulleyContact) {
    // Sampled just before the first Spring Belt impact at 60 Hz. The
    // capsule travels less than a quarter of its diameter but crosses the rim.
    World world;
    auto pulley = createSimpleOptions(5.0f, 3.014f, ObjectShape::CIRCLE, 2.5f);
    pulley["mass"] = 10.0f;
    pulley["rs"] = 2.506f;
    pulley["sFriction"] = 1.0f;
    pulley["kFriction"] = 1.0f;
    auto capsule = createSimpleOptions(3.482f, 0.434f, ObjectShape::CAPSULE, 1.0f);
    capsule["radius"] = 0.3f;
    capsule["mass"] = 0.1f;
    capsule["vx"] = 0.507f;
    capsule["vy"] = 5.451f;
    capsule["sFriction"] = 0.999f;
    capsule["kFriction"] = 0.99f;
    int a = world.createBody(1, pulley);
    int b = world.createBody(2, capsule);
    CollisionSolver solver(world);
    for (bool reverse : {false, true}) {
        solver.clear();
        ASSERT_TRUE(solver.solve(reverse ? b : a, reverse ? a : b, 1.0f / 60.0f));
        ASSERT_EQ(solver.collisions.size(), 1u);
        const auto& contact = solver.collisions.front();
        EXPECT_LT(contact.penetrationDepth, 0.0f);
        EXPECT_LT(contact.relativeVelocity.dot(contact.normal) / 60.0f,
                  contact.penetrationDepth);
    }
}

TEST(CollisionSolverTest, RotatingLinkApproachesPulleyOnlyOnClosingSwing) {
    for (auto shape : {ObjectShape::BOX, ObjectShape::CAPSULE}) {
        World world;
        auto pulley = createSimpleOptions(0, 0, ObjectShape::CIRCLE, 2.5f);
        pulley["rs"] = 2.5f;
        int a = world.createBody(1, pulley);
        const bool box = shape == ObjectShape::BOX;
        auto link = createSimpleOptions(box ? 2.67f : 2.82f, 0.4f, shape, 0.3f);
        link["height"] = box ? 0.6f : 1.0f;
        int b = world.createBody(2, link);
        CollisionSolver solver(world);
        for (float spin : {0.0f, 25.0f, -25.0f}) {
            world.getBody(2)->setAngularVelocity(spin);
            EXPECT_EQ(solver.solve(a, b, world.getTimeStep()), spin < 0) << "spin " << spin;
        }
    }
}
