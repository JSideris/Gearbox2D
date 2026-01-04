#include <cfloat>
#include <unordered_map>
#include <functional>
#include <iostream>
#include "collision-solver.h"
#include "constants.h"

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#include <stdio.h>
#endif

using namespace std;

CollisionSolver::CollisionSolver(vector<int>& intData, vector<float>& floatData)
    : intData(intData), floatData(floatData) 
{}

void CollisionSolver::clear() {
    collisions.clear();
}

void CollisionSolver::_swap() {
    int tempi = _indexA;
    _indexA = _indexB;
    _indexB = tempi;

    _relativeVelocity = _relativeVelocity * -1.0f;
}
    
bool CollisionSolver::solve(int indexA, int indexB) {

    _indexA = indexA;
    _indexB = indexB;

    int shapeA = intData[_indexA * LIVE_INT_EPO + LIVE_INT_SHAPE];
    int shapeB = intData[_indexB * LIVE_INT_EPO + LIVE_INT_SHAPE];

    _relativeVelocity = Vec2(
        floatData[_indexB * FDATA_EPO + FDATA_VX] - floatData[_indexA * FDATA_EPO + FDATA_VX],
        floatData[_indexB * FDATA_EPO + FDATA_VY] - floatData[_indexA * FDATA_EPO + FDATA_VY]
    );

    switch(shapeA){
        case static_cast<int>(ObjectShape::AABB):
            switch(shapeB){
                case static_cast<int>(ObjectShape::AABB):
                    return _solveAabbAabb();
                case static_cast<int>(ObjectShape::CIRCLE):
                    return _solveAabbCircle();
                case static_cast<int>(ObjectShape::BOX):
                    return _solveBoxBox();
                case static_cast<int>(ObjectShape::POINT):
                    return _solveAabbPoint();
                default:
                    cerr << "Unsupported collision shape combo." << endl;
                    break;
            }
        case static_cast<int>(ObjectShape::BOX):
            switch(shapeB){
                case static_cast<int>(ObjectShape::AABB):
                    _swap();
                    return _solveBoxBox();
                case static_cast<int>(ObjectShape::CIRCLE):
                    _swap();
                    return _solveCircleBox();
                case static_cast<int>(ObjectShape::BOX):
                    return _solveBoxBox();
                default:
                    cerr << "Unsupported collision shape combo." << endl;
                    break;
            }
            break;
        case static_cast<int>(ObjectShape::CIRCLE):
            switch(shapeB){
                case static_cast<int>(ObjectShape::CIRCLE):
                    return _solveCircleCircle();
                case static_cast<int>(ObjectShape::AABB):
                    _swap();
                    return _solveAabbCircle();
                case static_cast<int>(ObjectShape::BOX):
                    return _solveCircleBox();
                default:
                    cerr << "Unsupported collision shape combo." << endl;
                    break;
            }
            break;
        case static_cast<int>(ObjectShape::POINT):
            switch(shapeB){
                case static_cast<int>(ObjectShape::POINT):
                    return false;
                case static_cast<int>(ObjectShape::AABB):
                    _swap();
                    return _solveAabbPoint();
            }
        default: 
            cerr << "Unsupported collision shape combo." << endl;
            break;
    }

    return false;
}
