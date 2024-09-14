// #include "world.h"
// #include "physical-object.h"
// #include "collision-solver.h"
// #include "gtest/gtest.h"

// // Helper function to create a PhysicalObject
// PhysicalObject createCircleObject(World& world, int index, float x, float y, float radius) {
//     // world.liveFloatData[index * FDATA_EPO + FDATA_X] = x;
//     // world.liveFloatData[index * FDATA_EPO + FDATA_Y] = y;
//     // world.liveFloatData[index * FDATA_EPO + FDATA_R] = radius;

//     // PhysicalObject obj = PhysicalObject(world, index, emscripten_val());
//     // obj.shape = ObjectShape::CIRCLE;
//     // obj.world = world;
//     // obj.worldIndex = index;
//     // return obj;

//     world.makeObject(index, );
// }

// // Test case for non-colliding circles
// TEST(CollisionSolverTest, CirclesDoNotCollide) {
//     World world;
//     world.liveFloatData.resize(2 * FDATA_EPO);  // Resize data for 2 objects

//     PhysicalObject circle1 = createCircleObject(world, 0, 0.0f, 0.0f, 1.0f);  // Circle at (0, 0) with radius 1
//     PhysicalObject circle2 = createCircleObject(world, 1, 3.0f, 0.0f, 1.0f);  // Circle at (3, 0) with radius 1

//     CollisionSolver solver;
//     CollisionInfo result = solver.solve(circle1, circle2);

//     EXPECT_FALSE(result.isColliding);
//     EXPECT_EQ(result.penetrationDepth, 0.0f);
// }

// // Test case for colliding circles
// TEST(CollisionSolverTest, CirclesCollide) {
//     World world;
//     world.liveFloatData.resize(2 * FDATA_EPO);  // Resize data for 2 objects

//     PhysicalObject circle1 = createCircleObject(world, 0, 0.0f, 0.0f, 1.0f);  // Circle at (0, 0) with radius 1
//     PhysicalObject circle2 = createCircleObject(world, 1, 1.5f, 0.0f, 1.0f);  // Circle at (1.5, 0) with radius 1

//     CollisionSolver solver;
//     CollisionInfo result = solver.solve(circle1, circle2);

//     EXPECT_TRUE(result.isColliding);
//     EXPECT_FLOAT_EQ(result.penetrationDepth, 0.5f);  // Expect penetration depth of 0.5
//     EXPECT_FLOAT_EQ(result.contactPoint.x, 1.0f);    // Contact point should be on the boundary of circle1
//     EXPECT_FLOAT_EQ(result.contactPoint.y, 0.0f);
//     EXPECT_FLOAT_EQ(result.normal.x, 1.0f);          // Normal should point along the x-axis
//     EXPECT_FLOAT_EQ(result.normal.y, 0.0f);
// }

// // Test case for edge-touching circles
// TEST(CollisionSolverTest, CirclesJustTouch) {
//     World world;
//     world.liveFloatData.resize(2 * FDATA_EPO);  // Resize data for 2 objects

//     PhysicalObject circle1 = createCircleObject(world, 0, 0.0f, 0.0f, 1.0f);  // Circle at (0, 0) with radius 1
//     PhysicalObject circle2 = createCircleObject(world, 1, 2.0f, 0.0f, 1.0f);  // Circle at (2.0, 0) with radius 1

//     CollisionSolver solver;
//     CollisionInfo result = solver.solve(circle1, circle2);

//     EXPECT_FALSE(result.isColliding);  // Since it's edge-to-edge, there should be no collision
//     EXPECT_EQ(result.penetrationDepth, 0.0f);
// }

// // Test case for completely overlapping circles
// TEST(CollisionSolverTest, CirclesFullyOverlap) {
//     World world;
//     world.liveFloatData.resize(2 * FDATA_EPO);  // Resize data for 2 objects

//     PhysicalObject circle1 = createCircleObject(world, 0, 0.0f, 0.0f, 1.0f);  // Circle at (0, 0) with radius 1
//     PhysicalObject circle2 = createCircleObject(world, 1, 0.0f, 0.0f, 1.0f);  // Circle at (0, 0) with radius 1

//     CollisionSolver solver;
//     CollisionInfo result = solver.solve(circle1, circle2);

//     EXPECT_TRUE(result.isColliding);
//     EXPECT_FLOAT_EQ(result.penetrationDepth, 2.0f);  // Expect penetration depth of 2 (complete overlap)
//     EXPECT_FLOAT_EQ(result.contactPoint.x, 1.0f);    // Contact point should be at (1.0, 0.0) (on the boundary of circle1)
//     EXPECT_FLOAT_EQ(result.contactPoint.y, 0.0f);
//     EXPECT_FLOAT_EQ(result.normal.x, 1.0f);          // Normal should point along the positive x-axis
//     EXPECT_FLOAT_EQ(result.normal.y, 0.0f);
// }

