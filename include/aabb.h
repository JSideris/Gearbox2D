#ifndef AABB_H
#define AABB_H

#include <algorithm>
#include <limits>
#include "vec2.h"

// Axis-Aligned Bounding Box (AABB) class
class Aabb {
public:
    Vec2 min;  // Minimum corner of the AABB
    Vec2 max;  // Maximum corner of the AABB

    // Avoid using this default constructor whenever possible.
    Aabb() 
        : min(std::numeric_limits<float>::max(), std::numeric_limits<float>::max()),
          max(std::numeric_limits<float>::lowest(), std::numeric_limits<float>::lowest()) {}

    // Constructor with specific min and max corners
    Aabb(const Vec2& min, const Vec2& max) 
        : min(min), max(max) {}

    // Check if two AABBs overlap
    bool overlaps(const Aabb& other) const {
        return (min.x <= other.max.x && max.x >= other.min.x) &&
               (min.y <= other.max.y && max.y >= other.min.y);
    }

    // Expand the AABB to include a point
    void expandToInclude(const Vec2& point) {
        min.x = std::min(min.x, point.x);
        min.y = std::min(min.y, point.y);
        max.x = std::max(max.x, point.x);
        max.y = std::max(max.y, point.y);
    }

    // Expand the AABB by a margin (for allowing movement)
    void expandBy(float margin) {
        min.x -= margin;
        min.y -= margin;
        max.x += margin;
        max.y += margin;
    }

    // Merge this AABB with another AABB
    void mergeWith(const Aabb& other) {
        min.x = std::min(min.x, other.min.x);
        min.y = std::min(min.y, other.min.y);
        max.x = std::max(max.x, other.max.x);
        max.y = std::max(max.y, other.max.y);
    }

    // Get the center of the AABB
    Vec2 getCenter() const {
        return Vec2((min.x + max.x) / 2, (min.y + max.y) / 2);
    }

    // Get the extents (half-sizes) of the AABB
    Vec2 getExtents() const {
        return Vec2((max.x - min.x) / 2, (max.y - min.y) / 2);
    }

    // Get the surface area of the AABB
    float getSurfaceArea() const {
        float width = max.x - min.x;
        float height = max.y - min.y;
        return 2 * (width + height);
    }

    // Check if a point is inside the AABB
    bool containsPoint(const Vec2& point) const {
        return (point.x >= min.x && point.x <= max.x &&
                point.y >= min.y && point.y <= max.y);
    }
};

#endif