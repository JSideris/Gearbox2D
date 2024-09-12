
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
        normal = Vec2((xA < xB) ? -1.0f : 1.0f, 0.0f); // A is to the left of B if xA < xB
    } else {
        // Collision is primarily on the Y axis
        penetrationDepth = overlapY;
        normal = Vec2(0.0f, (yA < yB) ? -1.0f : 1.0f); // A is below B if yA < yB
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
            true, 
            contactPoint, 
            normal, 
            penetrationDepth, 
            _indexA, _indexB,
            _relativeVelocity, 0.0f
        });
        return true;
    }

    return false;
}

// TODO: this solver might not orient the collision normal correctly.
// e.g. circles on a flat surface should be pushed directly up, not at an angle.
// Low priority.
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

    // If the distance squared is less than the circle's radius squared, a collision occurs
    if (distanceSquared < rC * rC) {
        // Compute the penetration depth
        float distance = sqrt(distanceSquared);
        float penetrationDepth = rC - distance;

        // Normalize the distance vector to get the collision normal
        Vec2 normal = Vec2(1.0f, 0.0f);
        if (distance != 0) {
            normal = distanceVec / -distance;
        }

        collisions.push_back(CollisionInfo{
            true, 
            Vec2(closestX, closestY), 
            normal, 
            penetrationDepth, 
            _indexA, _indexB,
            _relativeVelocity, 0.0f
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

    // Get Box B data
    float xB = floatData[_indexB * FDATA_EPO + FDATA_X];
    float yB = floatData[_indexB * FDATA_EPO + FDATA_Y];
    float wB = floatData[_indexB * FDATA_EPO + FDATA_W];
    float hB = floatData[_indexB * FDATA_EPO + FDATA_H];
    float rotationB = floatData[_indexB * FDATA_EPO + FDATA_R];

    // Compute rotation matrices for both boxes
    Vec2 axisA1(cos(rotationA), sin(rotationA));   // X-axis for Box A
    Vec2 axisA2(-sin(rotationA), cos(rotationA));  // Y-axis for Box A
    Vec2 axisB1(cos(rotationB), sin(rotationB));   // X-axis for Box B
    Vec2 axisB2(-sin(rotationB), cos(rotationB));  // Y-axis for Box B

    // The potential separating axes are the normals of both box edges
    Vec2 axes[] = {axisA1, axisA2, axisB1, axisB2};

    float minPenetrationDepth = FLT_MAX;  // Store minimum penetration depth
    Vec2 bestAxis;  // Store the axis that results in the smallest penetration
    bool isColliding = true;

    // Helper function to project a box onto an axis
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

    // Check all axes for overlap
    for (const Vec2& axis : axes) {
        // Project both boxes onto the current axis
        auto [minA, maxA] = projectBoxOntoAxis(xA, yA, wA, hA, rotationA, axis);
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

    // If we get here, the boxes are colliding on all axes
    // The collision normal is the axis with the least penetration depth
    Vec2 normal = bestAxis;

    // Compute the contact point (optional, approximate it)
    Vec2 contactPoint = Vec2((xA + xB) / 2, (yA + yB) / 2);  // Midpoint approximation

    // Store the collision info
    collisions.push_back(CollisionInfo{
        true,                      // Collision detected
        contactPoint,               // Contact point
        normal,                    // Collision normal
        minPenetrationDepth,        // Penetration depth
        _indexA,                   // Object A index
        _indexB,                   // Object B index
        _relativeVelocity,         // Relative velocity (already computed)
        0.0f                       // Friction placeholder (can be computed later)
    });

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
    // The collision normal is the axis with the least penetration depth
    Vec2 normal = bestAxis;

    // Compute the contact point (optional, approximate it)
    Vec2 contactPoint = Vec2((xA + xB) / 2, (yA + yB) / 2);  // Midpoint approximation

    // Store the collision info
    collisions.push_back(CollisionInfo{
        true,                      // Collision detected
        contactPoint,               // Contact point
        normal,                    // Collision normal
        minPenetrationDepth,        // Penetration depth
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


