#include <gtest/gtest.h>
#include "world.h"
#include "body.h"
#include "fixture.h"
#include "constants.h"

// Helper to create options for various shapes
static emscripten_val createShapeOptions(float x, float y, ObjectShape shape, float w, float h = 0, float r = 0) {
    emscripten_val options;
    options.properties["x"] = x;
    options.properties["y"] = y;
    options.properties["shape"] = (int)shape;
    options.properties["r"] = r;
    if (shape == ObjectShape::CIRCLE) {
        options.properties["radius"] = w;
    } else {
        options.properties["width"] = w;
        options.properties["height"] = h;
    }
    options.properties["type"] = (int)ObjectType::DYNAMIC_OBJECT;
    options.properties["mass"] = 1.0f;
    return options;
}

TEST(QueryTest, CircleHitTest) {
    World world;
    // Circle at (5, 5) with radius 1
    world.makeBody(1, createShapeOptions(5.0f, 5.0f, ObjectShape::CIRCLE, 1.0f));
    
    Body* obj = world.getBody(1);
    
    // Center should be hit
    EXPECT_TRUE(obj->testPoint(5.0f, 5.0f));
    // Edge should be hit
    EXPECT_TRUE(obj->testPoint(5.9f, 5.0f));
    // Just outside edge should NOT be hit
    EXPECT_FALSE(obj->testPoint(6.1f, 5.0f));
}

TEST(QueryTest, AabbHitTest) {
    World world;
    // AABB at (5, 5) with width 2, height 2 (range 4-6)
    world.makeBody(1, createShapeOptions(5.0f, 5.0f, ObjectShape::AABB, 2.0f, 2.0f));
    
    Body* obj = world.getBody(1);
    
    EXPECT_TRUE(obj->testPoint(5.0f, 5.0f));
    EXPECT_TRUE(obj->testPoint(4.1f, 4.1f));
    EXPECT_TRUE(obj->testPoint(5.9f, 5.9f));
    EXPECT_FALSE(obj->testPoint(3.9f, 5.0f));
    EXPECT_FALSE(obj->testPoint(5.0f, 6.1f));
}

TEST(QueryTest, BoxHitTest) {
    World world;
    // Box at (5, 5) with width 2, height 1, rotated 0
    world.makeBody(1, createShapeOptions(5.0f, 5.0f, ObjectShape::BOX, 2.0f, 1.0f, 0.0f));
    
    Body* obj = world.getBody(1);
    
    EXPECT_TRUE(obj->testPoint(5.5f, 5.2f));
    EXPECT_FALSE(obj->testPoint(5.5f, 5.6f)); // Outside height (half-height is 0.5)

    // Now test rotation: rotate 90 degrees (PI/2)
    // Now it should be 1 wide and 2 high
    obj->setRotation(M_PI / 2.0f);
    
    EXPECT_TRUE(obj->testPoint(5.2f, 5.5f));
    EXPECT_FALSE(obj->testPoint(5.6f, 5.5f)); // Should be outside new width
}

TEST(QueryTest, WorldQueryPoint) {
    World world;
    // Obj 1: Circle at (2, 2) rad 1
    world.makeBody(1, createShapeOptions(2.0f, 2.0f, ObjectShape::CIRCLE, 1.0f));
    // Obj 2: Box at (2, 2) width 0.5, height 0.5
    world.makeBody(2, createShapeOptions(2.0f, 2.0f, ObjectShape::BOX, 0.5f, 0.5f));
    // Obj 3: Circle far away at (10, 10)
    world.makeBody(3, createShapeOptions(10.0f, 10.0f, ObjectShape::CIRCLE, 1.0f));
    
    // Query at (2, 2) should return 1 and 2
    std::vector<int> hits = world.queryBodiesAtPoint(2.0f, 2.0f);
    EXPECT_EQ(hits.size(), 2);
    
    // Check if both IDs are present
    bool found1 = false, found2 = false;
    for (int id : hits) {
        if (id == 1) found1 = true;
        if (id == 2) found2 = true;
    }
    EXPECT_TRUE(found1);
    EXPECT_TRUE(found2);
    
    // Query at (10, 10) should return 3
    hits = world.queryBodiesAtPoint(10.0f, 10.0f);
    EXPECT_EQ(hits.size(), 1);
    EXPECT_EQ(hits[0], 3);
    
    // Query at (5, 5) should return nothing
    hits = world.queryBodiesAtPoint(5.0f, 5.0f);
    EXPECT_EQ(hits.size(), 0);
}

TEST(QueryTest, WorldQueryWithMask) {
    World world;
    
    auto opt1 = createShapeOptions(5.0f, 5.0f, ObjectShape::CIRCLE, 1.0f);
    opt1.properties["categoryBits"] = 0x1;
    world.makeBody(1, opt1);
    
    auto opt2 = createShapeOptions(5.0f, 5.0f, ObjectShape::BOX, 1.0f, 1.0f);
    opt2.properties["categoryBits"] = 0x2;
    world.makeBody(2, opt2);
    
    // Query with mask 0x1 (should only hit obj 1)
    std::vector<int> hits = world.queryBodiesAtPoint(5.0f, 5.0f, 0x1);
    EXPECT_EQ(hits.size(), 1);
    EXPECT_EQ(hits[0], 1);
    
    // Query with mask 0x2 (should only hit obj 2)
    hits = world.queryBodiesAtPoint(5.0f, 5.0f, 0x2);
    EXPECT_EQ(hits.size(), 1);
    EXPECT_EQ(hits[0], 2);
    
    // Query with mask 0x3 (should hit both)
    hits = world.queryBodiesAtPoint(5.0f, 5.0f, 0x3);
    EXPECT_EQ(hits.size(), 2);
}

