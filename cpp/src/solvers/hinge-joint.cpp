#include "hinge-joint.h"
#include "physical-object.h"
#include <cmath>

HingeJoint::HingeJoint(int id, PhysicalObject* a, PhysicalObject* b, Vec2 anchorA, Vec2 anchorB)
    : Joint(id, a, b), localAnchorA(anchorA), localAnchorB(anchorB), impulse(0, 0) {}

void HingeJoint::preSolve(float dt) {
    _dt = dt;
    
    // Calculate world-space anchor offsets from center of mass
    float rotA = bodyA->getRotation();
    float rotB = bodyB->getRotation();
    
    rA = localAnchorA.rotate(rotA);
    rB = localAnchorB.rotate(rotB);

    float imA = bodyA->getInverseMass();
    float imB = bodyB->getInverseMass();
    float iIA = bodyA->getInverseInertia();
    float iIB = bodyB->getInverseInertia();

    // K = [(1/mA + 1/mB) * eye(2) - skew(rA) * iIA * skew(rA) - skew(rB) * iIB * skew(rB)]
    // K = [ imA+imB + iIA*rAy^2 + iIB*rBy^2,  -iIA*rAx*rAy - iIB*rBx*rBy ]
    //     [ -iIA*rAx*rAy - iIB*rBx*rBy,        imA+imB + iIA*rAx^2 + iIB*rBx^2 ]

    massMatrix[0][0] = imA + imB + iIA * rA.y * rA.y + iIB * rB.y * rB.y;
    massMatrix[0][1] = -iIA * rA.x * rA.y - iIB * rB.x * rB.y;
    massMatrix[1][0] = massMatrix[0][1];
    massMatrix[1][1] = imA + imB + iIA * rA.x * rA.x + iIB * rB.x * rB.x;

    // Invert the K matrix to get the effective mass
    float det = massMatrix[0][0] * massMatrix[1][1] - massMatrix[0][1] * massMatrix[1][0];
    if (std::abs(det) > 1e-6f) {
        float invDet = 1.0f / det;
        float k00 = massMatrix[0][0];
        float k01 = massMatrix[0][1];
        float k11 = massMatrix[1][1];
        
        massMatrix[0][0] = k11 * invDet;
        massMatrix[0][1] = -k01 * invDet;
        massMatrix[1][0] = -k01 * invDet;
        massMatrix[1][1] = k00 * invDet;
    } else {
        massMatrix[0][0] = massMatrix[0][1] = massMatrix[1][0] = massMatrix[1][1] = 0.0f;
    }

    // Position correction (Baumgarte stabilization)
    Vec2 posA = bodyA->getPosition();
    Vec2 posB = bodyB->getPosition();
    Vec2 C = (posB + rB) - (posA + rA);
    
    float beta = 0.2f; // Softness factor
    bias = C * (beta / dt);

    // Warm starting: Apply previous impulse
    bodyA->setVelocity(bodyA->getVelocity() - impulse * imA);
    bodyA->setAngularVelocity(bodyA->getAngularVelocity() - rA.cross(impulse) * iIA);
    
    bodyB->setVelocity(bodyB->getVelocity() + impulse * imB);
    bodyB->setAngularVelocity(bodyB->getAngularVelocity() + rB.cross(impulse) * iIB);
}

void HingeJoint::solve() {
    float imA = bodyA->getInverseMass();
    float imB = bodyB->getInverseMass();
    float iIA = bodyA->getInverseInertia();
    float iIB = bodyB->getInverseInertia();

    // Calculate relative velocity at the anchor points
    Vec2 vA = bodyA->getVelocity();
    float wA = bodyA->getAngularVelocity();
    Vec2 vB = bodyB->getVelocity();
    float wB = bodyB->getAngularVelocity();

    Vec2 vrA(-wA * rA.y, wA * rA.x);
    Vec2 vrB(-wB * rB.y, wB * rB.x);
    
    Vec2 Cdot = (vB + vrB) - (vA + vrA);
    
    // Impulse: lambda = -K_inv * (Cdot + bias)
    Vec2 jBias = Cdot + bias;
    Vec2 lambda(
        -(massMatrix[0][0] * jBias.x + massMatrix[0][1] * jBias.y),
        -(massMatrix[1][0] * jBias.x + massMatrix[1][1] * jBias.y)
    );

    impulse = impulse + lambda;

    // Apply impulse to bodies
    bodyA->setVelocity(bodyA->getVelocity() - lambda * imA);
    bodyA->setAngularVelocity(bodyA->getAngularVelocity() - rA.cross(lambda) * iIA);
    
    bodyB->setVelocity(bodyB->getVelocity() + lambda * imB);
    bodyB->setAngularVelocity(bodyB->getAngularVelocity() + rB.cross(lambda) * iIB);
}

Vec2 HingeJoint::getReactionForce(float inv_dt) const {
    return impulse * inv_dt;
}

float HingeJoint::getReactionTorque(float inv_dt) const {
    // In a 2D hinge, there is no constraint on rotation, so reaction torque is 0
    return 0.0f;
}

void HingeJoint::setLocalAnchorA(Vec2 a) {
    localAnchorA = a;
    bodyA->wakeUp();
    bodyB->wakeUp();
}

Vec2 HingeJoint::getLocalAnchorA() const {
    return localAnchorA;
}

void HingeJoint::setLocalAnchorB(Vec2 b) {
    localAnchorB = b;
    bodyA->wakeUp();
    bodyB->wakeUp();
}

Vec2 HingeJoint::getLocalAnchorB() const {
    return localAnchorB;
}

