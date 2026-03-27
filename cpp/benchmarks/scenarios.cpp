#include "scenarios.h"
#include <iostream>
#include <vector>
#include <cmath>
#include <random>

// Helper functions (mirrored from world_tests.cpp or adapted)
static emscripten_val createBodyOptions(float x, float y, ObjectType type, float mass = 1.0f) {
    emscripten_val options;
    options["x"] = x;
    options["y"] = y;
    options["mass"] = mass;
    options["type"] = (int)type;
    options["shape"] = (int)ObjectShape::BOX; // Default
    options["width"] = 1.0f;
    options["height"] = 1.0f;
    options["sFriction"] = 0.5f;
    options["kFriction"] = 0.5f;
    return options;
}

static emscripten_val createFixtureOptions(ObjectShape shape, float width, float height, float radius = 0.5f) {
    emscripten_val options;
    options["shape"] = (int)shape;
    options["width"] = width;
    options["height"] = height;
    options["radius"] = radius;
    options["density"] = 1.0f;
    options["restitution"] = 0.1f;
    options["sFriction"] = 0.5f;
    options["kFriction"] = 0.5f;
    options["categoryBits"] = (uint32_t)0xFFFF;
    options["maskBits"] = (uint32_t)0xFFFF;
    return options;
}

void setupLargeStack(World& world) {
    world.clear();
    world.setGravity(0.0f, 9.81f);
    
    // Create static ground
    int groundId = 10000;
    world.createBody(groundId, createBodyOptions(0.0f, 10.0f, ObjectType::FIXED_OBJECT));
    world.createFixture(groundId, 0, createFixtureOptions(ObjectShape::BOX, 100.0f, 1.0f));

    // Stacks
    int nextId = 0;
    for (float x = -4.0f; x <= 4.0f; x += 1.2f) {
        for (int y = 0; y < 15; ++y) {
            int id = ++nextId;
            world.createBody(id, createBodyOptions(x, 4.0f - y * 0.6f, ObjectType::DYNAMIC_OBJECT));
            world.createFixture(id, 0, createFixtureOptions(ObjectShape::BOX, 1.0f, 0.5f));
        }
    }
}

void setupHighDensity(World& world) {
    world.clear();
    world.setGravity(0.0f, 9.81f);
    
    // Ground & Walls
    int groundId = 10000;
    world.createBody(groundId, createBodyOptions(0.0f, 5.0f, ObjectType::FIXED_OBJECT));
    world.createFixture(groundId, 0, createFixtureOptions(ObjectShape::BOX, 12.0f, 1.0f));
    
    int leftWallId = 10001;
    world.createBody(leftWallId, createBodyOptions(-6.0f, 0.0f, ObjectType::FIXED_OBJECT));
    world.createFixture(leftWallId, 0, createFixtureOptions(ObjectShape::BOX, 1.0f, 10.0f));
    
    int rightWallId = 10002;
    world.createBody(rightWallId, createBodyOptions(6.0f, 0.0f, ObjectType::FIXED_OBJECT));
    world.createFixture(rightWallId, 0, createFixtureOptions(ObjectShape::BOX, 1.0f, 10.0f));

    std::mt19937 gen(42); // Fixed seed for determinism
    std::uniform_real_distribution<float> disX(-5.0f, 5.0f);
    std::uniform_real_distribution<float> disY(-10.0f, 0.0f);

    for (int i = 0; i < 500; ++i) {
        int id = i + 1;
        world.createBody(id, createBodyOptions(disX(gen), disY(gen), ObjectType::DYNAMIC_OBJECT));
        world.createFixture(id, 0, createFixtureOptions(ObjectShape::CIRCLE, 0.4f, 0.4f, 0.2f));
    }
}

void setupJointChain(World& world) {
    world.clear();
    world.setGravity(0.0f, 10.0f);

    int count = 20;
    float startX = 0.0f;
    float startY = -10.0f;
    float length = 1.0f;

    // Anchor
    int anchorId = 10000;
    world.createBody(anchorId, createBodyOptions(startX, startY, ObjectType::FIXED_OBJECT));
    world.createFixture(anchorId, 0, createFixtureOptions(ObjectShape::BOX, 0.5f, 0.5f));

    int prevId = anchorId;
    for (int i = 0; i < count; ++i) {
        int id = i + 1;
        world.createBody(id, createBodyOptions(startX + (i + 1) * length, startY, ObjectType::DYNAMIC_OBJECT));
        world.createFixture(id, 0, createFixtureOptions(ObjectShape::BOX, 0.8f, 0.2f));
        
        // Hinge Joint
        world.createHingeJoint(id, prevId, id, 
            startX + i * length + length/2.0f, startY, 
            startX + i * length + length/2.0f, startY);
        prevId = id;
    }
}

void setupParticlesStress(World& world) {
    world.clear();
    world.setGravity(0.0f, 0.0f); // Often stress tests like this use zero gravity or container bounce
    
    int id = 10000;
    float thickness = 2.0f;
    float length = 11.0f;

    // Walls (AABB in original, but creating as BOX here to match existing setup style)
    // Wall Top
    world.createBody(id++, createBodyOptions(5.0f, 0.0f, ObjectType::FIXED_OBJECT));
    world.createFixture(id - 1, 0, createFixtureOptions(ObjectShape::BOX, length, thickness));
    
    // Wall Bottom
    world.createBody(id++, createBodyOptions(5.0f, 10.0f, ObjectType::FIXED_OBJECT));
    world.createFixture(id - 1, 0, createFixtureOptions(ObjectShape::BOX, length, thickness));

    // Wall Left
    world.createBody(id++, createBodyOptions(0.0f, 5.0f, ObjectType::FIXED_OBJECT));
    world.createFixture(id - 1, 0, createFixtureOptions(ObjectShape::BOX, thickness, length));

    // Wall Right
    world.createBody(id++, createBodyOptions(10.0f, 5.0f, ObjectType::FIXED_OBJECT));
    world.createFixture(id - 1, 0, createFixtureOptions(ObjectShape::BOX, thickness, length));

    std::mt19937 gen(42);
    std::uniform_real_distribution<float> disPos(1.0f, 9.0f);
    std::uniform_real_distribution<float> disVel(-0.5f, 0.5f);
    std::uniform_real_distribution<float> disRot(0.0f, (float)M_PI);
    std::uniform_real_distribution<float> disAngVel(-10.0f, 10.0f);

    for (int i = 0; i < 2000; ++i) {
        int bodyId = i + 1;
        
        emscripten_val options = createBodyOptions(disPos(gen), disPos(gen), ObjectType::DYNAMIC_OBJECT, 0.5f);
        options["vx"] = disVel(gen);
        options["vy"] = disVel(gen);
        options["r"] = disRot(gen);
        options["rs"] = disAngVel(gen);
        options["angularDamping"] = 0.5f;
        options["linearDamping"] = 0.0f;
        
        world.createBody(bodyId, options);
        
        emscripten_val fixOptions = createFixtureOptions(ObjectShape::CIRCLE, 0.0f, 0.0f, 0.05f);
        fixOptions["restitution"] = 0.5f;
        world.createFixture(bodyId, 0, fixOptions);
    }
}

void setupMixedJoints(World& world) {
    world.clear();
    world.setGravity(0.0f, 10.0f);

    int chains = 5;
    int jointsPerChain = 40;
    float length = 0.5f;

    for (int c = 0; c < chains; ++c) {
        float startX = (c - chains / 2.0f) * 5.0f;
        float startY = -10.0f;
        int anchorId = 40000 + c * 1000;
        world.createBody(anchorId, createBodyOptions(startX, startY, ObjectType::FIXED_OBJECT));

        int prevId = anchorId;
        for (int j = 0; j < jointsPerChain; ++j) {
            int id = anchorId + j + 1;
            world.createBody(id, createBodyOptions(startX + (j + 1) * length, startY, ObjectType::DYNAMIC_OBJECT));
            
            int type = (c + j) % 3;
            if (type == 0) {
                world.createDistanceJoint(id, prevId, id, 0.0f, 0.0f, 0.0f, 0.0f, length);
            } else if (type == 1) {
                world.createSpringJoint(id, prevId, id, 0.0f, 0.0f, 0.0f, 0.0f, length, 5.0f, 0.7f);
            } else {
                world.createHingeJoint(id, prevId, id, startX + j * length, startY, startX + j * length, startY);
            }
            prevId = id;
        }
    }

    // Add GearJoints (4 independent pairs to trigger SIMD)
    for (int g = 0; g < 4; ++g) {
        float gx = 15.0f + g * 4.0f;
        float gy = 0.0f;
        int baseId = 50000 + g * 100;
        
        world.createBody(baseId, createBodyOptions(gx, gy, ObjectType::FIXED_OBJECT));
        world.createBody(baseId + 1, createBodyOptions(gx + 1.0f, gy, ObjectType::DYNAMIC_OBJECT));
        world.createBody(baseId + 2, createBodyOptions(gx + 2.0f, gy, ObjectType::DYNAMIC_OBJECT));
        
        world.createHingeJoint(baseId + 10, baseId, baseId + 1, gx, gy, gx, gy);
        world.createHingeJoint(baseId + 11, baseId, baseId + 2, gx + 2.0f, gy, gx + 2.0f, gy);
        
        world.createGearJoint(baseId + 20, baseId + 10, baseId + 11, 1.0f);
    }
}
