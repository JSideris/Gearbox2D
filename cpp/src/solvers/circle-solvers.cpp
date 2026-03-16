#include "collision-solver.h"
#include "world.h"
#include "constants.h"
#include <cmath>
#include <algorithm>

using namespace std;

bool CollisionSolver::_solveCircleCircle() {
    int bIdxA = world.liveFixtureIntData[_indexA * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX];
    int bIdxB = world.liveFixtureIntData[_indexB * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX];

    float rA = world.liveFixtureFloatData[_indexA * FIXTURE_FDATA_EPO + FIXTURE_FDATA_RADIUS];
    float rB = world.liveFixtureFloatData[_indexB * FIXTURE_FDATA_EPO + FIXTURE_FDATA_RADIUS];
    
    // World position = Body position + rotated Local position
    float bXA = world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_X];
    float bYA = world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_Y];
    float bRA = world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_R];
    float lXA = world.liveFixtureFloatData[_indexA * FIXTURE_FDATA_EPO + FIXTURE_FDATA_LOCAL_X];
    float lYA = world.liveFixtureFloatData[_indexA * FIXTURE_FDATA_EPO + FIXTURE_FDATA_LOCAL_Y];
    
    float cosA = cos(bRA), sinA = sin(bRA);
    Vec2 pA(bXA + (lXA * cosA - lYA * sinA), bYA + (lXA * sinA + lYA * cosA));

    float bXB = world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_X];
    float bYB = world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_Y];
    float bRB = world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_R];
    float lXB = world.liveFixtureFloatData[_indexB * FIXTURE_FDATA_EPO + FIXTURE_FDATA_LOCAL_X];
    float lYB = world.liveFixtureFloatData[_indexB * FIXTURE_FDATA_EPO + FIXTURE_FDATA_LOCAL_Y];
    
    float cosB = cos(bRB), sinB = sin(bRB);
    Vec2 pB(bXB + (lXB * cosB - lYB * sinB), bYB + (lXB * sinB + lYB * cosB));

    Vec2 pDiff = pB - pA;
    float pd2 = pDiff.magnitudeSquared();
    float combinedRadius = rA + rB;

    if ((combinedRadius + _speculativeMargin) * (combinedRadius + _speculativeMargin) > pd2) {
        float distance = sqrt(pd2);
        Vec2 normal = (distance > 0.0001f) ? pDiff / distance : Vec2(0.0f, -1.0f);
        float penetrationDepth = combinedRadius - distance;

        // Check for speculative contact: only create if overlapping or going to overlap
        float vn = _relativeVelocity.dot(normal);
        if (penetrationDepth <= 0.0f && vn >= penetrationDepth / _dt) {
            return false;
        }

        Vec2 contactPoint = pA + normal * (rA - std::max(0.0f, penetrationDepth) * 0.5f);

        Vec2 vA(world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_VX], world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_VY]);
        Vec2 vB(world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_VX], world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_VY]);
        float wA = world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_RS];
        float wB = world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_RS];
        
        Vec2 rA_vec = contactPoint - pA, rB_vec = contactPoint - pB;
        Vec2 totalVelocityA = vA + Vec2(-rA_vec.y * wA, rA_vec.x * wA);
        Vec2 totalVelocityB = vB + Vec2(-rB_vec.y * wB, rB_vec.x * wB);
        
        ContactID id;
        id.features.indexA = 0; // Circle center
        id.features.indexB = 0; // Circle center
        id.features.typeA = 0; // Vertex
        id.features.typeB = 0; // Vertex
        
        collisions.push_back(CollisionInfo{true, contactPoint, normal, penetrationDepth, _indexA, _indexB, totalVelocityB - totalVelocityA, 0.0f, id});
        return true;
    }
    return false;
}

bool CollisionSolver::_solveCirclePoint() {
    int bIdxA = world.liveFixtureIntData[_indexA * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX];
    int bIdxB = world.liveFixtureIntData[_indexB * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX];

    float rA = world.liveFixtureFloatData[_indexA * FIXTURE_FDATA_EPO + FIXTURE_FDATA_RADIUS];
    
    float bXA = world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_X];
    float bYA = world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_Y];
    float bRA = world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_R];
    float lXA = world.liveFixtureFloatData[_indexA * FIXTURE_FDATA_EPO + FIXTURE_FDATA_LOCAL_X];
    float lYA = world.liveFixtureFloatData[_indexA * FIXTURE_FDATA_EPO + FIXTURE_FDATA_LOCAL_Y];
    float cosA = cos(bRA), sinA = sin(bRA);
    Vec2 pA(bXA + (lXA * cosA - lYA * sinA), bYA + (lXA * sinA + lYA * cosA));

    float bXB = world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_X];
    float bYB = world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_Y];
    float bRB = world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_R];
    float lXB = world.liveFixtureFloatData[_indexB * FIXTURE_FDATA_EPO + FIXTURE_FDATA_LOCAL_X];
    float lYB = world.liveFixtureFloatData[_indexB * FIXTURE_FDATA_EPO + FIXTURE_FDATA_LOCAL_Y];
    float cosB = cos(bRB), sinB = sin(bRB);
    Vec2 pB(bXB + (lXB * cosB - lYB * sinB), bYB + (lXB * sinB + lYB * cosB));

    Vec2 pDiff = pB - pA;
    float pd2 = pDiff.magnitudeSquared();

    if ((rA + _speculativeMargin) * (rA + _speculativeMargin) > pd2) {
        float distance = sqrt(pd2);
        Vec2 normal = (distance > 0.0001f) ? pDiff / distance : Vec2(0.0f, -1.0f);
        float penetrationDepth = rA - distance;

        // Check for speculative contact: only create if overlapping or going to overlap
        float vn = _relativeVelocity.dot(normal);
        if (penetrationDepth <= 0.0f && vn >= penetrationDepth / _dt) {
            return false;
        }
        
        Vec2 vA(world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_VX], world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_VY]);
        Vec2 vB(world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_VX], world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_VY]);
        float wA = world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_RS];
        float wB = world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_RS];
        
        Vec2 rA_vec = pB - pA;
        Vec2 totalVelocityA = vA + Vec2(-rA_vec.y * wA, rA_vec.x * wA);
        Vec2 totalVelocityB = vB; // Point has no rotation effects usually or we can add if needed
        
        ContactID id;
        id.features.indexA = 0; // Circle center
        id.features.indexB = 0; // Point
        id.features.typeA = 0; // Vertex
        id.features.typeB = 0; // Vertex
        
        collisions.push_back(CollisionInfo{true, pB, normal, penetrationDepth, _indexA, _indexB, totalVelocityB - totalVelocityA, 0.0f, id});
        return true;
    }
    return false;
}
