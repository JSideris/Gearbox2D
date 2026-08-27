#include "body.h"
#include "fixture.h"
#include "joint.h"
#include "world.h"
#include <cmath>
#include <algorithm>
#include <vector>

namespace {

bool bodyIsStaticLike(const Body* body) {
	return body != nullptr &&
		(body->type == ObjectType::FIXED_OBJECT || body->type == ObjectType::KINEMATIC_OBJECT);
}

struct SleepSupport {
	bool any = false;
	bool worldContact = false;
	std::vector<Body*> component;
};

SleepSupport jointComponentSupport(Body* seed) {
	SleepSupport flags;
	if (!seed) {
		return flags;
	}
	std::vector<Body*> stack;
	stack.push_back(seed);
	flags.component.push_back(seed);
	while (!stack.empty()) {
		Body* body = stack.back();
		stack.pop_back();
		if (body->getContactCount() > 0 || body->sleptOnWorldContact) {
			flags.worldContact = true;
			flags.any = true;
		}
		for (Joint* joint : body->joints) {
			if (!joint) {
				continue;
			}
			Body* other = (joint->bodyA == body) ? joint->bodyB : joint->bodyA;
			if (!other) {
				continue;
			}
			if (bodyIsStaticLike(other)) {
				flags.any = true;
				continue;
			}
			bool seen = false;
			for (Body* v : flags.component) {
				if (v == other) {
					seen = true;
					break;
				}
			}
			if (seen) {
				continue;
			}
			flags.component.push_back(other);
			stack.push_back(other);
		}
	}
	return flags;
}

} // namespace

Body::Body(World& world, int id, int worldIndex, emscripten_val options)
    : world(world), id(id), worldIndex(worldIndex)
{
    if (!options["type"].isUndefined()) {
        type = static_cast<ObjectType>(options["type"].as<int>());
    } else {
        type = ObjectType::DYNAMIC_OBJECT;
    }

    if (!options["canSleep"].isUndefined()) {
        canSleep = options["canSleep"].as<bool>();
    }
    if (!options["sleepTimeRequired"].isUndefined()) {
        sleepTimeRequired = options["sleepTimeRequired"].as<float>();
    }

    int flags = 0;
    if (type == ObjectType::FIXED_OBJECT) {
        flags |= IS_SLEEPING | HAS_FIXED_MASS;
        isSleeping = true;
    } else if (!options["isSleeping"].isUndefined() && options["isSleeping"].as<bool>()) {
        flags |= IS_SLEEPING;
        isSleeping = true;
    }
    float mass = (type != ObjectType::FIXED_OBJECT && type != ObjectType::KINEMATIC_OBJECT && !options["mass"].isUndefined()) ? options["mass"].as<float>() : 0.0f;
    if (mass > 0.0f) flags |= HAS_FIXED_MASS;
    if (!options["wantsEvents"].isUndefined() && options["wantsEvents"].as<bool>()) {
        flags |= WANTS_EVENTS;
    }

    world.liveBodyIntData[GET_BODY_IDATA_INDEX(worldIndex, BODY_IDATA_ID)] = id;
    world.liveBodyIntData[GET_BODY_IDATA_INDEX(worldIndex, BODY_IDATA_TYPE)] = (int)type;
    world.liveBodyIntData[GET_BODY_IDATA_INDEX(worldIndex, BODY_IDATA_FLAGS)] = flags;
    world.liveBodyIntData[GET_BODY_IDATA_INDEX(worldIndex, BODY_IDATA_FIXTURE_COUNT)] = 0;

    float initX = !options["x"].isUndefined() ? options["x"].as<float>() : 0.0f;
    float initY = !options["y"].isUndefined() ? options["y"].as<float>() : 0.0f;
    float initR = !options["r"].isUndefined() ? options["r"].as<float>() : 0.0f;

    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_X)] = initX;
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_Y)] = initY;
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_R)] = initR;
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_VX)] = (!isSleeping && !options["vx"].isUndefined()) ? options["vx"].as<float>() : 0.0f;
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_VY)] = (!isSleeping && !options["vy"].isUndefined()) ? options["vy"].as<float>() : 0.0f;
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_RS)] = (!isSleeping && !options["rs"].isUndefined()) ? options["rs"].as<float>() : 0.0f;
    
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_M)] = mass;
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_IM)] = (mass > 0.0f) ? 1.0f / mass : 0.0f;
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_G_SCALE)] = !options["gscale"].isUndefined() ? options["gscale"].as<float>() : 1.0f;
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_DAMPING)] = !options["linearDamping"].isUndefined() ? options["linearDamping"].as<float>() : 0.05f;
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_ANGULAR_DAMPING)] = !options["angularDamping"].isUndefined() ? options["angularDamping"].as<float>() : 0.05f;
    
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_FX)] = 0.0f;
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_FY)] = 0.0f;
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_IX)] = 0.0f;
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_IY)] = 0.0f;
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_IA)] = 0.0f;
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_NFX)] = 0.0f;
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_NFY)] = 0.0f;
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_NIX)] = 0.0f;
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_NIY)] = 0.0f;
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_NIA)] = 0.0f;

    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_INV_INERTIA)] = 0.0f;
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_PREV_X)] = initX;
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_PREV_Y)] = initY;
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_PREV_R)] = initR;
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_SLEEP_TIMER)] = 0.0f;
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_ERR_ACC_X)] = 0.0f;
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_ERR_ACC_Y)] = 0.0f;
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_ERR_ACC_R)] = 0.0f;
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_FORCE_VX)] = 0.0f;
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_FORCE_VY)] = 0.0f;
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_LAST_X)] = initX;
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_LAST_Y)] = initY;
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_LAST_R)] = initR;
}

float Body::getSleepTimer() const { return world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_SLEEP_TIMER)]; }
void Body::setSleepTimer(float t) { world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_SLEEP_TIMER)] = t; }
float Body::getSleepErrAccumulatorX() const { return world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_ERR_ACC_X)]; }
void Body::setSleepErrAccumulatorX(float x) { world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_ERR_ACC_X)] = x; }
float Body::getSleepErrAccumulatorY() const { return world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_ERR_ACC_Y)]; }
void Body::setSleepErrAccumulatorY(float y) { world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_ERR_ACC_Y)] = y; }
float Body::getSleepErrAccumulatorR() const { return world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_ERR_ACC_R)]; }
void Body::setSleepErrAccumulatorR(float r) { world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_ERR_ACC_R)] = r; }

float Body::getLastX() const { return world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_LAST_X)]; }
void Body::setLastX(float x) { world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_LAST_X)] = x; }
float Body::getLastY() const { return world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_LAST_Y)]; }
void Body::setLastY(float y) { world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_LAST_Y)] = y; }
float Body::getLastR() const { return world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_LAST_R)]; }
void Body::setLastR(float r) { world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_LAST_R)] = r; }

Vec2 Body::getForceVelocity() const {
    return Vec2(world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_FORCE_VX)], 
                world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_FORCE_VY)]);
}
void Body::setForceVelocity(const Vec2& v) {
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_FORCE_VX)] = v.x;
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_FORCE_VY)] = v.y;
}

Body::~Body() {
    for (auto* contact : contacts) {
        auto it = std::remove(contact->contacts.begin(), contact->contacts.end(), this);
        contact->contacts.erase(it, contact->contacts.end());
    }
}

float Body::getX() const { return world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_X)]; }
void Body::setX(float x) { 
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_X)] = x; 
    setLastX(x); 
    setSleepErrAccumulatorX(0); 
    recomputeAabb(0); 
    wakeUp(); 
}
float Body::getY() const { return world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_Y)]; }
void Body::setY(float y) { 
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_Y)] = y; 
    setLastY(y); 
    setSleepErrAccumulatorY(0); 
    recomputeAabb(0); 
    wakeUp(); 
}
float Body::getRotation() const { return world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_R)]; }
void Body::setRotation(float r) { 
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_R)] = r; 
    setLastR(r); 
    setSleepErrAccumulatorR(0); 
    recomputeAabb(0); 
    wakeUp(); 
}

float Body::getVelocityX() const { return world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_VX)]; }
void Body::setVelocityX(float vx) { world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_VX)] = vx; wakeUp(); }
float Body::getVelocityY() const { return world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_VY)]; }
void Body::setVelocityY(float vy) { world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_VY)] = vy; wakeUp(); }
float Body::getAngularVelocity() const { return world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_RS)]; }
void Body::setAngularVelocity(float rs) { world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_RS)] = rs; wakeUp(); }

float Body::getMass() const { return world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_M)]; }
void Body::setMass(float m) {
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_M)] = m;
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_IM)] = (m > 0) ? 1.0f / m : 0.0f;
    if (m > 0.0f) world.liveBodyIntData[GET_BODY_IDATA_INDEX(worldIndex, BODY_IDATA_FLAGS)] |= HAS_FIXED_MASS;
    else world.liveBodyIntData[GET_BODY_IDATA_INDEX(worldIndex, BODY_IDATA_FLAGS)] &= ~HAS_FIXED_MASS;
    updateInverseInertia();
}
float Body::getInverseMass() const { return world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_IM)]; }
float Body::getInverseInertia() const { return world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_INV_INERTIA)]; }

float Body::getGravityScale() const { return world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_G_SCALE)]; }
void Body::setGravityScale(float s) { world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_G_SCALE)] = s; }

float Body::getDamping() const { return world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_DAMPING)]; }
void Body::setDamping(float d) { world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_DAMPING)] = d; }
float Body::getRotationalDamping() const { return world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_ANGULAR_DAMPING)]; }
void Body::setRotationalDamping(float rd) { world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_ANGULAR_DAMPING)] = rd; }

float Body::getForceX() const { return world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_FX)]; }
void Body::setForceX(float fx) { world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_FX)] = fx; }
float Body::getForceY() const { return world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_FY)]; }
void Body::setForceY(float fy) { world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_FY)] = fy; }

void Body::setCategoryBits(uint32_t bits) { for (auto* f : fixtures) f->setCategoryBits(bits); }
void Body::setMaskBits(uint32_t bits) { for (auto* f : fixtures) f->setMaskBits(bits); }
bool Body::wantsEvents() const { return (world.liveBodyIntData[GET_BODY_IDATA_INDEX(worldIndex, BODY_IDATA_FLAGS)] & WANTS_EVENTS) != 0; }
bool Body::testPoint(float x, float y) const { for (auto* f : fixtures) if (f->testPoint(x, y)) return true; return false; }

void Body::recomputeAabb(int mode) {
    float pr = getRotation();
    float cosR = std::cos(pr);
    float sinR = std::sin(pr);
    for (auto* f : fixtures) {
        f->updateAabb(cosR, sinR, mode);
        if (f->bvhNode) f->bvhNode = world.bvh.updateLeaf(f->bvhNode, f->aabb, f->getCollisionProperties());
    }
}

Vec2 Body::getPosition() const { return Vec2(getX(), getY()); }
void Body::setPosition(Vec2 p) {
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_X)] = p.x;
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_Y)] = p.y;
    setLastX(p.x);
    setLastY(p.y);
    setSleepErrAccumulatorX(0);
    setSleepErrAccumulatorY(0);
    recomputeAabb(0);
    wakeUp();
}
Vec2 Body::getVelocity() const { return Vec2(getVelocityX(), getVelocityY()); }
void Body::setVelocity(Vec2 v) { setVelocityX(v.x); setVelocityY(v.y); }
void Body::setVelocityInternal(Vec2 v) {
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_VX)] = v.x;
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_VY)] = v.y;
}
void Body::setAngularVelocityInternal(float rs) { world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_RS)] = rs; }

void Body::applyForce(const Vec2& force) { applyForce(force.x, force.y); }
void Body::applyForce(float x, float y) {
    if (getInverseMass() > 0 && (x || y)) {
        world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_FX)] += x;
        world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_FY)] += y;
        wakeUp();
    }
}

void Body::applyImpulse(const Vec2& impulse, const Vec2& contactPoint) { applyImpulse(impulse.x, impulse.y, contactPoint.x, contactPoint.y); }
void Body::applyImpulse(float x, float y, float cpX, float cpY) {
    float im = getInverseMass();
    if (im > 0) {
        world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_IX)] += x;
        world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_IY)] += y;
        world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_VX)] += x * im;
        world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_VY)] += y * im;
        float torque = x * cpY - y * cpX;
        world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_RS)] += -torque * getInverseInertia();
        wakeUp();
    }
}

void Body::applyAngularImpulse(float torque) {
    float invI = getInverseInertia();
    if (invI > 0 && torque != 0) {
        world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_IA)] += torque;
        world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_RS)] += torque * invI;
        wakeUp();
    }
}

void Body::sleep() {
    if (!isSleeping && canSleep) {
        SleepSupport support = jointComponentSupport(this);
        for (Body* member : support.component) {
            if (!member || bodyIsStaticLike(member)) {
                continue;
            }
            if (support.any) {
                member->sleptOnSupport = true;
            }
            if (support.worldContact) {
                member->sleptOnWorldContact = true;
            }
        }
        sleptOnSupport = support.any;
        sleptOnWorldContact = support.worldContact;
        isSleeping = true;
        world.liveBodyIntData[GET_BODY_IDATA_INDEX(worldIndex, BODY_IDATA_FLAGS)] |= IS_SLEEPING;
        setVelocityInternal(Vec2(0, 0));
        setAngularVelocityInternal(0);
        for (Joint* joint : joints) {
            if (joint && joint->getType() == JointType::SPRING) {
                joint->clearAccumulatedImpulse();
            }
        }
        if (wantsEvents()) world.addEvent((int)EventType::SLEEP, id, -1, -1, -1, 0.0f);
        float pr = getRotation(); float cosR = std::cos(pr); float sinR = std::sin(pr);
        for (auto* f : fixtures) {
            if (f->bvhNode) {
                f->bvhNode->properties.isSleeping = true;
                f->updateAabb(cosR, sinR, 1);
                f->bvhNode = world.bvh.updateLeaf(f->bvhNode, f->aabb, f->getCollisionProperties());
            }
        }
    }
}

void Body::wakeUp() {
    if (isSleeping && type != ObjectType::FIXED_OBJECT) {
        isSleeping = false;
        world.liveBodyIntData[GET_BODY_IDATA_INDEX(worldIndex, BODY_IDATA_FLAGS)] &= ~IS_SLEEPING;
        setSleepTimer(0);
        timeSinceWake = 0.0f;
        if (wantsEvents()) world.addEvent((int)EventType::WAKE, id, -1, -1, -1, 0.0f);
        for (auto* f : fixtures) if (f->bvhNode) f->bvhNode->wakeUp();
        for (auto* contact : contacts) contact->wakeUp();
    }
}

void Body::forceWakeUp() {
    setSleepTimer(0);
    wakeUp();
    if (!isSleeping) {
        // If it was already awake, wakeUp() did nothing, 
        // but we still want to make sure it stays awake for another full second
        setSleepTimer(0);
    }
}

void Body::addContact(Body* other) {
    for (auto* c : contacts) if (c == other) return;
    contacts.push_back(other);
    if (!other->isSleeping && type != ObjectType::FIXED_OBJECT) wakeUp();
}

void Body::removeContact(Body* other) {
    auto it = std::remove(contacts.begin(), contacts.end(), other);
    if (it != contacts.end()) contacts.erase(it, contacts.end());
}

void Body::updateInverseInertia() { recomputeInverseInertia(); }

void Body::recomputeInverseInertia() {
    float im = getInverseMass();
    if (type == ObjectType::FIXED_OBJECT || type == ObjectType::KINEMATIC_OBJECT) {
        world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_INV_INERTIA)] = 0.0f;
        return;
    }
    if (fixtures.empty()) {
        world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_M)] = 0.0f;
        world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_IM)] = 0.0f;
        world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_INV_INERTIA)] = 0.0f;
        return;
    }
    float totalMass = 0.0f; float totalInertia = 0.0f; Vec2 center(0.0f, 0.0f);
    for (auto* f : fixtures) {
        MassData data = f->getMassData();
        totalMass += data.mass; center = center + data.center * data.mass;
    }
    if (totalMass > 0.0f) {
        center = center / totalMass;
        for (auto* f : fixtures) {
            MassData data = f->getMassData();
            float dSq = (data.center - center).magnitudeSquared();
            totalInertia += data.inertia + data.mass * dSq;
        }
        if (center.magnitudeSquared() > 0.0001f) {
            float pr = getRotation(); Vec2 worldCenterShift = center.rotate(pr);
            world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_X)] += worldCenterShift.x;
            world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_Y)] += worldCenterShift.y;
            setLastX(getLastX() + worldCenterShift.x);
            setLastY(getLastY() + worldCenterShift.y);
            for (auto* f : fixtures) {
                world.liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(f->worldIndex, FIXTURE_FDATA_LOCAL_X)] -= center.x;
                world.liveFixtureFloatData[GET_FIXTURE_FDATA_INDEX(f->worldIndex, FIXTURE_FDATA_LOCAL_Y)] -= center.y;
                f->updateAabb(1);
            }
        }
    }
    int flags = world.liveBodyIntData[GET_BODY_IDATA_INDEX(worldIndex, BODY_IDATA_FLAGS)];
    if (totalMass > 0.0f) {
        if (flags & HAS_FIXED_MASS) {
            float manualMass = world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_M)];
            if (manualMass > 0.0f) totalInertia *= (manualMass / totalMass);
        } else {
            world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_M)] = totalMass;
            world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_IM)] = 1.0f / totalMass;
        }
        world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_INV_INERTIA)] = (totalInertia > 0.0f) ? 1.0f / totalInertia : 0.0f;
    } else {
        if (totalInertia > 0.0f) world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_INV_INERTIA)] = 1.0f / totalInertia;
    }
}

void Body::addFixture(Fixture* fixture, bool recomputeMass) {
    fixtures.push_back(fixture);
    world.liveBodyIntData[GET_BODY_IDATA_INDEX(worldIndex, BODY_IDATA_FIXTURE_COUNT)] = (int)fixtures.size();
    if (recomputeMass) {
        updateInverseInertia();
    }
}

SolverData Body::getSolverData() const {
    return {
        Vec2(world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_VX)], 
             world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_VY)]),
        world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_RS)],
        world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_IM)],
        world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_INV_INERTIA)]
    };
}

void Body::setSolverData(const SolverData& data) {
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_VX)] = data.v.x;
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_VY)] = data.v.y;
    world.liveBodyFloatData[GET_BODY_FDATA_INDEX(worldIndex, BODY_FDATA_RS)] = data.w;
}

int Body::createFixture(emscripten_val options) { return world.createFixture(id, 0, options); }

void Body::disableCollisionWith(int otherId) {
    if (std::find(_disabledBodyIds.begin(), _disabledBodyIds.end(), otherId) == _disabledBodyIds.end()) {
        _disabledBodyIds.push_back(otherId);
    }
}

void Body::enableCollisionWith(int otherId) {
    auto it = std::find(_disabledBodyIds.begin(), _disabledBodyIds.end(), otherId);
    if (it != _disabledBodyIds.end()) {
        _disabledBodyIds.erase(it);
    }
}
