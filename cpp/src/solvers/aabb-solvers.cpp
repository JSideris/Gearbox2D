#include "collision-solver.h"
#include "constants.h"
#include <cmath>
#include <algorithm>

using namespace std;

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
        float wA_rot = floatData[_indexA * FDATA_EPO + FDATA_RS];
        float wB_rot = floatData[_indexB * FDATA_EPO + FDATA_RS];
        
        // Calculate radius vectors (from center to contact point)
        Vec2 rA = contactPoint - Vec2(xA, yA);
        Vec2 rB = contactPoint - Vec2(xC, yC);
        
        // Calculate tangential velocities due to rotation
        Vec2 tangentialVelocityA(
            -rA.y * wA_rot,  // Cross product in 2D
            rA.x * wA_rot
        );
        
        Vec2 tangentialVelocityB(
            -rB.y * wB_rot,  // Cross product in 2D
            rB.x * wB_rot
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
        float wA_rot = floatData[_indexA * FDATA_EPO + FDATA_RS];
        float wB_rot = floatData[_indexB * FDATA_EPO + FDATA_RS];
        
        // Calculate radius vectors (from center to contact point)
        Vec2 rA = contactPoint - Vec2(xA, yA);
        Vec2 rB = contactPoint - Vec2(xP, yP); // This is (0,0) for a point
        
        // Calculate tangential velocities due to rotation
        Vec2 tangentialVelocityA(-rA.y * wA_rot, rA.x * wA_rot);
        Vec2 tangentialVelocityB(-rB.y * wB_rot, rB.x * wB_rot); // This is (0,0) for a point
        
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

