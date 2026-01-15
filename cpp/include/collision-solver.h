#pragma once

#include <vector>
#include "vec2.h"

class World;

struct CollisionInfo {
    bool isColliding;
    Vec2 contactPoint;
    Vec2 normal;
    float penetrationDepth;
    int indexA; // Fixture index
    int indexB; // Fixture index
    Vec2 relativeVelocity;
    float normalImpulseMagnitude;
};

class CollisionSolver {
public:
    std::vector<CollisionInfo> collisions;
    World& world;

    CollisionSolver(World& world);

    void clear();
    bool solve(int indexA, int indexB);

    static bool testPointCircle(const Vec2& point, const Vec2& center, float radius);
    static bool testPointAabb(const Vec2& point, const Vec2& center, float width, float height);
    static bool testPointBox(const Vec2& point, const Vec2& center, float width, float height, float rotation);

private:
    int _indexA = 0;
    int _indexB = 0;
    Vec2 _relativeVelocity;

    void _swap();
    float closestPointsBetweenLines(const Vec2& p1, const Vec2& p2, const Vec2& p3, const Vec2& p4, Vec2& pointOnLine1, Vec2& pointOnLine2);

    bool _solveAabbAabb();
    bool _solveAabbPoint();
    bool _solveAabbCircle();
    bool _solveCircleCircle();
    bool _solveCirclePoint();
    bool _solveBoxBox();
    bool _solveBoxPoint();
    bool _solveCircleBox();
};
