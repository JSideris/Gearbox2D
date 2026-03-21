#ifndef SIMD_MATH_H
#define SIMD_MATH_H

#ifdef __EMSCRIPTEN__
#include <wasm_simd128.h>

// Helper macros for WASM SIMD
#define v128_load_f32(ptr) wasm_v128_load(ptr)
#define v128_store_f32(ptr, v) wasm_v128_store(ptr, v)

// Splat a float to all 4 lanes
#define v128_splat_f32(f) wasm_f32x4_splat(f)

// Arithmetic
#define v128_add_f32(a, b) wasm_f32x4_add(a, b)
#define v128_sub_f32(a, b) wasm_f32x4_sub(a, b)
#define v128_mul_f32(a, b) wasm_f32x4_mul(a, b)
#define v128_div_f32(a, b) wasm_f32x4_div(a, b)

// Comparisons (returns masks)
#define v128_eq_f32(a, b) wasm_f32x4_eq(a, b)
#define v128_ne_f32(a, b) wasm_f32x4_ne(a, b)
#define v128_lt_f32(a, b) wasm_f32x4_lt(a, b)
#define v128_le_f32(a, b) wasm_f32x4_le(a, b)
#define v128_gt_f32(a, b) wasm_f32x4_gt(a, b)
#define v128_ge_f32(a, b) wasm_f32x4_ge(a, b)

// Logical
#define v128_and(a, b) wasm_v128_and(a, b)
#define v128_or(a, b) wasm_v128_or(a, b)
#define v128_xor(a, b) wasm_v128_xor(a, b)
#define v128_not(a) wasm_v128_not(a)
#define v128_andnot(a, b) wasm_v128_andnot(a, b)

// Select (mask ? a : b)
#define v128_select(mask, a, b) wasm_v128_bitselect(a, b, mask)

// Higher-level Vector Math (4-way)
#define v128_dot_f32(ax, ay, bx, by) v128_add_f32(v128_mul_f32(ax, bx), v128_mul_f32(ay, by))
#define v128_cross_f32(ax, ay, bx, by) v128_sub_f32(v128_mul_f32(ax, by), v128_mul_f32(ay, bx))
#define v128_mag_sq_f32(vx, vy) v128_add_f32(v128_mul_f32(vx, vx), v128_mul_f32(vy, vy))
#define v128_mag_f32(vx, vy) wasm_f32x4_sqrt(v128_mag_sq_f32(vx, vy))

// Rotate 4 vectors by 4 angles (provided as cos/sin)
#define v128_rotate_x_f32(vx, vy, cosA, sinA) v128_sub_f32(v128_mul_f32(vx, cosA), v128_mul_f32(vy, sinA))
#define v128_rotate_y_f32(vx, vy, cosA, sinA) v128_add_f32(v128_mul_f32(vx, sinA), v128_mul_f32(vy, cosA))

#else
// Fallback/No-op for non-WASM builds
#include <cmath>
#include <algorithm>

typedef struct { float f[4]; } v128_t;
inline v128_t v128_load_fallback(const float* ptr) {
    v128_t v;
    for (int i = 0; i < 4; ++i) v.f[i] = ptr[i];
    return v;
}
inline void v128_store_fallback(float* ptr, v128_t v) {
    for (int i = 0; i < 4; ++i) ptr[i] = v.f[i];
}
inline v128_t v128_splat_fallback(float f) {
    v128_t v;
    for (int i = 0; i < 4; ++i) v.f[i] = f;
    return v;
}
inline v128_t v128_add_fallback(v128_t a, v128_t b) {
    v128_t v;
    for (int i = 0; i < 4; ++i) v.f[i] = a.f[i] + b.f[i];
    return v;
}
inline v128_t v128_sub_fallback(v128_t a, v128_t b) {
    v128_t v;
    for (int i = 0; i < 4; ++i) v.f[i] = a.f[i] - b.f[i];
    return v;
}
inline v128_t v128_mul_fallback(v128_t a, v128_t b) {
    v128_t v;
    for (int i = 0; i < 4; ++i) v.f[i] = a.f[i] * b.f[i];
    return v;
}
inline v128_t v128_div_fallback(v128_t a, v128_t b) {
    v128_t v;
    for (int i = 0; i < 4; ++i) v.f[i] = a.f[i] / b.f[i];
    return v;
}
inline v128_t v128_sqrt_fallback(v128_t a) {
    v128_t v;
    for (int i = 0; i < 4; ++i) v.f[i] = std::sqrt(a.f[i]);
    return v;
}

#define v128_load_f32(ptr) v128_load_fallback(ptr)
#define v128_store_f32(ptr, v) v128_store_fallback(ptr, v)
#define v128_splat_f32(f) v128_splat_fallback(f)
#define v128_add_f32(a, b) v128_add_fallback(a, b)
#define v128_sub_f32(a, b) v128_sub_fallback(a, b)
#define v128_mul_f32(a, b) v128_mul_fallback(a, b)
#define v128_div_f32(a, b) v128_div_fallback(a, b)
#define wasm_f32x4_sqrt(a) v128_sqrt_fallback(a)

#define v128_eq_f32(a, b) {0} 
#define v128_ne_f32(a, b) {0}
#define v128_lt_f32(a, b) {0}
#define v128_le_f32(a, b) {0}
#define v128_gt_f32(a, b) {0}
#define v128_ge_f32(a, b) {0}
#define v128_and(a, b) {0}
#define v128_or(a, b) {0}
#define v128_xor(a, b) {0}
#define v128_not(a) {0}
#define v128_andnot(a, b) {0}
#define v128_select(mask, a, b) {0}

// Fallback Math
#define v128_dot_f32(ax, ay, bx, by) v128_add_f32(v128_mul_f32(ax, bx), v128_mul_f32(ay, by))
#define v128_cross_f32(ax, ay, bx, by) v128_sub_f32(v128_mul_f32(ax, by), v128_mul_f32(ay, bx))
#define v128_mag_sq_f32(vx, vy) v128_add_f32(v128_mul_f32(vx, vx), v128_mul_f32(vy, vy))
#define v128_mag_f32(vx, vy) wasm_f32x4_sqrt(v128_mag_sq_f32(vx, vy))
#define v128_rotate_x_f32(vx, vy, cosA, sinA) v128_sub_f32(v128_mul_f32(vx, cosA), v128_mul_f32(vy, sinA))
#define v128_rotate_y_f32(vx, vy, cosA, sinA) v128_add_f32(v128_mul_f32(vx, sinA), v128_mul_f32(vy, cosA))
#endif

#endif // SIMD_MATH_H
