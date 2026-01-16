#include "body.h"
#include "fixture.h"
#include "world.h"
#include <cmath>
#include <algorithm>

#define WAKE_MOVEMENT_THRESHOLD 0.001f
#define SLEEP_VELOCITY_THRESHOLD 0.005f
#define SLEEP_ANGULAR_VELOCITY_THRESHOLD 0.005f

Body::Body(World& world, int id, emscripten_val options)
    : world(world), id(id),
      type(!options["type"].isUndefined() ? static_cast<ObjectType>(options["type"].as<int>()) : ObjectType::DYNAMIC_OBJECT)
{
    int flags = 0;
    float mass = (type != ObjectType::FIXED_OBJECT && type != ObjectType::KINEMATIC_OBJECT && !options["mass"].isUndefined()) ? options["mass"].as<float>() : 0.0f;
    if (mass > 0.0f) flags |= HAS_FIXED_MASS;
    if (!options["wantsEvents"].isUndefined() && options["wantsEvents"].as<bool>()) {
        flags |= WANTS_EVENTS;
    }

    world.liveBodyIntData.push_back(id);
    world.liveBodyIntData.push_back((int)type);
    world.liveBodyIntData.push_back(flags); // Flags
    world.liveBodyIntData.push_back(0); // Fixture count

    float initX = !options["x"].isUndefined() ? options["x"].as<float>() : 0.0f;
    float initY = !options["y"].isUndefined() ? options["y"].as<float>() : 0.0f;
    float initR = !options["r"].isUndefined() ? options["r"].as<float>() : 0.0f;

    world.liveBodyFloatData.push_back(initX);
    world.liveBodyFloatData.push_back(initY);
    world.liveBodyFloatData.push_back(initR);
    world.liveBodyFloatData.push_back(!options["vx"].isUndefined() ? options["vx"].as<float>() : 0.0f);
    world.liveBodyFloatData.push_back(!options["vy"].isUndefined() ? options["vy"].as<float>() : 0.0f);
    world.liveBodyFloatData.push_back(!options["rs"].isUndefined() ? options["rs"].as<float>() : 0.0f);
    
    world.liveBodyFloatData.push_back(mass);
    world.liveBodyFloatData.push_back((mass > 0.0f) ? 1.0f / mass : 0.0f);
    world.liveBodyFloatData.push_back(!options["gscale"].isUndefined() ? options["gscale"].as<float>() : 1.0f);
    world.liveBodyFloatData.push_back(!options["linearDamping"].isUndefined() ? options["linearDamping"].as<float>() : 0.05f);
    world.liveBodyFloatData.push_back(!options["angularDamping"].isUndefined() ? options["angularDamping"].as<float>() : 0.05f);
    
    for (int i = 0; i < 10; ++i) world.liveBodyFloatData.push_back(0.0f); // FX, FY, IX, IY, IA, NFX, NFY, NIX, NIY, NIA
    world.liveBodyFloatData.push_back(0.0f); // InvInertia
    world.liveBodyFloatData.push_back(initX); // PrevX
    world.liveBodyFloatData.push_back(initY); // PrevY
    world.liveBodyFloatData.push_back(initR); // PrevR
    world.liveBodyFloatData.push_back(0.0f); // SleepTimer
    world.liveBodyFloatData.push_back(0.0f); // ErrAccX
    world.liveBodyFloatData.push_back(0.0f); // ErrAccR

    lastX = initX;
    lastY = initY;
    lastR = initR;
}

Body::~Body() {
    for (auto* contact : contacts) {
        auto it = std::remove(contact->contacts.begin(), contact->contacts.end(), this);
        contact->contacts.erase(it, contact->contacts.end());
    }
}

float Body::getX() const { return world.liveBodyFloatData[worldIndex * BODY_FDATA_EPO + BODY_FDATA_X]; }
void Body::setX(float x) { world.liveBodyFloatData[worldIndex * BODY_FDATA_EPO + BODY_FDATA_X] = x; recomputeAabb(0); wakeUp(); }
float Body::getY() const { return world.liveBodyFloatData[worldIndex * BODY_FDATA_EPO + BODY_FDATA_Y]; }
void Body::setY(float y) { world.liveBodyFloatData[worldIndex * BODY_FDATA_EPO + BODY_FDATA_Y] = y; recomputeAabb(0); wakeUp(); }
float Body::getRotation() const { return world.liveBodyFloatData[worldIndex * BODY_FDATA_EPO + BODY_FDATA_R]; }
void Body::setRotation(float r) { world.liveBodyFloatData[worldIndex * BODY_FDATA_EPO + BODY_FDATA_R] = r; recomputeAabb(0); wakeUp(); }

float Body::getVelocityX() const { return world.liveBodyFloatData[worldIndex * BODY_FDATA_EPO + BODY_FDATA_VX]; }
void Body::setVelocityX(float vx) { world.liveBodyFloatData[worldIndex * BODY_FDATA_EPO + BODY_FDATA_VX] = vx; wakeUp(); }
float Body::getVelocityY() const { return world.liveBodyFloatData[worldIndex * BODY_FDATA_EPO + BODY_FDATA_VY]; }
void Body::setVelocityY(float vy) { world.liveBodyFloatData[worldIndex * BODY_FDATA_EPO + BODY_FDATA_VY] = vy; wakeUp(); }
float Body::getAngularVelocity() const { return world.liveBodyFloatData[worldIndex * BODY_FDATA_EPO + BODY_FDATA_RS]; }
void Body::setAngularVelocity(float rs) { world.liveBodyFloatData[worldIndex * BODY_FDATA_EPO + BODY_FDATA_RS] = rs; wakeUp(); }

float Body::getMass() const { return world.liveBodyFloatData[worldIndex * BODY_FDATA_EPO + BODY_FDATA_M]; }
void Body::setMass(float m) {
    int idx = worldIndex * BODY_FDATA_EPO;
    world.liveBodyFloatData[idx + BODY_FDATA_M] = m;
    world.liveBodyFloatData[idx + BODY_FDATA_IM] = (m > 0) ? 1.0f / m : 0.0f;
    if (m > 0.0f) {
        world.liveBodyIntData[worldIndex * BODY_IDATA_EPO + BODY_IDATA_FLAGS] |= HAS_FIXED_MASS;
    } else {
        world.liveBodyIntData[worldIndex * BODY_IDATA_EPO + BODY_IDATA_FLAGS] &= ~HAS_FIXED_MASS;
    }
    updateInverseInertia();
}
float Body::getInverseMass() const { return world.liveBodyFloatData[worldIndex * BODY_FDATA_EPO + BODY_FDATA_IM]; }
float Body::getInverseInertia() const { return world.liveBodyFloatData[worldIndex * BODY_FDATA_EPO + BODY_FDATA_INV_INERTIA]; }

float Body::getGravityScale() const { return world.liveBodyFloatData[worldIndex * BODY_FDATA_EPO + BODY_FDATA_G_SCALE]; }
void Body::setGravityScale(float s) { world.liveBodyFloatData[worldIndex * BODY_FDATA_EPO + BODY_FDATA_G_SCALE] = s; }

float Body::getDamping() const { return world.liveBodyFloatData[worldIndex * BODY_FDATA_EPO + BODY_FDATA_DAMPING]; }
void Body::setDamping(float d) { world.liveBodyFloatData[worldIndex * BODY_FDATA_EPO + BODY_FDATA_DAMPING] = d; }
float Body::getRotationalDamping() const { return world.liveBodyFloatData[worldIndex * BODY_FDATA_EPO + BODY_FDATA_ANGULAR_DAMPING]; }
void Body::setRotationalDamping(float rd) { world.liveBodyFloatData[worldIndex * BODY_FDATA_EPO + BODY_FDATA_ANGULAR_DAMPING] = rd; }

float Body::getForceX() const { return world.liveBodyFloatData[worldIndex * BODY_FDATA_EPO + BODY_FDATA_FX]; }
void Body::setForceX(float fx) { world.liveBodyFloatData[worldIndex * BODY_FDATA_EPO + BODY_FDATA_FX] = fx; }
float Body::getForceY() const { return world.liveBodyFloatData[worldIndex * BODY_FDATA_EPO + BODY_FDATA_FY]; }
void Body::setForceY(float fy) { world.liveBodyFloatData[worldIndex * BODY_FDATA_EPO + BODY_FDATA_FY] = fy; }

void Body::setCategoryBits(uint32_t bits) {
    for (auto* f : fixtures) f->setCategoryBits(bits);
}

void Body::setMaskBits(uint32_t bits) {
    for (auto* f : fixtures) f->setMaskBits(bits);
}

bool Body::wantsEvents() const {
    return (world.liveBodyIntData[worldIndex * BODY_IDATA_EPO + BODY_IDATA_FLAGS] & WANTS_EVENTS) != 0;
}

bool Body::testPoint(float x, float y) const {
    for (auto* f : fixtures) if (f->testPoint(x, y)) return true;
    return false;
}

void Body::recomputeAabb(int mode) {
    float pr = getRotation();
    float cosR = cos(pr);
    float sinR = sin(pr);
    for (auto* f : fixtures) {
        f->updateAabb(cosR, sinR, mode);
        if (f->bvhNode) {
            f->bvhNode = world.bvh.updateLeaf(f->bvhNode, f->aabb);
        }
    }
}

Vec2 Body::getPosition() const { return Vec2(getX(), getY()); }
void Body::setPosition(Vec2 p) { setX(p.x); setY(p.y); }
Vec2 Body::getVelocity() const { return Vec2(getVelocityX(), getVelocityY()); }
void Body::setVelocity(Vec2 v) { setVelocityX(v.x); setVelocityY(v.y); }
void Body::setVelocityInternal(Vec2 v) {
    int idx = worldIndex * BODY_FDATA_EPO;
    world.liveBodyFloatData[idx + BODY_FDATA_VX] = v.x;
    world.liveBodyFloatData[idx + BODY_FDATA_VY] = v.y;
}
void Body::setAngularVelocityInternal(float rs) {
    world.liveBodyFloatData[worldIndex * BODY_FDATA_EPO + BODY_FDATA_RS] = rs;
}

void Body::applyForce(const Vec2& force) { applyForce(force.x, force.y); }
void Body::applyForce(float x, float y) {
    int idx = worldIndex * BODY_FDATA_EPO;
    if (getInverseMass() > 0 && (x || y)) {
        world.liveBodyFloatData[idx + BODY_FDATA_FX] += x;
        world.liveBodyFloatData[idx + BODY_FDATA_FY] += y;
        wakeUp();
    }
}

void Body::applyImpulse(const Vec2& impulse, const Vec2& contactPoint) { applyImpulse(impulse.x, impulse.y, contactPoint.x, contactPoint.y); }
void Body::applyImpulse(float x, float y, float cpX, float cpY) {
    int idx = worldIndex * BODY_FDATA_EPO;
    float im = getInverseMass();
    if (im > 0) {
        world.liveBodyFloatData[idx + BODY_FDATA_IX] += x;
        world.liveBodyFloatData[idx + BODY_FDATA_IY] += y;
        world.liveBodyFloatData[idx + BODY_FDATA_VX] += x * im;
        world.liveBodyFloatData[idx + BODY_FDATA_VY] += y * im;
        float torque = x * cpY - y * cpX;
        world.liveBodyFloatData[idx + BODY_FDATA_RS] += -torque * getInverseInertia();
        wakeUp();
    }
}

void Body::applyAngularImpulse(float torque) {
    int idx = worldIndex * BODY_FDATA_EPO;
    float invI = getInverseInertia();
    if (invI > 0 && torque != 0) {
        world.liveBodyFloatData[idx + BODY_FDATA_IA] += torque;
        world.liveBodyFloatData[idx + BODY_FDATA_RS] += torque * invI;
        wakeUp();
    }
}

void Body::integrateVelocities(float dt) {
    int idx = worldIndex * BODY_FDATA_EPO;
    float im = getInverseMass();
    
    // Apply accumulated impulses
    applyImpulse(world.liveBodyFloatData[idx + BODY_FDATA_NIX], world.liveBodyFloatData[idx + BODY_FDATA_NIY], 0, 0);
    world.liveBodyFloatData[idx + BODY_FDATA_NIX] = 0;
    world.liveBodyFloatData[idx + BODY_FDATA_NIY] = 0;
    
    applyAngularImpulse(world.liveBodyFloatData[idx + BODY_FDATA_NIA]);
    world.liveBodyFloatData[idx + BODY_FDATA_NIA] = 0;

    Vec2 vel(world.liveBodyFloatData[idx + BODY_FDATA_VX], world.liveBodyFloatData[idx + BODY_FDATA_VY]);
    
    // Apply accumulated forces
    applyForce(world.liveBodyFloatData[idx + BODY_FDATA_NFX], world.liveBodyFloatData[idx + BODY_FDATA_NFY]);
    world.liveBodyFloatData[idx + BODY_FDATA_NFX] = 0;
    world.liveBodyFloatData[idx + BODY_FDATA_NFY] = 0;

    // Damping
    applyForce(vel * -getDamping());
    
    Vec2 acc(0, 0);
    if (im > 0) {
        acc.x = world.liveBodyFloatData[idx + BODY_FDATA_FX] * im;
        acc.y = world.liveBodyFloatData[idx + BODY_FDATA_FY] * im;
    }
    
    forceVelocity = acc * dt;
    vel = vel + forceVelocity;
    
    // Velocity clamping for stability
    const float maxVel = 1000.0f;
    float speedSq = vel.magnitudeSquared();
    if (speedSq > maxVel * maxVel) {
        vel = vel * (maxVel / sqrt(speedSq));
    }

    world.liveBodyFloatData[idx + BODY_FDATA_VX] = vel.x;
    world.liveBodyFloatData[idx + BODY_FDATA_VY] = vel.y;
}

bool Body::integratePositions(float dt) {
    int idx = worldIndex * BODY_FDATA_EPO;
    
    Vec2 vel(world.liveBodyFloatData[idx + BODY_FDATA_VX], world.liveBodyFloatData[idx + BODY_FDATA_VY]);
    float rs = world.liveBodyFloatData[idx + BODY_FDATA_RS];

    // Settling and rotational damping (only for dynamic objects)
    if (type == ObjectType::DYNAMIC_OBJECT) {
        if (std::abs(vel.x) < SLEEP_VELOCITY_THRESHOLD * 0.1f) vel.x *= 0.95f;
        if (std::abs(vel.y) < SLEEP_VELOCITY_THRESHOLD * 0.1f) vel.y *= 0.95f;
        
        rs *= (1.0f - getRotationalDamping() * dt);
        if (std::abs(rs) < SLEEP_ANGULAR_VELOCITY_THRESHOLD * 0.5f) rs *= 0.8f;
    }

    Vec2 pos = getPosition() + vel * dt;
    float currentR = world.liveBodyFloatData[idx + BODY_FDATA_R];
    
    // NaN recovery
    if (!std::isfinite(pos.x) || !std::isfinite(pos.y) || !std::isfinite(currentR) || 
        !std::isfinite(vel.x) || !std::isfinite(vel.y) || !std::isfinite(rs)) {
        pos = Vec2(lastX, lastY);
        currentR = lastR;
        vel = Vec2(0, 0);
        rs = 0;
        world.liveBodyFloatData[idx + BODY_FDATA_R] = currentR;
    }

    // Pseudo-velocity (position correction from solver)
    pos = pos + pseudoVelocity * dt;
    float nextR = currentR + pseudoAngularVelocity * dt;
    pseudoVelocity = Vec2(0, 0);
    pseudoAngularVelocity = 0;

    world.liveBodyFloatData[idx + BODY_FDATA_X] = pos.x;
    world.liveBodyFloatData[idx + BODY_FDATA_Y] = pos.y;
    world.liveBodyFloatData[idx + BODY_FDATA_VX] = vel.x;
    world.liveBodyFloatData[idx + BODY_FDATA_VY] = vel.y;
    world.liveBodyFloatData[idx + BODY_FDATA_RS] = rs;
    world.liveBodyFloatData[idx + BODY_FDATA_R] = nextR + rs * dt;

    float dx = pos.x - lastX;
    float dy = pos.y - lastY;
    float dr = world.liveBodyFloatData[idx + BODY_FDATA_R] - lastR;
    
    sleepErrAccumulatorX += dx;
    sleepErrAccumulatorY += dy;
    sleepErrAccumulatorR += dr;
    
    lastX = pos.x; lastY = pos.y; lastR = world.liveBodyFloatData[idx + BODY_FDATA_R];
    
    bool moved = dx != 0 || dy != 0 || dr != 0;
    if (moved && (std::abs(sleepErrAccumulatorX) > WAKE_MOVEMENT_THRESHOLD || std::abs(sleepErrAccumulatorY) > WAKE_MOVEMENT_THRESHOLD || std::abs(sleepErrAccumulatorR) > WAKE_MOVEMENT_THRESHOLD)) {
        sleepTimer = 0;
        sleepErrAccumulatorX = 0; sleepErrAccumulatorY = 0; sleepErrAccumulatorR = 0;
    } else {
        sleepTimer += dt;
        if (sleepTimer > sleepTimeRequired) sleep();
    }
    return moved;
}

void Body::sleep() {
    if (!isSleeping && canSleep) {
        isSleeping = true;
        world.liveBodyIntData[worldIndex * BODY_IDATA_EPO + BODY_IDATA_FLAGS] |= IS_SLEEPING;
        setVelocityInternal(Vec2(0, 0));
        setAngularVelocityInternal(0);
        if (wantsEvents()) {
            world.addEvent((int)EventType::SLEEP, id, -1, -1, -1, 0.0f);
        }
        
        // Force shrink-wrap optimization
        float pr = getRotation();
        float cosR = cos(pr);
        float sinR = sin(pr);
        for (auto* f : fixtures) {
            if (f->bvhNode) {
                f->bvhNode->properties.isSleeping = true;
                f->updateAabb(cosR, sinR, 1); // Mode 1 = tight AABB
                f->bvhNode = world.bvh.updateLeaf(f->bvhNode, f->aabb);
            }
        }
    }
}

void Body::wakeUp() {
    if (isSleeping) {
        isSleeping = false;
        world.liveBodyIntData[worldIndex * BODY_IDATA_EPO + BODY_IDATA_FLAGS] &= ~IS_SLEEPING;
        sleepTimer = 0;
        if (wantsEvents()) {
            world.addEvent((int)EventType::WAKE, id, -1, -1, -1, 0.0f);
        }
        
        for (auto* f : fixtures) {
            if (f->bvhNode) {
                f->bvhNode->wakeUp();
            }
        }

        for (auto* contact : contacts) contact->wakeUp();
    }
}

void Body::addContact(Body* other) {
    for (auto* c : contacts) if (c == other) return;
    contacts.push_back(other);
    if (!other->isSleeping) wakeUp();
}

void Body::removeContact(Body* other) {
    auto it = std::remove(contacts.begin(), contacts.end(), other);
    if (it != contacts.end()) {
        contacts.erase(it, contacts.end());
    }
}

void Body::updateInverseInertia() {
    recomputeMassProperties();
}

void Body::recomputeMassProperties() {
    float im = getInverseMass();
    if (type == ObjectType::FIXED_OBJECT || type == ObjectType::KINEMATIC_OBJECT) {
        world.liveBodyFloatData[worldIndex * BODY_FDATA_EPO + BODY_FDATA_INV_INERTIA] = 0.0f;
        return;
    }

    if (fixtures.empty()) {
        world.liveBodyFloatData[worldIndex * BODY_FDATA_EPO + BODY_FDATA_M] = 0.0f;
        world.liveBodyFloatData[worldIndex * BODY_FDATA_EPO + BODY_FDATA_IM] = 0.0f;
        world.liveBodyFloatData[worldIndex * BODY_FDATA_EPO + BODY_FDATA_INV_INERTIA] = 0.0f;
        return;
    }

    float totalMass = 0.0f;
    float totalInertia = 0.0f;
    Vec2 center(0.0f, 0.0f);

    for (auto* f : fixtures) {
        MassData data = f->getMassData();
        totalMass += data.mass;
        center = center + data.center * data.mass;
    }

    if (totalMass > 0.0f) {
        center = center / totalMass;

        // Parallel Axis Theorem for total inertia: Σ (I_local + m * d^2)
        // where d is distance from fixture center to body COM
        for (auto* f : fixtures) {
            MassData data = f->getMassData();
            float dSq = (data.center - center).magnitudeSquared();
            totalInertia += data.inertia + data.mass * dSq;
        }

        // Shift origin to COM
        if (center.magnitudeSquared() > 0.0001f) {
            float pr = getRotation();
            Vec2 worldCenterShift = center.rotate(pr);
            
            // Update body position
            int idx = worldIndex * BODY_FDATA_EPO;
            world.liveBodyFloatData[idx + BODY_FDATA_X] += worldCenterShift.x;
            world.liveBodyFloatData[idx + BODY_FDATA_Y] += worldCenterShift.y;

            // Update fixture local positions
            for (auto* f : fixtures) {
                int fIdx = f->worldIndex * FIXTURE_FDATA_EPO;
                world.liveFixtureFloatData[fIdx + FIXTURE_FDATA_LOCAL_X] -= center.x;
                world.liveFixtureFloatData[fIdx + FIXTURE_FDATA_LOCAL_Y] -= center.y;
                f->updateAabb(1); // Update AABB with new local position
            }
        }
    }

    int idx = worldIndex * BODY_FDATA_EPO;
    int flags = world.liveBodyIntData[worldIndex * BODY_IDATA_EPO + BODY_IDATA_FLAGS];

    if (totalMass > 0.0f) {
        if (flags & HAS_FIXED_MASS) {
            float manualMass = world.liveBodyFloatData[idx + BODY_FDATA_M];
            if (manualMass > 0.0f) {
                totalInertia *= (manualMass / totalMass);
            }
        } else {
            world.liveBodyFloatData[idx + BODY_FDATA_M] = totalMass;
            world.liveBodyFloatData[idx + BODY_FDATA_IM] = 1.0f / totalMass;
        }
        world.liveBodyFloatData[idx + BODY_FDATA_INV_INERTIA] = (totalInertia > 0.0f) ? 1.0f / totalInertia : 0.0f;
    } else {
        if (totalInertia > 0.0f) {
            world.liveBodyFloatData[idx + BODY_FDATA_INV_INERTIA] = 1.0f / totalInertia;
        }
    }
}

void Body::addFixture(Fixture* fixture) {
    fixtures.push_back(fixture);
    world.liveBodyIntData[worldIndex * BODY_IDATA_EPO + BODY_IDATA_FIXTURE_COUNT] = fixtures.size();
    updateInverseInertia();
}

int Body::createFixture(emscripten_val options) {
    return world.addFixture(id, 0, options);
}
