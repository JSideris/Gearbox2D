// #include "vec2.h"
#include "physical-object.h"
// #include "world.h"

// static Vec2 _dampingForce;
// static Vec2 _acceleration;
// static Vec2 _dv;
// static Vec2 _force;
// static Vec2 _position;
// static Vec2 _velocity;   // Linear velocity of the object


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

    world.liveFloatData.push_back(options.hasOwnProperty("x") ? options["x"].as<float>() : 0.0f); // x
    world.liveFloatData.push_back(options.hasOwnProperty("y") ? options["y"].as<float>() : 0.0f); // y
    world.liveFloatData.push_back(options.hasOwnProperty("r") ? options["r"].as<float>() : 0.0f); // rotation
    world.liveFloatData.push_back(options.hasOwnProperty("vx") ? options["vx"].as<float>() : 0.0f); // vx
    world.liveFloatData.push_back(options.hasOwnProperty("vy") ? options["vy"].as<float>() : 0.0f); // vy
    world.liveFloatData.push_back(options.hasOwnProperty("rs") ? options["rs"].as<float>() : 0.0f); // rs
    float mass = options.hasOwnProperty("mass") ? options["mass"].as<float>() : 0.0f;
    world.liveFloatData.push_back(mass); // mass
    world.liveFloatData.push_back(mass > 0.0f ? 1.0f / mass : 0.0f); // inverse mass
    world.liveFloatData.push_back(options.hasOwnProperty("gscale") ? options["gscale"].as<float>() : 1.0f);
    world.liveFloatData.push_back(options.hasOwnProperty("restitution") ? options["restitution"].as<float>() : 0.5f);
    world.liveFloatData.push_back(options.hasOwnProperty("sFriction") ? options["sFriction"].as<float>() : 1.0f);
    world.liveFloatData.push_back(options.hasOwnProperty("kFriction") ? options["kFriction"].as<float>() : 1.0f);
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
}

// Getters and Setters
float PhysicalObject::getX() const { return world.liveFloatData[worldIndex * FDATA_EPO + FDATA_X]; }
void PhysicalObject::setX(float x) { world.liveFloatData[worldIndex * FDATA_EPO + FDATA_X] = x; }
float PhysicalObject::getY() const { return world.liveFloatData[worldIndex * FDATA_EPO + FDATA_Y]; }
void PhysicalObject::setY(float y) { world.liveFloatData[worldIndex * FDATA_EPO + FDATA_Y] = y; }

float PhysicalObject::getRotation() const { return world.liveFloatData[worldIndex * FDATA_EPO + FDATA_R]; }
void PhysicalObject::setRotation(float r) { world.liveFloatData[worldIndex * FDATA_EPO + FDATA_R] = r; }

float PhysicalObject::getVelocityX() const { return world.liveFloatData[worldIndex * FDATA_EPO + FDATA_VX]; }
void PhysicalObject::setVelocityX(float vx) { world.liveFloatData[worldIndex * FDATA_EPO + FDATA_VX] = vx; }
float PhysicalObject::getVelocityY() const { return world.liveFloatData[worldIndex * FDATA_EPO + FDATA_VY]; }
void PhysicalObject::setVelocityY(float vy) { world.liveFloatData[worldIndex * FDATA_EPO + FDATA_VY] = vy; }

float PhysicalObject::getAngularVelocity() const { return world.liveFloatData[worldIndex * FDATA_EPO + FDATA_RS]; }
void PhysicalObject::setAngularVelocity(float rs) { world.liveFloatData[worldIndex * FDATA_EPO + FDATA_RS] = rs; }

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
// void PhysicalObject::setInverseMass(float im) { world.liveFloatData[worldIndex * FDATA_EPO + FDATA_IM] = im; }

float PhysicalObject::getDamping() const { return world.liveFloatData[worldIndex * FDATA_EPO + FDATA_DAMPING]; }
void PhysicalObject::setDamping(float d) { world.liveFloatData[worldIndex * FDATA_EPO + FDATA_DAMPING] = d; }
float PhysicalObject::getRotationalDamping() const { return world.liveFloatData[worldIndex * FDATA_EPO + FDATA_ANGULAR_DAMPING]; }
void PhysicalObject::setRotationalDamping(float rd) { world.liveFloatData[worldIndex * FDATA_EPO + FDATA_ANGULAR_DAMPING] = rd; }

float PhysicalObject::getRestitution() const { return world.liveFloatData[worldIndex * FDATA_EPO + FDATA_RESTITUTION]; }
void PhysicalObject::setRestitution(float r) { world.liveFloatData[worldIndex * FDATA_EPO + FDATA_RESTITUTION] = r; }

float PhysicalObject::getImpulseX() const { return world.liveFloatData[worldIndex * FDATA_EPO + FDATA_IX]; }
void PhysicalObject::setImpulseX(float ix) { world.liveFloatData[worldIndex * FDATA_EPO + FDATA_IX] = ix; }
float PhysicalObject::getImpulseY() const { return world.liveFloatData[worldIndex * FDATA_EPO + FDATA_IY]; }
void PhysicalObject::setImpulseY(float iy) { world.liveFloatData[worldIndex * FDATA_EPO + FDATA_IY] = iy; }

float PhysicalObject::getForceX() const { return world.liveFloatData[worldIndex * FDATA_EPO + FDATA_FX]; }
void PhysicalObject::setForceX(float fx) { world.liveFloatData[worldIndex * FDATA_EPO + FDATA_FX] = fx; }
float PhysicalObject::getForceY() const { return world.liveFloatData[worldIndex * FDATA_EPO + FDATA_FY]; }
void PhysicalObject::setForceY(float fy) { world.liveFloatData[worldIndex * FDATA_EPO + FDATA_FY] = fy; }

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
float PhysicalObject::getRadius() const { return world.liveFloatData[worldIndex * FDATA_EPO + FDATA_R]; }
float PhysicalObject::getWidth() const { return world.liveFloatData[worldIndex * FDATA_EPO + FDATA_W]; }
float PhysicalObject::getHeight() const { return world.liveFloatData[worldIndex * FDATA_EPO + FDATA_H]; }

bool PhysicalObject::recomputeAabb(bool disablePadding){
    float newX1 = aabb.min.x;
    float newY1 = aabb.min.y;
    float newX2 = aabb.max.x;
    float newY2 = aabb.max.y;

    float px = world.liveFloatData[worldIndex * FDATA_EPO + FDATA_X];
    float py = world.liveFloatData[worldIndex * FDATA_EPO + FDATA_Y];
    float w = world.liveFloatData[worldIndex * FDATA_EPO + FDATA_W];
    float h = world.liveFloatData[worldIndex * FDATA_EPO + FDATA_H];
    float r = world.liveFloatData[worldIndex * FDATA_EPO + FDATA_R] * 180.0f / 3.14159f;
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
            newY1 = px;
            newX2 = py;
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

    if (newX1 < aabb.min.x || newY1 < aabb.min.y || newX2 > aabb.max.x || newY2 > aabb.max.y) {
        // Determine the maximum required padding amount.
        float paddingAmount = 0.2f;
        if (disablePadding) paddingAmount = 0.0f;

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

        return true;
    }

    return false;
}

// INTERNAL USE ONLY.
void PhysicalObject::applyForce(const Vec2& force){
    applyForce(force.x, force.y);
}
void PhysicalObject::applyForce(float x, float y){
    world.liveFloatData[worldIndex * FDATA_EPO + FDATA_FX] += x;
    world.liveFloatData[worldIndex * FDATA_EPO + FDATA_FY] += y;
}

void PhysicalObject::applyImpulse(const Vec2& impulse, const Vec2& contactPoint){
    applyImpulse(impulse.x, impulse.y, contactPoint.x, contactPoint.y);
}

void PhysicalObject::applyImpulse(float x, float y, float cpX, float cpY){

    int index = worldIndex * FDATA_EPO;

    world.liveFloatData[index + FDATA_IX] += x;
    world.liveFloatData[index + FDATA_IY] += y;

    float inverseMass = world.liveFloatData[index + FDATA_IM];

    if (inverseMass != 0 && inverseMass != INFINITY && type != ObjectType::FIXED_OBJECT) {
        world.liveFloatData[index + FDATA_VX] += x * inverseMass;
        world.liveFloatData[index + FDATA_VY] += y * inverseMass;

        // float torque = contactPoint.cross(impulse);  // 2D cross product gives scalar torque
        float torque = cpX * y - cpY * x;

        // obj.angularVelocity += torque / objA.momentOfInertia;

        // Temporary approximation for moment of inertia.
        // TODO: this could be computed per shape!
        float momentOfInertia = world.liveFloatData[index + FDATA_M];
        world.liveFloatData[index + FDATA_RS] += torque / momentOfInertia;
    }
}

    // void destroy(bool skipWorldRemove = false){
    //     if(!skipWorldRemove) world.removeObject(id);
    //     delete this;
    // }

    // Step function to update position and rotation
bool PhysicalObject::stepMovement(float dt) {
    int index = worldIndex * FDATA_EPO;
    float inverseMass = world.liveFloatData[index + FDATA_IM];

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
    if (inverseMass == 0 || inverseMass == INFINITY || type == ObjectType::FIXED_OBJECT) {
        _acceleration.x = 0.0f;
        _acceleration.y = 0.0f;
    } else {
        _force.x = world.liveFloatData[index + FDATA_FX];
        _force.y = world.liveFloatData[index + FDATA_FY];
        _acceleration = _force * inverseMass;
    }

    // cout << inverseMass << endl;

    // Update velocity based on acceleration and time step.
    _dv = _acceleration * dt * 0.5f;
    _velocity = _velocity + _dv;

    // ix and iy are for visual debugging.
    // We can decay them here.

    world.liveFloatData[index + FDATA_IX] *= world.decayMap[99];
    world.liveFloatData[index + FDATA_IY] *= world.decayMap[99];

    // Update position based on velocity and time step.
    _position = _position + _velocity * dt;

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

    bool moved = world.liveFloatData[index + FDATA_X] != lastX 
        || world.liveFloatData[index + FDATA_Y] != lastY 
        || world.liveFloatData[index + FDATA_R] != lastR;

    lastX = world.liveFloatData[index + FDATA_X];
    lastY = world.liveFloatData[index + FDATA_Y];
    lastR = world.liveFloatData[index + FDATA_R];

    return moved;
}