#include "collision-solver.h"
#include "world.h"
#include "constants.h"
#include <cmath>
#include <algorithm>
#include <cfloat>

using namespace std;

bool CollisionSolver::_solveBoxBox() {
    int bIdxA = world.liveFixtureIntData[_indexA * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX];
    int bIdxB = world.liveFixtureIntData[_indexB * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX];

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

    auto [pA, rotA] = getFixtureWorldPos(_indexA, bIdxA);
    auto [pB, rotB] = getFixtureWorldPos(_indexB, bIdxB);
    float wA = world.liveFixtureFloatData[_indexA * FIXTURE_FDATA_EPO + FIXTURE_FDATA_W];
    float hA = world.liveFixtureFloatData[_indexA * FIXTURE_FDATA_EPO + FIXTURE_FDATA_H];
    float wB = world.liveFixtureFloatData[_indexB * FIXTURE_FDATA_EPO + FIXTURE_FDATA_W];
    float hB = world.liveFixtureFloatData[_indexB * FIXTURE_FDATA_EPO + FIXTURE_FDATA_H];

    Vec2 axesA[2] = { Vec2(cos(rotA), sin(rotA)), Vec2(-sin(rotA), cos(rotA)) };
    Vec2 axesB[2] = { Vec2(cos(rotB), sin(rotB)), Vec2(-sin(rotB), cos(rotB)) };
    float halfA[2] = { wA / 2.0f, hA / 2.0f };
    float halfB[2] = { wB / 2.0f, hB / 2.0f };

    Vec2 relPos = pB - pA;
    float minOverlap = FLT_MAX;
    int bestAxis = -1;

    float dt = world.getTimeStep();

    for (int i = 0; i < 4; ++i) {
        Vec2 axis = (i < 2) ? axesA[i] : axesB[i - 2];
        float projA = halfA[0] * abs(axis.dot(axesA[0])) + halfA[1] * abs(axis.dot(axesA[1]));
        float projB = halfB[0] * abs(axis.dot(axesB[0])) + halfB[1] * abs(axis.dot(axesB[1]));
        float dist = abs(relPos.dot(axis));
        float overlap = projA + projB - dist;

        if (overlap < -_speculativeMargin) return false;
        if (overlap < minOverlap) {
            minOverlap = overlap;
            bestAxis = i;
        }
    }

    // Identify reference and incident boxes
    bool aIsReference = (bestAxis < 2);
    Vec2 normal = aIsReference ? axesA[bestAxis] : axesB[bestAxis - 2];
    if (normal.dot(relPos) < 0) normal = normal * -1.0f;

    // The normal now points from A to B.
    // If B is reference, normal should point from B to A for clipping logic, 
    // but we'll stick to normal pointing from A to B and adjust.

    Vec2 refP = aIsReference ? pA : pB;
    Vec2 incP = aIsReference ? pB : pA;
    Vec2* refAxes = aIsReference ? axesA : axesB;
    Vec2* incAxes = aIsReference ? axesB : axesA;
    float* refHalf = aIsReference ? halfA : halfB;
    float* incHalf = aIsReference ? halfB : halfA;
    Vec2 refNormal = aIsReference ? normal : normal * -1.0f;

    // Find incident face
    int incAxisIdx = 0;
    float minDot = FLT_MAX;
    for (int i = 0; i < 2; ++i) {
        float d = incAxes[i].dot(refNormal);
        if (d < minDot) { minDot = d; incAxisIdx = i; }
        if (-incAxes[i].dot(refNormal) < minDot) { minDot = -incAxes[i].dot(refNormal); incAxisIdx = i + 2; }
    }

    Vec2 incNormal = (incAxisIdx < 2) ? incAxes[incAxisIdx] : incAxes[incAxisIdx - 2] * -1.0f;
    Vec2 incVertices[2];
    if (incAxisIdx == 0) { // +X face
        incVertices[0] = incP + incAxes[0] * incHalf[0] + incAxes[1] * incHalf[1];
        incVertices[1] = incP + incAxes[0] * incHalf[0] - incAxes[1] * incHalf[1];
    } else if (incAxisIdx == 2) { // -X face
        incVertices[0] = incP - incAxes[0] * incHalf[0] + incAxes[1] * incHalf[1];
        incVertices[1] = incP - incAxes[0] * incHalf[0] - incAxes[1] * incHalf[1];
    } else if (incAxisIdx == 1) { // +Y face
        incVertices[0] = incP + incAxes[1] * incHalf[1] + incAxes[0] * incHalf[0];
        incVertices[1] = incP + incAxes[1] * incHalf[1] - incAxes[0] * incHalf[0];
    } else { // -Y face
        incVertices[0] = incP - incAxes[1] * incHalf[1] + incAxes[0] * incHalf[0];
        incVertices[1] = incP - incAxes[1] * incHalf[1] - incAxes[0] * incHalf[0];
    }

    // Clip against side planes of reference box
    int refSideAxisIdx = (bestAxis % 2 == 0) ? 1 : 0;
    Vec2 sideAxis = refAxes[refSideAxisIdx];
    float sideOffset1 = sideAxis.dot(refP + sideAxis * refHalf[refSideAxisIdx]);
    float sideOffset2 = -sideAxis.dot(refP - sideAxis * refHalf[refSideAxisIdx]);

    auto clip = [](Vec2 vIn[2], Vec2 n, float offset, Vec2 vOut[2]) -> int {
        int count = 0;
        float d1 = n.dot(vIn[0]) - offset;
        float d2 = n.dot(vIn[1]) - offset;
        if (d1 <= 0) vOut[count++] = vIn[0];
        if (d2 <= 0) vOut[count++] = vIn[1];
        if (d1 * d2 < 0) {
            float alpha = d1 / (d1 - d2);
            vOut[count++] = vIn[0] + (vIn[1] - vIn[0]) * alpha;
        }
        return count;
    };

    Vec2 clippedVertices[2], tempVertices[2];
    int count = clip(incVertices, sideAxis, sideOffset1, tempVertices);
    if (count < 2) return false;
    count = clip(tempVertices, sideAxis * -1.0f, sideOffset2, clippedVertices);
    if (count < 2) return false;

    // Clip against reference face plane
    float refOffset = refNormal.dot(refP + refNormal * refHalf[bestAxis % 2]);
    
    bool foundCollision = false;
    for (int i = 0; i < count; ++i) {
        float d = refNormal.dot(clippedVertices[i]) - refOffset;
        if (d <= _speculativeMargin) {
            Vec2 contactPoint = clippedVertices[i]; // Deepest points are on the incident box
            float penetration = -d;

            Vec2 vA(world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_VX], world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_VY]);
            Vec2 vB(world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_VX], world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_VY]);
            float rsA = world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_RS];
            float rsB = world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_RS];
            
            Vec2 rA_vec = contactPoint - pA, rB_vec = contactPoint - pB;
            Vec2 totalVelocityA = vA + Vec2(-rA_vec.y * rsA, rA_vec.x * rsA);
            Vec2 totalVelocityB = vB + Vec2(-rB_vec.y * rsB, rB_vec.x * rsB);
            Vec2 relativeVel = totalVelocityB - totalVelocityA;

            // Check for speculative contact
            float vn = relativeVel.dot(normal);
            if (penetration <= 0.0f && vn >= penetration / dt) {
                continue;
            }

            foundCollision = true;

            ContactID id;
            id.features.indexA = i; // which clipped vertex
            id.features.indexB = bestAxis; // which reference face
            id.features.typeA = 0; // vertex
            id.features.typeB = 1; // face
            if (!aIsReference) {
                std::swap(id.features.indexA, id.features.indexB);
                std::swap(id.features.typeA, id.features.typeB);
            }

            collisions.push_back(CollisionInfo{true, contactPoint, normal, penetration, _indexA, _indexB, totalVelocityB - totalVelocityA, 0.0f, id});
        }
    }

    return foundCollision;
}

bool CollisionSolver::_solveBoxPoint() {
    int bIdxA = world.liveFixtureIntData[_indexA * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX];
    int bIdxB = world.liveFixtureIntData[_indexB * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX];

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

    auto [pA, rotA] = getFixtureWorldPos(_indexA, bIdxA);
    auto [pB, rotB] = getFixtureWorldPos(_indexB, bIdxB); // B is the point
    
    float wA = world.liveFixtureFloatData[_indexA * FIXTURE_FDATA_EPO + FIXTURE_FDATA_W];
    float hA = world.liveFixtureFloatData[_indexA * FIXTURE_FDATA_EPO + FIXTURE_FDATA_H];

    // Transform Point to Box local space
    Vec2 relPos = pB - pA;
    float cosA = cos(-rotA), sinA = sin(-rotA);
    Vec2 localPos(relPos.x * cosA - relPos.y * sinA, relPos.x * sinA + relPos.y * cosA);

    float halfW = wA / 2.0f;
    float halfH = hA / 2.0f;

    float dt = world.getTimeStep();

    if (localPos.x >= -halfW - _speculativeMargin && localPos.x <= halfW + _speculativeMargin && 
        localPos.y >= -halfH - _speculativeMargin && localPos.y <= halfH + _speculativeMargin) {
        
        float d1 = localPos.x - (-halfW);
        float d2 = halfW - localPos.x;
        float d3 = localPos.y - (-halfH);
        float d4 = halfH - localPos.y;
        
        float minDist = min({d1, d2, d3, d4});
        float depth = minDist; // Can be negative if speculative

        Vec2 normalLocal;
        if (minDist == d1) normalLocal = Vec2(-1, 0);
        else if (minDist == d2) normalLocal = Vec2(1, 0);
        else if (minDist == d3) normalLocal = Vec2(0, -1);
        else normalLocal = Vec2(0, 1);
        
        // Transform normal back to world space
        float cosW = cos(rotA), sinW = sin(rotA);
        Vec2 normal(normalLocal.x * cosW - normalLocal.y * sinW, normalLocal.x * sinW + normalLocal.y * cosW);
        
        Vec2 vA(world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_VX], world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_VY]);
        Vec2 vB(world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_VX], world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_VY]);
        float wA_rot = world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_RS];
        
        Vec2 rA_vec = pB - pA;
        Vec2 totalVelocityA = vA + Vec2(-rA_vec.y * wA_rot, rA_vec.x * wA_rot);
        Vec2 relativeVel = vB - totalVelocityA;

        // Check for speculative contact
        float vn = relativeVel.dot(normal);
        if (depth <= 0.0f && vn >= depth / dt) {
            return false;
        }
        
        ContactID id;
        id.features.indexA = 0; // point
        id.features.indexB = (minDist == d1) ? 0 : (minDist == d2) ? 1 : (minDist == d3) ? 2 : 3;
        id.features.typeA = 0; // vertex
        id.features.typeB = 1; // face
        
        collisions.push_back(CollisionInfo{true, pB, normal, minDist, _indexA, _indexB, vB - totalVelocityA, 0.0f, id});
        return true;
    }
    return false;
}
bool CollisionSolver::_solveCircleBox() {
    int bIdxA = world.liveFixtureIntData[_indexA * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX];
    int bIdxB = world.liveFixtureIntData[_indexB * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX];

    float rA = world.liveFixtureFloatData[_indexA * FIXTURE_FDATA_EPO + FIXTURE_FDATA_RADIUS];
    
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

    auto [pA, rotA] = getFixtureWorldPos(_indexA, bIdxA);
    auto [pB, rotB] = getFixtureWorldPos(_indexB, bIdxB);
    
    float wB = world.liveFixtureFloatData[_indexB * FIXTURE_FDATA_EPO + FIXTURE_FDATA_W];
    float hB = world.liveFixtureFloatData[_indexB * FIXTURE_FDATA_EPO + FIXTURE_FDATA_H];

    // Transform Circle center to Box local space
    Vec2 relPos = pA - pB;
    float cosB = cos(-rotB), sinB = sin(-rotB);
    Vec2 localPos(relPos.x * cosB - relPos.y * sinB, relPos.x * sinB + relPos.y * cosB);

    float halfW = wB / 2.0f;
    float halfH = hB / 2.0f;

    float dt = world.getTimeStep();

    float closestX = max(-halfW, min(localPos.x, halfW));
    float closestY = max(-halfH, min(localPos.y, halfH));

    Vec2 closestPointLocal(closestX, closestY);
    Vec2 diffLocal = localPos - closestPointLocal;
    float distSq = diffLocal.magnitudeSquared();

    bool inside = false;
    float minDist = 0;
    float d1 = 0, d2 = 0, d3 = 0, d4 = 0;
    if (distSq == 0) {
        inside = true;
        d1 = localPos.x - (-halfW);
        d2 = halfW - localPos.x;
        d3 = localPos.y - (-halfH);
        d4 = halfH - localPos.y;
        
        minDist = min({d1, d2, d3, d4});
        if (minDist == d1) { closestPointLocal.x = -halfW; diffLocal = Vec2(-1, 0); }
        else if (minDist == d2) { closestPointLocal.x = halfW; diffLocal = Vec2(1, 0); }
        else if (minDist == d3) { closestPointLocal.y = -halfH; diffLocal = Vec2(0, -1); }
        else { closestPointLocal.y = halfH; diffLocal = Vec2(0, 1); }
        distSq = minDist * minDist;
    }

    if (distSq < (rA + _speculativeMargin) * (rA + _speculativeMargin) || inside) {
        float distance = sqrt(distSq);
        Vec2 normalLocal;
        float penetrationDepth;

        if (inside) {
            normalLocal = diffLocal;
            penetrationDepth = rA + distance;
        } else {
            normalLocal = (distance > 0.0001f) ? diffLocal / distance : Vec2(0.0f, -1.0f);
            penetrationDepth = rA - distance;
        }

        // Transform back to world space
        float cosW = cos(rotB), sinW = sin(rotB);
        Vec2 normal(normalLocal.x * cosW - normalLocal.y * sinW, normalLocal.x * sinW + normalLocal.y * cosW);

        // Check for speculative contact
        // Normal points from box to circle center.
        // We need normal from fixture A (circle) to B (box) for _relativeVelocity.dot(normal).
        // Wait, solve() calculates _relativeVelocity as vB - vA.
        // So vn = (vB - vA) . normal_A_to_B.
        // Here normalLocal points from Box center towards Circle center.
        // So normal points from Box to Circle center (A).
        // So -normal points from Circle (A) to Box (B).
        float vn = _relativeVelocity.dot(normal * -1.0f);
        if (penetrationDepth <= 0.0f && vn >= penetrationDepth / dt) {
            return false;
        }

        Vec2 contactPoint(closestPointLocal.x * cosW - closestPointLocal.y * sinW + pB.x, 
                          closestPointLocal.x * sinW + closestPointLocal.y * cosW + pB.y);

        Vec2 vA(world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_VX], world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_VY]);
        Vec2 vB(world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_VX], world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_VY]);
        float wA = world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_RS];
        float wB = world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_RS];
        
        Vec2 rA_vec = contactPoint - pA, rB_vec = contactPoint - pB;
        Vec2 totalVelocityA = vA + Vec2(-rA_vec.y * wA, rA_vec.x * wA);
        Vec2 totalVelocityB = vB + Vec2(-rB_vec.y * wB, rB_vec.x * wB);
        
        ContactID id;
        id.features.indexA = 0; // circle
        id.features.indexB = inside ? 
            ((minDist == d1) ? 0 : (minDist == d2) ? 1 : (minDist == d3) ? 2 : 3) : 
            0; // simplistic for now: inside gets face id, outside gets closest vertex id
        id.features.typeA = 0; // vertex
        id.features.typeB = inside ? 1 : 0; // face if inside, vertex if outside
        
        collisions.push_back(CollisionInfo{true, contactPoint, normal * -1.0f, penetrationDepth, _indexA, _indexB, totalVelocityB - totalVelocityA, 0.0f, id});
        return true;
    }

    return false;
}
