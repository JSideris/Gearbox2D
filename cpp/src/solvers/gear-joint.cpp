#include "gear-joint.h"
#include "physical-object.h"
#include <cmath>

GearJoint::GearJoint(int id, HingeJoint* j1, HingeJoint* j2, float r)
    : Joint(id, j1->bodyA, j2->bodyB), joint1(j1), joint2(j2), ratio(r), impulse(0.0f) {
    
    float angle1 = joint1->bodyB->getRotation() - joint1->bodyA->getRotation();
    float angle2 = joint2->bodyB->getRotation() - joint2->bodyA->getRotation();
    constant = angle2 + ratio * angle1;
}

void GearJoint::preSolve(float dt) {
    _dt = dt;

    // Jacobian:
    // Cdot = (wB2 - wA2) + ratio * (wB1 - wA1)
    // J = [0 0 -ratio 0 0 ratio 0 0 -1 0 0 1]
    // But we act on 4 bodies: A1, B1, A2, B2
    
    // For joint1: A1, B1
    // For joint2: A2, B2
    
    // J = [0 0 -ratio] (A1)
    // J = [0 0  ratio] (B1)
    // J = [0 0 -1]     (A2)
    // J = [0 0  1]     (B2)
    
    J1 = -ratio; // A1 angular
    J2 = ratio;  // B1 angular
    J3 = -1.0f;  // A2 angular
    J4 = 1.0f;   // B2 angular

    float iIA1 = joint1->bodyA->getInverseInertia();
    float iIB1 = joint1->bodyB->getInverseInertia();
    float iIA2 = joint2->bodyA->getInverseInertia();
    float iIB2 = joint2->bodyB->getInverseInertia();

    float k = J1 * J1 * iIA1 + J2 * J2 * iIB1 + J3 * J3 * iIA2 + J4 * J4 * iIB2;
    mass = (k > 0.0f) ? 1.0f / k : 0.0f;

    // Position correction
    float angle1 = joint1->bodyB->getRotation() - joint1->bodyA->getRotation();
    float angle2 = joint2->bodyB->getRotation() - joint2->bodyA->getRotation();
    float C = angle2 + ratio * angle1 - constant;
    
    float beta = 0.2f;
    bias = (beta / dt) * C;

    // Warm starting
    joint1->bodyA->setAngularVelocity(joint1->bodyA->getAngularVelocity() + J1 * iIA1 * impulse);
    joint1->bodyB->setAngularVelocity(joint1->bodyB->getAngularVelocity() + J2 * iIB1 * impulse);
    joint2->bodyA->setAngularVelocity(joint2->bodyA->getAngularVelocity() + J3 * iIA2 * impulse);
    joint2->bodyB->setAngularVelocity(joint2->bodyB->getAngularVelocity() + J4 * iIB2 * impulse);
}

void GearJoint::solve() {
    float wA1 = joint1->bodyA->getAngularVelocity();
    float wB1 = joint1->bodyB->getAngularVelocity();
    float wA2 = joint2->bodyA->getAngularVelocity();
    float wB2 = joint2->bodyB->getAngularVelocity();

    float Cdot = J1 * wA1 + J2 * wB1 + J3 * wA2 + J4 * wB2;

    float lambda = -mass * (Cdot + bias);
    impulse += lambda;

    float iIA1 = joint1->bodyA->getInverseInertia();
    float iIB1 = joint1->bodyB->getInverseInertia();
    float iIA2 = joint2->bodyA->getInverseInertia();
    float iIB2 = joint2->bodyB->getInverseInertia();

    joint1->bodyA->setAngularVelocity(joint1->bodyA->getAngularVelocity() + J1 * iIA1 * lambda);
    joint1->bodyB->setAngularVelocity(joint1->bodyB->getAngularVelocity() + J2 * iIB1 * lambda);
    joint2->bodyA->setAngularVelocity(joint2->bodyA->getAngularVelocity() + J3 * iIA2 * lambda);
    joint2->bodyB->setAngularVelocity(joint2->bodyB->getAngularVelocity() + J4 * iIB2 * lambda);
}

Vec2 GearJoint::getReactionForce(float inv_dt) const {
    return Vec2(0, 0);
}

float GearJoint::getReactionTorque(float inv_dt) const {
    return impulse * inv_dt;
}

void GearJoint::setRatio(float r) {
    if (ratio != r) {
        float angle1 = joint1->bodyB->getRotation() - joint1->bodyA->getRotation();
        float angle2 = joint2->bodyB->getRotation() - joint2->bodyA->getRotation();
        
        ratio = r;
        constant = angle2 + ratio * angle1;
        
        joint1->bodyA->wakeUp();
        joint1->bodyB->wakeUp();
        joint2->bodyA->wakeUp();
        joint2->bodyB->wakeUp();
    }
}

float GearJoint::getRatio() const {
    return ratio;
}

bool GearJoint::isConnectedTo(PhysicalObject* body) const {
    return joint1->bodyA == body || joint1->bodyB == body || 
           joint2->bodyA == body || joint2->bodyB == body;
}

