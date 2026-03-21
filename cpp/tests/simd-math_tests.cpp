#include <gtest/gtest.h>
#include "simd-math.h"
#include <cmath>

// Test v128_dot_f32
TEST(SimdMathTest, DotProduct) {
    float ax_raw[4] = {1.0f, 2.0f, 3.0f, 4.0f};
    float ay_raw[4] = {5.0f, 6.0f, 7.0f, 8.0f};
    float bx_raw[4] = {9.0f, 10.0f, 11.0f, 12.0f};
    float by_raw[4] = {13.0f, 14.0f, 15.0f, 16.0f};

    v128_t ax = v128_load_f32(ax_raw);
    v128_t ay = v128_load_f32(ay_raw);
    v128_t bx = v128_load_f32(bx_raw);
    v128_t by = v128_load_f32(by_raw);

    v128_t result = v128_dot_f32(ax, ay, bx, by);
    float result_raw[4];
    v128_store_f32(result_raw, result);

    for (int i = 0; i < 4; ++i) {
        float expected = ax_raw[i] * bx_raw[i] + ay_raw[i] * by_raw[i];
        EXPECT_FLOAT_EQ(result_raw[i], expected);
    }
}

// Test v128_cross_f32 (2D cross product: ax*by - ay*bx)
TEST(SimdMathTest, CrossProduct) {
    float ax_raw[4] = {1.0f, 2.0f, 3.0f, 4.0f};
    float ay_raw[4] = {5.0f, 6.0f, 7.0f, 8.0f};
    float bx_raw[4] = {9.0f, 10.0f, 11.0f, 12.0f};
    float by_raw[4] = {13.0f, 14.0f, 15.0f, 16.0f};

    v128_t ax = v128_load_f32(ax_raw);
    v128_t ay = v128_load_f32(ay_raw);
    v128_t bx = v128_load_f32(bx_raw);
    v128_t by = v128_load_f32(by_raw);

    v128_t result = v128_cross_f32(ax, ay, bx, by);
    float result_raw[4];
    v128_store_f32(result_raw, result);

    for (int i = 0; i < 4; ++i) {
        float expected = ax_raw[i] * by_raw[i] - ay_raw[i] * bx_raw[i];
        EXPECT_FLOAT_EQ(result_raw[i], expected);
    }
}

// Test v128_mag_sq_f32
TEST(SimdMathTest, MagnitudeSquared) {
    float vx_raw[4] = {1.0f, 2.0f, 3.0f, 4.0f};
    float vy_raw[4] = {5.0f, 6.0f, 7.0f, 8.0f};

    v128_t vx = v128_load_f32(vx_raw);
    v128_t vy = v128_load_f32(vy_raw);

    v128_t result = v128_mag_sq_f32(vx, vy);
    float result_raw[4];
    v128_store_f32(result_raw, result);

    for (int i = 0; i < 4; ++i) {
        float expected = vx_raw[i] * vx_raw[i] + vy_raw[i] * vy_raw[i];
        EXPECT_FLOAT_EQ(result_raw[i], expected);
    }
}

// Test v128_mag_f32
TEST(SimdMathTest, Magnitude) {
    float vx_raw[4] = {3.0f, 5.0f, 8.0f, 7.0f};
    float vy_raw[4] = {4.0f, 12.0f, 15.0f, 24.0f};

    v128_t vx = v128_load_f32(vx_raw);
    v128_t vy = v128_load_f32(vy_raw);

    v128_t result = v128_mag_f32(vx, vy);
    float result_raw[4];
    v128_store_f32(result_raw, result);

    for (int i = 0; i < 4; ++i) {
        float expected = std::sqrt(vx_raw[i] * vx_raw[i] + vy_raw[i] * vy_raw[i]);
        EXPECT_FLOAT_EQ(result_raw[i], expected);
    }
}

// Test v128_rotate_x_f32 and v128_rotate_y_f32
TEST(SimdMathTest, Rotation) {
    float vx_raw[4] = {1.0f, 0.0f, 1.0f, 1.0f};
    float vy_raw[4] = {0.0f, 1.0f, 1.0f, -1.0f};
    float angles[4] = {M_PI/2.0f, M_PI/2.0f, M_PI/4.0f, M_PI/4.0f};
    float cosA_raw[4], sinA_raw[4];
    for (int i = 0; i < 4; ++i) {
        cosA_raw[i] = std::cos(angles[i]);
        sinA_raw[i] = std::sin(angles[i]);
    }

    v128_t vx = v128_load_f32(vx_raw);
    v128_t vy = v128_load_f32(vy_raw);
    v128_t cosA = v128_load_f32(cosA_raw);
    v128_t sinA = v128_load_f32(sinA_raw);

    v128_t rx = v128_rotate_x_f32(vx, vy, cosA, sinA);
    v128_t ry = v128_rotate_y_f32(vx, vy, cosA, sinA);

    float rx_raw[4], ry_raw[4];
    v128_store_f32(rx_raw, rx);
    v128_store_f32(ry_raw, ry);

    for (int i = 0; i < 4; ++i) {
        float expected_x = vx_raw[i] * cosA_raw[i] - vy_raw[i] * sinA_raw[i];
        float expected_y = vx_raw[i] * sinA_raw[i] + vy_raw[i] * cosA_raw[i];
        EXPECT_NEAR(rx_raw[i], expected_x, 1e-5);
        EXPECT_NEAR(ry_raw[i], expected_y, 1e-5);
    }
}
