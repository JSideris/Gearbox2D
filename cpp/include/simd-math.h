#ifndef SIMD_MATH_H
#define SIMD_MATH_H

#include <cmath>
#include <algorithm>
#include <cstring>

#include "hwy/highway.h"
#include "hwy/contrib/math/math-inl.h"

namespace hn = hwy::HWY_NAMESPACE;

// Descriptor for fixed-size 128-bit vectors (4 lanes)
using DF = hn::FixedTag<float, 4>;
using DI = hn::FixedTag<int32_t, 4>;
using V128 = hn::Vec<DF>;
using SimdVec = hn::Vec<DF>;
using SimdMask = hn::Mask<DF>;

#define SIMD_LANE_COUNT ((int)hn::Lanes(DF()))

// Memory operations
#define v128_load_f32(ptr) hn::LoadU(DF(), reinterpret_cast<const float*>(ptr))
#define v128_store_f32(ptr, v) hn::StoreU(v, DF(), reinterpret_cast<float*>(ptr))
#define v128_masked_store_f32(ptr, mask, v) hn::BlendedStore(v, hn::MaskFromVec(mask), DF(), reinterpret_cast<float*>(ptr))

// Splat
#define v128_splat_f32(f) hn::Set(DF(), f)
#define v128_splat_i32(i) hn::BitCast(DF(), hn::Set(DI(), i))

// Arithmetic
#define v128_add_f32(a, b) hn::Add(a, b)
#define v128_sub_f32(a, b) hn::Sub(a, b)
#define v128_mul_f32(a, b) hn::Mul(a, b)
#define v128_div_f32(a, b) hn::Div(a, b)
#define v128_neg_f32(v) hn::Neg(v)

// Math
#define v128_sin_f32(v) hn::Sin(DF(), v)
#define v128_cos_f32(v) hn::Cos(DF(), v)

// Comparisons (Returns masks converted to vectors for compatibility)
#define v128_eq_f32(a, b) hn::VecFromMask(DF(), hn::Eq(a, b))
#define v128_ne_f32(a, b) hn::VecFromMask(DF(), hn::Ne(a, b))
#define v128_lt_f32(a, b) hn::VecFromMask(DF(), hn::Lt(a, b))
#define v128_le_f32(a, b) hn::VecFromMask(DF(), hn::Le(a, b))
#define v128_gt_f32(a, b) hn::VecFromMask(DF(), hn::Gt(a, b))
#define v128_ge_f32(a, b) hn::VecFromMask(DF(), hn::Ge(a, b))
#define v128_eq_i32(a, b) hn::BitCast(DF(), hn::VecFromMask(DI(), hn::Eq(hn::BitCast(DI(), a), hn::BitCast(DI(), b))))
#define v128_ne_i32(a, b) hn::BitCast(DF(), hn::VecFromMask(DI(), hn::Ne(hn::BitCast(DI(), a), hn::BitCast(DI(), b))))

// Logical
#define v128_and(a, b) hn::And(a, b)
#define v128_or(a, b) hn::Or(a, b)
#define v128_xor(a, b) hn::Xor(a, b)
#define v128_not(a) hn::Not(a)
#define v128_andnot(a, b) hn::AndNot(b, a) // returns a & ~b

// Select (mask ? a : b)
#define v128_select(mask, a, b) hn::IfThenElse(hn::MaskFromVec(mask), a, b)

#define v128_any_true(v) (!hn::AllFalse(DF(), hn::MaskFromVec(v)))
#define v128_all_true(v) (hn::AllTrue(DF(), hn::MaskFromVec(v)))
#define v128_bitmask(v) static_cast<int>(hn::BitsFromMask(DF(), hn::MaskFromVec(v)))
#define v128_abs_f32(v) hn::Abs(v)
#define v128_min_f32(a, b) hn::Min(a, b)
#define v128_max_f32(a, b) hn::Max(a, b)
#define v128_sqrt_f32(a) hn::Sqrt(a)
#define v128_is_finite(v) hn::VecFromMask(DF(), hn::IsFinite(v))
#define v128_first_n(n) hn::VecFromMask(DF(), hn::FirstN(DF(), n))

inline V128 v128_make_f32(float f1, float f2, float f3, float f4) {
	alignas(16) float values[4] = { f1, f2, f3, f4 };
	return hn::Load(DF(), values);
}
#define v128_extract_lane_f32(v, lane) hn::ExtractLane(v, lane)

inline V128 v128_make_mask_f32(bool m0, bool m1, bool m2, bool m3) {
	alignas(16) uint32_t masks[4] = { 
		m0 ? 0xFFFFFFFFu : 0u, 
		m1 ? 0xFFFFFFFFu : 0u, 
		m2 ? 0xFFFFFFFFu : 0u, 
		m3 ? 0xFFFFFFFFu : 0u 
	};
	return hn::Load(DF(), reinterpret_cast<const float*>(masks));
}

// Higher-level Vector Math
#define v128_dot_f32(ax, ay, bx, by) v128_add_f32(v128_mul_f32(ax, bx), v128_mul_f32(ay, by))
#define v128_cross_f32(ax, ay, bx, by) v128_sub_f32(v128_mul_f32(ax, by), v128_mul_f32(ay, bx))
#define v128_mag_sq_f32(vx, vy) v128_add_f32(v128_mul_f32(vx, vx), v128_mul_f32(vy, vy))
#define v128_mag_f32(vx, vy) v128_sqrt_f32(v128_mag_sq_f32(vx, vy))
#define v128_rotate_x_f32(vx, vy, cosA, sinA) v128_sub_f32(v128_mul_f32(vx, cosA), v128_mul_f32(vy, sinA))
#define v128_rotate_y_f32(vx, vy, cosA, sinA) v128_add_f32(v128_mul_f32(vx, sinA), v128_mul_f32(vy, cosA))

#endif // SIMD_MATH_H
