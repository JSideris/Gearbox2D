
#include <unordered_map>
#include <functional>
#include <iostream>
#include "collision-solver.h"
#include "constants.h"
// #include "physical-object.h"
// #include "vec2.h"

using namespace std;

CollisionSolver::CollisionSolver(vector<int>& intData, vector<float>& floatData)
    : intData(intData), floatData(floatData) 
{}

void CollisionSolver::clear() {
    collisions.clear();
}
    
bool CollisionSolver::solve(int indexA, int indexB) {

    int shapeA = intData[indexA * LIVE_INT_EPO + LIVE_INT_SHAPE];
    int shapeB = intData[indexB * LIVE_INT_EPO + LIVE_INT_SHAPE];

    switch(shapeA){
        case static_cast<int>(ObjectShape::CIRCLE):
            switch(shapeB){
                case static_cast<int>(ObjectShape::CIRCLE):
                    return _solveCircleCircle(indexA, indexB);
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
bool CollisionSolver::_solveCircleCircle(int indexA, int indexB) {
    float rA = floatData[indexA * FDATA_EPO + FDATA_RADIUS];
    float rB = floatData[indexB * FDATA_EPO + FDATA_RADIUS];
    float xA = floatData[indexA * FDATA_EPO + FDATA_X];
    float yA = floatData[indexA * FDATA_EPO + FDATA_Y];
    float xB = floatData[indexB * FDATA_EPO + FDATA_X];
    float yB = floatData[indexB * FDATA_EPO + FDATA_Y];
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
        auto info = CollisionInfo{true, contactPoint, normal, penetrationDepth};
        collisions.push_back(info);
        return true;
    }

    return false;
}