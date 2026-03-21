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

#else
// Fallback/No-op for non-WASM builds
typedef struct { float f[4]; } v128_t;
#define v128_load_f32(ptr) {0}
#define v128_store_f32(ptr, v) 
#define v128_splat_f32(f) {0}
#define v128_add_f32(a, b) {0}
#define v128_sub_f32(a, b) {0}
#define v128_mul_f32(a, b) {0}
#define v128_div_f32(a, b) {0}
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
#endif

#endif // SIMD_MATH_H
