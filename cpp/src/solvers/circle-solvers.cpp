#include "collision-solver.h"
#include "constants.h"
#include <cmath>

using namespace std;

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
        float wA_rot = floatData[_indexA * FDATA_EPO + FDATA_RS];
        float wB_rot = floatData[_indexB * FDATA_EPO + FDATA_RS];
        
        // Calculate radius vectors (from center to contact point)
        Vec2 rA_vec = contactPoint - pA;
        Vec2 rB_vec = contactPoint - pB;
        
        // Calculate tangential velocities due to rotation
        Vec2 tangentialVelocityA(-rA_vec.y * wA_rot, rA_vec.x * wA_rot);
        Vec2 tangentialVelocityB(-rB_vec.y * wB_rot, rB_vec.x * wB_rot);
        
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

bool CollisionSolver::_solveCirclePoint() {
    float rA = floatData[_indexA * FDATA_EPO + FDATA_RADIUS];
    float xA = floatData[_indexA * FDATA_EPO + FDATA_X];
    float yA = floatData[_indexA * FDATA_EPO + FDATA_Y];
    float xB = floatData[_indexB * FDATA_EPO + FDATA_X];
    float yB = floatData[_indexB * FDATA_EPO + FDATA_Y];

    auto pA = Vec2(xA, yA);
    auto pB = Vec2(xB, yB);

    if (testPointCircle(pB, pA, rA)) {
        auto pDiff = (pB - pA);
        float distance = pDiff.magnitude();
        Vec2 normal;

        if (distance > 0.0001f) {
            normal = pDiff / distance;
        } else {
            // Point is at circle center, use a default normal
            normal = Vec2(0.0f, -1.0f);
        }

        auto penetrationDepth = rA - distance;
        
        // Contact point is the point itself
        auto contactPoint = pB;

        // Compute relative velocity including rotational effects at contact point
        Vec2 vA(floatData[_indexA * FDATA_EPO + FDATA_VX], 
                floatData[_indexA * FDATA_EPO + FDATA_VY]);
        Vec2 vB(floatData[_indexB * FDATA_EPO + FDATA_VX], 
                floatData[_indexB * FDATA_EPO + FDATA_VY]);
                
        // Get rotational speeds
        float wA_rot = floatData[_indexA * FDATA_EPO + FDATA_RS];
        float wB_rot = floatData[_indexB * FDATA_EPO + FDATA_RS];
        
        // Calculate radius vectors (from center to contact point)
        Vec2 rA_vec = contactPoint - pA;
        Vec2 rB_vec = contactPoint - pB; // (0,0) for a point
        
        // Calculate tangential velocities due to rotation
        Vec2 tangentialVelocityA(-rA_vec.y * wA_rot, rA_vec.x * wA_rot);
        Vec2 tangentialVelocityB(-rB_vec.y * wB_rot, rB_vec.x * wB_rot);
        
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
            relativeVelocity,   // Relative velocity
            0.0f                // Friction coefficient
        });

        return true;
    }

    return false;
}

