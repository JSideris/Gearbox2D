#include <gtest/gtest.h>
#include "aabb.h"

// Test default constructor
TEST(AabbTest, DefaultConstructor) {
    Aabb aabb;
    EXPECT_EQ(aabb.min.x, std::numeric_limits<float>::max());
    EXPECT_EQ(aabb.min.y, std::numeric_limits<float>::max());
    EXPECT_EQ(aabb.max.x, std::numeric_limits<float>::lowest());
    EXPECT_EQ(aabb.max.y, std::numeric_limits<float>::lowest());
}

// Test parameterized constructor
TEST(AabbTest, ParameterizedConstructor) {
    Vec2 min(1.0f, 2.0f);
    Vec2 max(3.0f, 4.0f);
    Aabb aabb(min, max);
    EXPECT_EQ(aabb.min.x, 1.0f);
    EXPECT_EQ(aabb.min.y, 2.0f);
    EXPECT_EQ(aabb.max.x, 3.0f);
    EXPECT_EQ(aabb.max.y, 4.0f);
}

// Test overlap detection (overlapping case)
TEST(AabbTest, OverlapsTrue) {
    Aabb aabb1(Vec2(0.0f, 0.0f), Vec2(2.0f, 2.0f));
    Aabb aabb2(Vec2(1.0f, 1.0f), Vec2(3.0f, 3.0f));
    EXPECT_TRUE(aabb1.overlaps(aabb2));
}

// Test overlap detection (non-overlapping case)
TEST(AabbTest, OverlapsFalse) {
    Aabb aabb1(Vec2(0.0f, 0.0f), Vec2(2.0f, 2.0f));
    Aabb aabb2(Vec2(3.0f, 3.0f), Vec2(5.0f, 5.0f));
    EXPECT_FALSE(aabb1.overlaps(aabb2));
}

// Test expanding to include a point
TEST(AabbTest, ExpandToInclude) {
    Aabb aabb(Vec2(1.0f, 1.0f), Vec2(3.0f, 3.0f));
    Vec2 point(0.0f, 4.0f);
    aabb.expandToInclude(point);
    EXPECT_EQ(aabb.min.x, 0.0f);
    EXPECT_EQ(aabb.min.y, 1.0f);
    EXPECT_EQ(aabb.max.x, 3.0f);
    EXPECT_EQ(aabb.max.y, 4.0f);
}

// Test expanding by a margin
TEST(AabbTest, ExpandByMargin) {
    Aabb aabb(Vec2(1.0f, 1.0f), Vec2(3.0f, 3.0f));
    aabb.expandBy(1.0f);
    EXPECT_EQ(aabb.min.x, 0.0f);
    EXPECT_EQ(aabb.min.y, 0.0f);
    EXPECT_EQ(aabb.max.x, 4.0f);
    EXPECT_EQ(aabb.max.y, 4.0f);
}

// Test merging with another AABB
TEST(AabbTest, MergeWith) {
    Aabb aabb1(Vec2(1.0f, 1.0f), Vec2(3.0f, 3.0f));
    Aabb aabb2(Vec2(2.0f, 2.0f), Vec2(4.0f, 4.0f));
    aabb1.mergeWith(aabb2);
    EXPECT_EQ(aabb1.min.x, 1.0f);
    EXPECT_EQ(aabb1.min.y, 1.0f);
    EXPECT_EQ(aabb1.max.x, 4.0f);
    EXPECT_EQ(aabb1.max.y, 4.0f);
}

// Test getting the center of the AABB
TEST(AabbTest, GetCenter) {
    Aabb aabb(Vec2(1.0f, 1.0f), Vec2(3.0f, 3.0f));
    Vec2 center = aabb.getCenter();
    EXPECT_EQ(center.x, 2.0f);
    EXPECT_EQ(center.y, 2.0f);
}

// Test getting the extents (half-sizes) of the AABB
TEST(AabbTest, GetExtents) {
    Aabb aabb(Vec2(1.0f, 1.0f), Vec2(5.0f, 9.0f));
    Vec2 extents = aabb.getExtents();
    EXPECT_EQ(extents.x, 2.0f);
    EXPECT_EQ(extents.y, 4.0f);
}

// Test getting the surface area of the AABB
TEST(AabbTest, GetSurfaceArea) {
    Aabb aabb(Vec2(1.0f, 1.0f), Vec2(5.0f, 9.0f));
    EXPECT_EQ(aabb.getSurfaceArea(), 24.0f);  // 2 * (4 + 8)
}

// Test point containment (inside case)
TEST(AabbTest, ContainsPointTrue) {
    Aabb aabb(Vec2(1.0f, 1.0f), Vec2(5.0f, 5.0f));
    Vec2 point(3.0f, 3.0f);
    EXPECT_TRUE(aabb.containsPoint(point));
}

// Test point containment (outside case)
TEST(AabbTest, ContainsPointFalse) {
    Aabb aabb(Vec2(1.0f, 1.0f), Vec2(5.0f, 5.0f));
    Vec2 point(6.0f, 3.0f);
    EXPECT_FALSE(aabb.containsPoint(point));
}
