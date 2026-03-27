#include "gear-joint.h"
#include "body.h"
#include "hinge-joint.h"
#include "simd-math.h"
#include <cmath>

GearJoint::GearJoint(int id, HingeJoint* joint1, HingeJoint* joint2, float ratio)
    : Joint(id, joint1->bodyB, joint2->bodyB), joint1(joint1), joint2(joint2), ratio(ratio), impulse(0.0f) {}

void GearJoint::preSolve(float dt) {
    _dt = dt;
    Body* bodyA = joint1->bodyA;
    Body* bodyB = joint1->bodyB;
    Body* bodyC = joint2->bodyA;
    Body* bodyD = joint2->bodyB;

    float iIA = bodyA->getInverseInertia();
    float iIB = bodyB->getInverseInertia();
    float iIC = bodyC->getInverseInertia();
    float iID = bodyD->getInverseInertia();

    float k = ratio * ratio * (iIA + iIB) + (iIC + iID);
    mass = (k > 0.0f) ? 1.0f / k : 0.0f;

    bodyA->setAngularVelocityInternal(bodyA->getAngularVelocity() - ratio * impulse * iIA);
    bodyB->setAngularVelocityInternal(bodyB->getAngularVelocity() + ratio * impulse * iIB);
    bodyC->setAngularVelocityInternal(bodyC->getAngularVelocity() - impulse * iIC);
    bodyD->setAngularVelocityInternal(bodyD->getAngularVelocity() + impulse * iID);
}

void GearJoint::solve() {
    Body* bodyA = joint1->bodyA;
    Body* bodyB = joint1->bodyB;
    Body* bodyC = joint2->bodyA;
    Body* bodyD = joint2->bodyB;

    float wA = bodyA->getAngularVelocity();
    float wB = bodyB->getAngularVelocity();
    float wC = bodyC->getAngularVelocity();
    float wD = bodyD->getAngularVelocity();

    // Constraint: ratio * (wB - wA) + (wD - wC) = 0
    float Cdot = ratio * (wB - wA) + (wD - wC);
    float lambda = -mass * Cdot;
    impulse += lambda;

    bodyA->setAngularVelocityInternal(wA - ratio * lambda * bodyA->getInverseInertia());
    bodyB->setAngularVelocityInternal(wB + ratio * lambda * bodyB->getInverseInertia());
    bodyC->setAngularVelocityInternal(wC - lambda * bodyC->getInverseInertia());
    bodyD->setAngularVelocityInternal(wD + lambda * bodyD->getInverseInertia());
}

void GearJoint::solveFast() {
    SolverData& sA = *static_cast<SolverData*>(context.a);
    SolverData& sB = *static_cast<SolverData*>(context.b);
    SolverData& sC = *static_cast<SolverData*>(context.c);
    SolverData& sD = *static_cast<SolverData*>(context.d);

    float Cdot = ratio * (sB.w - sA.w) + (sD.w - sC.w);
    float lambda = -mass * Cdot;
    impulse += lambda;

    sA.w -= ratio * lambda * sA.iI;
    sB.w += ratio * lambda * sB.iI;
    sC.w -= lambda * sC.iI;
    sD.w += lambda * sD.iI;
}

void GearJoint::solveFastSIMD(GearJoint** joints) {
#if HWY_TARGET != HWY_SCALAR
    // Load joint properties
    V128 mass = v128_make_f32(joints[0]->mass, joints[1]->mass, joints[2]->mass, joints[3]->mass);
    V128 ratio = v128_make_f32(joints[0]->ratio, joints[1]->ratio, joints[2]->ratio, joints[3]->ratio);

    SolverData* sA[4];
    SolverData* sB[4];
    SolverData* sC[4];
    SolverData* sD[4];
    for (int i = 0; i < 4; ++i) {
        sA[i] = static_cast<SolverData*>(joints[i]->context.a);
        sB[i] = static_cast<SolverData*>(joints[i]->context.b);
        sC[i] = static_cast<SolverData*>(joints[i]->context.c);
        sD[i] = static_cast<SolverData*>(joints[i]->context.d);
    }

    // Load angular velocities and inertia properties
    V128 wA = v128_make_f32(sA[0]->w, sA[1]->w, sA[2]->w, sA[3]->w);
    V128 wB = v128_make_f32(sB[0]->w, sB[1]->w, sB[2]->w, sB[3]->w);
    V128 wC = v128_make_f32(sC[0]->w, sC[1]->w, sC[2]->w, sC[3]->w);
    V128 wD = v128_make_f32(sD[0]->w, sD[1]->w, sD[2]->w, sD[3]->w);

    V128 iIA = v128_make_f32(sA[0]->iI, sA[1]->iI, sA[2]->iI, sA[3]->iI);
    V128 iIB = v128_make_f32(sB[0]->iI, sB[1]->iI, sB[2]->iI, sB[3]->iI);
    V128 iIC = v128_make_f32(sC[0]->iI, sC[1]->iI, sC[2]->iI, sC[3]->iI);
    V128 iID = v128_make_f32(sD[0]->iI, sD[1]->iI, sD[2]->iI, sD[3]->iI);

    // Cdot = ratio * (wB - wA) + (wD - wC)
    V128 Cdot = v128_add_f32(v128_mul_f32(ratio, v128_sub_f32(wB, wA)), v128_sub_f32(wD, wC));

    // lambda = -mass * Cdot
    V128 lambda = v128_mul_f32(v128_splat_f32(-1.0f), v128_mul_f32(mass, Cdot));

    // Apply updates
    V128 ratioLambda = v128_mul_f32(ratio, lambda);
    
    wA = v128_sub_f32(wA, v128_mul_f32(ratioLambda, iIA));
    wB = v128_add_f32(wB, v128_mul_f32(ratioLambda, iIB));
    wC = v128_sub_f32(wC, v128_mul_f32(lambda, iIC));
    wD = v128_add_f32(wD, v128_mul_f32(lambda, iID));

    // Store back
    alignas(16) float resWA[4], resWB[4], resWC[4], resWD[4], resL[4];
    v128_store_f32(resWA, wA);
    v128_store_f32(resWB, wB);
    v128_store_f32(resWC, wC);
    v128_store_f32(resWD, wD);
    v128_store_f32(resL, lambda);

    for (int i = 0; i < 4; ++i) {
        sA[i]->w = resWA[i];
        sB[i]->w = resWB[i];
        sC[i]->w = resWC[i];
        sD[i]->w = resWD[i];
        joints[i]->impulse += resL[i];
    }
#else
    for (int i = 0; i < 4; ++i) joints[i]->solveFast();
#endif
}

Vec2 GearJoint::getReactionForce(float inv_dt) const { return Vec2(0, 0); }
float GearJoint::getReactionTorque(float inv_dt) const { return impulse * inv_dt; }
void GearJoint::setRatio(float r) { ratio = r; joint1->bodyB->forceWakeUp(); joint2->bodyB->forceWakeUp(); }
float GearJoint::getRatio() const { return ratio; }
bool GearJoint::isConnectedTo(Body* body) const {
    return joint1->bodyA == body || joint1->bodyB == body || joint2->bodyA == body || joint2->bodyB == body;
}

void GearJoint::solvePosition() {}
