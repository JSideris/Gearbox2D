#include <gtest/gtest.h>
#include "vec2.h"

// Test default constructor
TEST(Vec2Test, DefaultConstructor) {
    Vec2 v;
    EXPECT_EQ(v.x, 0);
    EXPECT_EQ(v.y, 0);
}

// Test parameterized constructor
TEST(Vec2Test, ParameterizedConstructor) {
    Vec2 v(3.0f, 4.0f);
    EXPECT_EQ(v.x, 3.0f);
    EXPECT_EQ(v.y, 4.0f);
}

// Test addition
TEST(Vec2Test, Addition) {
    Vec2 v1(1.0f, 2.0f);
    Vec2 v2(3.0f, 4.0f);
    Vec2 result = v1 + v2;
    EXPECT_EQ(result.x, 4.0f);
    EXPECT_EQ(result.y, 6.0f);
}

// Test subtraction
TEST(Vec2Test, Subtraction) {
    Vec2 v1(5.0f, 7.0f);
    Vec2 v2(3.0f, 4.0f);
    Vec2 result = v1 - v2;
    EXPECT_EQ(result.x, 2.0f);
    EXPECT_EQ(result.y, 3.0f);
}

// Test scalar multiplication
TEST(Vec2Test, ScalarMultiplication) {
    Vec2 v(2.0f, 3.0f);
    Vec2 result = v * 2.0f;
    EXPECT_EQ(result.x, 4.0f);
    EXPECT_EQ(result.y, 6.0f);
}

// Test scalar division
TEST(Vec2Test, ScalarDivision) {
    Vec2 v(4.0f, 8.0f);
    Vec2 result = v / 2.0f;
    EXPECT_EQ(result.x, 2.0f);
    EXPECT_EQ(result.y, 4.0f);
}

// Test magnitude calculation
TEST(Vec2Test, Magnitude) {
    Vec2 v(3.0f, 4.0f);
    EXPECT_FLOAT_EQ(v.magnitude(), 5.0f);
}

// Test magnitude squared calculation
TEST(Vec2Test, MagnitudeSquared) {
    Vec2 v(3.0f, 4.0f);
    EXPECT_FLOAT_EQ(v.magnitudeSquared(), 25.0f);
}

// Test normalization
TEST(Vec2Test, Normalize) {
    Vec2 v(3.0f, 4.0f);
    Vec2 result = v.normalize();
    EXPECT_FLOAT_EQ(result.x, 3.0f / 5.0f);
    EXPECT_FLOAT_EQ(result.y, 4.0f / 5.0f);
    EXPECT_FLOAT_EQ(result.magnitude(), 1.0f);
}

// Test normalization of zero vector
TEST(Vec2Test, NormalizeZeroVector) {
    Vec2 v(0.0f, 0.0f);
    Vec2 result = v.normalize();
    EXPECT_EQ(result.x, 0.0f);
    EXPECT_EQ(result.y, 0.0f);
}
