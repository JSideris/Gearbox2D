
#include <cfloat>
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
                    return _solveAabbBox();
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
                case static_cast<int>(ObjectShape::BOX):
                    return _solveCircleBox();
                default:
                    cerr << "Unsupported collision shape combo." << endl;
                    break;
            }
            break;
        case static_cast<int>(ObjectShape::BOX):
            switch(shapeB){
                case static_cast<int>(ObjectShape::AABB):
                    _swap();
                    return _solveAabbBox();
                case static_cast<int>(ObjectShape::CIRCLE):
                    _swap();
                    return _solveCircleBox();
                case static_cast<int>(ObjectShape::BOX):
                    return _solveBoxBox();
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

    if((rA + rB)*(rA + rB) > pd2){
        auto normal = pDiff.normalize();
        auto penetrationDepth = rA + rB - pDiff.magnitude();
        auto contactPoint = pA + normal * rA;
        collisions.push_back(CollisionInfo{
            true,               // Collision detected
            contactPoint,       // Contact point
            normal,             // Collision normal
            penetrationDepth,   // Penetration depth
            _indexA,            // Object A index
            _indexB,            // Object B index
            _relativeVelocity,  // Relative velocity
            0.0f                // Friction coefficient
        });

        return true;
    }

    return false;
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
        
        // Handle the case where circle center is inside AABB or very close to surface
        if (distance < 0.0001f) {
            // Find the closest AABB face to push the circle out
            float dLeft = xC - minX;
            float dRight = maxX - xC;
            float dTop = yC - minY;
            float dBottom = maxY - yC;
            
            // Find minimum penetration axis
            float minDist = dLeft;
            normal = Vec2(-1.0f, 0.0f);
            
            if (dRight < minDist) {
                minDist = dRight;
                normal = Vec2(1.0f, 0.0f);
            }
            
            if (dTop < minDist) {
                minDist = dTop;
                normal = Vec2(0.0f, -1.0f);
            }
            
            if (dBottom < minDist) {
                minDist = dBottom;
                normal = Vec2(0.0f, 1.0f);
            }
            
            // Adjust penetration depth and contact point
            float penetrationDepth = rC + minDist;
            Vec2 contactPoint = Vec2(xC, yC) + normal * -rC;
            
            collisions.push_back(CollisionInfo{
                true,
                contactPoint,
                normal,
                penetrationDepth,
                _indexA, _indexB,
                _relativeVelocity, 0.0f
            });
        } else {
            // Normal case - circle is outside AABB but penetrating
            normal = distanceVec.normalize() * -1.0f; // Point from AABB to circle
            float penetrationDepth = rC - distance;
            Vec2 contactPoint = Vec2(closestX, closestY);
            
            collisions.push_back(CollisionInfo{
                true,
                contactPoint,
                normal,
                penetrationDepth,
                _indexA, _indexB,
                _relativeVelocity, 0.0f
            });
        }
        
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
    
    // Find contact points - simplest approach is to find the deepest penetrating vertex
    Vec2 contacts[2];
    int contactCount = 0;
    
    // Check if vertices from box B are penetrating box A
    for (int i = 0; i < 4; i++) {
        bool inside = true;
        for (int j = 0; j < 4; j++) {
            // Check if corner is inside box A (behind all edges of A)
            Vec2 edgeNormal = Vec2(-edgesA[j].y, edgesA[j].x).normalize();
            if (edgeNormal.dot(cornersB[i] - cornersA[j]) > 0) {
                inside = false;
                break;
            }
        }
        if (inside) {
            contacts[contactCount++] = cornersB[i];
            if (contactCount == 2) break;  // Max 2 contacts
        }
    }
    
    // Check if vertices from box A are penetrating box B
    if (contactCount < 2) {
        for (int i = 0; i < 4; i++) {
            bool inside = true;
            for (int j = 0; j < 4; j++) {
                // Check if corner is inside box B (behind all edges of B)
                Vec2 edgeNormal = Vec2(-edgesB[j].y, edgesB[j].x).normalize();
                if (edgeNormal.dot(cornersA[i] - cornersB[j]) > 0) {
                    inside = false;
                    break;
                }
            }
            if (inside) {
                contacts[contactCount++] = cornersA[i];
                if (contactCount == 2) break;  // Max 2 contacts
            }
        }
    }
    
    // If no penetrating vertices were found, use the closest approach
    if (contactCount == 0) {
        // Find edge-edge closest points
        float minDistance = FLT_MAX;
        Vec2 bestContactPoint;
        
        // Check each edge pair
        for (int i = 0; i < 4; i++) {
            for (int j = 0; j < 4; j++) {
                // Calculate closest points between the two edges
                Vec2 pointOnEdgeA, pointOnEdgeB;
                float distanceSq = closestPointsBetweenLines(
                    cornersA[i], cornersA[(i+1)%4],
                    cornersB[j], cornersB[(j+1)%4],
                    pointOnEdgeA, pointOnEdgeB);
                
                if (distanceSq < minDistance) {
                    minDistance = distanceSq;
                    // Use midpoint between closest points as contact
                    bestContactPoint = (pointOnEdgeA + pointOnEdgeB) * 0.5f;
                }
            }
        }
        
        contacts[0] = bestContactPoint;
        contactCount = 1;
    }
    
    // Fallback - if all else fails, use center of overlap
    if (contactCount == 0) {
        contacts[0] = Vec2((xA + xB) / 2, (yA + yB) / 2); // Midpoint between centers
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
        
        // Normal component of velocity
        float normalVel = relVel.dot(normal);
        
        // Determine friction based on contact state
        float friction = 0.2f; // Default friction
        
        // Higher friction for resting contacts
        if (std::abs(normalVel) < 0.1f) {
            friction = 0.7f;
        }
        
        // Add collision to list
        collisions.push_back(CollisionInfo{
            true,                    // Collision detected
            contacts[i],             // Contact point
            normal,                  // Collision normal
            minOverlap,              // Penetration depth
            _indexA,                 // Object A index
            _indexB,                 // Object B index
            relVel,                  // Relative velocity
            friction                 // Friction coefficient
        });
    }
    
    return true;
}



bool CollisionSolver::_solveAabbBox() {
    // Get AABB (Object A) data
    float xA = floatData[_indexA * FDATA_EPO + FDATA_X];
    float yA = floatData[_indexA * FDATA_EPO + FDATA_Y];
    float wA = floatData[_indexA * FDATA_EPO + FDATA_W];
    float hA = floatData[_indexA * FDATA_EPO + FDATA_H];

    // Get Box (Object B) data
    float xB = floatData[_indexB * FDATA_EPO + FDATA_X];
    float yB = floatData[_indexB * FDATA_EPO + FDATA_Y];
    float wB = floatData[_indexB * FDATA_EPO + FDATA_W];
    float hB = floatData[_indexB * FDATA_EPO + FDATA_H];
    float rotationB = floatData[_indexB * FDATA_EPO + FDATA_R];

    // AABB's axes are just the X and Y world axes
    Vec2 axisA1(1.0f, 0.0f);  // X-axis
    Vec2 axisA2(0.0f, 1.0f);  // Y-axis

    // Box B's rotated axes
    Vec2 axisB1(cos(rotationB), sin(rotationB));    // X-axis for Box B
    Vec2 axisB2(-sin(rotationB), cos(rotationB));   // Y-axis for Box B

    // The separating axes to test: X and Y for AABB, rotated axes for Box B
    Vec2 axes[] = {axisA1, axisA2, axisB1, axisB2};

    float minPenetrationDepth = FLT_MAX;  // Store the minimum penetration depth
    Vec2 bestAxis;  // Store the axis that results in the smallest penetration
    bool isColliding = true;

    // Helper function to project the AABB onto an axis
    auto projectAabbOntoAxis = [&](float x, float y, float w, float h, const Vec2& axis) {
        // Get the min/max of the AABB based on its extents
        float hw = w / 2.0f;
        float hh = h / 2.0f;

        // Project the corners of the AABB onto the axis
        Vec2 corners[4] = {
            Vec2(x - hw, y - hh),
            Vec2(x + hw, y - hh),
            Vec2(x + hw, y + hh),
            Vec2(x - hw, y + hh)
        };

        // Find the minimum and maximum projection values
        float minProj = corners[0].dot(axis);
        float maxProj = minProj;

        for (int i = 1; i < 4; i++) {
            float proj = corners[i].dot(axis);
            if (proj < minProj) minProj = proj;
            if (proj > maxProj) maxProj = proj;
        }

        return std::make_pair(minProj, maxProj);
    };

    // Helper function to project the rotated box onto an axis (reusing from box-box)
    auto projectBoxOntoAxis = [&](float x, float y, float w, float h, float rotation, const Vec2& axis) {
        Vec2 corners[4];
        float hw = w / 2.0f;
        float hh = h / 2.0f;

        // Get the rotated corners of the box
        corners[0] = Vec2(-hw, -hh).rotate(rotation) + Vec2(x, y);
        corners[1] = Vec2(hw, -hh).rotate(rotation) + Vec2(x, y);
        corners[2] = Vec2(hw, hh).rotate(rotation) + Vec2(x, y);
        corners[3] = Vec2(-hw, hh).rotate(rotation) + Vec2(x, y);

        // Project all corners onto the axis and find the min/max projections
        float minProj = corners[0].dot(axis);
        float maxProj = minProj;

        for (int i = 1; i < 4; i++) {
            float proj = corners[i].dot(axis);
            if (proj < minProj) minProj = proj;
            if (proj > maxProj) maxProj = proj;
        }

        return std::make_pair(minProj, maxProj);
    };

    // Check all axes for overlap (for both AABB and Box)
    for (const Vec2& axis : axes) {
        // Project AABB (Object A) onto the current axis
        auto [minA, maxA] = projectAabbOntoAxis(xA, yA, wA, hA, axis);

        // Project Box (Object B) onto the current axis
        auto [minB, maxB] = projectBoxOntoAxis(xB, yB, wB, hB, rotationB, axis);

        // Check for overlap between projections
        if (maxA < minB || maxB < minA) {
            // No overlap on this axis, so there is a separating axis -> no collision
            return false;
        }

        // Calculate the penetration depth on this axis
        float overlap = std::min(maxA, maxB) - std::max(minA, minB);
        if (overlap < minPenetrationDepth) {
            minPenetrationDepth = overlap;
            bestAxis = axis;
        }
    }

    // If we get here, the AABB and Box are colliding on all axes
    // Compute the vector from AABB to Box centers
    Vec2 AB = Vec2(xB - xA, yB - yA);

    // Determine the correct normal direction
    Vec2 normal;
    if (AB.dot(bestAxis) > 0.0f) {
        normal = bestAxis;
    } else {
        normal = -bestAxis;
    }

    // Compute the contact point (optional, approximate it)
    Vec2 contactPoint = Vec2((xA + xB) / 2.0f, (yA + yB) / 2.0f);  // Midpoint approximation

    // Store the collision info
    collisions.push_back(CollisionInfo{
        true,                      // Collision detected
        contactPoint,              // Contact point
        normal,                    // Collision normal
        minPenetrationDepth,       // Penetration depth
        _indexA,                   // Object A index (AABB)
        _indexB,                   // Object B index (Box)
        _relativeVelocity,         // Relative velocity (already computed)
        0.0f                       // Friction placeholder (can be computed later)
    });

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
        // Compute the penetration depth
        float distance = sqrt(distanceSquared);
        float penetrationDepth = rA - distance;

        // Compute the collision normal in local space
        Vec2 normalLocal = (distance == 0) ? Vec2(1.0f, 0.0f) : distanceVecLocal / distance;

        // Rotate the normal back to world space
        Vec2 normal = normalLocal.rotate(rotationB);

        // Find the closest point in world space
        Vec2 closestPointWorld = closestPointLocal.rotate(rotationB) + boxCenter;

        // Store the collision info
        collisions.push_back(CollisionInfo{
            true,                      // Collision detected
            closestPointWorld,          // Contact point
            normal,                    // Collision normal
            penetrationDepth,           // Penetration depth
            _indexA,                   // Object A index (Circle)
            _indexB,                   // Object B index (Box)
            _relativeVelocity,         // Relative velocity (already computed)
            0.0f                       // Friction placeholder (can be computed later)
        });

        return true;
    }

    return false;  // No collision
}


