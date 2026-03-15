#include "fixture.h"
#include "body.h"
#include "world.h"
#include "collision-solver.h"
#include <cmath>
#include <algorithm>

Fixture::Fixture(World& world, int id, Body* body, emscripten_val options)
    : world(world), id(id), body(body),
      shape(!options["shape"].isUndefined() ? static_cast<ObjectShape>(options["shape"].as<int>()) : ObjectShape::CIRCLE)
{
    world.liveFixtureIntData.push_back(id);
    world.liveFixtureIntData.push_back(body->worldIndex);
    world.liveFixtureIntData.push_back((int)shape);
    
    uint32_t categoryBits = !options["categoryBits"].isUndefined() ? (uint32_t)options["categoryBits"].as<int>() : 0xFFFFFFFF; // Default to all bits
    uint32_t maskBits = !options["maskBits"].isUndefined() ? (uint32_t)options["maskBits"].as<int>() : 0xFFFFFFFF; // Default to all bits
    
    world.liveFixtureIntData.push_back(categoryBits);
    world.liveFixtureIntData.push_back(maskBits);
    uint32_t flags = 0;
    if (!options["isSensor"].isUndefined() && options["isSensor"].as<bool>()) {
        flags |= FIXTURE_FLAG_IS_SENSOR;
    }
    if (!options["wantsEvents"].isUndefined() && options["wantsEvents"].as<bool>()) {
        flags |= FIXTURE_FLAG_WANTS_EVENTS;
    }
    world.liveFixtureIntData.push_back(flags); // Flags

    world.liveFixtureFloatData.push_back(!options["localX"].isUndefined() ? options["localX"].as<float>() : 0.0f);
    world.liveFixtureFloatData.push_back(!options["localY"].isUndefined() ? options["localY"].as<float>() : 0.0f);
    world.liveFixtureFloatData.push_back(!options["localR"].isUndefined() ? options["localR"].as<float>() : 0.0f);
    
    float valW = !options["radius"].isUndefined() ? options["radius"].as<float>() : (!options["width"].isUndefined() ? options["width"].as<float>() : 0.0f);
    float valH = !options["height"].isUndefined() ? options["height"].as<float>() : 0.0f;
    
    world.liveFixtureFloatData.push_back(valW);
    world.liveFixtureFloatData.push_back(valH);
    world.liveFixtureFloatData.push_back(!options["restitution"].isUndefined() ? options["restitution"].as<float>() : 0.2f);
    world.liveFixtureFloatData.push_back(!options["sFriction"].isUndefined() ? options["sFriction"].as<float>() : 0.2f);
    world.liveFixtureFloatData.push_back(!options["kFriction"].isUndefined() ? options["kFriction"].as<float>() : 0.2f);
    
    // AABB placeholders
    world.liveFixtureFloatData.push_back(0.0f);
    world.liveFixtureFloatData.push_back(0.0f);
    world.liveFixtureFloatData.push_back(0.0f);
    world.liveFixtureFloatData.push_back(0.0f);

    // Max extent for AABB padding
    float maxExtent = 0.0f;
    if (shape == ObjectShape::CIRCLE || shape == ObjectShape::POINT) {
        maxExtent = valW;
    } else if (shape == ObjectShape::BOX || shape == ObjectShape::AABB) {
        maxExtent = 0.5f * std::sqrt(valW * valW + valH * valH);
    } else if (shape == ObjectShape::ELLIPSE) {
        maxExtent = std::max(valW, valH) * 0.5f;
    } else if (shape == ObjectShape::CAPSULE) {
        maxExtent = valH * 0.5f; 
    }
    world.liveFixtureFloatData.push_back(maxExtent); // Index 12

    float density = !options["density"].isUndefined() ? options["density"].as<float>() : 1.0f;
    world.liveFixtureFloatData.push_back(density); // Index 13 (FIXTURE_FDATA_DENSITY)

    // Ensure we push exactly FIXTURE_FDATA_EPO (16) elements
    for (int i = 14; i < FIXTURE_FDATA_EPO; ++i) {
        world.liveFixtureFloatData.push_back(0.0f);
    }
}

Fixture::~Fixture() {
    if (bvhNode) {
        // World should handle BVH removal before deleting fixture
    }
}

float Fixture::getLocalX() const { return world.liveFixtureFloatData[worldIndex * FIXTURE_FDATA_EPO + FIXTURE_FDATA_LOCAL_X]; }
float Fixture::getLocalY() const { return world.liveFixtureFloatData[worldIndex * FIXTURE_FDATA_EPO + FIXTURE_FDATA_LOCAL_Y]; }
float Fixture::getLocalR() const { return world.liveFixtureFloatData[worldIndex * FIXTURE_FDATA_EPO + FIXTURE_FDATA_LOCAL_R]; }
float Fixture::getWidth() const { return world.liveFixtureFloatData[worldIndex * FIXTURE_FDATA_EPO + FIXTURE_FDATA_W]; }
float Fixture::getHeight() const { return world.liveFixtureFloatData[worldIndex * FIXTURE_FDATA_EPO + FIXTURE_FDATA_H]; }
float Fixture::getRadius() const { return world.liveFixtureFloatData[worldIndex * FIXTURE_FDATA_EPO + FIXTURE_FDATA_RADIUS]; }
float Fixture::getRestitution() const { return world.liveFixtureFloatData[worldIndex * FIXTURE_FDATA_EPO + FIXTURE_FDATA_RESTITUTION]; }
float Fixture::getStaticFriction() const { return world.liveFixtureFloatData[worldIndex * FIXTURE_FDATA_EPO + FIXTURE_FDATA_S_FRICTION]; }
float Fixture::getKineticFriction() const { return world.liveFixtureFloatData[worldIndex * FIXTURE_FDATA_EPO + FIXTURE_FDATA_K_FRICTION]; }

uint32_t Fixture::getCategoryBits() const { return world.liveFixtureIntData[worldIndex * FIXTURE_IDATA_EPO + FIXTURE_IDATA_CATEGORY_BITS]; }
uint32_t Fixture::getMaskBits() const { return world.liveFixtureIntData[worldIndex * FIXTURE_IDATA_EPO + FIXTURE_IDATA_MASK_BITS]; }

uint32_t Fixture::getSystemCategory() const {
    if (shape == ObjectShape::POINT) return CATEGORY_POINT;
    if (body->type == ObjectType::FIXED_OBJECT) return CATEGORY_STATIC;
    if (isSensor()) return CATEGORY_SENSOR;
    return CATEGORY_DYNAMIC;
}

void Fixture::setSensor(bool isSensor) {
    int idx = worldIndex * FIXTURE_IDATA_EPO + FIXTURE_IDATA_FLAGS;
    if (isSensor) {
        world.liveFixtureIntData[idx] |= FIXTURE_FLAG_IS_SENSOR;
    } else {
        world.liveFixtureIntData[idx] &= ~FIXTURE_FLAG_IS_SENSOR;
    }
    if (bvhNode) {
        CollisionProperties props = bvhNode->properties;
        props.systemCategory = getSystemCategory();
        props.isRigid = !isSensor;
        bvhNode->updateProperties(props);
    }
}

bool Fixture::isSensor() const {
    return (world.liveFixtureIntData[worldIndex * FIXTURE_IDATA_EPO + FIXTURE_IDATA_FLAGS] & FIXTURE_FLAG_IS_SENSOR) != 0;
}

bool Fixture::wantsEvents() const {
    return (world.liveFixtureIntData[worldIndex * FIXTURE_IDATA_EPO + FIXTURE_IDATA_FLAGS] & FIXTURE_FLAG_WANTS_EVENTS) != 0;
}

float Fixture::getDensity() const { return world.liveFixtureFloatData[worldIndex * FIXTURE_FDATA_EPO + FIXTURE_FDATA_DENSITY]; }

void Fixture::setCategoryBits(uint32_t bits) {
    world.liveFixtureIntData[worldIndex * FIXTURE_IDATA_EPO + FIXTURE_IDATA_CATEGORY_BITS] = bits;
    if (bvhNode) {
        CollisionProperties props = bvhNode->properties;
        props.userCategory = bits;
        bvhNode->updateProperties(props);
    }
}

void Fixture::setMaskBits(uint32_t bits) {
    world.liveFixtureIntData[worldIndex * FIXTURE_IDATA_EPO + FIXTURE_IDATA_MASK_BITS] = bits;
    if (bvhNode) {
        CollisionProperties props = bvhNode->properties;
        props.userMask = bits;
        bvhNode->updateProperties(props);
    }
}

void Fixture::setDensity(float density) {
    world.liveFixtureFloatData[worldIndex * FIXTURE_FDATA_EPO + FIXTURE_FDATA_DENSITY] = density;
    body->updateInverseInertia();
}

MassData Fixture::getMassData() const {
    MassData data;
    float density = getDensity();
    float lx = getLocalX();
    float ly = getLocalY();
    data.center = Vec2(lx, ly);

    if (shape == ObjectShape::CIRCLE || shape == ObjectShape::POINT) {
        float r = getRadius();
        data.mass = density * M_PI * r * r;
        data.inertia = 0.5f * data.mass * r * r;
    } else {
        // Box or AABB
        float w = getWidth();
        float h = getHeight();
        data.mass = density * w * h;
        data.inertia = (1.0f / 12.0f) * data.mass * (w * w + h * h);
    }
    
    return data;
}

CollisionProperties Fixture::getCollisionProperties() const {
    CollisionProperties props;
    props.userCategory = getCategoryBits();
    props.userMask = getMaskBits();
    props.systemCategory = getSystemCategory();
    props.isRigid = !isSensor();
    props.isSleeping = body->isSleeping;
    props.bodyId = body->id;
    props.velocity = body->getVelocity();
    return props;
}

void Fixture::updateAabb(int mode) {
    float pr = body->getRotation();
    updateAabb(cos(pr), sin(pr), mode);
}

void Fixture::updateAabb(float cosR, float sinR, int mode) {
    aabb = computeAabb(cosR, sinR, mode);
    
    int idx = worldIndex * FIXTURE_FDATA_EPO;
    world.liveFixtureFloatData[idx + FIXTURE_FDATA_AX1] = aabb.min.x;
    world.liveFixtureFloatData[idx + FIXTURE_FDATA_AY1] = aabb.min.y;
    world.liveFixtureFloatData[idx + FIXTURE_FDATA_AX2] = aabb.max.x;
    world.liveFixtureFloatData[idx + FIXTURE_FDATA_AY2] = aabb.max.y;
}

Aabb Fixture::computeAabb(float cosR, float sinR, int mode) const {
    float px = body->getX();
    float py = body->getY();
    float pr = body->getRotation();
    
    float lx = getLocalX();
    float ly = getLocalY();
    float lr = getLocalR();
    
    // World position of fixture
    float wx = px + (lx * cosR - ly * sinR);
    float wy = py + (lx * sinR + ly * cosR);
    float wr = pr + lr;

    float w = getWidth();
    float h = getHeight();
    
    float newX1, newY1, newX2, newY2;

    switch (shape) {
        case ObjectShape::CIRCLE:
            newX1 = wx - w;
            newY1 = wy - w;
            newX2 = wx + w;
            newY2 = wy + w;
            break;
        case ObjectShape::AABB:
            newX1 = wx - w / 2;
            newY1 = wy - h / 2;
            newX2 = wx + w / 2;
            newY2 = wy + h / 2;
            break;
        case ObjectShape::BOX:
        case ObjectShape::ELLIPSE: {
            float cr = cos(wr);
            float sr = sin(wr);
            float cornersX[4] = {
                (-w/2) * cr - (-h/2) * sr + wx,
                ( w/2) * cr - (-h/2) * sr + wx,
                ( w/2) * cr - ( h/2) * sr + wx,
                (-w/2) * cr - ( h/2) * sr + wx
            };
            float cornersY[4] = {
                (-w/2) * sr + (-h/2) * cr + wy,
                ( w/2) * sr + (-h/2) * cr + wy,
                ( w/2) * sr + ( h/2) * cr + wy,
                (-w/2) * sr + ( h/2) * cr + wy
            };
            newX1 = *std::min_element(cornersX, cornersX + 4);
            newY1 = *std::min_element(cornersY, cornersY + 4);
            newX2 = *std::max_element(cornersX, cornersX + 4);
            newY2 = *std::max_element(cornersY, cornersY + 4);
            break;
        }
        default:
            newX1 = wx; newY1 = wy; newX2 = wx; newY2 = wy;
            break;
    }

    // Apply proportional padding
    float hx = (newX2 - newX1) * 0.5f;
    float hy = (newY2 - newY1) * 0.5f;
    float size = std::max(hx, hy) * 2.0f;

    float margin = (mode == 0) ? size * 0.05f : 0.0f; // 5% of object size
    float padding = (mode == 0) ? 0.1f : 0.0f;        // 0.1s of velocity-based expansion
    
    if (margin > 0 || padding > 0) {
        float vx = body->getVelocityX();
        float vy = body->getVelocityY();
        float rs = body->getAngularVelocity();
        float absRs = std::abs(rs);

        newX1 += std::min((vx - absRs * hy) * padding, 0.0f) - margin;
        newY1 += std::min((vy - absRs * hx) * padding, 0.0f) - margin;
        newX2 += std::max((vx + absRs * hy) * padding, 0.0f) + margin;
        newY2 += std::max((vy + absRs * hx) * padding, 0.0f) + margin;
    }

    return Aabb(Vec2(newX1, newY1), Vec2(newX2, newY2));
}

bool Fixture::testPoint(float x, float y) const {
    Vec2 p(x, y);
    float px = body->getX();
    float py = body->getY();
    float pr = body->getRotation();
    float lx = getLocalX();
    float ly = getLocalY();
    float lr = getLocalR();
    
    float cosR = cos(pr);
    float sinR = sin(pr);
    Vec2 center(px + (lx * cosR - ly * sinR), py + (lx * sinR + ly * cosR));
    float rotation = pr + lr;

    switch(shape) {
        case ObjectShape::POINT:
        case ObjectShape::CIRCLE: 
            return CollisionSolver::testPointCircle(p, center, getRadius());
        case ObjectShape::BOX:    
            return CollisionSolver::testPointBox(p, center, getWidth(), getHeight(), rotation);
        case ObjectShape::AABB:   
            return CollisionSolver::testPointAabb(p, center, getWidth(), getHeight());
        default: 
            return false;
    }
}
