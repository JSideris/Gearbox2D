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

#define v128_any_true(v) wasm_v128_any_true(v)
#define v128_bitmask(v) wasm_i32x4_bitmask(v)
#define v128_abs_f32(v) wasm_f32x4_abs(v)
#define v128_min_f32(a, b) wasm_f32x4_pmin(a, b)
#define v128_max_f32(a, b) wasm_f32x4_pmax(a, b)
#define v128_sqrt_f32(a) wasm_f32x4_sqrt(a)
#define v128_make_f32(f1, f2, f3, f4) wasm_f32x4_make(f1, f2, f3, f4)

// Trignometry (Scalar fallback as WASM SIMD has no native sin/cos)
inline v128_t wasm_f32x4_sin(v128_t v) {
    float f[4];
    wasm_v128_store(f, v);
    return wasm_f32x4_make(std::sin(f[0]), std::sin(f[1]), std::sin(f[2]), std::sin(f[3]));
}
inline v128_t wasm_f32x4_cos(v128_t v) {
    float f[4];
    wasm_v128_store(f, v);
    return wasm_f32x4_make(std::cos(f[0]), std::cos(f[1]), std::cos(f[2]), std::cos(f[3]));
}

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
inline bool v128_any_true_fallback(v128_t v) {
    for (int i = 0; i < 4; ++i) {
        if (*(uint32_t*)&v.f[i] != 0) return true;
    }
    return false;
}
inline int v128_bitmask_fallback(v128_t v) {
    int mask = 0;
    for (int i = 0; i < 4; ++i) {
        if (*(uint32_t*)&v.f[i] & 0x80000000) mask |= (1 << i);
    }
    return mask;
}
inline v128_t v128_abs_fallback(v128_t a) {
    v128_t v;
    for (int i = 0; i < 4; ++i) v.f[i] = std::abs(a.f[i]);
    return v;
}
inline v128_t v128_min_fallback(v128_t a, v128_t b) {
    v128_t v;
    for (int i = 0; i < 4; ++i) v.f[i] = std::min(a.f[i], b.f[i]);
    return v;
}
inline v128_t v128_max_fallback(v128_t a, v128_t b) {
    v128_t v;
    for (int i = 0; i < 4; ++i) v.f[i] = std::max(a.f[i], b.f[i]);
    return v;
}
inline v128_t v128_make_fallback(float f1, float f2, float f3, float f4) {
    v128_t v;
    v.f[0] = f1; v.f[1] = f2; v.f[2] = f3; v.f[3] = f4;
    return v;
}

#define v128_load_f32(ptr) v128_load_fallback(ptr)
#define v128_store_f32(ptr, v) v128_store_fallback(ptr, v)
#define v128_splat_f32(f) v128_splat_fallback(f)
#define v128_add_f32(a, b) v128_add_fallback(a, b)
#define v128_sub_f32(a, b) v128_sub_fallback(a, b)
#define v128_mul_f32(a, b) v128_mul_fallback(a, b)
#define v128_div_f32(a, b) v128_div_fallback(a, b)
#define v128_sqrt_f32(a) v128_sqrt_fallback(a)
#define v128_min_f32(a, b) v128_min_fallback(a, b)
#define v128_max_f32(a, b) v128_max_fallback(a, b)
#define wasm_f32x4_sqrt(a) v128_sqrt_fallback(a)
#define wasm_f32x4_min(a, b) v128_min_fallback(a, b)
#define wasm_f32x4_max(a, b) v128_max_fallback(a, b)
#define wasm_f32x4_sin(a) v128_make_fallback(std::sin(a.f[0]), std::sin(a.f[1]), std::sin(a.f[2]), std::sin(a.f[3]))
#define wasm_f32x4_cos(a) v128_make_fallback(std::cos(a.f[0]), std::cos(a.f[1]), std::cos(a.f[2]), std::cos(a.f[3]))

#define v128_eq_f32(a, b) v128_make_fallback((a.f[0] == b.f[0]) ? -1.0f : 0.0f, (a.f[1] == b.f[1]) ? -1.0f : 0.0f, (a.f[2] == b.f[2]) ? -1.0f : 0.0f, (a.f[3] == b.f[3]) ? -1.0f : 0.0f) 
#define v128_ne_f32(a, b) v128_make_fallback((a.f[0] != b.f[0]) ? -1.0f : 0.0f, (a.f[1] != b.f[1]) ? -1.0f : 0.0f, (a.f[2] != b.f[2]) ? -1.0f : 0.0f, (a.f[3] != b.f[3]) ? -1.0f : 0.0f)
#define v128_lt_f32(a, b) v128_make_fallback((a.f[0] < b.f[0]) ? -1.0f : 0.0f, (a.f[1] < b.f[1]) ? -1.0f : 0.0f, (a.f[2] < b.f[2]) ? -1.0f : 0.0f, (a.f[3] < b.f[3]) ? -1.0f : 0.0f)
#define v128_le_f32(a, b) v128_make_fallback((a.f[0] <= b.f[0]) ? -1.0f : 0.0f, (a.f[1] <= b.f[1]) ? -1.0f : 0.0f, (a.f[2] <= b.f[2]) ? -1.0f : 0.0f, (a.f[3] <= b.f[3]) ? -1.0f : 0.0f)
#define v128_gt_f32(a, b) v128_make_fallback((a.f[0] > b.f[0]) ? -1.0f : 0.0f, (a.f[1] > b.f[1]) ? -1.0f : 0.0f, (a.f[2] > b.f[2]) ? -1.0f : 0.0f, (a.f[3] > b.f[3]) ? -1.0f : 0.0f)
#define v128_ge_f32(a, b) v128_make_fallback((a.f[0] >= b.f[0]) ? -1.0f : 0.0f, (a.f[1] >= b.f[1]) ? -1.0f : 0.0f, (a.f[2] >= b.f[2]) ? -1.0f : 0.0f, (a.f[3] >= b.f[3]) ? -1.0f : 0.0f)
#define v128_and(a, b) v128_make_fallback((float)((*(uint32_t*)&a.f[0]) & (*(uint32_t*)&b.f[0])), (float)((*(uint32_t*)&a.f[1]) & (*(uint32_t*)&b.f[1])), (float)((*(uint32_t*)&a.f[2]) & (*(uint32_t*)&b.f[2])), (float)((*(uint32_t*)&a.f[3]) & (*(uint32_t*)&b.f[3])))
#define v128_or(a, b) v128_make_fallback((float)((*(uint32_t*)&a.f[0]) | (*(uint32_t*)&b.f[0])), (float)((*(uint32_t*)&a.f[1]) | (*(uint32_t*)&b.f[1])), (float)((*(uint32_t*)&a.f[2]) | (*(uint32_t*)&b.f[2])), (float)((*(uint32_t*)&a.f[3]) | (*(uint32_t*)&b.f[3])))
#define v128_xor(a, b) v128_make_fallback((float)((*(uint32_t*)&a.f[0]) ^ (*(uint32_t*)&b.f[0])), (float)((*(uint32_t*)&a.f[1]) ^ (*(uint32_t*)&b.f[1])), (float)((*(uint32_t*)&a.f[2]) ^ (*(uint32_t*)&b.f[2])), (float)((*(uint32_t*)&a.f[3]) ^ (*(uint32_t*)&b.f[3])))
#define v128_not(a) v128_make_fallback((float)(~(*(uint32_t*)&a.f[0])), (float)(~(*(uint32_t*)&a.f[1])), (float)(~(*(uint32_t*)&a.f[2])), (float)(~(*(uint32_t*)&a.f[3])))
#define v128_andnot(a, b) v128_make_fallback((float)((*(uint32_t*)&a.f[0]) & ~(*(uint32_t*)&b.f[0])), (float)((*(uint32_t*)&a.f[1]) & ~(*(uint32_t*)&b.f[1])), (float)((*(uint32_t*)&a.f[2]) & ~(*(uint32_t*)&b.f[2])), (float)((*(uint32_t*)&a.f[3]) & ~(*(uint32_t*)&b.f[3])))

#define v128_any_true(v) v128_any_true_fallback(v)
#define v128_bitmask(v) v128_bitmask_fallback(v)
#define v128_abs_f32(v) v128_abs_fallback(v)
#define v128_make_f32(f1, f2, f3, f4) v128_make_fallback(f1, f2, f3, f4)

inline v128_t v128_select_fallback(v128_t mask, v128_t a, v128_t b) {
    v128_t v;
    for (int i = 0; i < 4; ++i) {
        uint32_t m = *(uint32_t*)&mask.f[i];
        uint32_t va = *(uint32_t*)&a.f[i];
        uint32_t vb = *(uint32_t*)&b.f[i];
        uint32_t res = (va & m) | (vb & ~m);
        v.f[i] = *(float*)&res;
    }
    return v;
}
#define v128_select(mask, a, b) v128_select_fallback(mask, a, b)

// Fallback Math
#define v128_dot_f32(ax, ay, bx, by) v128_add_f32(v128_mul_f32(ax, bx), v128_mul_f32(ay, by))
#define v128_cross_f32(ax, ay, bx, by) v128_sub_f32(v128_mul_f32(ax, by), v128_mul_f32(ay, bx))
#define v128_mag_sq_f32(vx, vy) v128_add_f32(v128_mul_f32(vx, vx), v128_mul_f32(vy, vy))
#define v128_mag_f32(vx, vy) wasm_f32x4_sqrt(v128_mag_sq_f32(vx, vy))
#define v128_rotate_x_f32(vx, vy, cosA, sinA) v128_sub_f32(v128_mul_f32(vx, cosA), v128_mul_f32(vy, sinA))
#define v128_rotate_y_f32(vx, vy, cosA, sinA) v128_add_f32(v128_mul_f32(vx, sinA), v128_mul_f32(vy, cosA))
#endif

#endif // SIMD_MATH_H
