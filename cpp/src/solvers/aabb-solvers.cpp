#include "collision-solver.h"
#include "world.h"
#include "constants.h"
#include <cmath>
#include <algorithm>

using namespace std;

bool CollisionSolver::_solveAabbAabb() {
    int bIdxA = world.liveFixtureIntData[_indexA * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX];
    int bIdxB = world.liveFixtureIntData[_indexB * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX];

    float x1A = world.liveFixtureFloatData[_indexA * FIXTURE_FDATA_EPO + FIXTURE_FDATA_AX1];
    float y1A = world.liveFixtureFloatData[_indexA * FIXTURE_FDATA_EPO + FIXTURE_FDATA_AY1];
    float x2A = world.liveFixtureFloatData[_indexA * FIXTURE_FDATA_EPO + FIXTURE_FDATA_AX2];
    float y2A = world.liveFixtureFloatData[_indexA * FIXTURE_FDATA_EPO + FIXTURE_FDATA_AY2];

    float x1B = world.liveFixtureFloatData[_indexB * FIXTURE_FDATA_EPO + FIXTURE_FDATA_AX1];
    float y1B = world.liveFixtureFloatData[_indexB * FIXTURE_FDATA_EPO + FIXTURE_FDATA_AY1];
    float x2B = world.liveFixtureFloatData[_indexB * FIXTURE_FDATA_EPO + FIXTURE_FDATA_AX2];
    float y2B = world.liveFixtureFloatData[_indexB * FIXTURE_FDATA_EPO + FIXTURE_FDATA_AY2];

    if (x1A < x2B && x2A > x1B && y1A < y2B && y2A > y1B) {
        float overlapX = min(x2A, x2B) - max(x1A, x1B);
        float overlapY = min(y2A, y2B) - max(y1A, y1B);
        Vec2 normal;
        float penetrationDepth;
        bool horizontal = overlapX < overlapY;

        if (horizontal) {
            penetrationDepth = overlapX;
            normal = (x1A + x2A < x1B + x2B) ? Vec2(1, 0) : Vec2(-1, 0);
        } else {
            penetrationDepth = overlapY;
            normal = (y1A + y2A < y1B + y2B) ? Vec2(0, 1) : Vec2(0, -1);
        }

        Vec2 vA(world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_VX], world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_VY]);
        Vec2 vB(world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_VX], world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_VY]);

        if (horizontal) {
            float yOverlapCenter = (max(y1A, y1B) + min(y2A, y2B)) / 2;
            float cpX = (max(x1A, x1B) + min(x2A, x2B)) / 2;
            collisions.push_back(CollisionInfo{true, Vec2(cpX, yOverlapCenter), normal, penetrationDepth, _indexA, _indexB, vB - vA, 0.0f});
        } else {
            float xOverlapCenter = (max(x1A, x1B) + min(x2A, x2B)) / 2;
            float cpY = (max(y1A, y1B) + min(y2A, y2B)) / 2;
            collisions.push_back(CollisionInfo{true, Vec2(xOverlapCenter, cpY), normal, penetrationDepth, _indexA, _indexB, vB - vA, 0.0f});
        }

        return true;
    }
    return false;
}

bool CollisionSolver::_solveAabbPoint() {
    int bIdxA = world.liveFixtureIntData[_indexA * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX];
    int bIdxB = world.liveFixtureIntData[_indexB * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX];

    float x1A = world.liveFixtureFloatData[_indexA * FIXTURE_FDATA_EPO + FIXTURE_FDATA_AX1];
    float y1A = world.liveFixtureFloatData[_indexA * FIXTURE_FDATA_EPO + FIXTURE_FDATA_AY1];
    float x2A = world.liveFixtureFloatData[_indexA * FIXTURE_FDATA_EPO + FIXTURE_FDATA_AX2];
    float y2A = world.liveFixtureFloatData[_indexA * FIXTURE_FDATA_EPO + FIXTURE_FDATA_AY2];

    float bXB = world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_X];
    float bYB = world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_Y];
    float bRB = world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_R];
    float lXB = world.liveFixtureFloatData[_indexB * FIXTURE_FDATA_EPO + FIXTURE_FDATA_LOCAL_X];
    float lYB = world.liveFixtureFloatData[_indexB * FIXTURE_FDATA_EPO + FIXTURE_FDATA_LOCAL_Y];
    
    float cosB = cos(bRB), sinB = sin(bRB);
    Vec2 pB(bXB + (lXB * cosB - lYB * sinB), bYB + (lXB * sinB + lYB * cosB));

    if (pB.x >= x1A && pB.x <= x2A && pB.y >= y1A && pB.y <= y2A) {
        float d1 = pB.x - x1A;
        float d2 = x2A - pB.x;
        float d3 = pB.y - y1A;
        float d4 = y2A - pB.y;
        
        float minDist = min({d1, d2, d3, d4});
        Vec2 normal;
        if (minDist == d1) normal = Vec2(-1, 0);
        else if (minDist == d2) normal = Vec2(1, 0);
        else if (minDist == d3) normal = Vec2(0, -1);
        else normal = Vec2(0, 1);
        
        Vec2 vA(world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_VX], world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_VY]);
        Vec2 vB(world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_VX], world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_VY]);
        
        collisions.push_back(CollisionInfo{true, pB, normal, minDist, _indexA, _indexB, vB - vA, 0.0f});
        return true;
    }
    return false;
}

bool CollisionSolver::_solveAabbCircle() {
    int bIdxA = world.liveFixtureIntData[_indexA * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX];
    int bIdxB = world.liveFixtureIntData[_indexB * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX];

    float x1A = world.liveFixtureFloatData[_indexA * FIXTURE_FDATA_EPO + FIXTURE_FDATA_AX1];
    float y1A = world.liveFixtureFloatData[_indexA * FIXTURE_FDATA_EPO + FIXTURE_FDATA_AY1];
    float x2A = world.liveFixtureFloatData[_indexA * FIXTURE_FDATA_EPO + FIXTURE_FDATA_AX2];
    float y2A = world.liveFixtureFloatData[_indexA * FIXTURE_FDATA_EPO + FIXTURE_FDATA_AY2];

    float rB = world.liveFixtureFloatData[_indexB * FIXTURE_FDATA_EPO + FIXTURE_FDATA_RADIUS];
    float bXB = world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_X];
    float bYB = world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_Y];
    float bRB = world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_R];
    float lXB = world.liveFixtureFloatData[_indexB * FIXTURE_FDATA_EPO + FIXTURE_FDATA_LOCAL_X];
    float lYB = world.liveFixtureFloatData[_indexB * FIXTURE_FDATA_EPO + FIXTURE_FDATA_LOCAL_Y];
    
    float cosB = cos(bRB), sinB = sin(bRB);
    Vec2 pB(bXB + (lXB * cosB - lYB * sinB), bYB + (lXB * sinB + lYB * cosB));

    // Closest point on AABB to circle center
    float closestX = max(x1A, min(pB.x, x2A));
    float closestY = max(y1A, min(pB.y, y2A));

    Vec2 closestPoint(closestX, closestY);
    Vec2 diff = pB - closestPoint;
    float distSq = diff.magnitudeSquared();

    bool inside = false;
    if (distSq == 0) {
        // Circle center is inside or on the edge of the AABB
        inside = true;
        float d1 = pB.x - x1A;
        float d2 = x2A - pB.x;
        float d3 = pB.y - y1A;
        float d4 = y2A - pB.y;
        
        float minDist = min({d1, d2, d3, d4});
        if (minDist == d1) { closestPoint.x = x1A; diff = Vec2(-1, 0); }
        else if (minDist == d2) { closestPoint.x = x2A; diff = Vec2(1, 0); }
        else if (minDist == d3) { closestPoint.y = y1A; diff = Vec2(0, -1); }
        else { closestPoint.y = y2A; diff = Vec2(0, 1); }
        
        distSq = minDist * minDist;
    }

    if (distSq < rB * rB || inside) {
        float distance = sqrt(distSq);
        Vec2 normal;
        float penetrationDepth;

        if (inside) {
            normal = diff; // diff was set to normal-like direction
            penetrationDepth = rB + distance;
        } else {
            normal = diff / distance;
            penetrationDepth = rB - distance;
        }

        Vec2 contactPoint = closestPoint;

        Vec2 vA(world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_VX], world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_VY]);
        Vec2 vB(world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_VX], world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_VY]);
        float wB = world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_RS];
        
        Vec2 rB_vec = contactPoint - pB;
        Vec2 totalVelocityB = vB + Vec2(-rB_vec.y * wB, rB_vec.x * wB);
        
        collisions.push_back(CollisionInfo{true, contactPoint, normal, penetrationDepth, _indexA, _indexB, totalVelocityB - vA, 0.0f});
        return true;
    }

    return false;
}
