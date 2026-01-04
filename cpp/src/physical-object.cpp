// #include "vec2.h"
#include "physical-object.h"

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#include <stdio.h>
#endif

#define EXPERIMENTAL_SHRINK_WRAP_AABB_ON_SLEEP
#define ENABLE_SLEEPING

// static Vec2 _dampingForce;
// static Vec2 _acceleration;
// static Vec2 _dv;
// static Vec2 _force;
// static Vec2 _position;
// static Vec2 _velocity;   // Linear velocity of the object

// TODO: probably makes more sense to make this configurable.
// Or compute it based on world scale.
// TODO: make sure this doesn't get weird with different frame rates.
#define WAKE_MOVEMENT_THRESHOLD 0.05f
#define SLEEP_VELOCITY_THRESHOLD 0.1f
#define SLEEP_ANGULAR_VELOCITY_THRESHOLD 0.1f

static Vec2 _dampingForce;
static Vec2 _acceleration;
static Vec2 _dv;
static Vec2 _force;
static Vec2 _position;
static Vec2 _velocity;   // Linear velocity of the object
static float _inverseMass;

PhysicalObject::PhysicalObject(World& world, int id, emscripten_val options) 
    : world(world),
        id(id),
        bvhNode(nullptr),
        type(options.hasOwnProperty("type") ? static_cast<ObjectType>(options["type"].as<int>()) : ObjectType::RIGID_BODY),
        shape(options.hasOwnProperty("shape") ? static_cast<ObjectShape>(options["shape"].as<int>()) : ObjectShape::CIRCLE)
{
    world.liveIntData.push_back(id); // id.
    world.liveIntData.push_back((int)shape); // shape.
    world.liveIntData.push_back((int)type); // type.
    world.liveIntData.push_back(0); // has collision bits.

    categoryBits = options.hasOwnProperty("categoryBits") ? (uint32_t)options["categoryBits"].as<int>() : CATEGORY_DYNAMIC;
    maskBits = options.hasOwnProperty("maskBits") ? (uint32_t)options["maskBits"].as<int>() : CATEGORY_ALL;

    world.liveIntData.push_back(categoryBits);
    world.liveIntData.push_back(maskBits);

    world.liveFloatData.push_back(options.hasOwnProperty("x") ? options["x"].as<float>() : 0.0f); // x
    world.liveFloatData.push_back(options.hasOwnProperty("y") ? options["y"].as<float>() : 0.0f); // y
    world.liveFloatData.push_back(options.hasOwnProperty("r") ? options["r"].as<float>() : 0.0f); // rotation
    world.liveFloatData.push_back(options.hasOwnProperty("vx") ? options["vx"].as<float>() : 0.0f); // vx
    world.liveFloatData.push_back(options.hasOwnProperty("vy") ? options["vy"].as<float>() : 0.0f); // vy
    world.liveFloatData.push_back(options.hasOwnProperty("rs") ? options["rs"].as<float>() : 0.0f); // rs
    float mass = type != ObjectType::FIXED_OBJECT && options.hasOwnProperty("mass") ? options["mass"].as<float>() : 0.0f;
    world.liveFloatData.push_back(mass); // mass
    world.liveFloatData.push_back((mass > 0.0f) ? 1.0f / mass : 0.0f); // inverse mass
    world.liveFloatData.push_back(options.hasOwnProperty("gscale") ? options["gscale"].as<float>() : 1.0f);
    world.liveFloatData.push_back(options.hasOwnProperty("restitution") ? options["restitution"].as<float>() : 0.2f);
    world.liveFloatData.push_back(options.hasOwnProperty("sFriction") ? options["sFriction"].as<float>() : 0.2f);
    world.liveFloatData.push_back(options.hasOwnProperty("kFriction") ? options["kFriction"].as<float>() : 0.2f);
    
    world.liveFloatData.push_back(options.hasOwnProperty("linearDamping") ? options["linearDamping"].as<float>() : 0.05f);
    world.liveFloatData.push_back(options.hasOwnProperty("angularDamping") ? options["angularDamping"].as<float>() : 0.05f);
    world.liveFloatData.push_back(
        (
            options.hasOwnProperty("radius") ? options["radius"].as<float>() : (
                options.hasOwnProperty("width") ? options["width"].as<float>() : 0.0f)
        )
    ); // radius or width
    world.liveFloatData.push_back(options.hasOwnProperty("height") ? options["height"].as<float>() : 0.0f); // height

    world.liveFloatData.push_back(0.0f); // fx
    world.liveFloatData.push_back(0.0f); // fy
    world.liveFloatData.push_back(0.0f); // ix
    world.liveFloatData.push_back(0.0f); // iy

    world.liveFloatData.push_back(aabb.min.x); // x0
    world.liveFloatData.push_back(aabb.min.y); // y0
    world.liveFloatData.push_back(aabb.max.x); // x1
    world.liveFloatData.push_back(aabb.max.y); // y1
    
    world.liveFloatData.push_back(0.0f); // nfx
    world.liveFloatData.push_back(0.0f); // nfy
    world.liveFloatData.push_back(0.0f); // nix
    world.liveFloatData.push_back(0.0f); // niy
    world.liveFloatData.push_back(0.0f); // ia
    world.liveFloatData.push_back(0.0f); // nia
}

// Getters and Setters
float PhysicalObject::getX() const { return world.liveFloatData[worldIndex * FDATA_EPO + FDATA_X]; }
void PhysicalObject::setX(float x) { 
    int i = worldIndex * FDATA_EPO + FDATA_X;
    float err = world.liveFloatData[i] - x;
    if(err){ 
        // sleepErrAccumulator += abs(err);
        world.liveFloatData[i] = x; 
        wakeUp();
    }
}
float PhysicalObject::getY() const { return world.liveFloatData[worldIndex * FDATA_EPO + FDATA_Y]; }
void PhysicalObject::setY(float y) { 
    int i = worldIndex * FDATA_EPO + FDATA_Y;
    float err = world.liveFloatData[i] - y;
    if(err){
        // sleepErrAccumulator += abs(err);
        world.liveFloatData[i] = y; 
        wakeUp();
    }
}

float PhysicalObject::getRotation() const { return world.liveFloatData[worldIndex * FDATA_EPO + FDATA_R]; }
void PhysicalObject::setRotation(float r) { 
    int i = worldIndex * FDATA_EPO + FDATA_R;
    float err = world.liveFloatData[i] - r;
    if(err){
        // sleepErrAccumulator += abs(err);
        world.liveFloatData[i] = r; 
        wakeUp();
    }
}

float PhysicalObject::getVelocityX() const { return world.liveFloatData[worldIndex * FDATA_EPO + FDATA_VX]; }
void PhysicalObject::setVelocityX(float vx) { 
    world.liveFloatData[worldIndex * FDATA_EPO + FDATA_VX] = vx; 
    if(abs(vx) > SLEEP_VELOCITY_THRESHOLD) {
        wakeUp();
    }
}
void PhysicalObject::setVelocityY(float vy) { 
    world.liveFloatData[worldIndex * FDATA_EPO + FDATA_VY] = vy; 
    if(abs(vy) > SLEEP_VELOCITY_THRESHOLD) {
        wakeUp();
    }
}

float PhysicalObject::getVelocityY() const { return world.liveFloatData[worldIndex * FDATA_EPO + FDATA_VY]; }

float PhysicalObject::getAngularVelocity() const { return world.liveFloatData[worldIndex * FDATA_EPO + FDATA_RS]; }
void PhysicalObject::setAngularVelocity(float rs) { 
    world.liveFloatData[worldIndex * FDATA_EPO + FDATA_RS] = rs;
    if(abs(rs) > SLEEP_ANGULAR_VELOCITY_THRESHOLD) {
        wakeUp();
    }
}

uint32_t PhysicalObject::getCategoryBits() const { return world.liveIntData[worldIndex * LIVE_INT_EPO + LIVE_INT_CATEGORY_BITS]; }
void PhysicalObject::setCategoryBits(uint32_t category) {
    categoryBits = category;
    world.liveIntData[worldIndex * LIVE_INT_EPO + LIVE_INT_CATEGORY_BITS] = category;
    if (bvhNode) {
        CollisionProperties props = bvhNode->properties;
        props.category = category;
        bvhNode->updateProperties(props);
    }
}

uint32_t PhysicalObject::getMaskBits() const { return world.liveIntData[worldIndex * LIVE_INT_EPO + LIVE_INT_MASK_BITS]; }
void PhysicalObject::setMaskBits(uint32_t mask) {
    maskBits = mask;
    world.liveIntData[worldIndex * LIVE_INT_EPO + LIVE_INT_MASK_BITS] = mask;
    if (bvhNode) {
        CollisionProperties props = bvhNode->properties;
        props.collidesWith = mask;
        bvhNode->updateProperties(props);
    }
}

float PhysicalObject::getMass() const { return world.liveFloatData[worldIndex * FDATA_EPO + FDATA_M]; }
void PhysicalObject::setMass(float m) { 
    world.liveFloatData[worldIndex * FDATA_EPO + FDATA_M] = m;
    if(m > 0){
        world.liveFloatData[worldIndex * FDATA_EPO + FDATA_IM] = 1.0f / m;
    }
    else{
        world.liveFloatData[worldIndex * FDATA_EPO + FDATA_IM] = 0.0f;
    }
}

float PhysicalObject::getInverseMass() const { return world.liveFloatData[worldIndex * FDATA_EPO + FDATA_IM]; }
// No setter for inverse mass, it is calculated from mass.

float PhysicalObject::getInverseInertia() const {
    float imass = getInverseMass();
    
    // Fixed objects have zero inverse inertia
    if (imass == 0.0f) {
        return 0.0f;
    }
    
    // Calculate inverse inertia based on shape
    if (shape == ObjectShape::CIRCLE) {
        float radius = getRadius();
        // For circle: I = (1/2) * m * r^2, so I^-1 = 2 / (m * r^2) = 2 * imass / r^2
        return 2.0f * imass / (radius * radius);
    } 
    else if (shape == ObjectShape::AABB || shape == ObjectShape::BOX) {
        float width = getWidth();
        float height = getHeight();
        // For rectangle: I = (1/12) * m * (w^2 + h^2), so I^-1 = 12 / (m * (w^2 + h^2)) = 12 * imass / (w^2 + h^2)
        return 12.0f * imass / (width * width + height * height);
    }
    
    // Default case (shouldn't reach here if all shapes are handled)
    return imass;
}

float PhysicalObject::getDamping() const { return world.liveFloatData[worldIndex * FDATA_EPO + FDATA_DAMPING]; }
void PhysicalObject::setDamping(float d) { world.liveFloatData[worldIndex * FDATA_EPO + FDATA_DAMPING] = d; }
float PhysicalObject::getRotationalDamping() const { return world.liveFloatData[worldIndex * FDATA_EPO + FDATA_ANGULAR_DAMPING]; }
void PhysicalObject::setRotationalDamping(float rd) { world.liveFloatData[worldIndex * FDATA_EPO + FDATA_ANGULAR_DAMPING] = rd; }

float PhysicalObject::getRestitution() const { return world.liveFloatData[worldIndex * FDATA_EPO + FDATA_RESTITUTION]; }
void PhysicalObject::setRestitution(float r) { world.liveFloatData[worldIndex * FDATA_EPO + FDATA_RESTITUTION] = r; }

float PhysicalObject::getImpulseX() const { return world.liveFloatData[worldIndex * FDATA_EPO + FDATA_IX]; }
void PhysicalObject::setImpulseX(float ix) { 
    world.liveFloatData[worldIndex * FDATA_EPO + FDATA_IX] = ix; 
    if(ix) wakeUp();
}
float PhysicalObject::getImpulseY() const { return world.liveFloatData[worldIndex * FDATA_EPO + FDATA_IY]; }
void PhysicalObject::setImpulseY(float iy) { 
    world.liveFloatData[worldIndex * FDATA_EPO + FDATA_IY] = iy; 
    if(iy) wakeUp();
}

float PhysicalObject::getForceX() const { return world.liveFloatData[worldIndex * FDATA_EPO + FDATA_FX]; }
void PhysicalObject::setForceX(float fx) { 
    world.liveFloatData[worldIndex * FDATA_EPO + FDATA_FX] = fx; 
    if(fx) wakeUp();
}
float PhysicalObject::getForceY() const { return world.liveFloatData[worldIndex * FDATA_EPO + FDATA_FY]; }
void PhysicalObject::setForceY(float fy) { 
    world.liveFloatData[worldIndex * FDATA_EPO + FDATA_FY] = fy; 
    if(fy) wakeUp();
}

float PhysicalObject::getStaticFriction() const { return world.liveFloatData[worldIndex * FDATA_EPO + FDATA_S_FRICTION]; }
void PhysicalObject::setStaticFriction(float f) { world.liveFloatData[worldIndex * FDATA_EPO + FDATA_S_FRICTION] = f; }
float PhysicalObject::getKineticFriction() const { return world.liveFloatData[worldIndex * FDATA_EPO + FDATA_K_FRICTION]; }
void PhysicalObject::setKineticFriction(float f) { world.liveFloatData[worldIndex * FDATA_EPO + FDATA_K_FRICTION] = f; }

Vec2 PhysicalObject::getPosition() const { return Vec2(getX(), getY()); }
void PhysicalObject::setPosition(Vec2 p) { setX(p.x); setY(p.y); }
Vec2 PhysicalObject::getVelocity() const { return Vec2(getVelocityX(), getVelocityY()); }
void PhysicalObject::setVelocity(Vec2 v) { setVelocityX(v.x); setVelocityY(v.y); }

// Read only stuff.
int PhysicalObject::getId() const { return id; }
float PhysicalObject::getRadius() const { return world.liveFloatData[worldIndex * FDATA_EPO + FDATA_RADIUS]; }
float PhysicalObject::getWidth() const { return world.liveFloatData[worldIndex * FDATA_EPO + FDATA_W]; }
float PhysicalObject::getHeight() const { return world.liveFloatData[worldIndex * FDATA_EPO + FDATA_H]; }

// Modes:
// 0: with padding.
// 1: without padding.
// 2: shrink wrap.
bool PhysicalObject::recomputeAabb(int mode){
    float newX1 = aabb.min.x;
    float newY1 = aabb.min.y;
    float newX2 = aabb.max.x;
    float newY2 = aabb.max.y;

    float px = world.liveFloatData[worldIndex * FDATA_EPO + FDATA_X];
    float py = world.liveFloatData[worldIndex * FDATA_EPO + FDATA_Y];
    float w = world.liveFloatData[worldIndex * FDATA_EPO + FDATA_W];
    float h = world.liveFloatData[worldIndex * FDATA_EPO + FDATA_H];
    float r = world.liveFloatData[worldIndex * FDATA_EPO + FDATA_R];
    // float r = 1.0f;
    float cr;
    float sr;

    float tl_x;
    float tl_y;
    float tr_x;
    float tr_y;
    float br_x;
    float br_y;
    float bl_x;
    float bl_y;

    // Calculate the AABB for the object based on its shape.
    switch (shape) {
        case ObjectShape::POINT:
            newX1 = px;
            newY1 = py;
            newX2 = px;
            newY2 = py;

            break;
        case ObjectShape::CIRCLE:
            newX1 = px - w;
            newY1 = py - w;
            newX2 = px + w;
            newY2 = py + w;
            break;
        case ObjectShape::AABB:
            newX1 = px - w / 2;
            newY1 = py - h / 2;
            newX2 = px + w / 2;
            newY2 = py + h / 2;
            break;
        case ObjectShape::BOX:
        case ObjectShape::ELLIPSE:
            cr = cos(r);
            sr = sin(r);
            tl_x = (-w/2) * cr - (-h/2) * sr + px; 
            tl_y = (-w/2) * sr + (-h/2) * cr + py;
            tr_x = ( w/2) * cr - (-h/2) * sr + px; 
            tr_y = ( w/2) * sr + (-h/2) * cr + py;
            br_x = ( w/2) * cr - ( h/2) * sr + px; 
            br_y = ( w/2) * sr + ( h/2) * cr + py;
            bl_x = (-w/2) * cr - ( h/2) * sr + px;
            bl_y = (-w/2) * sr + ( h/2) * cr + py;

            newX1 = std::min({tl_x, tr_x, br_x, bl_x});
            newY1 = std::min({tl_y, tr_y, br_y, bl_y});
            newX2 = std::max({tl_x, tr_x, br_x, bl_x});
            newY2 = std::max({tl_y, tr_y, br_y, bl_y});

            break;
        case ObjectShape::CAPSULE:
            // TODO: this must handle rotations.
            newX1 = px - w / 2;
            newY1 = py - h / 2;
            newX2 = px + w / 2;
            newY2 = py + h / 2;
            break;
        case ObjectShape::POLYGON:
            // TODO.
            newX1 = px;
            newY1 = px;
            newX2 = py;
            newY2 = py;
            break;
    }

    if (mode == 2 || newX1 < aabb.min.x || newY1 < aabb.min.y || newX2 > aabb.max.x || newY2 > aabb.max.y) {
        // Determine the maximum required padding amount.
        float paddingAmount = 0.2f;
        if (mode != 0) paddingAmount = 0.0f;

        float vx = world.liveFloatData[worldIndex * FDATA_EPO + FDATA_VX];
        float vy = world.liveFloatData[worldIndex * FDATA_EPO + FDATA_VY];
        
        Vec2 paddingA = Vec2(std::min(vx * paddingAmount, 0.0f), std::min(vy * paddingAmount, 0.0f));
        Vec2 paddingB = Vec2(std::max(vx * paddingAmount, 0.0f), std::max(vy * paddingAmount, 0.0f));

        // Calculate the maximum padding required in either direction.
        // float paddingX = std::max(
        //     std::abs((newX1 - aabb.min.x) * paddingAmount), 
        //     std::abs((newX2 - aabb.max.x) * paddingAmount)
        // );
        // float paddingY = std::max(
        //     std::abs((newY1 - aabb.min.y) * paddingAmount), 
        //     std::abs((newY2 - aabb.max.y) * paddingAmount)
        // );

        // Apply consistent padding across both directions.
        // Vec2 paddingA = Vec2(-paddingX, -paddingY);
        // Vec2 paddingB = Vec2(paddingX, paddingY);

        // Update the AABB with consistent padding.
        aabb = Aabb(Vec2(newX1, newY1) + paddingA, Vec2(newX2, newY2) + paddingB);

        world.liveFloatData[worldIndex * FDATA_EPO + FDATA_AX1] = aabb.min.x;
        world.liveFloatData[worldIndex * FDATA_EPO + FDATA_AY1] = aabb.min.y;
        world.liveFloatData[worldIndex * FDATA_EPO + FDATA_AX2] = aabb.max.x;
        world.liveFloatData[worldIndex * FDATA_EPO + FDATA_AY2] = aabb.max.y;

        // No tree update needed in shrink wrap mode.
        return mode != 2;
    }

    return false;
}

// INTERNAL USE ONLY.
void PhysicalObject::applyForce(const Vec2& force){
    applyForce(force.x, force.y);
}
void PhysicalObject::applyForce(float x, float y){
    int index = worldIndex * FDATA_EPO;
    float inverseMass = world.liveFloatData[index + FDATA_IM];
    
    if (inverseMass != 0.0f && inverseMass != INFINITY && type != ObjectType::FIXED_OBJECT && (x || y)) {
        world.liveFloatData[index + FDATA_FX] += x;
        world.liveFloatData[index + FDATA_FY] += y;
        
        // Only wake up if the force is significant relative to mass.
        if (abs(x * inverseMass) > SLEEP_VELOCITY_THRESHOLD || abs(y * inverseMass) > SLEEP_VELOCITY_THRESHOLD) {
            wakeUp();
        }
    }
}

void PhysicalObject::applyImpulse(const Vec2& impulse, const Vec2& contactPoint){
    applyImpulse(impulse.x, impulse.y, contactPoint.x, contactPoint.y);
}

void PhysicalObject::applyImpulse(float x, float y, float cpX, float cpY){

    int index = worldIndex * FDATA_EPO;

    
    float inverseMass = world.liveFloatData[index + FDATA_IM];
    
    if (inverseMass != 0.0f && inverseMass != INFINITY && type != ObjectType::FIXED_OBJECT) {
        world.liveFloatData[index + FDATA_IX] += x;
        world.liveFloatData[index + FDATA_IY] += y;

        float dvx = x * inverseMass;
        float dvy = y * inverseMass;

        world.liveFloatData[index + FDATA_VX] += dvx;
        world.liveFloatData[index + FDATA_VY] += dvy;

        // float torque = contactPoint.cross(impulse);  // 2D cross product gives scalar torque
        // float torque = cpX * y - cpY * x; // this one might be backwards.
        float torque = x * cpY - y * cpX;
        float drs = -torque * getInverseInertia();

        // Apply angular velocity change using inverse inertia.
        world.liveFloatData[index + FDATA_RS] += drs;

        if (abs(dvx) > SLEEP_VELOCITY_THRESHOLD || abs(dvy) > SLEEP_VELOCITY_THRESHOLD || abs(drs) > SLEEP_ANGULAR_VELOCITY_THRESHOLD) {
            wakeUp();
        }
    }

}

void PhysicalObject::applyAngularImpulse(float torque){
    int index = worldIndex * FDATA_EPO;
    float invI = getInverseInertia();
    
    if (invI != 0.0f && type != ObjectType::FIXED_OBJECT && torque != 0.0f) {
        world.liveFloatData[index + FDATA_IA] += torque;

        float drs = torque * invI;
        world.liveFloatData[index + FDATA_RS] += drs;

        if (abs(drs) > SLEEP_ANGULAR_VELOCITY_THRESHOLD) {
            wakeUp();
        }
    }
}

    // void destroy(bool skipWorldRemove = false){
    //     if(!skipWorldRemove) world.removeObject(id);
    //     delete this;
    // }

    // Step function to update position and rotation
bool PhysicalObject::stepMovement(float dt) {
    int index = worldIndex * FDATA_EPO;
    _inverseMass = world.liveFloatData[index + FDATA_IM];

    // TODO: these should be moved out of the function as an optimization.
    world.liveFloatData[index + FDATA_FX] = 0;
    world.liveFloatData[index + FDATA_FY] = 0;

    // Cache the last position.
    // Probably redundant now.
    _position.x = world.liveFloatData[index + FDATA_X];
    _position.y = world.liveFloatData[index + FDATA_Y];

    // Apply the acculumated impulse.
    applyImpulse(world.liveFloatData[index + FDATA_NIX], world.liveFloatData[index + FDATA_NIY], 0.0f, 0.0f);

    world.liveFloatData[index + FDATA_NIX] = 0.0f;
    world.liveFloatData[index + FDATA_NIY] = 0.0f;

    // Apply the accumulated angular impulse.
    applyAngularImpulse(world.liveFloatData[index + FDATA_NIA]);
    world.liveFloatData[index + FDATA_NIA] = 0.0f;

    // Set the class's vectors based on the live data.
    _velocity.x = world.liveFloatData[index + FDATA_VX];
    _velocity.y = world.liveFloatData[index + FDATA_VY];
    
    // Apply the force that is currently in memory, then clear it.
    applyForce(world.liveFloatData[index + FDATA_NFX], world.liveFloatData[index + FDATA_NFY]);
    world.liveFloatData[index + FDATA_NFX] = 0;
    world.liveFloatData[index + FDATA_NFY] = 0;

    // Apply damping force.
    // TODO: may want to consider wind resistance, etc.
    _dampingForce = _velocity * -getDamping();
    applyForce(_dampingForce.x, _dampingForce.y);

    // Calculate acceleration based on force and mass.
    if (_inverseMass == 0.0f || _inverseMass == INFINITY || type == ObjectType::FIXED_OBJECT) {
        _acceleration.x = 0.0f;
        _acceleration.y = 0.0f;
    } else {
        _force.x = world.liveFloatData[index + FDATA_FX];
        _force.y = world.liveFloatData[index + FDATA_FY];
        _acceleration = _force * _inverseMass;
    }

    // cout << inverseMass << endl;

    // Update velocity based on acceleration and time step.
    _velocity = _velocity + _acceleration * dt;

    // Update position based on velocity and time step.
    _position = _position + _velocity * dt;

    // Apply pseudo-velocity (split impulses for penetration resolution)
    _position = _position + pseudoVelocity * dt;
    float rs_pseudo = pseudoAngularVelocity;
    world.liveFloatData[index + FDATA_R] += rs_pseudo * dt;

    // Reset pseudo-velocity for the next frame
    pseudoVelocity = Vec2(0.0f, 0.0f);
    pseudoAngularVelocity = 0.0f;

// Help objects settle by zeroing out very small velocities
    if (abs(_velocity.x) < SLEEP_VELOCITY_THRESHOLD * 0.1f) {
        _velocity.x *= 0.95f;
        if (abs(_velocity.x) < 1e-5f) _velocity.x = 0.0f;
    }
    if (abs(_velocity.y) < SLEEP_VELOCITY_THRESHOLD * 0.1f) {
        _velocity.y *= 0.95f;
        if (abs(_velocity.y) < 1e-5f) _velocity.y = 0.0f;
    }
    
    float rs_val = world.liveFloatData[index + FDATA_RS];
    if (abs(rs_val) < SLEEP_ANGULAR_VELOCITY_THRESHOLD * 0.5f) {
        world.liveFloatData[index + FDATA_RS] *= 0.8f;
        if (abs(world.liveFloatData[index + FDATA_RS]) < 1e-4f) world.liveFloatData[index + FDATA_RS] = 0.0f;
    }

    // ix and iy are for visual debugging.
    // We can decay them here.
    world.liveFloatData[index + FDATA_IX] *= world.decayMap[99];
    world.liveFloatData[index + FDATA_IY] *= world.decayMap[99];
    world.liveFloatData[index + FDATA_IA] *= world.decayMap[99];

    // Apply rotational damping to rotational speed.
    float rs1 = world.liveFloatData[index + FDATA_RS];
    world.liveFloatData[index + FDATA_RS] *= (1.0f - getRotationalDamping() * dt);
    float rs2 = world.liveFloatData[index + FDATA_RS];

    // Update rotation based on rotational speed and time step.
    world.liveFloatData[index + FDATA_R] += (rs1 + rs2) * dt * 0.5f;

    // TODO: I don't like how the full damping takes effect per frame. It should be per second.
    // This requires us to basically hard code frame rates.

    // Apply linear damping to velocity.
    // No more damping. We will use a damping force.
    // The existing damping var will represent the damping coefficient.
    // velocity = velocity * (1.0f - damping * dt);

    // Reassign the values to the live data.
    world.liveFloatData[index + FDATA_X] = _position.x;
    world.liveFloatData[index + FDATA_Y] = _position.y;
    world.liveFloatData[index + FDATA_VX] = _velocity.x;
    world.liveFloatData[index + FDATA_VY] = _velocity.y;

    float dx = world.liveFloatData[index + FDATA_X] - lastX;
    float dy = world.liveFloatData[index + FDATA_Y] - lastY;
    float dr = world.liveFloatData[index + FDATA_R] - lastR;

    sleepErrAccumulatorX += dx;
    sleepErrAccumulatorY += dy;
    sleepErrAccumulatorR += dr;

    bool moved = dx || dy || dr;

    lastX = world.liveFloatData[index + FDATA_X];
    lastY = world.liveFloatData[index + FDATA_Y];
    lastR = world.liveFloatData[index + FDATA_R];

    if(shape == ObjectShape::AABB){
        setRotation(0.0f);
    }


    // If moved, compute isWakable based on the amount of movement surpassing a threshold.
    float dErr = sleepErrAccumulatorX * sleepErrAccumulatorX + sleepErrAccumulatorY * sleepErrAccumulatorY;
    
    // Only accumulate if movement is actually happening above a noise floor.
    // This prevents micro-jitter from eventually waking the object.
    bool isMoving = abs(dx) > 1e-4f || abs(dy) > 1e-4f || abs(dr) > 1e-4f;
    
    bool isWakable = isMoving && (
        abs(sleepErrAccumulatorR) > WAKE_MOVEMENT_THRESHOLD
        || dErr > WAKE_MOVEMENT_THRESHOLD * WAKE_MOVEMENT_THRESHOLD
    );

    if(isWakable){
        sleepTimer = 0.0f;
        sleepErrAccumulatorX = 0.0f;
        sleepErrAccumulatorY = 0.0f;
        sleepErrAccumulatorR = 0.0f;
    }
    else{
        if (!isMoving) {
            // Reset accumulators if truly stationary to prevent gradual creep.
            sleepErrAccumulatorX *= 0.9f;
            sleepErrAccumulatorY *= 0.9f;
            sleepErrAccumulatorR *= 0.9f;
        }
        sleepTimer += dt;
        if(sleepTimer > sleepTimeRequired){
            sleep();
        }
    }

    return moved;
}

void PhysicalObject::sleep(){
#ifndef ENABLE_SLEEPING
    return;
#endif
    if(!isSleeping && canSleep){
        isSleeping = true;
        
        world.liveIntData[worldIndex * LIVE_INT_EPO + LIVE_INT_HAS_COLLISION] = 0x4;
        setVelocityX(0.0f);
        setVelocityY(0.0f);
        setAngularVelocity(0.0f);

#ifdef EXPERIMENTAL_SHRINK_WRAP_AABB_ON_SLEEP
        // I don't think the tree being updated is needed here ever.
        // Because the shrunken AABB will alwasy be smaller than the original.
        // However, if this causes bugs, we'll know what to look out for.
        bool treeNeedsUpdate = recomputeAabb(2);
#endif

        bvhNode->sleep();
    }
}

void PhysicalObject::wakeUp() {
    if (isSleeping) {
        isSleeping = false;
        sleepTimer = 0.0f; // RESET TIMER ON WAKEUP
        bvhNode->wakeUp();
        
        for (auto* contact : contacts) {
            // This won't circle back because we've already set isSleeping to false.
            contact->wakeUp();
        }
    }
}

void PhysicalObject::addContact(PhysicalObject* other) {
    // Check if contact already exists (simple linear search)
    for (auto* contact : contacts) {
        if (contact == other) return;
    }
    
    bool wasEmpty = contacts.empty();
    contacts.push_back(other);
    
    // Wake up if this is the first contact
    // Experiment: Let the kinematics updates do the wakeup. If no movement happens, keep it sleeping.
    // if (wasEmpty) {
    //     wakeUp();
    // }
}

void PhysicalObject::removeContact(PhysicalObject* other) {
    // Store original size to detect if removal happened
    size_t originalSize = contacts.size();
    
    // Use remove-erase idiom correctly
    auto it = std::remove(contacts.begin(), contacts.end(), other);
    contacts.erase(it, contacts.end());
    
    // Wake up only if a contact was actually removed
    // Experiment: Let the kinematics updates do the wakeup. If no movement happens, keep it sleeping.
    // if (contacts.size() < originalSize) {
    //     wakeUp();
    // }
}

