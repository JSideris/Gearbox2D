#include <gtest/gtest.h>
#include "world.h"
#include "body.h"
#include "fixture.h"
#include "collision-solver.h"
#include "debug.h"

// Helper to create options for Body
emscripten_val createAabbOptions(float x, float y, float w, float h, float vx = 0, float vy = 0) {
    emscripten_val options;
    options.properties["x"] = x;
    options.properties["y"] = y;
    options.properties["shape"] = (int)ObjectShape::AABB;
    options.properties["width"] = w;
    options.properties["height"] = h;
    options.properties["type"] = (int)ObjectType::DYNAMIC_OBJECT;
    options.properties["vx"] = vx;
    options.properties["vy"] = vy;
    return options;
}

TEST(ReproAabbIssue, FloatingPaddingBug) {
    World world;
    
    // AABB 1 at (0,0) size 2x2, moving right at 1.0m/s
    // Physical bounds: x in [-1, 1]
    // Fat AABB will include x up to ~1.3 due to padding/margin
    int id1 = world.createBody(1, createAabbOptions(0.0f, 0.0f, 2.0f, 2.0f, 1.0f, 0.0f));
    
    // AABB 2 at (2.1, 0) size 2x2, static
    // Physical bounds: x in [1.1, 3.1]
    // Separation is 0.1m. They should NOT collide.
    int id2 = world.createBody(2, createAabbOptions(2.1f, 0.0f, 2.0f, 2.0f, 0.0f, 0.0f));
    
    // Update AABBs (this happens in world.step or manually)
    world.getBodyAtIndex(id1)->fixtures[0]->updateAabb(0); // Fat AABB
    world.getBodyAtIndex(id2)->fixtures[0]->updateAabb(0); // Fat AABB
    
    CollisionSolver solver(world);
    // The current solver incorrectly uses the AX1/AX2 fields which are fat bounds
    bool colliding = solver.solve(world.getBodyAtIndex(id1)->fixtures[0]->worldIndex, 
                                  world.getBodyAtIndex(id2)->fixtures[0]->worldIndex,
                                  world.getTimeStep());
    
    EXPECT_FALSE(colliding) << "AABBs should not collide when separated by 0.1m, despite padding.";
}

TEST(ReproAabbIssue, MissingRotationalVelocity) {
    World world;
    
    // AABB 1 at (0,0) size 2x2, static
    int id1 = world.createBody(1, createAabbOptions(0.0f, 0.0f, 2.0f, 2.0f));
    
    // AABB 2 at (1.9, 0) size 2x2, rotating at 1 rad/s
    // Overlap is 0.1m.
    emscripten_val options2 = createAabbOptions(1.9f, 0.0f, 2.0f, 2.0f);
    options2.properties["rs"] = 1.0f; // Angular velocity
    int id2 = world.createBody(2, options2);
    
    CollisionSolver solver(world);
    bool colliding = solver.solve(world.getBodyAtIndex(id1)->fixtures[0]->worldIndex, 
                                  world.getBodyAtIndex(id2)->fixtures[0]->worldIndex,
                                  world.getTimeStep());
    
    ASSERT_TRUE(colliding);
    // BUG: Currently solver uses vB - vA which ignores rotation.
    // The relative velocity at contact should have a Y component due to AABB 2's rotation.
    // Contact point is around (0.95, 0). rB relative to bodyB (1.9, 0) is (-0.95, 0).
    // Velocity at contact due to rotation = omega x r = 1 * (-0.95, 0).perp() = 1 * (0, -0.95) = (0, -0.95).
    EXPECT_NEAR(solver.collisions[0].relativeVelocity.y, -0.95f, 0.01f);
}

// TC-15: fat AABB leftover slack was smaller than one step of travel, so the
// bullet's broadphase bounds stopped just short of a thin wall and speculative
// contacts never ran.
TEST(ReproAabbIssue, FastBulletDoesNotTunnelThinWall) {
    World world;
    world.setGravity(0.0f, 0.0f);
    world.setTimeStep(1.0f / 60.0f);

    emscripten_val wallOptions;
    wallOptions.properties["x"] = 7.0f;
    wallOptions.properties["y"] = 5.0f;
    wallOptions.properties["type"] = (int)ObjectType::FIXED_OBJECT;
    wallOptions.properties["shape"] = (int)ObjectShape::BOX;
    wallOptions.properties["width"] = 0.05f;
    wallOptions.properties["height"] = 4.0f;
    world.createBody(1, wallOptions);

    emscripten_val bulletOptions;
    bulletOptions.properties["x"] = 1.0f;
    bulletOptions.properties["y"] = 5.0f;
    bulletOptions.properties["vx"] = 50.0f;
    bulletOptions.properties["type"] = (int)ObjectType::DYNAMIC_OBJECT;
    bulletOptions.properties["shape"] = (int)ObjectShape::CIRCLE;
    bulletOptions.properties["radius"] = 0.1f;
    bulletOptions.properties["mass"] = 1.0f;
    bulletOptions.properties["canSleep"] = false;
    bulletOptions.properties["linearDamping"] = 0.0f;
    bulletOptions.properties["angularDamping"] = 0.0f;
    int bulletIdx = world.createBody(2, bulletOptions);
    Body* bullet = world.getBodyAtIndex(bulletIdx);
    ASSERT_NE(bullet, nullptr);

    const float wallRight = 7.0f + 0.025f;
    for (int i = 0; i < 20; ++i) {
        world.step();
        EXPECT_LT(bullet->getX() - 0.1f, wallRight + 0.05f) << "tunneled on step " << i;
    }

    EXPECT_LT(bullet->getX(), wallRight);
    EXPECT_LE(bullet->getVelocityX(), 0.0f);
}
