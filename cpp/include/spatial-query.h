#ifndef SPATIAL_QUERY_H
#define SPATIAL_QUERY_H

// Exact narrow tests for spatial queries (PER-856): box (AABB), radius and ray.
// Every fixture is reduced to a world-space convex QueryShape:
//   DISC    – circle (center a, radius r). POINT fixtures are a zero-radius disc,
//             matching their broadphase AABB.
//   CAPSULE – segment a..b swept by radius r.
//   POLY    – convex polygon, CCW (BOX, AABB, POLYGON; ELLIPSE as a 16-gon).
// Queries walk the BVH broadphase first; these tests only run on its candidates.

#include <cmath>
#include <algorithm>
#include "vec2.h"

#define QUERY_SHAPE_MAX_VERTICES 16

struct QueryShape {
    enum Kind { DISC = 0, CAPSULE = 1, POLY = 2 };
    Kind kind = DISC;
    Vec2 a, b;
    float r = 0.0f;
    int n = 0;
    Vec2 v[QUERY_SHAPE_MAX_VERTICES];
};

struct RayHit {
    float t;      // fraction along p1->p2, in [0, 1]
    Vec2 point;
    Vec2 normal;  // unit, pointing out of the shape (-dir when the ray starts inside)
};

namespace sq {

inline float distSqPointSegment(const Vec2& p, const Vec2& a, const Vec2& b) {
    Vec2 ab = b - a;
    float denom = ab.dot(ab);
    float t = denom > 0.0f ? std::min(std::max((p - a).dot(ab) / denom, 0.0f), 1.0f) : 0.0f;
    Vec2 c = a + ab * t;
    return (p - c).magnitudeSquared();
}

// Makes a polygon counter-clockwise (in place).
inline void makeCCW(Vec2* v, int n) {
    float area = 0.0f;
    for (int i = 0; i < n; ++i) area += v[i].cross(v[(i + 1) % n]);
    if (area < 0.0f) std::reverse(v, v + n);
}

inline bool pointInConvex(const Vec2& p, const Vec2* v, int n) {
    if (n < 3) return false;
    for (int i = 0; i < n; ++i) {
        const Vec2& a = v[i];
        const Vec2& b = v[(i + 1) % n];
        if ((b - a).cross(p - a) < 0.0f) return false;
    }
    return true;
}

inline float distSqPointConvex(const Vec2& p, const Vec2* v, int n) {
    if (pointInConvex(p, v, n)) return 0.0f;
    float best = (p - v[0]).magnitudeSquared();
    for (int i = 0; i < n; ++i) best = std::min(best, distSqPointSegment(p, v[i], v[(i + 1) % n]));
    return best;
}

inline float distSqPointAabb(const Vec2& p, const Vec2& lo, const Vec2& hi) {
    float dx = std::max(std::max(lo.x - p.x, 0.0f), p.x - hi.x);
    float dy = std::max(std::max(lo.y - p.y, 0.0f), p.y - hi.y);
    return dx * dx + dy * dy;
}

// Slab test of p + t*d, t in [0, tMax], against [lo, hi]. Returns entry t or -1.
inline float rayAabb(const Vec2& p, const Vec2& d, const Vec2& lo, const Vec2& hi, float tMax) {
    float t0 = 0.0f, t1 = tMax;
    const float pc[2] = {p.x, p.y}, dc[2] = {d.x, d.y}, loc[2] = {lo.x, lo.y}, hic[2] = {hi.x, hi.y};
    for (int k = 0; k < 2; ++k) {
        if (dc[k] == 0.0f) {
            if (pc[k] < loc[k] || pc[k] > hic[k]) return -1.0f;
        } else {
            float inv = 1.0f / dc[k];
            float ta = (loc[k] - pc[k]) * inv, tb = (hic[k] - pc[k]) * inv;
            if (ta > tb) std::swap(ta, tb);
            t0 = std::max(t0, ta);
            t1 = std::min(t1, tb);
            if (t0 > t1) return -1.0f;
        }
    }
    return t0;
}

inline float distSqSegmentAabb(const Vec2& a, const Vec2& b, const Vec2& lo, const Vec2& hi) {
    if (rayAabb(a, b - a, lo, hi, 1.0f) >= 0.0f) return 0.0f;
    float best = std::min(distSqPointAabb(a, lo, hi), distSqPointAabb(b, lo, hi));
    const Vec2 corners[4] = {lo, Vec2(hi.x, lo.y), hi, Vec2(lo.x, hi.y)};
    for (const Vec2& c : corners) best = std::min(best, distSqPointSegment(c, a, b));
    return best;
}

// --- Overlap tests -------------------------------------------------------

inline bool overlapsCircle(const QueryShape& s, const Vec2& c, float radius) {
    switch (s.kind) {
        case QueryShape::DISC: { float rr = s.r + radius; return (c - s.a).magnitudeSquared() <= rr * rr; }
        case QueryShape::CAPSULE: { float rr = s.r + radius; return distSqPointSegment(c, s.a, s.b) <= rr * rr; }
        case QueryShape::POLY: return distSqPointConvex(c, s.v, s.n) <= radius * radius;
    }
    return false;
}

inline bool overlapsAabb(const QueryShape& s, const Vec2& lo, const Vec2& hi) {
    if (s.kind != QueryShape::POLY) {
        Vec2 b = (s.kind == QueryShape::CAPSULE) ? s.b : s.a;
        return distSqSegmentAabb(s.a, b, lo, hi) <= s.r * s.r;
    }
    // SAT: box axes, then polygon edge normals.
    float minX = s.v[0].x, maxX = s.v[0].x, minY = s.v[0].y, maxY = s.v[0].y;
    for (int i = 1; i < s.n; ++i) {
        minX = std::min(minX, s.v[i].x); maxX = std::max(maxX, s.v[i].x);
        minY = std::min(minY, s.v[i].y); maxY = std::max(maxY, s.v[i].y);
    }
    if (maxX < lo.x || minX > hi.x || maxY < lo.y || minY > hi.y) return false;
    const Vec2 corners[4] = {lo, Vec2(hi.x, lo.y), hi, Vec2(lo.x, hi.y)};
    for (int i = 0; i < s.n; ++i) {
        const Vec2& a = s.v[i];
        Vec2 e = s.v[(i + 1) % s.n] - a;
        Vec2 outward(e.y, -e.x);
        bool separated = true;
        for (const Vec2& c : corners) {
            if (outward.dot(c - a) <= 0.0f) { separated = false; break; }
        }
        if (separated) return false;
    }
    return true;
}

// --- Ray tests (p + t*d, t in [0, tMax]) ----------------------------------

inline bool rayCircle(const Vec2& p, const Vec2& d, const Vec2& c, float r, float tMax, RayHit& hit) {
    Vec2 f = p - c;
    float cc = f.dot(f) - r * r;
    if (cc <= 0.0f) { hit.t = 0.0f; hit.point = p; hit.normal = (d * -1.0f).normalize(); return true; }
    float a = d.dot(d);
    if (a <= 0.0f) return false;
    float b = f.dot(d);
    if (b >= 0.0f) return false; // outside and moving away
    float disc = b * b - a * cc;
    if (disc < 0.0f) return false;
    float t = (-b - std::sqrt(disc)) / a;
    if (t < 0.0f || t > tMax) return false;
    hit.t = t;
    hit.point = p + d * t;
    hit.normal = r > 0.0f ? (hit.point - c) * (1.0f / r) : (d * -1.0f).normalize();
    return true;
}

inline bool rayConvex(const Vec2& p, const Vec2& d, const Vec2* v, int n, float tMax, RayHit& hit) {
    if (n < 3) return false;
    float tEnter = 0.0f, tExit = tMax;
    int enterEdge = -1;
    for (int i = 0; i < n; ++i) {
        const Vec2& a = v[i];
        Vec2 e = v[(i + 1) % n] - a;
        Vec2 outward(e.y, -e.x);
        float num = outward.dot(a - p);   // >= 0 when p is on the inner side
        float den = outward.dot(d);
        if (den == 0.0f) {
            if (num < 0.0f) return false;
            continue;
        }
        float t = num / den;
        if (den < 0.0f) {
            if (t > tEnter) { tEnter = t; enterEdge = i; }
        } else {
            if (t < tExit) tExit = t;
        }
        if (tEnter > tExit) return false;
    }
    hit.t = tEnter;
    hit.point = p + d * tEnter;
    if (enterEdge < 0) {
        hit.normal = (d * -1.0f).normalize(); // started inside
    } else {
        Vec2 e = v[(enterEdge + 1) % n] - v[enterEdge];
        hit.normal = Vec2(e.y, -e.x).normalize();
    }
    return true;
}

inline bool raycastShape(const QueryShape& s, const Vec2& p, const Vec2& d, float tMax, RayHit& hit) {
    switch (s.kind) {
        case QueryShape::DISC:
            if (s.r <= 0.0f) return false; // zero-area POINT fixtures can't be hit by a ray
            return rayCircle(p, d, s.a, s.r, tMax, hit);
        case QueryShape::POLY: return rayConvex(p, d, s.v, s.n, tMax, hit);
        case QueryShape::CAPSULE: {
            if (distSqPointSegment(p, s.a, s.b) <= s.r * s.r) {
                hit.t = 0.0f; hit.point = p; hit.normal = (d * -1.0f).normalize(); return true;
            }
            bool found = false;
            RayHit h;
            if (rayCircle(p, d, s.a, s.r, tMax, h)) { hit = h; found = true; tMax = h.t; }
            if (rayCircle(p, d, s.b, s.r, tMax, h)) { hit = h; found = true; tMax = h.t; }
            Vec2 ab = s.b - s.a;
            if (ab.magnitudeSquared() > 0.0f) {
                Vec2 n = ab.normalize().perp() * s.r;
                Vec2 rect[4] = {s.a - n, s.b - n, s.b + n, s.a + n};
                makeCCW(rect, 4);
                if (rayConvex(p, d, rect, 4, tMax, h) && (!found || h.t < hit.t)) { hit = h; found = true; }
            }
            return found;
        }
    }
    return false;
}

} // namespace sq

#endif
