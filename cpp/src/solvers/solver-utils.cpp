#include "collision-solver.h"
#include <algorithm>

using namespace std;

float CollisionSolver::closestPointsBetweenLines(
    const Vec2& p1, const Vec2& p2,
    const Vec2& p3, const Vec2& p4,
    Vec2& pointOnLine1, Vec2& pointOnLine2) {
    
    Vec2 d1 = p2 - p1, d2 = p4 - p3, r = p1 - p3;
    float a = d1.dot(d1), e = d2.dot(d2), f = d2.dot(r);
    if (a <= 1e-6f && e <= 1e-6f) { pointOnLine1 = p1; pointOnLine2 = p3; return (p1 - p3).magnitudeSquared(); }
    float t, s;
    if (a <= 1e-6f) { s = 0.0f; t = std::min(std::max(f / e, 0.0f), 1.0f); }
    else {
        float c = d1.dot(r);
        if (e <= 1e-6f) { t = 0.0f; s = std::min(std::max(-c / a, 0.0f), 1.0f); }
        else {
            float b = d1.dot(d2);
            float denom = a * e - b * b;
            s = (denom != 0.0f) ? std::min(std::max((b * f - c * e) / denom, 0.0f), 1.0f) : 0.0f;
            t = (b * s + f) / e;
            if (t < 0.0f) { t = 0.0f; s = std::min(std::max(-c / a, 0.0f), 1.0f); }
            else if (t > 1.0f) { t = 1.0f; s = std::min(std::max((b - c) / a, 0.0f), 1.0f); }
        }
    }
    pointOnLine1 = p1 + d1 * s; pointOnLine2 = p3 + d2 * t;
    return (pointOnLine1 - pointOnLine2).magnitudeSquared();
}

bool CollisionSolver::testPointCircle(const Vec2& point, const Vec2& center, float radius) { return (point - center).magnitudeSquared() < (radius * radius); }
bool CollisionSolver::testPointAabb(const Vec2& point, const Vec2& center, float width, float height) {
    return (point.x >= center.x - width/2 && point.x <= center.x + width/2 && point.y >= center.y - height/2 && point.y <= center.y + height/2);
}
bool CollisionSolver::testPointBox(const Vec2& point, const Vec2& center, float width, float height, float rotation) {
    Vec2 relPoint = (point - center).rotate(-rotation);
    return (relPoint.x >= -width/2 && relPoint.x <= width/2 && relPoint.y >= -height/2 && relPoint.y <= height/2);
}

bool CollisionSolver::testPointCapsule(const Vec2& point, const Vec2& center, float radius, float height, float rotation) {
    float halfL = std::max(0.0f, height * 0.5f - radius);
    Vec2 d(0, halfL);
    d = d.rotate(rotation);
    Vec2 p1 = center - d;
    Vec2 p2 = center + d;
    
    Vec2 v = p2 - p1;
    Vec2 w = point - p1;
    float c1 = w.dot(v);
    if (c1 <= 0) return (point - p1).magnitudeSquared() < radius * radius;
    float c2 = v.dot(v);
    if (c2 <= c1) return (point - p2).magnitudeSquared() < radius * radius;
    float b = c1 / c2;
    Vec2 pb = p1 + v * b;
    return (point - pb).magnitudeSquared() < radius * radius;
}

bool CollisionSolver::testPointPolygon(const Vec2& point, const std::vector<Vec2>& vertices) {
    if (vertices.size() < 3) return false;
    bool inside = true;
    for (size_t i = 0; i < vertices.size(); ++i) {
        Vec2 p1 = vertices[i];
        Vec2 p2 = vertices[(i + 1) % vertices.size()];
        Vec2 edge = p2 - p1;
        Vec2 normal(edge.y, -edge.x);
        if (normal.dot(point - p1) > 0) {
            inside = false;
            break;
        }
    }
    return inside;
}
