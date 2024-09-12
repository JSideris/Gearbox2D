
#include <unordered_map>
#include <functional>
#include <iostream>
#include "collision-solver.h"
#include "constants.h"
// #include "physical-object.h"
// #include "vec2.h"

using namespace std;

// static float _totalInverseMass = 0.0f;
static int _indexA = 0;
static int _indexB = 0;
static Vec2 _relativeVelocity;

CollisionSolver::CollisionSolver(vector<int>& intData, vector<float>& floatData)
    : intData(intData), floatData(floatData) 
{}

void CollisionSolver::clear() {
    collisions.clear();
}

void _swap() {
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

    // _totalInverseMass = floatData[_indexA * FDATA_EPO + FDATA_IM] + floatData[_indexB * FDATA_EPO + FDATA_IM];

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
                default:
                    cerr << "Unsupported collision shape combo." << endl;
                    break;
            }
        case static_cast<int>(ObjectShape::CIRCLE):
            switch(shapeB){
                case static_cast<int>(ObjectShape::CIRCLE):
                    return _solveCircleCircle();
                case static_cast<int>(ObjectShape::AABB):
                    _swap();
                    return _solveAabbCircle();
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


bool CollisionSolver::_solveAabbAabb() {
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
            _relativeVelocity, 0.0f
        });
        return true;
    }

    return false;
}

// TODO: this solver doesn't orient the collision normal correctly.
bool CollisionSolver::_solveAabbCircle() {
    float rC = floatData[_indexB * FDATA_EPO + FDATA_RADIUS];
    float xC = floatData[_indexB * FDATA_EPO + FDATA_X];
    float yC = floatData[_indexB * FDATA_EPO + FDATA_Y];

    float xA = floatData[_indexA * FDATA_EPO + FDATA_X];
    float yA = floatData[_indexA * FDATA_EPO + FDATA_Y];
    float wA = floatData[_indexA * FDATA_EPO + FDATA_W];
    float hA = floatData[_indexA * FDATA_EPO + FDATA_H];

    float minX = xA - wA/2;
    float maxX = xA + wA/2;
    float minY = yA - hA/2;
    float maxY = yA + hA/2;

    // Find the closest point on the AABB to the circle's center
    float closestX = max(minX, min(xC, maxX));
    float closestY = max(minY, min(yC, maxY));

    // Compute the distance vector between the circle's center and the closest point
    Vec2 distanceVec(closestX - xC, closestY - yC);

    // Calculate the squared distance
    float distanceSquared = distanceVec.magnitudeSquared();

    // If the distance squared is less than the circle's radius squared, a collision occurs
    if (distanceSquared < rC * rC) {
        // Compute the penetration depth
        float distance = sqrt(distanceSquared);
        float penetrationDepth = rC - distance;

        // Normalize the distance vector to get the collision normal
        Vec2 normal = Vec2(1.0f, 0.0f);
        if (distance != 0) {
            normal = distanceVec / -distance;
        }

        collisions.push_back(CollisionInfo{
            true, 
            Vec2(closestX, closestY), 
            normal, 
            penetrationDepth, 
            _indexA, _indexB,
            _relativeVelocity, 0.0f
        });

        return true;
    }

    return false;
}
