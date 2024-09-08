
#include <unordered_map>
#include <functional>
#include <iostream>
#include "collision-solver.h"
#include "constants.h"
// #include "physical-object.h"
// #include "vec2.h"

using namespace std;

static float _mA = 0.0f;
static float _mB = 0.0f;
static float _imA = 0.0f;
static float _imB = 0.0f;
static float _totalInverseMass = 0.0f;
static int _indexA = 0;
static int _indexB = 0;

CollisionSolver::CollisionSolver(vector<int>& intData, vector<float>& floatData)
    : intData(intData), floatData(floatData) 
{}

void CollisionSolver::clear() {
    collisions.clear();
}
    
bool CollisionSolver::solve(int indexA, int indexB) {

    _indexA = indexA;
    _indexB = indexB;

    int shapeA = intData[_indexA * LIVE_INT_EPO + LIVE_INT_SHAPE];
    int shapeB = intData[_indexB * LIVE_INT_EPO + LIVE_INT_SHAPE];

    _mA = floatData[_indexB * FDATA_EPO + FDATA_M];
    _mB = floatData[_indexB * FDATA_EPO + FDATA_M];
    if(_mA > 0.0f){_imA = 1.0f / _mA;}
    if(_mB > 0.0f){_imB = 1.0f / _mB;}
    _totalInverseMass = _imA + _imB;

    switch(shapeA){
        case static_cast<int>(ObjectShape::CIRCLE):
            switch(shapeB){
                case static_cast<int>(ObjectShape::CIRCLE):
                    return _solveCircleCircle();
                default:
                    cerr << "Unsupported collision shape combo." << endl;
                    break;
            }
            break;
        default: 
            cerr << "Unsupported collision shape combo." << endl;
            break;
    }

    return false;
}



    // Get the correct solver for the obj types
bool CollisionSolver::_solveCircleCircle() {
    float rA = floatData[_indexA * FDATA_EPO + FDATA_RADIUS];
    float rB = floatData[_indexB * FDATA_EPO + FDATA_RADIUS];
    float xA = floatData[_indexA * FDATA_EPO + FDATA_X];
    float yA = floatData[_indexA * FDATA_EPO + FDATA_Y];
    float xB = floatData[_indexB * FDATA_EPO + FDATA_X];
    float yB = floatData[_indexB * FDATA_EPO + FDATA_Y];

    auto pA = Vec2(xA, yA);
    auto pB = Vec2(xB, yB);

    auto pDiff = (pB-pA);

    auto pd2 = pDiff.magnitudeSquared();
    // cout << (rA + rB)*(rA + rB) << " -- " << pd2 << endl;

    if((rA + rB)*(rA + rB) > pd2){
    //     return false;
    // }
    // else{
        auto normal = pDiff.normalize();
        auto penetrationDepth = rA + rB - pDiff.magnitude();
        auto contactPoint = pA + normal * rA;
        collisions.push_back(CollisionInfo{
            true, 
            contactPoint, 
            normal, 
            penetrationDepth, 
            _indexA, _indexB,
            _imA, _imB, _totalInverseMass
        });
        return true;
    }

    return false;
}