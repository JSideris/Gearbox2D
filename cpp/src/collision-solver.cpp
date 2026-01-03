
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

// Helper function to find closest points between two line segments
float CollisionSolver::closestPointsBetweenLines(
    const Vec2& p1, const Vec2& p2,
    const Vec2& p3, const Vec2& p4,
    Vec2& pointOnLine1, Vec2& pointOnLine2) {
    
    Vec2 d1 = p2 - p1; // Direction vector of line 1
    Vec2 d2 = p4 - p3; // Direction vector of line 2
    Vec2 r = p1 - p3;
    
    float a = d1.dot(d1); // Square of length of d1
    float e = d2.dot(d2); // Square of length of d2
    float f = d2.dot(r);
    
    // Check if either or both segments degenerate into points
    if (a <= 1e-6f && e <= 1e-6f) {
        // Both segments degenerate into points
        pointOnLine1 = p1;
        pointOnLine2 = p3;
        return (p1 - p3).magnitudeSquared();
    }
    
    float t, s;
    
    if (a <= 1e-6f) {
        // First segment degenerates into a point
        s = 0.0f;
        t = f / e;
        t = std::min(std::max(t, 0.0f), 1.0f);
    }
    else {
        float c = d1.dot(r);
        if (e <= 1e-6f) {
            // Second segment degenerates into a point
            t = 0.0f;
            s = std::min(std::max(-c / a, 0.0f), 1.0f);
        }
        else {
            // General case
            float b = d1.dot(d2);
            float denom = a * e - b * b;
            
            // If segments not parallel, compute closest point on line1 to line2
            // and clamp to segment
            if (denom != 0.0f) {
                s = std::min(std::max((b * f - c * e) / denom, 0.0f), 1.0f);
            }
            else {
                s = 0.0f;
            }
            
            // Compute point on line2 closest to segment1(s)
            t = (b * s + f) / e;
            
            // Clamp
            if (t < 0.0f) {
                t = 0.0f;
                s = std::min(std::max(-c / a, 0.0f), 1.0f);
            }
            else if (t > 1.0f) {
                t = 1.0f;
                s = std::min(std::max((b - c) / a, 0.0f), 1.0f);
            }
        }
    }
    
    pointOnLine1 = p1 + d1 * s;
    pointOnLine2 = p3 + d2 * t;
    
    return (pointOnLine1 - pointOnLine2).magnitudeSquared();
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
                    // _swap();
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


bool CollisionSolver::_solveAabbAabb() {
    // Get AABB A data
    float xA = floatData[_indexA * FDATA_EPO + FDATA_X];
    float yA = floatData[_indexA * FDATA_EPO + FDATA_Y];
    float wA = floatData[_indexA * FDATA_EPO + FDATA_W];
    float hA = floatData[_indexA * FDATA_EPO + FDATA_H];

    // Get AABB B data
    float xB = floatData[_indexB * FDATA_EPO + FDATA_X];
    float yB = floatData[_indexB * FDATA_EPO + FDATA_Y];
    float wB = floatData[_indexB * FDATA_EPO + FDATA_W];
    float hB = floatData[_indexB * FDATA_EPO + FDATA_H];

    // Compute the min/max for AABB A
    float minXA = xA - wA / 2;
    float maxXA = xA + wA / 2;
    float minYA = yA - hA / 2;
    float maxYA = yA + hA / 2;

    // Compute the min/max for AABB B
    float minXB = xB - wB / 2;
    float maxXB = xB + wB / 2;
    float minYB = yB - hB / 2;
    float maxYB = yB + hB / 2;

    // Check for overlap on the X axis
    if (maxXA < minXB || maxXB < minXA) {
        return false; // No collision on the X axis
    }

    // Check for overlap on the Y axis
    if (maxYA < minYB || maxYB < minYA) {
        return false; // No collision on the Y axis
    }

    // We have overlap in both X and Y, so a collision is happening

    // Calculate the overlap depth on the X axis
    float overlapX = min(maxXA, maxXB) - max(minXA, minXB);

    // Calculate the overlap depth on the Y axis
    float overlapY = min(maxYA, maxYB) - max(minYA, minYB);

    // Determine the collision normal based on the smallest overlap
    Vec2 normal;
    float penetrationDepth;
    
    if (overlapX < overlapY) {
        // Collision is primarily on the X axis
        penetrationDepth = overlapX;
        Vec2 normalDirection = Vec2(xB - xA, 0.0f);
        normal = (normalDirection.dot(Vec2(1.0f, 0.0f)) > 0.0f) ? Vec2(1.0f, 0.0f) : Vec2(-1.0f, 0.0f);
    } else {
        // Collision is primarily on the Y axis
        penetrationDepth = overlapY;
        Vec2 normalDirection = Vec2(0.0f, yB - yA);
        normal = (normalDirection.dot(Vec2(0.0f, 1.0f)) > 0.0f) ? Vec2(0.0f, 1.0f) : Vec2(0.0f, -1.0f);
    }

    // Calculate the contact point (optional, approximate it to the center of overlap)
    float contactX = (max(minXA, minXB) + min(maxXA, maxXB)) / 2;
    float contactY = (max(minYA, minYB) + min(maxYA, maxYB)) / 2;

    // Store the collision info
    collisions.push_back(CollisionInfo{
        true,                        // Collision detected
        Vec2(contactX, contactY),     // Contact point
        normal,                      // Collision normal
        penetrationDepth,            // Penetration depth
        _indexA,                     // Object A index
        _indexB,                     // Object B index
        _relativeVelocity,           // Relative velocity (already computed)
        0.0f                         // Friction placeholder (can be computed later)
    });

    return true;
}

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
    
    // Check for collision
    if (distanceSquared < rC * rC) {
        float distance = sqrt(distanceSquared);
        Vec2 normal;
        Vec2 contactPoint;
        float penetrationDepth;
        
        // Circle center is inside AABB or very close to surface
        bool isCircleInside = (xC >= minX && xC <= maxX && yC >= minY && yC <= maxY);
        
        if (distance < 0.001f || isCircleInside) {
            // Find distances to each face
            float dLeft = xC - minX;
            float dRight = maxX - xC;
            float dTop = yC - minY;
            float dBottom = maxY - yC;
            
            // Default to left face
            float minDist = dLeft;
            normal = Vec2(-1.0f, 0.0f);
            contactPoint = Vec2(minX, yC);
            
            if (dRight < minDist) {
                minDist = dRight;
                normal = Vec2(1.0f, 0.0f);
                contactPoint = Vec2(maxX, yC);
            }
            
            if (dTop < minDist) {
                minDist = dTop;
                normal = Vec2(0.0f, -1.0f);
                contactPoint = Vec2(xC, minY);
            }
            
            if (dBottom < minDist) {
                minDist = dBottom;
                normal = Vec2(0.0f, 1.0f);
                contactPoint = Vec2(xC, maxY);
            }
            
            // Penetration depth calculation: distance needed to push the circle COMPLETELY out
            penetrationDepth = rC + minDist;
        } else {
            // Normal case - circle is outside AABB but penetrating
            normal = distanceVec.normalize() * -1.0f;
            penetrationDepth = rC - distance;
            contactPoint = Vec2(closestX, closestY);
        }
        
        // Compute relative velocity including rotational effects at contact point
        Vec2 vA(floatData[_indexA * FDATA_EPO + FDATA_VX], 
                floatData[_indexA * FDATA_EPO + FDATA_VY]);
        Vec2 vB(floatData[_indexB * FDATA_EPO + FDATA_VX], 
                floatData[_indexB * FDATA_EPO + FDATA_VY]);
                
        // Get rotational speeds (in radians per second)
        float wA = floatData[_indexA * FDATA_EPO + FDATA_RS];
        float wB = floatData[_indexB * FDATA_EPO + FDATA_RS];
        
        // Calculate radius vectors (from center to contact point)
        Vec2 rA = contactPoint - Vec2(xA, yA);
        Vec2 rB = contactPoint - Vec2(xC, yC);
        
        // Calculate tangential velocities due to rotation
        Vec2 tangentialVelocityA(
            -rA.y * wA,  // Cross product in 2D
            rA.x * wA
        );
        
        Vec2 tangentialVelocityB(
            -rB.y * wB,  // Cross product in 2D
            rB.x * wB
        );
        
        // Total velocities at contact point
        Vec2 totalVelocityA = vA + tangentialVelocityA;
        Vec2 totalVelocityB = vB + tangentialVelocityB;
        
        // Store the actual relative velocity at the contact point
        Vec2 relativeVelocity = totalVelocityB - totalVelocityA;
        
        collisions.push_back(CollisionInfo{
            true,                // Collision detected
            contactPoint,        // Contact point
            normal,              // Collision normal
            penetrationDepth,    // Penetration depth
            _indexA,             // Object A index
            _indexB,             // Object B index
            relativeVelocity,    // Correct relative velocity including rotational effects
            0.0f                 // Friction coefficient (can be set based on material properties)
        });
        
        return true;
    }
    
    return false;
}

bool CollisionSolver::_solveAabbPoint() {
    // Extract point data
    float xP = floatData[_indexB * FDATA_EPO + FDATA_X];
    float yP = floatData[_indexB * FDATA_EPO + FDATA_Y];
    
    // Extract AABB data
    float xA = floatData[_indexA * FDATA_EPO + FDATA_X];
    float yA = floatData[_indexA * FDATA_EPO + FDATA_Y];
    float wA = floatData[_indexA * FDATA_EPO + FDATA_W];
    float hA = floatData[_indexA * FDATA_EPO + FDATA_H];
    
    // Calculate AABB boundaries
    float minX = xA - wA/2;
    float maxX = xA + wA/2;
    float minY = yA - hA/2;
    float maxY = yA + hA/2;
    
    // Simple check: is point inside AABB?
    if (xP >= minX && xP <= maxX && yP >= minY && yP <= maxY) {
        
        // Find distances to each edge
        float dLeft = xP - minX;
        float dRight = maxX - xP;
        float dTop = yP - minY;
        float dBottom = maxY - yP;
        
        // Find which edge is closest
        float minDist = dLeft;
        Vec2 normal(-1.0f, 0.0f); // Push left
        
        if (dRight < minDist) {
            minDist = dRight;
            normal = Vec2(1.0f, 0.0f); // Push right
        }
        
        if (dTop < minDist) {
            minDist = dTop;
            normal = Vec2(0.0f, -1.0f); // Push up
        }
        
        if (dBottom < minDist) {
            minDist = dBottom;
            normal = Vec2(0.0f, 1.0f); // Push down
        }
        
        // Contact point is the point itself
        Vec2 contactPoint(xP, yP);
        
        // Penetration depth is distance to closest edge
        float penetrationDepth = minDist;
        
        // Compute relative velocity including rotational effects at contact point
        Vec2 vA(floatData[_indexA * FDATA_EPO + FDATA_VX], 
                floatData[_indexA * FDATA_EPO + FDATA_VY]);
        Vec2 vB(floatData[_indexB * FDATA_EPO + FDATA_VX], 
                floatData[_indexB * FDATA_EPO + FDATA_VY]);
                
        // Get rotational speeds
        float wA = floatData[_indexA * FDATA_EPO + FDATA_RS];
        float wB = floatData[_indexB * FDATA_EPO + FDATA_RS];
        
        // Calculate radius vectors (from center to contact point)
        Vec2 rA = contactPoint - Vec2(xA, yA);
        Vec2 rB = contactPoint - Vec2(xP, yP); // This is (0,0) for a point
        
        // Calculate tangential velocities due to rotation
        Vec2 tangentialVelocityA(-rA.y * wA, rA.x * wA);
        Vec2 tangentialVelocityB(-rB.y * wB, rB.x * wB); // This is (0,0) for a point
        
        // Total velocities at contact point
        Vec2 totalVelocityA = vA + tangentialVelocityA;
        Vec2 totalVelocityB = vB + tangentialVelocityB; // Just vB for a point
        
        // Relative velocity at contact point
        Vec2 relativeVelocity = totalVelocityB - totalVelocityA;
        
        collisions.push_back(CollisionInfo{
            true,                // Collision detected
            contactPoint,        // Contact point
            normal,              // Collision normal
            penetrationDepth,    // Penetration depth
            _indexA,             // Object A index
            _indexB,             // Object B index
            relativeVelocity,    // Relative velocity
            0.0f                 // Friction coefficient
        });
        
        return true;
    }
    
    return false;
}

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

    if((rA + rB)*(rA + rB) > pd2){
        float distance = sqrt(pd2);
        Vec2 normal;
        
        if (distance > 0.0001f) {
            normal = pDiff / distance;
        } else {
            // Centers are identical, use a default normal (pointing up)
            normal = Vec2(0.0f, -1.0f);
        }

        auto penetrationDepth = rA + rB - distance;
        
        // Midpoint of the overlap region for more stable stacking
        auto contactPoint = pA + normal * (rA - penetrationDepth * 0.5f);

        // Compute relative velocity including rotational effects at contact point
        Vec2 vA(floatData[_indexA * FDATA_EPO + FDATA_VX], 
                floatData[_indexA * FDATA_EPO + FDATA_VY]);
        Vec2 vB(floatData[_indexB * FDATA_EPO + FDATA_VX], 
                floatData[_indexB * FDATA_EPO + FDATA_VY]);
                
        // Get rotational speeds
        float wA = floatData[_indexA * FDATA_EPO + FDATA_RS];
        float wB = floatData[_indexB * FDATA_EPO + FDATA_RS];
        
        // Calculate radius vectors (from center to contact point)
        Vec2 rA_vec = contactPoint - pA;
        Vec2 rB_vec = contactPoint - pB;
        
        // Calculate tangential velocities due to rotation
        Vec2 tangentialVelocityA(-rA_vec.y * wA, rA_vec.x * wA);
        Vec2 tangentialVelocityB(-rB_vec.y * wB, rB_vec.x * wB);
        
        // Total velocities at contact point
        Vec2 totalVelocityA = vA + tangentialVelocityA;
        Vec2 totalVelocityB = vB + tangentialVelocityB;
        
        // Store the actual relative velocity at the contact point
        Vec2 relativeVelocity = totalVelocityB - totalVelocityA;

        collisions.push_back(CollisionInfo{
            true,               // Collision detected
            contactPoint,       // Contact point
            normal,             // Collision normal
            penetrationDepth,   // Penetration depth
            _indexA,            // Object A index
            _indexB,            // Object B index
            relativeVelocity,   // Relative velocity including rotational effects
            0.0f                // Friction coefficient
        });

        return true;
    }

    return false;
}



bool CollisionSolver::_solveBoxBox() {
    // Get Box A data
    float xA = floatData[_indexA * FDATA_EPO + FDATA_X];
    float yA = floatData[_indexA * FDATA_EPO + FDATA_Y];
    float wA = floatData[_indexA * FDATA_EPO + FDATA_W];
    float hA = floatData[_indexA * FDATA_EPO + FDATA_H];
    float rotationA = floatData[_indexA * FDATA_EPO + FDATA_R];
    float angVelA = floatData[_indexA * FDATA_EPO + FDATA_RS]; // Angular velocity

    // Get Box B data
    float xB = floatData[_indexB * FDATA_EPO + FDATA_X];
    float yB = floatData[_indexB * FDATA_EPO + FDATA_Y];
    float wB = floatData[_indexB * FDATA_EPO + FDATA_W];
    float hB = floatData[_indexB * FDATA_EPO + FDATA_H];
    float rotationB = floatData[_indexB * FDATA_EPO + FDATA_R];
    float angVelB = floatData[_indexB * FDATA_EPO + FDATA_RS]; // Angular velocity

    // Check if either object is a fixed body
    bool isAFixed = (intData[_indexA * LIVE_INT_EPO + LIVE_INT_TYPE] == static_cast<int>(ObjectType::FIXED_OBJECT));
    bool isBFixed = (intData[_indexB * LIVE_INT_EPO + LIVE_INT_TYPE] == static_cast<int>(ObjectType::FIXED_OBJECT));

    // Get the corners of both boxes
    Vec2 cornersA[4], cornersB[4];
    float halfWidthA = wA / 2.0f;
    float halfHeightA = hA / 2.0f;
    float halfWidthB = wB / 2.0f;
    float halfHeightB = hB / 2.0f;

    // Box A corners (local coordinates, then rotated and translated to world coordinates)
    cornersA[0] = Vec2(-halfWidthA, -halfHeightA).rotate(rotationA) + Vec2(xA, yA);
    cornersA[1] = Vec2(halfWidthA, -halfHeightA).rotate(rotationA) + Vec2(xA, yA);
    cornersA[2] = Vec2(halfWidthA, halfHeightA).rotate(rotationA) + Vec2(xA, yA);
    cornersA[3] = Vec2(-halfWidthA, halfHeightA).rotate(rotationA) + Vec2(xA, yA);

    // Box B corners
    cornersB[0] = Vec2(-halfWidthB, -halfHeightB).rotate(rotationB) + Vec2(xB, yB);
    cornersB[1] = Vec2(halfWidthB, -halfHeightB).rotate(rotationB) + Vec2(xB, yB);
    cornersB[2] = Vec2(halfWidthB, halfHeightB).rotate(rotationB) + Vec2(xB, yB);
    cornersB[3] = Vec2(-halfWidthB, halfHeightB).rotate(rotationB) + Vec2(xB, yB);

    // Edge vectors for each box
    Vec2 edgesA[4], edgesB[4];
    for (int i = 0; i < 4; i++) {
        edgesA[i] = cornersA[(i + 1) % 4] - cornersA[i];
        edgesB[i] = cornersB[(i + 1) % 4] - cornersB[i];
    }

    // Compute all possible separating axes (perpendicular to edges)
    Vec2 axes[8];
    for (int i = 0; i < 4; i++) {
        // Perpendicular to edge = (-edge.y, edge.x) normalized
        axes[i] = Vec2(-edgesA[i].y, edgesA[i].x).normalize();
        axes[i + 4] = Vec2(-edgesB[i].y, edgesB[i].x).normalize();
    }

    // Separating Axis Test (SAT)
    float minOverlap = FLT_MAX;
    int minOverlapAxis = -1;
    bool fromAtoB = true;  // Direction flag for consistent normals

    // Helper function to project box onto an axis
    auto projectBoxOntoAxis = [](const Vec2 corners[4], const Vec2& axis) {
        float min = corners[0].dot(axis);
        float max = min;

        for (int i = 1; i < 4; i++) {
            float projection = corners[i].dot(axis);
            if (projection < min) min = projection;
            if (projection > max) max = projection;
        }

        return std::make_pair(min, max);
    };

    // Check each axis for separation or to find minimum penetration
    for (int i = 0; i < 8; i++) {
        auto [minA, maxA] = projectBoxOntoAxis(cornersA, axes[i]);
        auto [minB, maxB] = projectBoxOntoAxis(cornersB, axes[i]);

        // Check for separation (no overlap)
        if (maxA < minB || maxB < minA) {
            return false;  // Separating axis found, no collision
        }

        // Calculate overlap - we need to determine which way the axis points
        float overlapAB = maxA - minB;  // A pushing into B
        float overlapBA = maxB - minA;  // B pushing into A
        float overlap = std::min(overlapAB, overlapBA);
        
        // Track axis with minimum overlap for collision normal
        if (overlap < minOverlap) {
            minOverlap = overlap;
            minOverlapAxis = i;
            // Check which way the normal should point (A->B or B->A)
            Vec2 centerDiff = Vec2(xB - xA, yB - yA);
            fromAtoB = (centerDiff.dot(axes[i]) >= 0);
        }
    }

    // Get the collision normal (ensure it points from A to B)
    Vec2 normal = fromAtoB ? axes[minOverlapAxis] : -axes[minOverlapAxis];
    
    // Find contact points
    Vec2 contacts[2];
    float depths[2];
    int contactCount = 0;
    
    // Helper to calculate penetration depth of a point into a box along the collision normal
    auto getDepth = [&](const Vec2& point, const Vec2 corners[4], const Vec2& n, bool isPointInA) {
        // Find the "reference" face of the box being penetrated
        // The depth is the maximum penetration along the normal N
        float maxD = -FLT_MAX;
        for (int i = 0; i < 4; i++) {
            float d = isPointInA ? (point - corners[i]).dot(n) : (corners[i] - point).dot(n);
            if (d > maxD) maxD = d;
        }
        return maxD;
    };

    // Check if vertices from box B are penetrating box A
    for (int i = 0; i < 4; i++) {
        bool inside = true;
        for (int j = 0; j < 4; j++) {
            Vec2 edgeNormal = Vec2(-edgesA[j].y, edgesA[j].x).normalize();
            if (edgeNormal.dot(cornersB[i] - cornersA[j]) < 0) {
                inside = false;
                break;
            }
        }
        if (inside) {
            float depth = getDepth(cornersB[i], cornersA, normal, false);
            if (depth > 0) {
                contacts[contactCount] = cornersB[i];
                depths[contactCount] = depth;
                contactCount++;
                if (contactCount == 2) break;
            }
        }
    }
    
    // Check if vertices from box A are penetrating box B
    if (contactCount < 2) {
        for (int i = 0; i < 4; i++) {
            bool inside = true;
            for (int j = 0; j < 4; j++) {
                Vec2 edgeNormal = Vec2(-edgesB[j].y, edgesB[j].x).normalize();
                if (edgeNormal.dot(cornersA[i] - cornersB[j]) < 0) {
                    inside = false;
                    break;
                }
            }
            if (inside) {
                float depth = getDepth(cornersA[i], cornersB, normal, true);
                if (depth > 0) {
                    contacts[contactCount] = cornersA[i];
                    depths[contactCount] = depth;
                    contactCount++;
                    if (contactCount == 2) break;
                }
            }
        }
    }
    
    // If no penetrating vertices were found, use the closest approach as fallback
    if (contactCount == 0) {
        // ... (closest approach logic stays the same)
        float minDistance = FLT_MAX;
        Vec2 bestContactPoint;
        for (int i = 0; i < 4; i++) {
            for (int j = 0; j < 4; j++) {
                Vec2 pointOnEdgeA, pointOnEdgeB;
                float distanceSq = closestPointsBetweenLines(
                    cornersA[i], cornersA[(i+1)%4],
                    cornersB[j], cornersB[(j+1)%4],
                    pointOnEdgeA, pointOnEdgeB);
                if (distanceSq < minDistance) {
                    minDistance = distanceSq;
                    bestContactPoint = (pointOnEdgeA + pointOnEdgeB) * 0.5f;
                }
            }
        }
        contacts[0] = bestContactPoint;
        depths[0] = minOverlap;
        contactCount = 1;
    }
    
    // Fallback - if all else fails, use center of overlap
    if (contactCount == 0) {
        contacts[0] = Vec2((xA + xB) / 2, (yA + yB) / 2);
        depths[0] = minOverlap;
        contactCount = 1;
    }
    
    // Process each contact point
    for (int i = 0; i < contactCount; i++) {
        // Vectors from centers to contact point
        Vec2 rA = contacts[i] - Vec2(xA, yA);
        Vec2 rB = contacts[i] - Vec2(xB, yB);
        
        // Calculate velocities at contact point
        Vec2 vA(floatData[_indexA * FDATA_EPO + FDATA_VX], floatData[_indexA * FDATA_EPO + FDATA_VY]);
        Vec2 vB(floatData[_indexB * FDATA_EPO + FDATA_VX], floatData[_indexB * FDATA_EPO + FDATA_VY]);
        
        // Add rotational velocity
        if (!isAFixed) {
            vA = vA + Vec2(-rA.y * angVelA, rA.x * angVelA);
        }
        
        if (!isBFixed) {
            vB = vB + Vec2(-rB.y * angVelB, rB.x * angVelB);
        }
        
        // Calculate relative velocity
        Vec2 relVel = vB - vA;
        
        // Add collision to list
        collisions.push_back(CollisionInfo{
            true,                    // Collision detected
            contacts[i],             // Contact point
            normal,                  // Collision normal
            depths[i],               // Individual penetration depth
            _indexA,                 // Object A index
            _indexB,                 // Object B index
            relVel,                  // Relative velocity
            0.0f                     // Friction placeholder
        });
    }
    
    return true;
}


bool CollisionSolver::_solveCircleBox() {
    // Get Circle (Object A) data
    float rA = floatData[_indexA * FDATA_EPO + FDATA_RADIUS];
    float xA = floatData[_indexA * FDATA_EPO + FDATA_X];
    float yA = floatData[_indexA * FDATA_EPO + FDATA_Y];

    // Get Box (Object B) data
    float xB = floatData[_indexB * FDATA_EPO + FDATA_X];
    float yB = floatData[_indexB * FDATA_EPO + FDATA_Y];
    float wB = floatData[_indexB * FDATA_EPO + FDATA_W];
    float hB = floatData[_indexB * FDATA_EPO + FDATA_H];
    float rotationB = floatData[_indexB * FDATA_EPO + FDATA_R];

    // Compute the relative position of the circle's center to the box's center
    Vec2 circleCenter(xA, yA);
    Vec2 boxCenter(xB, yB);
    Vec2 relCircleCenter = circleCenter - boxCenter;

    // Rotate the relative position into the box's local space (unrotate the box)
    Vec2 localCircleCenter = relCircleCenter.rotate(-rotationB);

    // Box half-extents
    float halfW = wB / 2.0f;
    float halfH = hB / 2.0f;

    // Find the closest point on the box to the circle in the box's local space
    float closestX = max(-halfW, min(localCircleCenter.x, halfW));
    float closestY = max(-halfH, min(localCircleCenter.y, halfH));

    // Compute the distance vector between the circle's center and the closest point
    Vec2 closestPointLocal(closestX, closestY);
    Vec2 distanceVecLocal = closestPointLocal - localCircleCenter;

    // Calculate the squared distance
    float distanceSquared = distanceVecLocal.magnitudeSquared();

    // Check if the distance squared is less than the circle's radius squared
    if (distanceSquared < rA * rA) {
        float distance = sqrt(distanceSquared);
        float penetrationDepth;
        Vec2 normalLocal;
        Vec2 contactPointLocal;

        // Check if the circle's center is inside the box
        bool isInside = (localCircleCenter.x > -halfW && localCircleCenter.x < halfW &&
                         localCircleCenter.y > -halfH && localCircleCenter.y < halfH);

        if (isInside || distance < 0.0001f) {
            // Find distances to each face in local space
            float dLeft = localCircleCenter.x - (-halfW);
            float dRight = halfW - localCircleCenter.x;
            float dTop = localCircleCenter.y - (-halfH);
            float dBottom = halfH - localCircleCenter.y;

            float minDist = dLeft;
            normalLocal = Vec2(-1.0f, 0.0f);

            if (dRight < minDist) {
                minDist = dRight;
                normalLocal = Vec2(1.0f, 0.0f);
            }
            if (dTop < minDist) {
                minDist = dTop;
                normalLocal = Vec2(0.0f, -1.0f);
            }
            if (dBottom < minDist) {
                minDist = dBottom;
                normalLocal = Vec2(0.0f, 1.0f);
            }

            penetrationDepth = rA + minDist;
            contactPointLocal = localCircleCenter - normalLocal * rA;
        } else {
            // Standard case: circle is outside or just touching
            normalLocal = distanceVecLocal / distance;
            penetrationDepth = rA - distance;
            contactPointLocal = closestPointLocal;
        }

        // Rotate normal and contact point back to world space
        Vec2 normal = normalLocal.rotate(rotationB);
        Vec2 contactPoint = contactPointLocal.rotate(rotationB) + boxCenter;

        // Compute relative velocity including rotational effects at contact point
        Vec2 vA(floatData[_indexA * FDATA_EPO + FDATA_VX], 
                floatData[_indexA * FDATA_EPO + FDATA_VY]);
        Vec2 vB(floatData[_indexB * FDATA_EPO + FDATA_VX], 
                floatData[_indexB * FDATA_EPO + FDATA_VY]);
                
        // Get rotational speeds
        float wA = floatData[_indexA * FDATA_EPO + FDATA_RS];
        float wB = floatData[_indexB * FDATA_EPO + FDATA_RS];
        
        // Calculate radius vectors (from center to contact point)
        Vec2 rA_vec = contactPoint - circleCenter;
        Vec2 rB_vec = contactPoint - boxCenter;
        
        // Calculate tangential velocities due to rotation
        Vec2 tangentialVelocityA(-rA_vec.y * wA, rA_vec.x * wA);
        Vec2 tangentialVelocityB(-rB_vec.y * wB, rB_vec.x * wB);
        
        // Total velocities at contact point
        Vec2 totalVelocityA = vA + tangentialVelocityA;
        Vec2 totalVelocityB = vB + tangentialVelocityB;
        
        // Store the actual relative velocity at the contact point
        Vec2 relativeVelocity = totalVelocityB - totalVelocityA;

        // Store the collision info
        collisions.push_back(CollisionInfo{
            true,                      // Collision detected
            contactPoint,              // Contact point
            normal,                    // Collision normal
            penetrationDepth,          // Penetration depth
            _indexA,                   // Object A index (Circle)
            _indexB,                   // Object B index (Box)
            relativeVelocity,          // Correct relative velocity including rotational effects
            0.0f                       // Friction placeholder (can be computed later)
        });

        return true;
    }

    return false;  // No collision
}


