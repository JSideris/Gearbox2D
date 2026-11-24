#include <gtest/gtest.h>
#include "world.h"
#include "body.h"
#include <cmath>
#include <vector>

namespace {
Body* box(World& world, int id, float y, float width, float height, float mass,
          float rotation = 0.0f, float friction = 0.2f, ObjectShape shape = ObjectShape::BOX) {
    emscripten_val options;
    options.properties["type"] = int(mass > 0 ? ObjectType::DYNAMIC_OBJECT : ObjectType::FIXED_OBJECT);
    options.properties["x"] = 5.f;
    options.properties["y"] = y;
    options.properties["r"] = rotation;
    options.properties["mass"] = mass;
    options.properties["shape"] = int(shape);
    options.properties["width"] = width;
    options.properties["height"] = height;
    options.properties["sFriction"] = friction;
    options.properties["kFriction"] = friction;
    world.createBody(id, options);
    return world.getBody(id);
}

// Minimum separating-axis overlap for two squares, including during toppling.
float squareOverlap(Body* small, Body* large) {
    Vec2 smallX(std::cos(small->getRotation()), std::sin(small->getRotation()));
    Vec2 largeX(std::cos(large->getRotation()), std::sin(large->getRotation()));
    Vec2 smallY(-smallX.y, smallX.x), largeY(-largeX.y, largeX.x);
    Vec2 delta = large->getPosition() - small->getPosition();
    float overlap = 3.f;
    for (Vec2 axis : {smallX, smallY, largeX, largeY}) {
        float extent = 0.5f * (std::abs(smallX.dot(axis)) + std::abs(smallY.dot(axis)))
                     + std::abs(largeX.dot(axis)) + std::abs(largeY.dot(axis));
        overlap = std::min(overlap, extent - std::abs(delta.dot(axis)));
    }
    return overlap;
}
}

TEST(LoadedContacts, LightBoxKeepsFloorSupportUnderHeavyBox) {
    for (float gap : {0.f, 0.25f}) {
        World world;
        world.setGravity(0, 10);
        box(world, 1, 9.5f, 10, 1, 0);
        Body* light = box(world, 2, 8.5f, 1, 1, 0.1f);
        Body* heavy = box(world, 3, 7 - gap, 2, 2, 100);
        for (int i = 0; i < 600; ++i) {
            SCOPED_TRACE(::testing::Message() << "gap " << gap << ", frame " << i);
            world.step();
            float angle = light->getRotation();
            float bottom = light->getY() + 0.5f * (std::abs(std::sin(angle)) + std::abs(std::cos(angle)));
            ASSERT_LT(bottom - 9.f, 0.05f);
            ASSERT_LT(squareOverlap(light, heavy), 0.05f);
        }
    }
}

TEST(LoadedContacts, WakingSlabsTransmitAnIncomingImpact) {
    World world;
    world.setGravity(0, 10);
    box(world, 1, 8.5f, 20, 1, 0, 0, 0.2f, ObjectShape::AABB);
    std::vector<Body*> slabs;
    for (int i = 0; i < 700; ++i) {
        if (i % 90 == 0) {
            slabs.push_back(box(world, 2 + i / 90, 0, 6, 0.5f, 0.2f,
                                0.04f * std::sin(float(1 + i / 90)), 10));
        }
        world.step();
        for (size_t j = 1; j < slabs.size(); ++j) {
            ASSERT_GT(slabs[j - 1]->getY() - slabs[j]->getY(), 0.40f) << "frame " << i;
        }
    }
}

TEST(LoadedContacts, WakingPairResistsNewCompressionWithoutReleasingFrozenOverlap) {
    World world;
    Body* a = box(world, 1, 0, 1, 1, 1);
    Body* b = box(world, 2, 0.9f, 1, 1, 1);
    for (Body* body : {a, b}) {
        body->sleptOnSupport = true;
        body->timeSinceWake = 0.f;
    }
    ContactConstraint contact;
    contact.a = a;
    contact.b = b;
    contact.point = Vec2(5, 0.45f);
    contact.normal = Vec2(0, 1);
    contact.depth = 0.1f;
    contact.restitution = 0.f;
    contact.preSolve(world.getTimeStep(), true, true, true);
    contact.solvePosition();
    EXPECT_FLOAT_EQ(a->getY(), 0.f);
    EXPECT_FLOAT_EQ(b->getY(), 0.9f);

    // Another constraint pushes b further into a during the same step.
    b->setY(0.85f);
    contact.solvePosition();
    EXPECT_GT(b->getY() - a->getY(), 0.85f);
    EXPECT_LE(b->getY() - a->getY(), 0.9f);
    EXPECT_NEAR(b->getY() + a->getY(), 0.85f, 1e-6f);
}
