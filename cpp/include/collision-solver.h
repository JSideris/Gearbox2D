#pragma once

#include <vector>
#include <cstdint>
#include "vec2.h"

class World;

union ContactID {
    struct {
        uint8_t indexA;
        uint8_t indexB;
        uint8_t typeA; // 0 = vertex, 1 = face
        uint8_t typeB;
    } features;
    uint32_t key;
    
    ContactID() : key(0) {}
    ContactID(uint32_t k) : key(k) {}
};

struct CollisionInfo {
    bool isColliding;
    Vec2 contactPoint;
    Vec2 normal;
    float penetrationDepth;
    int indexA; // Fixture index
    int indexB; // Fixture index
    Vec2 relativeVelocity;
    float normalImpulseMagnitude;
    ContactID id;
};

class CollisionSolver {
public:
    std::vector<CollisionInfo> collisions;
    World& world;

    CollisionSolver(World& world);

    void clear();
    bool solve(int indexA, int indexB, float dt);

    static bool testPointCircle(const Vec2& point, const Vec2& center, float radius);
    static bool testPointAabb(const Vec2& point, const Vec2& center, float width, float height);
    static bool testPointBox(const Vec2& point, const Vec2& center, float width, float height, float rotation);

private:
    int _indexA = 0;
    int _indexB = 0;
    float _dt = 0.0f;
    float _speculativeMargin = 0.0f;
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
