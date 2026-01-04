#pragma once

#include <unordered_map>
#include <functional>
#include <iostream>

#include "vec2.h"

using namespace std;

struct CollisionInfo {
    bool isColliding;
    Vec2 contactPoint;
    Vec2 normal;
    float penetrationDepth;
    int indexA;
    int indexB;
    Vec2 relativeVelocity;

    // Set after collision resolution
    float normalImpulseMagnitude;
};

class CollisionSolver {
public:

    vector<CollisionInfo> collisions;
    vector<int>& intData;
    vector<float>& floatData;

    CollisionSolver(vector<int>& intData, vector<float>& floatData);

    void clear();
    
    bool solve(int indexA, int indexB);

private:
    int _indexA = 0;
    int _indexB = 0;
    Vec2 _relativeVelocity;

    void _swap();

    float closestPointsBetweenLines(
        const Vec2& p1, const Vec2& p2,
        const Vec2& p3, const Vec2& p4,
        Vec2& pointOnLine1, Vec2& pointOnLine2);

    // Get the correct solver for the obj types
    bool _solveAabbAabb();
    bool _solveAabbPoint();
    bool _solveAabbCircle();
    
    bool _solveCircleCircle();
    bool _solveCirclePoint();
    
    bool _solveBoxBox();
    bool _solveBoxPoint();
    bool _solveCircleBox();
};