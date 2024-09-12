#ifndef VEC2_H
#define VEC2_H

#include <cmath>

// Vec2 class definition
class Vec2 {
public:
    float x, y;

    // Default constructor
    Vec2() : x(0), y(0) {}

    // Parameterized constructor
    Vec2(float x, float y) : x(x), y(y) {}

    // Addition
    Vec2 operator+(const Vec2& other) const {
        return Vec2(x + other.x, y + other.y);
    }

    // Subtraction
    Vec2 operator-(const Vec2& other) const {
        return Vec2(x - other.x, y - other.y);
    }

    // Scalar multiplication
    Vec2 operator*(float scalar) const {
        return Vec2(x * scalar, y * scalar);
    }

    // Scalar division
    Vec2 operator/(float scalar) const {
        return Vec2(x / scalar, y / scalar);
    }

    // Magnitude (length) of the vector
    float magnitude() const {
        return std::sqrt(x * x + y * y);
    }

    float magnitudeSquared() const {
        return (x * x + y * y);
    }

    // Normalize the vector
    Vec2 normalize() const {
        float mag = magnitude();
        return (mag > 0) ? Vec2(x / mag, y / mag) : Vec2();
    }

    float dot(const Vec2& other) const {
        return x * other.x + y * other.y;
    }

    float cross(const Vec2& other) const {
        return x * other.y - y * other.x;
    }

    // Rotate this vector by angle (in radians)
    Vec2 rotate(float angle) const {
        float cosTheta = cos(angle);
        float sinTheta = sin(angle);

        // Apply the 2D rotation matrix
        float xRot = x * cosTheta - y * sinTheta;
        float yRot = x * sinTheta + y * cosTheta;

        return Vec2(xRot, yRot);
    }
};


#endif // VEC2_H