#include <gtest/gtest.h>
#include "simd-math.h"
#include <cmath>

// Test v128_dot_f32
TEST(SimdMathTest, DotProduct) {
    float ax_raw[4] = {1.0f, 2.0f, 3.0f, 4.0f};
    float ay_raw[4] = {5.0f, 6.0f, 7.0f, 8.0f};
    float bx_raw[4] = {9.0f, 10.0f, 11.0f, 12.0f};
    float by_raw[4] = {13.0f, 14.0f, 15.0f, 16.0f};

    V128 ax = v128_load_f32(ax_raw);
    V128 ay = v128_load_f32(ay_raw);
    V128 bx = v128_load_f32(bx_raw);
    V128 by = v128_load_f32(by_raw);

    V128 result = v128_dot_f32(ax, ay, bx, by);
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

    V128 ax = v128_load_f32(ax_raw);
    V128 ay = v128_load_f32(ay_raw);
    V128 bx = v128_load_f32(bx_raw);
    V128 by = v128_load_f32(by_raw);

    V128 result = v128_cross_f32(ax, ay, bx, by);
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

    V128 vx = v128_load_f32(vx_raw);
    V128 vy = v128_load_f32(vy_raw);

    V128 result = v128_mag_sq_f32(vx, vy);
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

    V128 vx = v128_load_f32(vx_raw);
    V128 vy = v128_load_f32(vy_raw);

    V128 result = v128_mag_f32(vx, vy);
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

    V128 vx = v128_load_f32(vx_raw);
    V128 vy = v128_load_f32(vy_raw);
    V128 cosA = v128_load_f32(cosA_raw);
    V128 sinA = v128_load_f32(sinA_raw);

    V128 rx = v128_rotate_x_f32(vx, vy, cosA, sinA);
    V128 ry = v128_rotate_y_f32(vx, vy, cosA, sinA);

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

// Phase 1.2: Google Highway Infrastructure Tests

TEST(SimdMathTest, HighwayDFBasics) {
    const DF d;
    auto v = hn::Set(d, 42.0f);
    float result[4];
    hn::StoreU(v, d, result);
    for (int i = 0; i < 4; ++i) {
        EXPECT_EQ(result[i], 42.0f);
    }
}

TEST(SimdMathTest, HighwayArithmetic) {
    const DF d;
    auto a = hn::Set(d, 10.0f);
    auto b = hn::Set(d, 2.0f);
    
    float add_res[4], sub_res[4], mul_res[4], div_res[4];
    hn::StoreU(hn::Add(a, b), d, add_res);
    hn::StoreU(hn::Sub(a, b), d, sub_res);
    hn::StoreU(hn::Mul(a, b), d, mul_res);
    hn::StoreU(hn::Div(a, b), d, div_res);
    
    for (int i = 0; i < 4; ++i) {
        EXPECT_FLOAT_EQ(add_res[i], 12.0f);
        EXPECT_FLOAT_EQ(sub_res[i], 8.0f);
        EXPECT_FLOAT_EQ(mul_res[i], 20.0f);
        EXPECT_FLOAT_EQ(div_res[i], 5.0f);
    }
}

TEST(SimdMathTest, HighwayMasking) {
    const DF d;
    auto a = v128_make_f32(1.0f, 2.0f, 3.0f, 4.0f);
    auto b = hn::Set(d, 2.5f);
    
    // a < b => {true, true, false, false}
    auto mask = hn::Lt(a, b);
    auto if_then_else = hn::IfThenElse(mask, a, b);
    
    float res[4];
    hn::StoreU(if_then_else, d, res);
    
    EXPECT_FLOAT_EQ(res[0], 1.0f); // 1.0 < 2.5 -> 1.0
    EXPECT_FLOAT_EQ(res[1], 2.0f); // 2.0 < 2.5 -> 2.0
    EXPECT_FLOAT_EQ(res[2], 2.5f); // 3.0 < 2.5 -> 2.5
    EXPECT_FLOAT_EQ(res[3], 2.5f); // 4.0 < 2.5 -> 2.5
}

TEST(SimdMathTest, HighwayMathFunctions) {
    const DF d;
    auto angles = v128_make_f32(0.0f, M_PI / 2.0f, M_PI, 1.5f * M_PI);
    
    auto sins = hn::Sin(d, angles);
    auto coss = hn::Cos(d, angles);
    
    float sin_res[4], cos_res[4];
    hn::StoreU(sins, d, sin_res);
    hn::StoreU(coss, d, cos_res);
    
    EXPECT_NEAR(sin_res[0], 0.0f, 1e-6);
    EXPECT_NEAR(sin_res[1], 1.0f, 1e-6);
    EXPECT_NEAR(sin_res[2], 0.0f, 1e-6);
    EXPECT_NEAR(sin_res[3], -1.0f, 1e-6);
    
    EXPECT_NEAR(cos_res[0], 1.0f, 1e-6);
    EXPECT_NEAR(cos_res[1], 0.0f, 1e-6);
    EXPECT_NEAR(cos_res[2], -1.0f, 1e-6);
    EXPECT_NEAR(cos_res[3], 0.0f, 1e-6);
}
