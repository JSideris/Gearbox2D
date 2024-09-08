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
};

class CollisionSolver {
public:

    vector<CollisionInfo> collisions;
    vector<int>& intData;
    vector<float>& floatData;

    CollisionSolver(vector<int>& intData, vector<float>& floatData);

    void clear();
    
    bool solve(int indexA, int indexB);

    // Get the correct solver for the obj types
    bool _solveCircleCircle(int indexA, int indexB);
};