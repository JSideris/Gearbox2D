#include <gtest/gtest.h>
#include "world.h"
#include "body.h"
#include "debug.h"
#include "constants.h"

#include <cmath>
#include <sstream>
#include <string>

// Reproduction tests for reported tunneling. A failure means the circle reached
// a side of a solid it does not fit through. These checks are invariants.

static const float kDt = 1.0f / 60.0f;
static const float kRadius = 0.5f;
static const int kPushSteps = 240;

static emscripten_val fixedBox(float x, float y, float w, float h, ObjectShape shape) {
    emscripten_val options;
    options.properties["x"] = x;
    options.properties["y"] = y;
    options.properties["type"] = (int)ObjectType::FIXED_OBJECT;
    options.properties["shape"] = (int)shape;
    options.properties["width"] = w;
    options.properties["height"] = h;
    options.properties["restitution"] = 0.0f;
    options.properties["sFriction"] = 0.0f;
    options.properties["kFriction"] = 0.0f;
    return options;
}

static emscripten_val movingCircle(float x, float y, float vx, float vy) {
    emscripten_val options;
    options.properties["x"] = x;
    options.properties["y"] = y;
    options.properties["vx"] = vx;
    options.properties["vy"] = vy;
    options.properties["type"] = (int)ObjectType::DYNAMIC_OBJECT;
    options.properties["shape"] = (int)ObjectShape::CIRCLE;
    options.properties["radius"] = kRadius;
    options.properties["mass"] = 1.0f;
    options.properties["canSleep"] = false;
    options.properties["linearDamping"] = 0.0f;
    options.properties["angularDamping"] = 0.0f;
    options.properties["restitution"] = 0.0f;
    options.properties["sFriction"] = 0.0f;
    options.properties["kFriction"] = 0.0f;
    return options;
}

static void configureWorld(World& world, float gravityY) {
    world.setGravity(0.0f, gravityY);
    world.setTimeStep(kDt);
    world.setHasFriction(false);
    world.setHasRestitution(false);
}

// Scripted forces are read from NFX during velocity integration. World::step
// clears FX before that, so Body::applyForce does not reach the solver.
static void setSustainedForce(Body* body, float fx, float fy) {
    int i = body->worldIndex;
    body->world.liveBodyFloatData[GET_BODY_FDATA_INDEX(i, BODY_FDATA_NFX)] = fx;
    body->world.liveBodyFloatData[GET_BODY_FDATA_INDEX(i, BODY_FDATA_NFY)] = fy;
}

static const char* shapeName(ObjectShape shape) {
    return shape == ObjectShape::AABB ? "aabb" : "box";
}

static std::string formatCross(const std::string& label, int step, float x, float y) {
    std::ostringstream os;
    os << label << " crossed on step " << step << " at (" << x << ", " << y << ")\n";
    return os.str();
}

// Barrier at x = 0, opening along Y. Exit is the right face.
// Crossed: center passes that face while still lined up with the opening.
static std::string pushCircleThroughVerticalSlit(float gap, float speed, ObjectShape shape) {
    const float thickness = 1.0f;
    const float length = 30.0f;
    const float exitX = thickness * 0.5f;
    const float corridor = gap * 0.5f + kRadius;

    World world;
    configureWorld(world, 0.0f);

    int id = 1;
    float halfGap = gap * 0.5f;
    float halfLen = length * 0.5f;
    world.createBody(id++, fixedBox(0.0f, -(halfGap + halfLen), thickness, length, shape));
    world.createBody(id++, fixedBox(0.0f, halfGap + halfLen, thickness, length, shape));

    float startX = -exitX - kRadius - 1.0f;
    int circleId = id;
    world.createBody(circleId, movingCircle(startX, 0.0f, speed, 0.0f));
    Body* circle = world.getBody(circleId);
    EXPECT_NE(circle, nullptr);
    if (!circle) return "";

    for (int step = 0; step < kPushSteps; ++step) {
        circle->setVelocityX(speed);
        circle->setVelocityY(0.0f);
        world.step();
        float x = circle->getX();
        float y = circle->getY();
        if (x > exitX && std::fabs(y) <= corridor) {
            std::ostringstream label;
            label << shapeName(shape) << " slit gap=" << gap << " speed=" << speed;
            return formatCross(label.str(), step, x, y);
        }
    }
    return "";
}

// Barrier at y = 0, opening along X. Gravity pulls the circle into the opening.
// Crossed: center passes the bottom face while still lined up with the opening.
static std::string dropCircleThroughHorizontalSlit(float gap, ObjectShape shape) {
    const float thickness = 1.0f;
    const float length = 30.0f;
    const float exitY = -thickness * 0.5f;
    const float corridor = gap * 0.5f + kRadius;

    World world;
    configureWorld(world, -20.0f);

    int id = 1;
    float halfGap = gap * 0.5f;
    float halfLen = length * 0.5f;
    world.createBody(id++, fixedBox(-(halfGap + halfLen), 0.0f, length, thickness, shape));
    world.createBody(id++, fixedBox(halfGap + halfLen, 0.0f, length, thickness, shape));

    float startY = thickness * 0.5f + kRadius + 1.5f;
    int circleId = id;
    world.createBody(circleId, movingCircle(0.0f, startY, 0.0f, 0.0f));
    Body* circle = world.getBody(circleId);
    EXPECT_NE(circle, nullptr);
    if (!circle) return "";

    for (int step = 0; step < kPushSteps; ++step) {
        world.step();
        float x = circle->getX();
        float y = circle->getY();
        if (y < exitY && std::fabs(x) <= corridor) {
            std::ostringstream label;
            label << shapeName(shape) << " fall slit gap=" << gap;
            return formatCross(label.str(), step, x, y);
        }
    }
    return "";
}

TEST(TunnelingRepro, OpenSlitBlocksCircle) {
    const float gaps[] = {0.2f, 0.5f, 0.9f};
    const float speeds[] = {2.0f, 15.0f, 50.0f};
    const ObjectShape shapes[] = {ObjectShape::BOX, ObjectShape::AABB};
    std::string crossings;
    for (ObjectShape shape : shapes) {
        for (float gap : gaps) {
            for (float speed : speeds) {
                crossings += pushCircleThroughVerticalSlit(gap, speed, shape);
            }
        }
    }
    EXPECT_TRUE(crossings.empty()) << crossings;
}

TEST(TunnelingRepro, OpenSlitFallBlocksCircle) {
    const float gaps[] = {0.2f, 0.5f, 0.9f};
    const ObjectShape shapes[] = {ObjectShape::BOX, ObjectShape::AABB};
    std::string crossings;
    for (ObjectShape shape : shapes) {
        for (float gap : gaps) {
            crossings += dropCircleThroughHorizontalSlit(gap, shape);
        }
    }
    EXPECT_TRUE(crossings.empty()) << crossings;
}

// Gap wider than the diameter. Same drive must carry the circle past the exit,
// otherwise a blocked result above is an immobile scene rather than a seal.
TEST(TunnelingRepro, WiderGapLetsCircleThrough) {
    const float gap = 1.6f;
    const float speed = 15.0f;
    const float thickness = 1.0f;
    const float length = 30.0f;
    const float exitX = thickness * 0.5f;

    World world;
    configureWorld(world, 0.0f);

    int id = 1;
    float halfGap = gap * 0.5f;
    float halfLen = length * 0.5f;
    world.createBody(id++, fixedBox(0.0f, -(halfGap + halfLen), thickness, length, ObjectShape::BOX));
    world.createBody(id++, fixedBox(0.0f, halfGap + halfLen, thickness, length, ObjectShape::BOX));

    float startX = -exitX - kRadius - 1.0f;
    int circleId = id;
    world.createBody(circleId, movingCircle(startX, 0.0f, speed, 0.0f));
    Body* circle = world.getBody(circleId);
    ASSERT_NE(circle, nullptr);

    float farX = circle->getX();
    for (int step = 0; step < 120; ++step) {
        circle->setVelocityX(speed);
        circle->setVelocityY(0.0f);
        world.step();
        farX = std::max(farX, circle->getX());
    }

    EXPECT_GT(farX, exitX) << "circle stayed at x=" << circle->getX()
                           << " and never cleared exit " << exitX;
    EXPECT_LT(std::fabs(circle->getY()), halfGap);
}

// Two overlapping rects form a solid elbow. The free region is x < 0, y < 0.
// The overlap occupies x in [0, 1], y in [0, 1]. Entering that square is the
// sealed corner. Speeds here cannot jump the whole square in one step.
TEST(TunnelingRepro, ClosedCornerBlocksCircle) {
    const float angles[] = {0.0f, 20.0f, 45.0f};
    const float offsets[] = {0.0f, 0.15f};
    const float speeds[] = {2.0f, 15.0f, 50.0f};
    const float clear = kRadius + 0.02f;
    const float overlap = 1.0f;

    std::string crossings;
    for (float angleDeg : angles) {
        float angle = angleDeg * 3.14159265f / 180.0f;
        float dx = std::cos(angle);
        float dy = std::sin(angle);
        // Perpendicular that points into the open quadrant.
        float px = -dy;
        float py = dx;
        if (px + py > 0.0f) {
            px = -px;
            py = -py;
        }

        for (float offset : offsets) {
            float startX = -dx * 2.5f + px * offset;
            float startY = -dy * 2.5f + py * offset;
            if (startX > -clear) startX = -clear;
            if (startY > -clear) startY = -clear;
            // A pure horizontal aim sits on the slab. Keep the offset after
            // that separation so the two aims do not collapse together.
            if (angleDeg == 0.0f) startY -= offset;

            for (float speed : speeds) {
                World world;
                configureWorld(world, 0.0f);

                // Horizontal arm: x in [-3, 3], y in [0, 1].
                // Vertical arm:   x in [0, 1], y in [-3, 1].
                world.createBody(1, fixedBox(0.0f, 0.5f, 6.0f, 1.0f, ObjectShape::BOX));
                world.createBody(2, fixedBox(0.5f, -1.0f, 1.0f, 4.0f, ObjectShape::BOX));
                world.createBody(3, movingCircle(startX, startY, dx * speed, dy * speed));
                Body* circle = world.getBody(3);
                EXPECT_NE(circle, nullptr);
                if (!circle) continue;

                for (int step = 0; step < kPushSteps; ++step) {
                    circle->setVelocityX(dx * speed);
                    circle->setVelocityY(dy * speed);
                    world.step();
                    float x = circle->getX();
                    float y = circle->getY();
                    if (x > 0.0f && y > 0.0f && x < overlap && y < overlap) {
                        std::ostringstream label;
                        label << "corner angle=" << angleDeg << " offset=" << offset
                              << " speed=" << speed << " start=(" << startX << "," << startY << ")";
                        crossings += formatCross(label.str(), step, x, y);
                        break;
                    }
                }
            }
        }
    }

    EXPECT_TRUE(crossings.empty()) << crossings;
}

TEST(TunnelingRepro, ThickWallBlocksCircle) {
    const float wallWidth = 4.0f;
    const float wallHeight = 6.0f;
    const float exitX = wallWidth * 0.5f;
    const float entryX = -exitX;
    const float startX = entryX - kRadius - 0.05f;
    const float faceBand = wallHeight * 0.5f;

    struct Drive {
        const char* name;
        float speed;
        float force;
        bool reapply;
        int steps;
    };
    // 180 m/s covers the 2.55 m from the start to just past the midplane in one step.
    const Drive drives[] = {
        {"speed=2", 2.0f, 0.0f, true, kPushSteps},
        {"speed=15", 15.0f, 0.0f, true, kPushSteps},
        {"speed=50", 50.0f, 0.0f, true, kPushSteps},
        {"force=500", 0.0f, 500.0f, true, kPushSteps},
        {"oneshot=180", 180.0f, 0.0f, false, 120},
    };

    std::string crossings;
    for (const Drive& drive : drives) {
        World world;
        configureWorld(world, 0.0f);
        world.createBody(1, fixedBox(0.0f, 0.0f, wallWidth, wallHeight, ObjectShape::BOX));
        world.createBody(2, movingCircle(startX, 0.0f, drive.speed, 0.0f));
        Body* circle = world.getBody(2);
        ASSERT_NE(circle, nullptr);

        float farX = startX;
        bool crossed = false;
        for (int step = 0; step < drive.steps; ++step) {
            if (drive.reapply && drive.force == 0.0f) {
                circle->setVelocityX(drive.speed);
                circle->setVelocityY(0.0f);
            } else if (drive.force != 0.0f) {
                setSustainedForce(circle, drive.force, 0.0f);
            }
            world.step();
            float x = circle->getX();
            float y = circle->getY();
            farX = std::max(farX, x);
            if (x > exitX && std::fabs(y) <= faceBand) {
                crossings += formatCross(std::string("thick wall ") + drive.name, step, x, y);
                crossed = true;
                break;
            }
        }

        if (!crossed && drive.force != 0.0f) {
            EXPECT_GT(farX, startX + 0.04f)
                << "sustained force did not move the circle (farX=" << farX << ")";
        }
    }

    EXPECT_TRUE(crossings.empty()) << crossings;
}
