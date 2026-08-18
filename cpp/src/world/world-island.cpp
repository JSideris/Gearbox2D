#include "world.h"
#include "body.h"
#include "fixture.h"
#include "constants.h"
#include "hinge-joint.h"
#include "distance-joint.h"
#include "spring-joint.h"
#include "gear-joint.h"
#include <algorithm>
#include <cmath>
#include <unordered_map>
#include <unordered_set>
#include <vector>

#include "island/island-internal.h"

// World island façade (stable compile path).
// Domain package: cpp/src/world/island/ (not more world-* siblings).
// Nested .cpp files are separate TUs via Makefile glob; do not #include implementation files.
// Modules: chain-map (island/chain-map.cpp), solve (island/solve.cpp), build (island/build.cpp); island-internal.h seam.

bool bodyHasDistanceJoint(Body* body) {
    for (Joint* joint : body->joints) {
        if (joint->getType() == JointType::DISTANCE) {
            return true;
        }
    }
    return false;
}

float pendulumHeightAboveRest(Body* body) {
    if (!body) {
        return 0.0f;
    }
    Vec2 g = body->world.getGravity();
    float gMag = g.magnitude();
    if (gMag <= kChainResidualEps) {
        return 0.0f;
    }
    Vec2 gHat = g / gMag;
    for (Joint* joint : body->joints) {
        if (joint->getType() != JointType::DISTANCE) {
            continue;
        }
        Body* other = (joint->bodyA == body) ? joint->bodyB : joint->bodyA;
        if (!other || other->type != ObjectType::FIXED_OBJECT) {
            continue;
        }
        DistanceJoint* distanceJoint = static_cast<DistanceJoint*>(joint);
        Vec2 rod = body->getPosition() - other->getPosition();
        float alongG = rod.dot(gHat);
        float h = distanceJoint->getLength() - alongG;
        if (h < 0.0f) {
            h = 0.0f;
        }
        return h;
    }
    return 0.0f;
}
bool applyDistanceJointCdotOnly(DistanceJoint* joint, std::vector<SolverData>& solverBodies) {
    Body* bodyA = joint->bodyA;
    Body* bodyB = joint->bodyB;
    SolverData& sA = solverBodies[bodyA->worldIndex];
    SolverData& sB = solverBodies[bodyB->worldIndex];
    if (sA.im <= 0.0f && sB.im <= 0.0f) {
        return false;
    }

    Vec2 rA = joint->getLocalAnchorA().rotate(bodyA->getRotation());
    Vec2 rB = joint->getLocalAnchorB().rotate(bodyB->getRotation());
    Vec2 pA = bodyA->getPosition();
    Vec2 pB = bodyB->getPosition();
    Vec2 d = (pB + rB) - (pA + rA);
    float dMag = d.magnitude();
    if (dMag <= kChainJointReprojectMinDist) {
        return false;
    }

    Vec2 n = d / dMag;
    float rnA = rA.cross(n);
    float rnB = rB.cross(n);
    float k = sA.im + sB.im + sA.iI * rnA * rnA + sB.iI * rnB * rnB;
    if (k <= 0.0f) {
        return false;
    }
    float mass = 1.0f / k;

    Vec2 vrA(-sA.w * rA.y, sA.w * rA.x);
    Vec2 vrB(-sB.w * rB.y, sB.w * rB.x);
    float Cdot = (sB.v + vrB - (sA.v + vrA)).dot(n);
    if (!std::isfinite(Cdot)) {
        return false;
    }

    float lambda = -mass * Cdot;
    if (!std::isfinite(lambda)) {
        return false;
    }

    Vec2 p = n * lambda;
    if (sA.im > 0.0f) {
        sA.v.x -= p.x * sA.im;
        sA.v.y -= p.y * sA.im;
        sA.w -= rA.cross(p) * sA.iI;
    }
    if (sB.im > 0.0f) {
        sB.v.x += p.x * sB.im;
        sB.v.y += p.y * sB.im;
        sB.w += rB.cross(p) * sB.iI;
    }
    return true;
}

bool islandHasOverlappingContact(const Island& island) {
    for (ContactConstraint* c : island.contacts) {
        if (c && c->depth >= 0.0f) {
            return true;
        }
    }
    return false;
}
