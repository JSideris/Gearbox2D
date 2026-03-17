#include "collision-solver.h"
#include "world.h"
#include "constants.h"
#include <cmath>
#include <algorithm>
#include <cfloat>

using namespace std;

struct Polygon {
    vector<Vec2> vertices;
    vector<Vec2> normals;
    int fixtureIndex;
};

static Polygon getPolygon(const World& world, int fIdx) {
    int bIdx = world.liveFixtureIntData[fIdx * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX];
    float bx = world.liveBodyFloatData[bIdx * BODY_FDATA_EPO + BODY_FDATA_X];
    float by = world.liveBodyFloatData[bIdx * BODY_FDATA_EPO + BODY_FDATA_Y];
    float br = world.liveBodyFloatData[bIdx * BODY_FDATA_EPO + BODY_FDATA_R];
    float lx = world.liveFixtureFloatData[fIdx * FIXTURE_FDATA_EPO + FIXTURE_FDATA_LOCAL_X];
    float ly = world.liveFixtureFloatData[fIdx * FIXTURE_FDATA_EPO + FIXTURE_FDATA_LOCAL_Y];
    float lr = world.liveFixtureFloatData[fIdx * FIXTURE_FDATA_EPO + FIXTURE_FDATA_LOCAL_R];
    
    float cosR = cos(br), sinR = sin(br);
    Vec2 fixturePos(bx + (lx * cosR - ly * sinR), by + (lx * sinR + ly * cosR));
    float fixtureRot = br + lr;
    float cosF = cos(fixtureRot), sinF = sin(fixtureRot);

    Polygon poly;
    poly.fixtureIndex = fIdx;
    int shape = world.liveFixtureIntData[fIdx * FIXTURE_IDATA_EPO + FIXTURE_IDATA_SHAPE];

    if (shape == (int)ObjectShape::POLYGON) {
        int vCount = (int)world.liveFixtureFloatData[fIdx * FIXTURE_FDATA_EPO + FIXTURE_FDATA_VERTEX_COUNT];
        int startIdx = fIdx * FIXTURE_FDATA_EPO + FIXTURE_FDATA_VERTEX_START;
        for (int i = 0; i < vCount; ++i) {
            float vx = world.liveFixtureFloatData[startIdx + i * 2];
            float vy = world.liveFixtureFloatData[startIdx + i * 2 + 1];
            poly.vertices.push_back(Vec2(fixturePos.x + (vx * cosF - vy * sinF), fixturePos.y + (vx * sinF + vy * cosF)));
        }
    } else if (shape == (int)ObjectShape::BOX || shape == (int)ObjectShape::AABB) {
        float w = world.liveFixtureFloatData[fIdx * FIXTURE_FDATA_EPO + FIXTURE_FDATA_W];
        float h = world.liveFixtureFloatData[fIdx * FIXTURE_FDATA_EPO + FIXTURE_FDATA_H];
        float hw = w / 2.0f;
        float hh = h / 2.0f;
        float realCos = (shape == (int)ObjectShape::AABB) ? 1.0f : cosF;
        float realSin = (shape == (int)ObjectShape::AABB) ? 0.0f : sinF;

        poly.vertices.push_back(Vec2(fixturePos.x + (-hw * realCos - -hh * realSin), fixturePos.y + (-hw * realSin + -hh * realCos)));
        poly.vertices.push_back(Vec2(fixturePos.x + ( hw * realCos - -hh * realSin), fixturePos.y + ( hw * realSin + -hh * realCos)));
        poly.vertices.push_back(Vec2(fixturePos.x + ( hw * realCos -  hh * realSin), fixturePos.y + ( hw * realSin +  hh * realCos)));
        poly.vertices.push_back(Vec2(fixturePos.x + (-hw * realCos -  hh * realSin), fixturePos.y + (-hw * realSin +  hh * realCos)));
    } else if (shape == (int)ObjectShape::CAPSULE) {
        float r = world.liveFixtureFloatData[fIdx * FIXTURE_FDATA_EPO + FIXTURE_FDATA_RADIUS];
        float h = world.liveFixtureFloatData[fIdx * FIXTURE_FDATA_EPO + FIXTURE_FDATA_H];
        float hw = r;
        float hh = h / 2.0f;
        // Approximate capsule as a box for SAT
        poly.vertices.push_back(Vec2(fixturePos.x + (-hw * cosF - -hh * sinF), fixturePos.y + (-hw * sinF + -hh * cosF)));
        poly.vertices.push_back(Vec2(fixturePos.x + ( hw * cosF - -hh * sinF), fixturePos.y + ( hw * sinF + -hh * cosF)));
        poly.vertices.push_back(Vec2(fixturePos.x + ( hw * cosF -  hh * sinF), fixturePos.y + ( hw * sinF +  hh * cosF)));
        poly.vertices.push_back(Vec2(fixturePos.x + (-hw * cosF -  hh * sinF), fixturePos.y + (-hw * sinF +  hh * cosF)));
    }

    for (size_t i = 0; i < poly.vertices.size(); ++i) {
        Vec2 p1 = poly.vertices[i];
        Vec2 p2 = poly.vertices[(i + 1) % poly.vertices.size()];
        Vec2 edge = p2 - p1;
        Vec2 n(edge.y, -edge.x);
        poly.normals.push_back(n.normalize());
    }

    return poly;
}

static float findAxisOfMinimumPenetration(const Polygon& polyA, const Polygon& polyB, int& bestIndex) {
    float maxSeparation = -FLT_MAX;
    bestIndex = -1;

    for (size_t i = 0; i < polyA.normals.size(); ++i) {
        Vec2 n = polyA.normals[i];
        
        // Find extreme point on B in direction -n
        float minDot = FLT_MAX;
        for (const auto& v : polyB.vertices) {
            float d = (v - polyA.vertices[i]).dot(n);
            if (d < minDot) minDot = d;
        }

        if (minDot > maxSeparation) {
            maxSeparation = minDot;
            bestIndex = (int)i;
        }
    }
    return maxSeparation;
}

bool CollisionSolver::_solvePolygonPolygon() {
    Polygon polyA = getPolygon(world, _indexA);
    Polygon polyB = getPolygon(world, _indexB);

    int bestAxisA, bestAxisB;
    float sepA = findAxisOfMinimumPenetration(polyA, polyB, bestAxisA);
    if (sepA > _speculativeMargin) return false;

    float sepB = findAxisOfMinimumPenetration(polyB, polyA, bestAxisB);
    if (sepB > _speculativeMargin) return false;

    bool aIsReference = (sepA >= sepB);
    const Polygon& refPoly = aIsReference ? polyA : polyB;
    const Polygon& incPoly = aIsReference ? polyB : polyA;
    int refAxis = aIsReference ? bestAxisA : bestAxisB;

    // Normal should point from A to B. 
    // Outward normal of reference face.
    Vec2 refNormal = refPoly.normals[refAxis];
    Vec2 normal = aIsReference ? refNormal : refNormal * -1.0f;

    // Find incident face (most anti-parallel to refNormal)
    int incAxis = -1;
    float minDot = FLT_MAX;
    for (size_t i = 0; i < incPoly.normals.size(); ++i) {
        float d = incPoly.normals[i].dot(refNormal);
        if (d < minDot) {
            minDot = d;
            incAxis = (int)i;
        }
    }

    Vec2 incVertices[2] = { incPoly.vertices[incAxis], incPoly.vertices[(incAxis + 1) % incPoly.vertices.size()] };

    // Reference face planes
    Vec2 v1 = refPoly.vertices[refAxis];
    Vec2 v2 = refPoly.vertices[(refAxis + 1) % refPoly.vertices.size()];
    Vec2 sideNormal = (v2 - v1).normalize();
    float refOffset = refNormal.dot(v1);
    float sideOffset1 = sideNormal.dot(v1);
    float sideOffset2 = -sideNormal.dot(v2);

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
    int count = clip(incVertices, sideNormal * -1.0f, -sideOffset1, tempVertices);
    if (count < 2) return false;
    count = clip(tempVertices, sideNormal, -sideOffset2, clippedVertices);
    if (count < 2) return false;

    bool found = false;
    for (int i = 0; i < count; ++i) {
        float d = refNormal.dot(clippedVertices[i]) - refOffset;
        if (d <= _speculativeMargin) {
            found = true;
            float penetration = -d;
            
            // Get velocities for relative velocity calculation
            int bAIdx = world.liveFixtureIntData[_indexA * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX];
            int bBIdx = world.liveFixtureIntData[_indexB * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX];
            Vec2 pA(world.liveBodyFloatData[bAIdx * BODY_FDATA_EPO + BODY_FDATA_X], world.liveBodyFloatData[bAIdx * BODY_FDATA_EPO + BODY_FDATA_Y]);
            Vec2 pB(world.liveBodyFloatData[bBIdx * BODY_FDATA_EPO + BODY_FDATA_X], world.liveBodyFloatData[bBIdx * BODY_FDATA_EPO + BODY_FDATA_Y]);
            Vec2 vA(world.liveBodyFloatData[bAIdx * BODY_FDATA_EPO + BODY_FDATA_VX], world.liveBodyFloatData[bAIdx * BODY_FDATA_EPO + BODY_FDATA_VY]);
            Vec2 vB(world.liveBodyFloatData[bBIdx * BODY_FDATA_EPO + BODY_FDATA_VX], world.liveBodyFloatData[bBIdx * BODY_FDATA_EPO + BODY_FDATA_VY]);
            float wA = world.liveBodyFloatData[bAIdx * BODY_FDATA_EPO + BODY_FDATA_RS];
            float wB = world.liveBodyFloatData[bBIdx * BODY_FDATA_EPO + BODY_FDATA_RS];

            Vec2 rA = clippedVertices[i] - pA, rB = clippedVertices[i] - pB;
            Vec2 vRel = (vB + Vec2(-rB.y * wB, rB.x * wB)) - (vA + Vec2(-rA.y * wA, rA.x * wA));

            if (penetration <= 0.0f && vRel.dot(normal) >= penetration / _dt) continue;

            ContactID id;
            id.features.indexA = (uint8_t)(aIsReference ? refAxis : incAxis);
            id.features.indexB = (uint8_t)(aIsReference ? incAxis : refAxis);
            id.features.typeA = (uint8_t)(aIsReference ? 1 : 0); // face vs vertex/clipped
            id.features.typeB = (uint8_t)(aIsReference ? 0 : 1);
            // Use the clipping index to make the ID unique for the two points
            if (aIsReference) id.features.indexB += i * 32; 
            else id.features.indexA += i * 32;
            
            collisions.push_back({true, clippedVertices[i], normal, penetration, _indexA, _indexB, vRel, 0.0f, id});
        }
    }

    return found;
}

bool CollisionSolver::_solvePolygonPoint() {
    Polygon polyA = getPolygon(world, _indexA);
    int bIdxB = world.liveFixtureIntData[_indexB * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX];
    float bxB = world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_X];
    float byB = world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_Y];
    float brB = world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_R];
    float lxB = world.liveFixtureFloatData[_indexB * FIXTURE_FDATA_EPO + FIXTURE_FDATA_LOCAL_X];
    float lyB = world.liveFixtureFloatData[_indexB * FIXTURE_FDATA_EPO + FIXTURE_FDATA_LOCAL_Y];
    
    float cosRB = cos(brB), sinRB = sin(brB);
    Vec2 pB(bxB + (lxB * cosRB - lyB * sinRB), byB + (lxB * sinRB + lyB * cosRB));

    float minDepth = FLT_MAX;
    Vec2 bestNormal;
    int bestFace = -1;

    for (size_t i = 0; i < polyA.vertices.size(); ++i) {
        Vec2 n = polyA.normals[i];
        float d = (pB - polyA.vertices[i]).dot(n);
        if (d > _speculativeMargin) return false;
        if (d < minDepth) {
            minDepth = d;
            bestNormal = n;
            bestFace = (int)i;
        }
    }

    float penetration = -minDepth;
    int bIdxA = world.liveFixtureIntData[_indexA * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX];
    Vec2 pA(world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_X], world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_Y]);
    Vec2 vA(world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_VX], world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_VY]);
    Vec2 vB(world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_VX], world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_VY]);
    float wA = world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_RS];
    
    Vec2 rA = pB - pA;
    Vec2 vRel = vB - (vA + Vec2(-rA.y * wA, rA.x * wA));
    if (penetration <= 0.0f && vRel.dot(bestNormal) >= penetration / _dt) return false;

    ContactID id;
    id.features.indexA = (uint8_t)bestFace;
    id.features.indexB = 0;
    id.features.typeA = 1; // face
    id.features.typeB = 0; // vertex
    
    collisions.push_back({true, pB, bestNormal, penetration, _indexA, _indexB, vRel, 0.0f, id});
    return true;
}

bool CollisionSolver::_solvePolygonCircle() {
    Polygon polyA = getPolygon(world, _indexA);
    int bIdxB = world.liveFixtureIntData[_indexB * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX];
    float bxB = world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_X];
    float byB = world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_Y];
    float brB = world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_R];
    float lxB = world.liveFixtureFloatData[_indexB * FIXTURE_FDATA_EPO + FIXTURE_FDATA_LOCAL_X];
    float lyB = world.liveFixtureFloatData[_indexB * FIXTURE_FDATA_EPO + FIXTURE_FDATA_LOCAL_Y];
    
    float cosRB = cos(brB), sinRB = sin(brB);
    Vec2 pB(bxB + (lxB * cosRB - lyB * sinRB), byB + (lxB * sinRB + lyB * cosRB));
    float rB = world.liveFixtureFloatData[_indexB * FIXTURE_FDATA_EPO + FIXTURE_FDATA_RADIUS];

    float maxSeparation = -FLT_MAX;
    int bestFace = -1;

    for (size_t i = 0; i < polyA.vertices.size(); ++i) {
        float sep = (pB - polyA.vertices[i]).dot(polyA.normals[i]);
        if (sep > rB + _speculativeMargin) return false;
        if (sep > maxSeparation) {
            maxSeparation = sep;
            bestFace = (int)i;
        }
    }

    if (maxSeparation < 0) {
        // Circle center is inside polygon
        Vec2 normal = polyA.normals[bestFace];
        float penetration = rB - maxSeparation;
        Vec2 contactPoint = pB - normal * rB;
        
        int bIdxA = world.liveFixtureIntData[_indexA * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX];
        Vec2 pA(world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_X], world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_Y]);
        Vec2 vA(world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_VX], world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_VY]);
        Vec2 vB(world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_VX], world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_VY]);
        float wA = world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_RS];
        float wB = world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_RS];
        
        Vec2 rA_vec = contactPoint - pA, rB_vec = contactPoint - pB;
        Vec2 vRel = (vB + Vec2(-rB_vec.y * wB, rB_vec.x * wB)) - (vA + Vec2(-rA_vec.y * wA, rA_vec.x * wA));

        ContactID id;
        id.features.indexA = (uint8_t)bestFace;
        id.features.indexB = 0;
        id.features.typeA = 1; // face
        id.features.typeB = 0; // vertex
        collisions.push_back({true, contactPoint, normal, penetration, _indexA, _indexB, vRel, 0.0f, id});
        return true;
    }

    // Circle center is outside. Check vertices.
    Vec2 v1 = polyA.vertices[bestFace];
    Vec2 v2 = polyA.vertices[(bestFace + 1) % polyA.vertices.size()];
    
    float dot1 = (pB - v1).dot(v2 - v1);
    float dot2 = (pB - v2).dot(v1 - v2);

    if (dot1 <= 0) {
        float distSq = (pB - v1).magnitudeSquared();
        if (distSq > (rB + _speculativeMargin) * (rB + _speculativeMargin)) return false;
        float dist = sqrt(distSq);
        Vec2 normal = (dist > 0.0001f) ? (pB - v1) / dist : polyA.normals[bestFace];
        float penetration = rB - dist;
        Vec2 contactPoint = v1;
        
        int bIdxA = world.liveFixtureIntData[_indexA * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX];
        Vec2 pA(world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_X], world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_Y]);
        Vec2 vA(world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_VX], world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_VY]);
        Vec2 vB(world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_VX], world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_VY]);
        float wA = world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_RS];
        float wB = world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_RS];
        
        Vec2 rA_vec = contactPoint - pA, rB_vec = contactPoint - pB;
        Vec2 vRel = (vB + Vec2(-rB_vec.y * wB, rB_vec.x * wB)) - (vA + Vec2(-rA_vec.y * wA, rA_vec.x * wA));
        
        ContactID id;
        id.features.indexA = (uint8_t)bestFace;
        id.features.indexB = 0;
        id.features.typeA = 0; // vertex
        id.features.typeB = 0; // vertex
        collisions.push_back({true, contactPoint, normal, penetration, _indexA, _indexB, vRel, 0.0f, id});
        return true;
    } else if (dot2 <= 0) {
        float distSq = (pB - v2).magnitudeSquared();
        if (distSq > (rB + _speculativeMargin) * (rB + _speculativeMargin)) return false;
        float dist = sqrt(distSq);
        Vec2 normal = (dist > 0.0001f) ? (pB - v2) / dist : polyA.normals[bestFace];
        float penetration = rB - dist;
        Vec2 contactPoint = v2;
        
        int bIdxA = world.liveFixtureIntData[_indexA * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX];
        Vec2 pA(world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_X], world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_Y]);
        Vec2 vA(world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_VX], world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_VY]);
        Vec2 vB(world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_VX], world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_VY]);
        float wA = world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_RS];
        float wB = world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_RS];
        
        Vec2 rA_vec = contactPoint - pA, rB_vec = contactPoint - pB;
        Vec2 vRel = (vB + Vec2(-rB_vec.y * wB, rB_vec.x * wB)) - (vA + Vec2(-rA_vec.y * wA, rA_vec.x * wA));
        
        ContactID id;
        id.features.indexA = (uint8_t)((bestFace + 1) % polyA.vertices.size());
        id.features.indexB = 0;
        id.features.typeA = 0; // vertex
        id.features.typeB = 0; // vertex
        collisions.push_back({true, contactPoint, normal, penetration, _indexA, _indexB, vRel, 0.0f, id});
        return true;
    } else {
        float penetration = rB - maxSeparation;
        Vec2 normal = polyA.normals[bestFace];
        Vec2 contactPoint = pB - normal * rB;
        
        int bIdxA = world.liveFixtureIntData[_indexA * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX];
        Vec2 pA(world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_X], world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_Y]);
        Vec2 vA(world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_VX], world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_VY]);
        Vec2 vB(world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_VX], world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_VY]);
        float wA = world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_RS];
        float wB = world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_RS];
        
        Vec2 rA_vec = contactPoint - pA, rB_vec = contactPoint - pB;
        Vec2 vRel = (vB + Vec2(-rB_vec.y * wB, rB_vec.x * wB)) - (vA + Vec2(-rA_vec.y * wA, rA_vec.x * wA));
        
        ContactID id;
        id.features.indexA = (uint8_t)bestFace;
        id.features.indexB = 0;
        id.features.typeA = 1; // face
        id.features.typeB = 0; // vertex
        collisions.push_back({true, contactPoint, normal, penetration, _indexA, _indexB, vRel, 0.0f, id});
        return true;
    }
}

bool CollisionSolver::_solvePolygonBox() {
    return _solvePolygonPolygon();
}

bool CollisionSolver::_solvePolygonAabb() {
    return _solvePolygonPolygon();
}

bool CollisionSolver::_solvePolygonCapsule() {
    // Treat capsule as a segment with radius
    Polygon polyA = getPolygon(world, _indexA);
    int bIdxB = world.liveFixtureIntData[_indexB * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX];
    float bxB = world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_X];
    float byB = world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_Y];
    float brB = world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_R];
    float lxB = world.liveFixtureFloatData[_indexB * FIXTURE_FDATA_EPO + FIXTURE_FDATA_LOCAL_X];
    float lyB = world.liveFixtureFloatData[_indexB * FIXTURE_FDATA_EPO + FIXTURE_FDATA_LOCAL_Y];
    float lrB = world.liveFixtureFloatData[_indexB * FIXTURE_FDATA_EPO + FIXTURE_FDATA_LOCAL_R];
    
    float cosRB = cos(brB), sinRB = sin(brB);
    Vec2 fixturePosB(bxB + (lxB * cosRB - lyB * sinRB), byB + (lxB * sinRB + lyB * cosRB));
    float fixtureRotB = brB + lrB;
    float cosFB = cos(fixtureRotB), sinFB = sin(fixtureRotB);
    
    float rB = world.liveFixtureFloatData[_indexB * FIXTURE_FDATA_EPO + FIXTURE_FDATA_RADIUS];
    float hB = world.liveFixtureFloatData[_indexB * FIXTURE_FDATA_EPO + FIXTURE_FDATA_H];
    float halfLB = std::max(0.0f, hB * 0.5f - rB);
    
    Vec2 p1B(fixturePosB.x - (-halfLB) * sinFB, fixturePosB.y + (-halfLB) * cosFB);
    Vec2 p2B(fixturePosB.x - (halfLB) * sinFB, fixturePosB.y + (halfLB) * cosFB);

    // Simplistic approach: check segment against polygon
    // For now, let's just treat capsule as 2 circles at p1B, p2B
    // This is not perfect for long capsules but better than nothing.
    // A better way would be to treat capsule as a polygon (box) + 2 circles.
    
    // Swap and use polygon-circle for each end
    int savedA = _indexA;
    int savedB = _indexB;
    
    // This is a bit hacky because we don't have a direct segment solver.
    // Let's just use the SAT approach by treating capsule as a box.
    return _solvePolygonPolygon();
}
