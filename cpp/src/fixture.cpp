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

    // Polygon vertex data
    if (shape == ObjectShape::POLYGON && !options["vertices"].isUndefined()) {
        emscripten_val vertices = options["vertices"];
        int count = vertices["length"].as<int>();
        count = std::min(count, MAX_POLYGON_VERTICES);
        
        std::vector<Vec2> polyVertices;
        for (int i = 0; i < count; ++i) {
            polyVertices.push_back(Vec2(vertices[i]["x"].as<float>(), vertices[i]["y"].as<float>()));
        }

        // Check winding order (should be CCW)
        float area = 0.0f;
        for (int i = 0; i < count; ++i) {
            Vec2 p1 = polyVertices[i];
            Vec2 p2 = polyVertices[(i + 1) % count];
            area += p1.cross(p2);
        }
        
        if (area < 0) {
            std::reverse(polyVertices.begin(), polyVertices.end());
        }

        world.liveFixtureFloatData.push_back((float)count); // Index 14: FIXTURE_FDATA_VERTEX_COUNT
        world.liveFixtureFloatData.push_back(0.0f);         // Index 15: Padding
        
        float maxPolyExtentSq = 0.0f;
        for (int i = 0; i < MAX_POLYGON_VERTICES; ++i) {
            if (i < count) {
                float vx = polyVertices[i].x;
                float vy = polyVertices[i].y;
                world.liveFixtureFloatData.push_back(vx);
                world.liveFixtureFloatData.push_back(vy);
                maxPolyExtentSq = std::max(maxPolyExtentSq, vx * vx + vy * vy);
            } else {
                world.liveFixtureFloatData.push_back(0.0f);
                world.liveFixtureFloatData.push_back(0.0f);
            }
        }
        maxExtent = std::sqrt(maxPolyExtentSq);
        // Overwrite maxExtent at index 12 if it was polygon
        // We just pushed 2 + 2 * MAX_POLYGON_VERTICES = 18 elements.
        // Index 12 is 18 - (14 - 12) = 18 - 2 = 16 elements back? No.
        // Let's just use the absolute index in the vector for now since we know we just pushed them.
        size_t lastIdx = world.liveFixtureFloatData.size() - 1; // index 31
        world.liveFixtureFloatData[lastIdx - (FIXTURE_FDATA_EPO - 1 - FIXTURE_FDATA_MAX_EXTENT)] = maxExtent;
    } else {
        // Ensure we push exactly FIXTURE_FDATA_EPO (32) elements
        for (int i = 14; i < FIXTURE_FDATA_EPO; ++i) {
            world.liveFixtureFloatData.push_back(0.0f);
        }
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
    } else if (shape == ObjectShape::CAPSULE) {
        float r = getRadius();
        float h = getHeight();
        float l = std::max(0.0f, h - 2.0f * r);
        float circleArea = M_PI * r * r;
        float rectArea = 2.0f * r * l;
        data.mass = density * (circleArea + rectArea);
        
        float mCircle = density * circleArea;
        float mRect = density * rectArea;
        
        // Inertia of rectangle + Steiner's theorem for two semicircles (forming a circle shifted by l/2)
        data.inertia = (1.0f / 12.0f) * mRect * (4.0f * r * r + l * l) + 
                       (0.5f * mCircle * r * r + mCircle * (l * l * 0.25f));
    } else if (shape == ObjectShape::POLYGON) {
        int vCount = (int)world.liveFixtureFloatData[worldIndex * FIXTURE_FDATA_EPO + FIXTURE_FDATA_VERTEX_COUNT];
        float area = 0.0f;
        Vec2 centroid(0.0f, 0.0f);
        float inertia = 0.0f;
        
        int startIdx = worldIndex * FIXTURE_FDATA_EPO + FIXTURE_FDATA_VERTEX_START;
        for (int i = 0; i < vCount; ++i) {
            Vec2 p1(world.liveFixtureFloatData[startIdx + i * 2], world.liveFixtureFloatData[startIdx + i * 2 + 1]);
            Vec2 p2(world.liveFixtureFloatData[startIdx + ((i + 1) % vCount) * 2], world.liveFixtureFloatData[startIdx + ((i + 1) % vCount) * 2 + 1]);
            
            float cross = p1.cross(p2);
            area += 0.5f * cross;
            centroid += (p1 + p2) * (cross / 6.0f);
        }
        
        if (std::abs(area) > 0.0001f) {
            centroid /= area;
            data.mass = density * std::abs(area);
            
            // Inertia of polygon: sum (p1 x p2) * (p1^2 + p1.p2 + p2^2) / 12
            for (int i = 0; i < vCount; ++i) {
                Vec2 p1 = Vec2(world.liveFixtureFloatData[startIdx + i * 2], world.liveFixtureFloatData[startIdx + i * 2 + 1]) - centroid;
                Vec2 p2 = Vec2(world.liveFixtureFloatData[startIdx + ((i + 1) % vCount) * 2], world.liveFixtureFloatData[startIdx + ((i + 1) % vCount) * 2 + 1]) - centroid;
                float cross = p1.cross(p2);
                inertia += cross * (p1.dot(p1) + p1.dot(p2) + p2.dot(p2));
            }
            data.inertia = density * std::abs(inertia) / 12.0f;
            data.center = centroid + Vec2(lx, ly);
        } else {
            data.mass = 0.0f;
            data.inertia = 0.0f;
        }
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
        case ObjectShape::CAPSULE: {
            float r = getRadius();
            float halfL = std::max(0.0f, getHeight() * 0.5f - r);
            float cr = cos(wr);
            float sr = sin(wr);
            
            // Local segment is (0, -halfL) to (0, halfL)
            float ex1 = -(-halfL) * sr + wx;
            float ey1 = (-halfL) * cr + wy;
            float ex2 = -(halfL) * sr + wx;
            float ey2 = (halfL) * cr + wy;
            
            newX1 = std::min(ex1, ex2) - r;
            newY1 = std::min(ey1, ey2) - r;
            newX2 = std::max(ex1, ex2) + r;
            newY2 = std::max(ey1, ey2) + r;
            break;
        }
        case ObjectShape::POLYGON: {
            int vCount = (int)world.liveFixtureFloatData[worldIndex * FIXTURE_FDATA_EPO + FIXTURE_FDATA_VERTEX_COUNT];
            int startIdx = worldIndex * FIXTURE_FDATA_EPO + FIXTURE_FDATA_VERTEX_START;
            float cosTotal = cos(wr);
            float sinTotal = sin(wr);
            
            newX1 = 1e10f; newY1 = 1e10f;
            newX2 = -1e10f; newY2 = -1e10f;
            
            for (int i = 0; i < vCount; ++i) {
                float vx = world.liveFixtureFloatData[startIdx + i * 2];
                float vy = world.liveFixtureFloatData[startIdx + i * 2 + 1];
                float worldVX = wx + (vx * cosTotal - vy * sinTotal);
                float worldVY = wy + (vx * sinTotal + vy * cosTotal);
                
                newX1 = std::min(newX1, worldVX);
                newY1 = std::min(newY1, worldVY);
                newX2 = std::max(newX2, worldVX);
                newY2 = std::max(newY2, worldVY);
            }
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
        case ObjectShape::CAPSULE:
            return CollisionSolver::testPointCapsule(p, center, getRadius(), getHeight(), rotation);
        case ObjectShape::AABB:   
            return CollisionSolver::testPointAabb(p, center, getWidth(), getHeight());
        case ObjectShape::POLYGON: {
            int vCount = (int)world.liveFixtureFloatData[worldIndex * FIXTURE_FDATA_EPO + FIXTURE_FDATA_VERTEX_COUNT];
            int startIdx = worldIndex * FIXTURE_FDATA_EPO + FIXTURE_FDATA_VERTEX_START;
            std::vector<Vec2> worldVertices;
            float cosTotal = cos(rotation);
            float sinTotal = sin(rotation);
            for (int i = 0; i < vCount; ++i) {
                float vx = world.liveFixtureFloatData[startIdx + i * 2];
                float vy = world.liveFixtureFloatData[startIdx + i * 2 + 1];
                worldVertices.push_back(Vec2(center.x + (vx * cosTotal - vy * sinTotal), center.y + (vx * sinTotal + vy * cosTotal)));
            }
            return CollisionSolver::testPointPolygon(p, worldVertices);
        }
        default: 
            return false;
    }
}
