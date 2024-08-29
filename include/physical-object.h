#pragma once

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

class PhysicalObject {
private:
    int id;
    Vec2 position;
    Vec2 force;
    float rotation;  // Current rotation in degrees
    Vec2 velocity;   // Linear velocity of the object
    float rotationalSpeed;  // Angular velocity (degrees per second)
    ObjectType type;
    ObjectShape shape;
    float damping;   // Linear damping factor (0 = no damping, 1 = full damping)
    float rotationalDamping; // Rotational damping factor (0 = no damping, 1 = full damping)


    

    // Shape properties
    float radius;
    // float* points;
    float width;
    float height;

public:

    Aabb aabb;
    TreeNode* bvhNode; 
    
    float mass;
    World* world = nullptr;
    int worldIndex = -1;

    // Public accessors for js...
    // Read only.
    float x = 0.0f;
    float y = 0.0f;
    float r = 0.0f;
    float vx = 0.0f;
    float vy = 0.0f;
    float rs = 0.0f;
    float fx = 0.0f;
    float fy = 0.0f;
    float ix = 0.0f;
    float iy = 0.0f;

    // AABB readouts.
    float x0 = 0.0f;
    float y0 = 0.0f;
    float x1 = 0.0f;
    float y1 = 0.0f;

    // Constructor with default values for position, rotation, and type
    PhysicalObject(int id, emscripten::val options) 
        : id(id),
          bvhNode(nullptr),
          force(Vec2(0.0f, 0.0f)),
          mass(options.hasOwnProperty("mass") ? options["mass"].as<float>() : 1.0f),
          position(Vec2(options.hasOwnProperty("x") ? options["x"].as<float>() : 0.0f, options.hasOwnProperty("y") ? options["y"].as<float>() : 0.0f)),
          rotation(options.hasOwnProperty("r") ? options["r"].as<float>() : 0.0f),
          type(options.hasOwnProperty("type") ? options["type"].as<ObjectType>() : ObjectType::RIGID_BODY),
          velocity(Vec2(options.hasOwnProperty("vx") ? options["vx"].as<float>() : 0.0f, options.hasOwnProperty("vy") ? options["vy"].as<float>() : 0.0f)),
          rotationalSpeed(options.hasOwnProperty("rotationalSpeed") ? options["rotationalSpeed"].as<float>() : 0.0f),
          damping(options.hasOwnProperty("damping") ? options["damping"].as<float>() : 0.1f),
          rotationalDamping(options.hasOwnProperty("rotationalDamping") ? options["rotationalDamping"].as<float>() : 0.1f),

          shape(options.hasOwnProperty("shape") ? options["shape"].as<ObjectShape>() : ObjectShape::CIRCLE),
          radius(options.hasOwnProperty("radius") ? options["radius"].as<float>() : 10.0f),
          // type(options.hasOwnProperty("points") ? options["points"].as<float*>() : nullptr), // TODO: figure out how to do points.
          width(options.hasOwnProperty("width") ? options["width"].as<float>() : 10.0f),
          height(options.hasOwnProperty("height") ? options["height"].as<float>() : 10.0f)

    {
        recomputeAabb();

        x = position.x;
        y = position.y;
        x0 = aabb.min.x;
        y0 = aabb.min.y;
        x1 = aabb.max.x;
        y1 = aabb.max.y;
    }

    // Getters
    int getId() const { return id; }
    const Vec2& getPosition() const { return position; }
    // const float getX() const { return position.x; }
    // const float getY() const { return position.y; }
    float getRotation() const { return rotation; }
    ObjectType getType() const { return type; }
    ObjectShape getShape() const { return shape; }
    const Vec2& getVelocity() const { return velocity; }
    float getRotationalSpeed() const { return rotationalSpeed; }
    float getDamping() const { return damping; }
    float getRotationalDamping() const { return rotationalDamping; }

    float getRadius() const { return radius; }
    // float* getPoints() const { return points; }
    float getWidth() const { return width; }
    float getHeight() const { return height; }

    // Setters
    void setPosition(float x, float y) { position.x = x; position.y = y; this->x = x; this->y = y; }
    void setRotation(float newRotation) { rotation = newRotation; }
    void setType(ObjectType newType) { type = newType; }
    void setVelocity(float x, float y) { velocity.x = x; velocity.y = y; }
    void setRotationalSpeed(float newRotationalSpeed) { rotationalSpeed = newRotationalSpeed; }
    void setMass(float newMass) { mass = newMass; }
    void setDamping(float newDamping) { damping = newDamping; }
    void setRotationalDamping(float newRotationalDamping) { rotationalDamping = newRotationalDamping; }

    bool recomputeAabb(){

        bool changed = false;
        float newX1 = aabb.min.x;
        float newY1 = aabb.min.y;
        float newX2 = aabb.max.x;
        float newY2 = aabb.max.y;

        // Calculate the AABB for the object based on its shape.
        switch (shape) {
            case ObjectShape::POINT:
                newX1 = position.x;
                newY1 = position.x;
                newX2 = position.y;
                newY2 = position.y;

                break;
            case ObjectShape::CIRCLE:
                newX1 = position.x - radius;
                newY1 = position.y - radius;
                newX2 = position.x + radius;
                newY2 = position.y + radius;
                break;
            case ObjectShape::AABB:
                newX1 = position.x - width / 2;
                newY1 = position.y - height / 2;
                newX2 = position.x + width / 2;
                newY2 = position.y + height / 2;
                break;
            case ObjectShape::BOX:
                // TODO: this must handle rotations.
                newX1 = position.x - width / 2;
                newY1 = position.y - height / 2;
                newX2 = position.x + width / 2;
                newY2 = position.y + height / 2;
                break;
            case ObjectShape::ELLIPSE:
                // TODO: this must handle rotations.
                newX1 = position.x - width / 2;
                newY1 = position.y - height / 2;
                newX2 = position.x + width / 2;
                newY2 = position.y + height / 2;
                break;
            case ObjectShape::CAPSULE:
                // TODO: this must handle rotations.
                newX1 = position.x - width / 2;
                newY1 = position.y - height / 2;
                newX2 = position.x + width / 2;
                newY2 = position.y + height / 2;
                break;
            case ObjectShape::POLYGON:
                // TODO.
                newX1 = position.x;
                newY1 = position.x;
                newX2 = position.y;
                newY2 = position.y;
                break;
        }

        if (newX1 < aabb.min.x || newY1 < aabb.min.y || newX2 > aabb.max.x || newY2 > aabb.max.y) {
            changed = true;
            float paddingAmount = 0.2f;
            Vec2 paddingA = Vec2(std::min(velocity.x * paddingAmount, 0.0f), std::min(velocity.y * paddingAmount, 0.0f));
            Vec2 paddingB = Vec2(std::max(velocity.x * paddingAmount, 0.0f), std::max(velocity.y * paddingAmount, 0.0f));

            aabb = Aabb(Vec2(newX1, newY1) + paddingA, Vec2(newX2, newY2) + paddingB);
        }

        return changed;
    }

    void applyForce(float x, float y){
        force.x += x;
        force.y += y;
    }

    void applyImpulse(float x, float y){
        ix += x;
        iy += y;

        if (mass != 0 && mass != INFINITY && type != ObjectType::FIXED_OBJECT) {
            velocity.x += x / mass;
            velocity.y += y / mass;
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

        // Apply damping force.
        Vec2 dampingForce = velocity * -damping;
        applyForce(dampingForce.x, dampingForce.y);

        // Calculate acceleration based on force and mass.
        Vec2 acceleration;
        if (mass == 0 || mass == INFINITY || type == ObjectType::FIXED_OBJECT) {
            acceleration = Vec2(0.0f, 0.0f);
        } else {
            acceleration = force / mass;
        }

        // Update velocity based on acceleration and time step.
        auto dv = acceleration * dt * 0.5f;
        velocity = velocity + dv;

        fx = force.x;
        fy = force.y;

        // Reset force to zero.
        force.x = 0;
        force.y = 0;

        // ix and iy are for visual debugging.
        // We can decay them here.

        ix *= world->decayMap[99];
        iy *= world->decayMap[99];

        // Update position based on velocity and time step.
        position = position + velocity * dt;

        // Update rotation based on rotational speed and time step.
        rotation += rotationalSpeed * dt;

        // TODO: I don't like how the full damping takes effect per frame. It should be per second.
        // This requires us to basically hard code frame rates.

        // Apply linear damping to velocity.
        // No more damping. We will use a damping force.
        // The existing damping var will represent the damping coefficient.
        // velocity = velocity * (1.0f - damping * dt);

        // Apply rotational damping to rotational speed.
        rotationalSpeed *= (1.0f - rotationalDamping * dt);

        return dv.magnitudeSquared() > 0.0f;
    }
};

