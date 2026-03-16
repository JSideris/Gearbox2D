#include "collision-solver.h"
#include "world.h"
#include "constants.h"
#include <cmath>
#include <algorithm>
#include <cfloat>

using namespace std;

bool CollisionSolver::_solveCapsuleCircle() {
    int bIdxA = world.liveFixtureIntData[_indexA * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX];
    int bIdxB = world.liveFixtureIntData[_indexB * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX];

    float rA = world.liveFixtureFloatData[_indexA * FIXTURE_FDATA_EPO + FIXTURE_FDATA_RADIUS];
    float hA = world.liveFixtureFloatData[_indexA * FIXTURE_FDATA_EPO + FIXTURE_FDATA_H];
    float rB = world.liveFixtureFloatData[_indexB * FIXTURE_FDATA_EPO + FIXTURE_FDATA_RADIUS];

    auto getFixtureWorldPos = [&](int fIdx, int bIdx) {
        float bx = world.liveBodyFloatData[bIdx * BODY_FDATA_EPO + BODY_FDATA_X];
        float by = world.liveBodyFloatData[bIdx * BODY_FDATA_EPO + BODY_FDATA_Y];
        float br = world.liveBodyFloatData[bIdx * BODY_FDATA_EPO + BODY_FDATA_R];
        float lx = world.liveFixtureFloatData[fIdx * FIXTURE_FDATA_EPO + FIXTURE_FDATA_LOCAL_X];
        float ly = world.liveFixtureFloatData[fIdx * FIXTURE_FDATA_EPO + FIXTURE_FDATA_LOCAL_Y];
        float lr = world.liveFixtureFloatData[fIdx * FIXTURE_FDATA_EPO + FIXTURE_FDATA_LOCAL_R];
        
        float cosR = cos(br), sinR = sin(br);
        Vec2 worldPos(bx + (lx * cosR - ly * sinR), by + (lx * sinR + ly * cosR));
        float worldRot = br + lr;
        return make_pair(worldPos, worldRot);
    };

    auto pA_rotA = getFixtureWorldPos(_indexA, bIdxA);
    Vec2 pA = pA_rotA.first;
    float rotA = pA_rotA.second;
    auto pB_rotB = getFixtureWorldPos(_indexB, bIdxB);
    Vec2 pB = pB_rotB.first;
    float rotB = pB_rotB.second;

    float halfL = max(0.0f, hA * 0.5f - rA);
    Vec2 d(0, halfL);
    d = d.rotate(rotA);
    Vec2 a1 = pA - d;
    Vec2 a2 = pA + d;

    Vec2 closestOnA, closestOnB;
    float distSq = closestPointsBetweenLines(a1, a2, pB, pB, closestOnA, closestOnB);
    
    float combinedRadius = rA + rB;
    if (distSq < (combinedRadius + _speculativeMargin) * (combinedRadius + _speculativeMargin)) {
        float distance = sqrt(distSq);
        Vec2 normal = (distance > 0.0001f) ? (pB - closestOnA) / distance : Vec2(0.0f, -1.0f);
        float penetrationDepth = combinedRadius - distance;

        float vn = _relativeVelocity.dot(normal);
        if (penetrationDepth <= 0.0f && vn >= penetrationDepth / _dt) return false;

        Vec2 contactPoint = closestOnA + normal * (rA - std::max(0.0f, penetrationDepth) * 0.5f);

        Vec2 vA(world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_VX], world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_VY]);
        Vec2 vB(world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_VX], world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_VY]);
        float wA = world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_RS];
        float wB = world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_RS];
        
        Vec2 rA_vec = contactPoint - pA, rB_vec = contactPoint - pB;
        Vec2 totalVelocityA = vA + Vec2(-rA_vec.y * wA, rA_vec.x * wA);
        Vec2 totalVelocityB = vB + Vec2(-rB_vec.y * wB, rB_vec.x * wB);
        
        ContactID id;
        id.features.indexA = 0;
        id.features.indexB = 0;
        
        collisions.push_back(CollisionInfo{true, contactPoint, normal, penetrationDepth, _indexA, _indexB, totalVelocityB - totalVelocityA, 0.0f, id});
        return true;
    }
    return false;
}

bool CollisionSolver::_solveCapsuleCapsule() {
    int bIdxA = world.liveFixtureIntData[_indexA * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX];
    int bIdxB = world.liveFixtureIntData[_indexB * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX];

    float rA = world.liveFixtureFloatData[_indexA * FIXTURE_FDATA_EPO + FIXTURE_FDATA_RADIUS];
    float hA = world.liveFixtureFloatData[_indexA * FIXTURE_FDATA_EPO + FIXTURE_FDATA_H];
    float rB = world.liveFixtureFloatData[_indexB * FIXTURE_FDATA_EPO + FIXTURE_FDATA_RADIUS];
    float hB = world.liveFixtureFloatData[_indexB * FIXTURE_FDATA_EPO + FIXTURE_FDATA_H];

    auto getFixtureWorldPos = [&](int fIdx, int bIdx) {
        float bx = world.liveBodyFloatData[bIdx * BODY_FDATA_EPO + BODY_FDATA_X];
        float by = world.liveBodyFloatData[bIdx * BODY_FDATA_EPO + BODY_FDATA_Y];
        float br = world.liveBodyFloatData[bIdx * BODY_FDATA_EPO + BODY_FDATA_R];
        float lx = world.liveFixtureFloatData[fIdx * FIXTURE_FDATA_EPO + FIXTURE_FDATA_LOCAL_X];
        float ly = world.liveFixtureFloatData[fIdx * FIXTURE_FDATA_EPO + FIXTURE_FDATA_LOCAL_Y];
        float lr = world.liveFixtureFloatData[fIdx * FIXTURE_FDATA_EPO + FIXTURE_FDATA_LOCAL_R];
        
        float cosR = cos(br), sinR = sin(br);
        Vec2 worldPos(bx + (lx * cosR - ly * sinR), by + (lx * sinR + ly * cosR));
        float worldRot = br + lr;
        return make_pair(worldPos, worldRot);
    };

    auto pA_rotA = getFixtureWorldPos(_indexA, bIdxA);
    Vec2 pA = pA_rotA.first;
    float rotA = pA_rotA.second;
    auto pB_rotB = getFixtureWorldPos(_indexB, bIdxB);
    Vec2 pB = pB_rotB.first;
    float rotB = pB_rotB.second;

    float halfLA = max(0.0f, hA * 0.5f - rA);
    Vec2 dA(0, halfLA); dA = dA.rotate(rotA);
    Vec2 a1 = pA - dA, a2 = pA + dA;

    float halfLB = max(0.0f, hB * 0.5f - rB);
    Vec2 dB(0, halfLB); dB = dB.rotate(rotB);
    Vec2 b1 = pB - dB, b2 = pB + dB;

    Vec2 closestOnA, closestOnB;
    float distSq = closestPointsBetweenLines(a1, a2, b1, b2, closestOnA, closestOnB);
    
    float combinedRadius = rA + rB;
    if (distSq < (combinedRadius + _speculativeMargin) * (combinedRadius + _speculativeMargin)) {
        float distance = sqrt(distSq);
        Vec2 normal = (distance > 0.0001f) ? (closestOnB - closestOnA) / distance : Vec2(0.0f, -1.0f);
        float penetrationDepth = combinedRadius - distance;

        float vn = _relativeVelocity.dot(normal);
        if (penetrationDepth <= 0.0f && vn >= penetrationDepth / _dt) return false;

        Vec2 contactPoint = closestOnA + normal * (rA - std::max(0.0f, penetrationDepth) * 0.5f);

        Vec2 vA(world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_VX], world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_VY]);
        Vec2 vB(world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_VX], world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_VY]);
        float wA = world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_RS];
        float wB = world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_RS];
        
        Vec2 rA_vec = contactPoint - pA, rB_vec = contactPoint - pB;
        Vec2 totalVelocityA = vA + Vec2(-rA_vec.y * wA, rA_vec.x * wA);
        Vec2 totalVelocityB = vB + Vec2(-rB_vec.y * wB, rB_vec.x * wB);
        
        ContactID id;
        id.features.indexA = 0;
        id.features.indexB = 0;
        
        collisions.push_back(CollisionInfo{true, contactPoint, normal, penetrationDepth, _indexA, _indexB, totalVelocityB - totalVelocityA, 0.0f, id});
        return true;
    }
    return false;
}

bool CollisionSolver::_solveCapsulePoint() {
    int bIdxA = world.liveFixtureIntData[_indexA * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX];
    int bIdxB = world.liveFixtureIntData[_indexB * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX];

    float rA = world.liveFixtureFloatData[_indexA * FIXTURE_FDATA_EPO + FIXTURE_FDATA_RADIUS];
    float hA = world.liveFixtureFloatData[_indexA * FIXTURE_FDATA_EPO + FIXTURE_FDATA_H];

    auto getFixtureWorldPos = [&](int fIdx, int bIdx) {
        float bx = world.liveBodyFloatData[bIdx * BODY_FDATA_EPO + BODY_FDATA_X];
        float by = world.liveBodyFloatData[bIdx * BODY_FDATA_EPO + BODY_FDATA_Y];
        float br = world.liveBodyFloatData[bIdx * BODY_FDATA_EPO + BODY_FDATA_R];
        float lx = world.liveFixtureFloatData[fIdx * FIXTURE_FDATA_EPO + FIXTURE_FDATA_LOCAL_X];
        float ly = world.liveFixtureFloatData[fIdx * FIXTURE_FDATA_EPO + FIXTURE_FDATA_LOCAL_Y];
        float lr = world.liveFixtureFloatData[fIdx * FIXTURE_FDATA_EPO + FIXTURE_FDATA_LOCAL_R];
        
        float cosR = cos(br), sinR = sin(br);
        Vec2 worldPos(bx + (lx * cosR - ly * sinR), by + (lx * sinR + ly * cosR));
        float worldRot = br + lr;
        return make_pair(worldPos, worldRot);
    };

    auto pA_rotA = getFixtureWorldPos(_indexA, bIdxA);
    Vec2 pA = pA_rotA.first;
    float rotA = pA_rotA.second;
    auto pB_rotB = getFixtureWorldPos(_indexB, bIdxB);
    Vec2 pB = pB_rotB.first;
    float rotB = pB_rotB.second;

    float halfL = max(0.0f, hA * 0.5f - rA);
    Vec2 d(0, halfL); d = d.rotate(rotA);
    Vec2 a1 = pA - d, a2 = pA + d;

    Vec2 closestOnA, closestOnB;
    float distSq = closestPointsBetweenLines(a1, a2, pB, pB, closestOnA, closestOnB);
    
    if (distSq < (rA + _speculativeMargin) * (rA + _speculativeMargin)) {
        float distance = sqrt(distSq);
        Vec2 normal = (distance > 0.0001f) ? (pB - closestOnA) / distance : Vec2(0.0f, -1.0f);
        float penetrationDepth = rA - distance;

        float vn = _relativeVelocity.dot(normal);
        if (penetrationDepth <= 0.0f && vn >= penetrationDepth / _dt) return false;

        Vec2 vA(world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_VX], world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_VY]);
        Vec2 vB(world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_VX], world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_VY]);
        float wA = world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_RS];
        
        Vec2 rA_vec = pB - pA;
        Vec2 totalVelocityA = vA + Vec2(-rA_vec.y * wA, rA_vec.x * wA);
        Vec2 totalVelocityB = vB;
        
        ContactID id;
        id.features.indexA = 0;
        id.features.indexB = 0;
        
        collisions.push_back(CollisionInfo{true, pB, normal, penetrationDepth, _indexA, _indexB, totalVelocityB - totalVelocityA, 0.0f, id});
        return true;
    }
    return false;
}

bool CollisionSolver::_solveCapsuleBox() {
    // Treat capsule as Minkowski sum of segment and circle.
    // Check segment against Box. If distance is < radius, we have collision.
    
    int bIdxA = world.liveFixtureIntData[_indexA * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX];
    int bIdxB = world.liveFixtureIntData[_indexB * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX];

    float rA = world.liveFixtureFloatData[_indexA * FIXTURE_FDATA_EPO + FIXTURE_FDATA_RADIUS];
    float hA = world.liveFixtureFloatData[_indexA * FIXTURE_FDATA_EPO + FIXTURE_FDATA_H];
    float wB = world.liveFixtureFloatData[_indexB * FIXTURE_FDATA_EPO + FIXTURE_FDATA_W];
    float hB = world.liveFixtureFloatData[_indexB * FIXTURE_FDATA_EPO + FIXTURE_FDATA_H];

    auto getFixtureWorldPos = [&](int fIdx, int bIdx) {
        float bx = world.liveBodyFloatData[bIdx * BODY_FDATA_EPO + BODY_FDATA_X];
        float by = world.liveBodyFloatData[bIdx * BODY_FDATA_EPO + BODY_FDATA_Y];
        float br = world.liveBodyFloatData[bIdx * BODY_FDATA_EPO + BODY_FDATA_R];
        float lx = world.liveFixtureFloatData[fIdx * FIXTURE_FDATA_EPO + FIXTURE_FDATA_LOCAL_X];
        float ly = world.liveFixtureFloatData[fIdx * FIXTURE_FDATA_EPO + FIXTURE_FDATA_LOCAL_Y];
        float lr = world.liveFixtureFloatData[fIdx * FIXTURE_FDATA_EPO + FIXTURE_FDATA_LOCAL_R];
        
        float cosR = cos(br), sinR = sin(br);
        Vec2 worldPos(bx + (lx * cosR - ly * sinR), by + (lx * sinR + ly * cosR));
        
        int shape = world.liveFixtureIntData[fIdx * FIXTURE_IDATA_EPO + FIXTURE_IDATA_SHAPE];
        float worldRot = (shape == (int)ObjectShape::AABB) ? 0.0f : (br + lr);
        
        return make_pair(worldPos, worldRot);
    };

    auto pA_rotA = getFixtureWorldPos(_indexA, bIdxA);
    Vec2 pA = pA_rotA.first;
    float rotA = pA_rotA.second;
    auto pB_rotB = getFixtureWorldPos(_indexB, bIdxB);
    Vec2 pB = pB_rotB.first;
    float rotB = pB_rotB.second;

    float halfLA = max(0.0f, hA * 0.5f - rA);
    Vec2 dA(0, halfLA); dA = dA.rotate(rotA);
    Vec2 a1 = pA - dA, a2 = pA + dA;

    // Transform segment a1-a2 to Box local space
    float cosB = cos(-rotB), sinB = sin(-rotB);
    auto toLocal = [pB, cosB, sinB](const Vec2& v) {
        Vec2 rel = v - pB;
        return Vec2(rel.x * cosB - rel.y * sinB, rel.x * sinB + rel.y * cosB);
    };
    Vec2 la1 = toLocal(a1), la2 = toLocal(a2);

    // Box bounds in local space
    float hw = wB * 0.5f, hh = hB * 0.5f;
    
    // Find closest point on segment la1-la2 to the AABB (-hw, -hh) to (hw, hh)
    auto closestPointOnSegmentToAabb = [&](const Vec2& s1, const Vec2& s2, float hw, float hh, Vec2& outS, Vec2& outB) {
        // This is a bit more complex. Let's simplify:
        // Test endpoints and segment-edge intersections.
        // Actually, we can use the property that the closest point is either an endpoint
        // or where the segment is perpendicular to an edge.
        
        float bestDistSq = FLT_MAX;
        
        auto checkPoint = [&](const Vec2& ps) {
            Vec2 pb(max(-hw, min(ps.x, hw)), max(-hh, min(ps.y, hh)));
            float d2 = (ps - pb).magnitudeSquared();
            if (d2 < bestDistSq) { bestDistSq = d2; outS = ps; outB = pb; }
        };

        checkPoint(s1);
        checkPoint(s2);

        // Check intersections with edge lines
        Vec2 dir = s2 - s1;
        if (abs(dir.x) > 1e-6) {
            float t1 = (-hw - s1.x) / dir.x;
            if (t1 > 0 && t1 < 1) checkPoint(s1 + dir * t1);
            float t2 = (hw - s1.x) / dir.x;
            if (t2 > 0 && t2 < 1) checkPoint(s1 + dir * t2);
        }
        if (abs(dir.y) > 1e-6) {
            float t1 = (-hh - s1.y) / dir.y;
            if (t1 > 0 && t1 < 1) checkPoint(s1 + dir * t1);
            float t2 = (hh - s1.y) / dir.y;
            if (t2 > 0 && t2 < 1) checkPoint(s1 + dir * t2);
        }
        
        return bestDistSq;
    };

    Vec2 localClosestOnA, localClosestOnB;
    float distSq = closestPointOnSegmentToAabb(la1, la2, hw, hh, localClosestOnA, localClosestOnB);
    
    // If the segment is inside the box, distSq might be 0.
    // We need a proper "inside" penetration depth.
    bool inside = false;
    float minDist = 0;
    if (distSq < 1e-6) {
        inside = true;
        // If inside, find deepest point on segment
        // Let's just use the midpoint for now or one of endpoints.
        // Actually, we need the distance to the closest edge.
        auto distToEdge = [&](const Vec2& p) {
            return min({hw - p.x, p.x + hw, hh - p.y, p.y + hh});
        };
        float d1 = distToEdge(la1);
        float d2 = distToEdge(la2);
        minDist = max(d1, d2); // We want the deepest part of the segment? No, we want to push it out.
        // Simplification: use the one closer to an edge to avoid jumping.
        if (d1 < d2) { localClosestOnA = la1; minDist = d1; }
        else { localClosestOnA = la2; minDist = d2; }
        
        // Find normal
        float e1 = hw - localClosestOnA.x, e2 = localClosestOnA.x + hw, e3 = hh - localClosestOnA.y, e4 = localClosestOnA.y + hh;
        float me = min({e1, e2, e3, e4});
        if (me == e1) localClosestOnB = Vec2(hw, localClosestOnA.y);
        else if (me == e2) localClosestOnB = Vec2(-hw, localClosestOnA.y);
        else if (me == e3) localClosestOnB = Vec2(localClosestOnA.x, hh);
        else localClosestOnB = Vec2(localClosestOnA.x, -hh);
        distSq = me * me;
    }

    if (distSq < (rA + _speculativeMargin) * (rA + _speculativeMargin) || inside) {
        float distance = sqrt(distSq);
        Vec2 normalLocal;
        float penetrationDepth;

        if (inside) {
            normalLocal = (localClosestOnA - localClosestOnB);
            if (normalLocal.magnitudeSquared() > 1e-6) normalLocal = normalLocal.normalize();
            else normalLocal = Vec2(0, 1);
            penetrationDepth = rA + distance;
        } else {
            normalLocal = (localClosestOnA - localClosestOnB);
            if (distance > 0.0001f) normalLocal = normalLocal / distance;
            else normalLocal = Vec2(0, 1);
            penetrationDepth = rA - distance;
        }

        float cosW = cos(rotB), sinW = sin(rotB);
        Vec2 normal(normalLocal.x * cosW - normalLocal.y * sinW, normalLocal.x * sinW + normalLocal.y * cosW);

        float vn = _relativeVelocity.dot(normal * -1.0f);
        if (penetrationDepth <= 0.0f && vn >= penetrationDepth / _dt) return false;

        Vec2 contactPoint(localClosestOnB.x * cosW - localClosestOnB.y * sinW + pB.x, 
                          localClosestOnB.x * sinW + localClosestOnB.y * cosW + pB.y);

        Vec2 vA(world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_VX], world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_VY]);
        Vec2 vB(world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_VX], world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_VY]);
        float wA = world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_RS];
        float wB = world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_RS];
        
        Vec2 rA_vec = contactPoint - pA, rB_vec = contactPoint - pB;
        Vec2 totalVelocityA = vA + Vec2(-rA_vec.y * wA, rA_vec.x * wA);
        Vec2 totalVelocityB = vB + Vec2(-rB_vec.y * wB, rB_vec.x * wB);
        
        ContactID id;
        id.features.indexA = 0;
        id.features.indexB = 0;
        
        collisions.push_back(CollisionInfo{true, contactPoint, normal * -1.0f, penetrationDepth, _indexA, _indexB, totalVelocityB - totalVelocityA, 0.0f, id});
        return true;
    }
    return false;
}
