#include "collision-solver.h"
#include "world.h"
#include "constants.h"
#include <cmath>
#include <algorithm>

using namespace std;

// Helper to get true world properties for an AABB fixture
struct AabbProps {
    Vec2 center;
    Vec2 halfDim;
    Vec2 bodyPos;
    float bodyAngVel;
    Vec2 bodyVel;
};

AabbProps getAabbProps(World& world, int fIdx) {
    int bIdx = world.liveFixtureIntData[GET_FIXTURE_IDATA_INDEX(fIdx, FIXTURE_IDATA_BODY_INDEX)];
    float bx = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_X)];
    float by = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_Y)];
    float br = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_R)];
    float lx = world.liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(fIdx, FIXTURE_FDATA_LOCAL_X)];
    float ly = world.liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(fIdx, FIXTURE_FDATA_LOCAL_Y)];
    float w = world.liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(fIdx, FIXTURE_FDATA_W)];
    float h = world.liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(fIdx, FIXTURE_FDATA_H)];

    float cosR = cos(br), sinR = sin(br);
    Vec2 center(bx + (lx * cosR - ly * sinR), by + (lx * sinR + ly * cosR));

    return {
        center,
        Vec2(w * 0.5f, h * 0.5f),
        Vec2(bx, by),
        world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_RS)],
        Vec2(world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_VX)], world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_VY)])
    };
}

Vec2 getVelocityAt(const AabbProps& props, Vec2 p) {
    Vec2 r = p - props.bodyPos;
    return props.bodyVel + Vec2(-r.y * props.bodyAngVel, r.x * props.bodyAngVel);
}

bool CollisionSolver::_solveAabbAabb() {
    AabbProps pA = getAabbProps(world, _indexA);
    AabbProps pB = getAabbProps(world, _indexB);

    float x1A = pA.center.x - pA.halfDim.x, x2A = pA.center.x + pA.halfDim.x;
    float y1A = pA.center.y - pA.halfDim.y, y2A = pA.center.y + pA.halfDim.y;
    float x1B = pB.center.x - pB.halfDim.x, x2B = pB.center.x + pB.halfDim.x;
    float y1B = pB.center.y - pB.halfDim.y, y2B = pB.center.y + pB.halfDim.y;

    if (x1A < x2B + _speculativeMargin && x2A > x1B - _speculativeMargin && 
        y1A < y2B + _speculativeMargin && y2A > y1B - _speculativeMargin) {
        
        float gapX = max(x1A, x1B) - min(x2A, x2B);
        float gapY = max(y1A, y1B) - min(y2A, y2B);
        
        float overlapX = -gapX;
        float overlapY = -gapY;

        Vec2 normal;
        float depth;
        bool horizontal = overlapX < overlapY;

        if (horizontal) {
            depth = overlapX;
            normal = (pA.center.x < pB.center.x) ? Vec2(1, 0) : Vec2(-1, 0);
        } else {
            depth = overlapY;
            normal = (pA.center.y < pB.center.y) ? Vec2(0, 1) : Vec2(0, -1);
        }

        // Check for speculative contact: only create if overlapping or going to overlap
        float vn = _relativeVelocity.dot(normal);
        if (depth <= 0.0f && vn >= depth / _dt) {
            return false;
        }

        Vec2 contactPoint((max(x1A, x1B) + min(x2A, x2B)) * 0.5f, (max(y1A, y1B) + min(y2A, y2B)) * 0.5f);
        Vec2 relVel = getVelocityAt(pB, contactPoint) - getVelocityAt(pA, contactPoint);

        ContactID id;
        id.features.indexA = horizontal ? ((pA.center.x < pB.center.x) ? 1 : 3) : ((pA.center.y < pB.center.y) ? 2 : 0); // simplistic ID for AABB faces
        id.features.indexB = horizontal ? ((pA.center.x < pB.center.x) ? 3 : 1) : ((pA.center.y < pB.center.y) ? 0 : 2);
        id.features.typeA = 1; // face
        id.features.typeB = 1; // face

        collisions.push_back(CollisionInfo{true, contactPoint, normal, depth, _indexA, _indexB, relVel, 0.0f, id});
        return true;
    }
    return false;
}

bool CollisionSolver::_solveAabbPoint() {
    AabbProps pA = getAabbProps(world, _indexA);
    int bIdxB = world.liveFixtureIntData[GET_FIXTURE_IDATA_INDEX(_indexB, FIXTURE_IDATA_BODY_INDEX)];
    float bxB = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxB, BODY_FDATA_X)], byB = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxB, BODY_FDATA_Y)], brB = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxB, BODY_FDATA_R)];
    float lxB = world.liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(_indexB, FIXTURE_FDATA_LOCAL_X)], lyB = world.liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(_indexB, FIXTURE_FDATA_LOCAL_Y)];
    
    float cosB = cos(brB), sinB = sin(brB);
    Vec2 pointWorld(bxB + (lxB * cosB - lyB * sinB), byB + (lxB * sinB + lyB * cosB));

    float x1 = pA.center.x - pA.halfDim.x, x2 = pA.center.x + pA.halfDim.x;
    float y1 = pA.center.y - pA.halfDim.y, y2 = pA.center.y + pA.halfDim.y;

    if (pointWorld.x >= x1 - _speculativeMargin && pointWorld.x <= x2 + _speculativeMargin && 
        pointWorld.y >= y1 - _speculativeMargin && pointWorld.y <= y2 + _speculativeMargin) {
        
        float d[4] = { pointWorld.x - x1, x2 - pointWorld.x, pointWorld.y - y1, y2 - pointWorld.y };
        float minDist = d[0]; int axis = 0;
        for(int i=1; i<4; ++i) if(d[i] < minDist) { minDist = d[i]; axis = i; }
        
        float depth = minDist; // Can be negative if speculative
        Vec2 normal = (axis == 0) ? Vec2(-1, 0) : (axis == 1) ? Vec2(1, 0) : (axis == 2) ? Vec2(0, -1) : Vec2(0, 1);
        
        // Check for speculative contact
        float vn = _relativeVelocity.dot(normal);
        if (depth <= 0.0f && vn >= depth / _dt) {
            return false;
        }

        Vec2 relVel = Vec2(world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxB, BODY_FDATA_VX)], world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxB, BODY_FDATA_VY)]) - getVelocityAt(pA, pointWorld);

        ContactID id;
        id.features.indexA = axis; // Which AABB face
        id.features.indexB = 0; // Point
        id.features.typeA = 1; // Face
        id.features.typeB = 0; // Vertex

        collisions.push_back(CollisionInfo{true, pointWorld, normal, minDist, _indexA, _indexB, relVel, 0.0f, id});
        return true;
    }
    return false;
}

bool CollisionSolver::_solveAabbCircle() {
    AabbProps pA = getAabbProps(world, _indexA);
    int bIdxB = world.liveFixtureIntData[GET_FIXTURE_IDATA_INDEX(_indexB, FIXTURE_IDATA_BODY_INDEX)];
    float rB = world.liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(_indexB, FIXTURE_FDATA_RADIUS)];
    float bxB = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxB, BODY_FDATA_X)], byB = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxB, BODY_FDATA_Y)], brB = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxB, BODY_FDATA_R)];
    float lxB = world.liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(_indexB, FIXTURE_FDATA_LOCAL_X)], lyB = world.liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(_indexB, FIXTURE_FDATA_LOCAL_Y)];
    
    float cosB = cos(brB), sinB = sin(brB);
    Vec2 centerB(bxB + (lxB * cosB - lyB * sinB), byB + (lxB * sinB + lyB * cosB));

    float x1 = pA.center.x - pA.halfDim.x, x2 = pA.center.x + pA.halfDim.x;
    float y1 = pA.center.y - pA.halfDim.y, y2 = pA.center.y + pA.halfDim.y;

    float closestX = max(x1, min(centerB.x, x2));
    float closestY = max(y1, min(centerB.y, y2));
    Vec2 closest(closestX, closestY);
    Vec2 diff = centerB - closest;
    float distSq = diff.magnitudeSquared();

    bool inside = (distSq == 0);
    int axis = 0;
    if (inside) {
        float d[4] = { centerB.x - x1, x2 - centerB.x, centerB.y - y1, y2 - centerB.y };
        float minDist = d[0];
        for(int i=1; i<4; ++i) if(d[i] < minDist) { minDist = d[i]; axis = i; }
        if (axis == 0) { closest.x = x1; diff = Vec2(-1, 0); }
        else if (axis == 1) { closest.x = x2; diff = Vec2(1, 0); }
        else if (axis == 2) { closest.y = y1; diff = Vec2(0, -1); }
        else { closest.y = y2; diff = Vec2(0, 1); }
        distSq = minDist * minDist;
    }

    if (distSq < (rB + _speculativeMargin) * (rB + _speculativeMargin) || inside) {
        float dist = sqrt(distSq);
        Vec2 normal = inside ? diff : (dist > 0.0001f ? diff / dist : Vec2(0, -1));
        float depth = inside ? rB + dist : rB - dist;

        // Check for speculative contact
        float vn = _relativeVelocity.dot(normal);
        if (depth <= 0.0f && vn >= depth / _dt) {
            return false;
        }

        Vec2 vB = Vec2(world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxB, BODY_FDATA_VX)], world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxB, BODY_FDATA_VY)]);
        float wB = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdxB, BODY_FDATA_RS)];
        Vec2 rB_vec = closest - centerB;
        Vec2 totalVelB = vB + Vec2(-rB_vec.y * wB, rB_vec.x * wB);
        Vec2 relVel = totalVelB - getVelocityAt(pA, closest);

        ContactID id;
        id.features.indexA = inside ? axis : 0; // AABB face if inside, else simplistic 0
        id.features.indexB = 0; // Circle center
        id.features.typeA = inside ? 1 : 0; // Face if inside, vertex (closest point) if outside
        id.features.typeB = 0; // Vertex (circle center)

        collisions.push_back(CollisionInfo{true, closest, normal, depth, _indexA, _indexB, relVel, 0.0f, id});
        return true;
    }
    return false;
}
