#ifndef PHYSICAL_OBJECT_H
#define PHYSICAL_OBJECT_H

#include <initializer_list>
#include <iostream>

#include "debug.h"
#include "vec2.h"
#include "world.h"
#include "aabb.h"
#include "bvh.h"

enum class ObjectType {
    RIGID_BODY,
    SENSOR,
    FIXED_OBJECT
};

enum class ObjectShape {
    POINT,
    CIRCLE,
    AABB,
    BOX,
    ELLIPSE,
    CAPSULE,
    POLYGON
};

static Vec2 _dampingForce;
static Vec2 _acceleration;
static Vec2 _dv;
static Vec2 _force;
static Vec2 _position;
static Vec2 _velocity;   // Linear velocity of the object

class PhysicalObject {
private:
    // Vec2 force;
    // float rotation;  // Current rotation in degrees
    // float rotationalSpeed;  // Angular velocity (degrees per second)
    float damping;   // Linear damping factor (0 = no damping, 1 = full damping)
    float rotationalDamping; // Rotational damping factor (0 = no damping, 1 = full damping)

    float lastX = 0.0f;
    float lastY = 0.0f;
    float lastR = 0.0f;

public:
    int id;
    // Shape properties
    // float radius;
    // // float* points;
    // float width;
    // float height;
    
    ObjectShape shape;
    ObjectType type;

    Aabb aabb;
    TreeNode* bvhNode; 
    
    // float mass;
    World* world = nullptr;
    int worldIndex = -1;

    // // Public accessors for js...
    // // Read only.
    // float x = 0.0f;
    // float y = 0.0f;
    // float r = 0.0f;
    // float vx = 0.0f;
    // float vy = 0.0f;
    // float rs = 0.0f;
    // float fx = 0.0f;
    // float fy = 0.0f;
    // float ix = 0.0f;
    // float iy = 0.0f;

    // // New forces and impulses since the last frame.
    // float nfx = 0.0f;
    // float nfy = 0.0f;
    // float nix = 0.0f;
    // float niy = 0.0f;

    // // AABB readouts.
    // float x0 = 0.0f;
    // float y0 = 0.0f;
    // float x1 = 0.0f;
    // float y1 = 0.0f;

    // Constructor with default values for position, rotation, and type
    
    PhysicalObject(int id, emscripten_val options) 
        : id(id),
          bvhNode(nullptr),
          type(options.hasOwnProperty("type") ? static_cast<ObjectType>(options["type"].as<int>()) : ObjectType::RIGID_BODY),
          damping(options.hasOwnProperty("damping") ? options["damping"].as<float>() : 0.1f),
          rotationalDamping(options.hasOwnProperty("rotationalDamping") ? options["rotationalDamping"].as<float>() : 0.1f),
          shape(options.hasOwnProperty("shape") ? static_cast<ObjectShape>(options["shape"].as<int>()) : ObjectShape::CIRCLE)
        //   force(Vec2(0.0f, 0.0f)),
        //   mass(options.hasOwnProperty("mass") ? options["mass"].as<float>() : 1.0f),
        //   velocity(Vec2(options.hasOwnProperty("vx") ? options["vx"].as<float>() : 0.0f, options.hasOwnProperty("vy") ? options["vy"].as<float>() : 0.0f)),
        //   rotationalSpeed(options.hasOwnProperty("rotationalSpeed") ? options["rotationalSpeed"].as<float>() : 0.0f),
        //   radius(options.hasOwnProperty("radius") ? options["radius"].as<float>() : 10.0f),
          // type(options.hasOwnProperty("points") ? options["points"].as<float*>() : nullptr), // TODO: figure out how to do points.
        //   width(options.hasOwnProperty("width") ? options["width"].as<float>() : 10.0f),
        //   height(options.hasOwnProperty("height") ? options["height"].as<float>() : 10.0f)
        // aabb(Aabb())
    {
        // Don't set this here. Set it after the object is added to the world.
        // recomputeAabb(true);

        // x = position.x;
        // y = position.y;
        // x0 = aabb.min.x;
        // y0 = aabb.min.y;
        // x1 = aabb.max.x;
        // y1 = aabb.max.y;
    }

    // Getters
    // int getId() const { return id; }
    // const Vec2& getPosition() const { return position; }
    // // const float getX() const { return position.x; }
    // // const float getY() const { return position.y; }
    // float getRotation() const { return rotation; }
    // ObjectType getType() const { return type; }
    // ObjectShape getShape() const { return shape; }
    // const Vec2& getVelocity() const { return velocity; }
    // float getRotationalSpeed() const { return rotationalSpeed; }
    // float getDamping() const { return damping; }
    // float getRotationalDamping() const { return rotationalDamping; }

    // float getRadius() const { return radius; }
    // // float* getPoints() const { return points; }
    // float getWidth() const { return width; }
    // float getHeight() const { return height; }

    // Setters
    // void setPosition(float x, float y) { position.x = x; position.y = y; this->x = x; this->y = y; }
    // void setRotation(float newRotation) { rotation = newRotation; }
    // void setType(ObjectType newType) { type = newType; }
    // void setVelocity(float x, float y) { velocity.x = x; velocity.y = y; }
    // void setRotationalSpeed(float newRotationalSpeed) { rotationalSpeed = newRotationalSpeed; }
    // void setMass(float newMass) { mass = newMass; }
    // void setDamping(float newDamping) { damping = newDamping; }
    // void setRotationalDamping(float newRotationalDamping) { rotationalDamping = newRotationalDamping; }

    bool recomputeAabb(bool disablePadding){
        float newX1 = aabb.min.x;
        float newY1 = aabb.min.y;
        float newX2 = aabb.max.x;
        float newY2 = aabb.max.y;

        float px = world->liveFloatData[worldIndex * LIVE_FLOAT_EPO + LIVE_FLOAT_X];
        float py = world->liveFloatData[worldIndex * LIVE_FLOAT_EPO + LIVE_FLOAT_Y];
        float w = world->liveFloatData[worldIndex * LIVE_FLOAT_EPO + LIVE_FLOAT_W];
        float h = world->liveFloatData[worldIndex * LIVE_FLOAT_EPO + LIVE_FLOAT_H];
        float r = world->liveFloatData[worldIndex * LIVE_FLOAT_EPO + LIVE_FLOAT_R] * 180.0f / 3.14159f;
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

            float vx = world->liveFloatData[worldIndex * LIVE_FLOAT_EPO + LIVE_FLOAT_VX];
            float vy = world->liveFloatData[worldIndex * LIVE_FLOAT_EPO + LIVE_FLOAT_VY];
            
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

            world->liveFloatData[worldIndex * LIVE_FLOAT_EPO + LIVE_FLOAT_AX1] = aabb.min.x;
            world->liveFloatData[worldIndex * LIVE_FLOAT_EPO + LIVE_FLOAT_AY1] = aabb.min.y;
            world->liveFloatData[worldIndex * LIVE_FLOAT_EPO + LIVE_FLOAT_AX2] = aabb.max.x;
            world->liveFloatData[worldIndex * LIVE_FLOAT_EPO + LIVE_FLOAT_AY2] = aabb.max.y;

            return true;
        }

        return false;
    }

    // INTERNAL USE ONLY.
    void applyForce(float x, float y){
        world->liveFloatData[worldIndex * LIVE_FLOAT_EPO + LIVE_FLOAT_FX] += x;
        world->liveFloatData[worldIndex * LIVE_FLOAT_EPO + LIVE_FLOAT_FY] += y;
    }

    void applyImpulse(float x, float y){

        int index = worldIndex * LIVE_FLOAT_EPO;

        world->liveFloatData[index + LIVE_FLOAT_IX] += x;
        world->liveFloatData[index + LIVE_FLOAT_IY] += y;

        float mass = world->liveFloatData[index + LIVE_FLOAT_M];

        if (mass != 0 && mass != INFINITY && type != ObjectType::FIXED_OBJECT) {
            world->liveFloatData[index + LIVE_FLOAT_VX] += x / mass;
            world->liveFloatData[index + LIVE_FLOAT_VY] += y / mass;
        }
    }

    void destroy(){
        if(world){
            world->removeObject(id);
        }
        delete this;
    }

    // Step function to update position and rotation
    bool stepMovement(float dt) {
        int index = worldIndex * LIVE_FLOAT_EPO;
        float mass = world->liveFloatData[index + LIVE_FLOAT_M];

        // TODO: these should be moved out of the function as an optimization.
        world->liveFloatData[index + LIVE_FLOAT_FX] = 0;
        world->liveFloatData[index + LIVE_FLOAT_FY] = 0;

        _position.x = world->liveFloatData[index + LIVE_FLOAT_X];
        _position.y = world->liveFloatData[index + LIVE_FLOAT_Y];

        applyImpulse(world->liveFloatData[index + LIVE_FLOAT_NIX], world->liveFloatData[index + LIVE_FLOAT_NIY]);

        world->liveFloatData[index + LIVE_FLOAT_NIX] = 0.0f;
        world->liveFloatData[index + LIVE_FLOAT_NIY] = 0.0f;

        // Set the class's vectors based on the live data.
        _velocity.x = world->liveFloatData[index + LIVE_FLOAT_VX];
        _velocity.y = world->liveFloatData[index + LIVE_FLOAT_VY];
        
        // Apply the force that is currently in memory, then clear it.
        applyForce(world->liveFloatData[index + LIVE_FLOAT_NFX], world->liveFloatData[index + LIVE_FLOAT_NFY]);
        world->liveFloatData[index + LIVE_FLOAT_NFX] = 0;
        world->liveFloatData[index + LIVE_FLOAT_NFY] = 0;

        // Apply damping force.
        _dampingForce = _velocity * -damping;
        applyForce(_dampingForce.x, _dampingForce.y);

        // Calculate acceleration based on force and mass.
        if (mass == 0 || mass == INFINITY || type == ObjectType::FIXED_OBJECT) {
            _acceleration.x = 0.0f;
            _acceleration.y = 0.0f;
        } else {
            _force.x = world->liveFloatData[index + LIVE_FLOAT_FX];
            _force.y = world->liveFloatData[index + LIVE_FLOAT_FY];
            _acceleration = _force / mass;
        }

        // Update velocity based on acceleration and time step.
        _dv = _acceleration * dt * 0.5f;
        _velocity = _velocity + _dv;

        // ix and iy are for visual debugging.
        // We can decay them here.

        world->liveFloatData[index + LIVE_FLOAT_IX] *= world->decayMap[99];
        world->liveFloatData[index + LIVE_FLOAT_IY] *= world->decayMap[99];

        // Update position based on velocity and time step.
        _position = _position + _velocity * dt;

        // Apply rotational damping to rotational speed.
        float rs1 = world->liveFloatData[index + LIVE_FLOAT_RS];
        world->liveFloatData[index + LIVE_FLOAT_RS] *= (1.0f - rotationalDamping * dt);
        float rs2 = world->liveFloatData[index + LIVE_FLOAT_RS];

        // Update rotation based on rotational speed and time step.
        world->liveFloatData[index + LIVE_FLOAT_R] += (rs1 + rs2) * dt / 2.0f;

        // TODO: I don't like how the full damping takes effect per frame. It should be per second.
        // This requires us to basically hard code frame rates.

        // Apply linear damping to velocity.
        // No more damping. We will use a damping force.
        // The existing damping var will represent the damping coefficient.
        // velocity = velocity * (1.0f - damping * dt);

        // Reassign the values to the live data.
        world->liveFloatData[index + LIVE_FLOAT_X] = _position.x;
        world->liveFloatData[index + LIVE_FLOAT_Y] = _position.y;
        world->liveFloatData[index + LIVE_FLOAT_VX] = _velocity.x;
        world->liveFloatData[index + LIVE_FLOAT_VY] = _velocity.y;

        bool moved = world->liveFloatData[index + LIVE_FLOAT_X] != lastX 
            || world->liveFloatData[index + LIVE_FLOAT_Y] != lastY 
            || world->liveFloatData[index + LIVE_FLOAT_R] != lastR;

        lastX = world->liveFloatData[index + LIVE_FLOAT_X];
        lastY = world->liveFloatData[index + LIVE_FLOAT_Y];
        lastR = world->liveFloatData[index + LIVE_FLOAT_R];

        return moved;
    }
};


#endif