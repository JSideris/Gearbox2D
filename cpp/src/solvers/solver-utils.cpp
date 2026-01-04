#include "collision-solver.h"
#include <algorithm>

using namespace std;

// Helper function to find closest points between two line segments
float CollisionSolver::closestPointsBetweenLines(
    const Vec2& p1, const Vec2& p2,
    const Vec2& p3, const Vec2& p4,
    Vec2& pointOnLine1, Vec2& pointOnLine2) {
    
    Vec2 d1 = p2 - p1; // Direction vector of line 1
    Vec2 d2 = p4 - p3; // Direction vector of line 2
    Vec2 r = p1 - p3;
    
    float a = d1.dot(d1); // Square of length of d1
    float e = d2.dot(d2); // Square of length of d2
    float f = d2.dot(r);
    
    // Check if either or both segments degenerate into points
    if (a <= 1e-6f && e <= 1e-6f) {
        // Both segments degenerate into points
        pointOnLine1 = p1;
        pointOnLine2 = p3;
        return (p1 - p3).magnitudeSquared();
    }
    
    float t, s;
    
    if (a <= 1e-6f) {
        // First segment degenerates into a point
        s = 0.0f;
        t = f / e;
        t = std::min(std::max(t, 0.0f), 1.0f);
    }
    else {
        float c = d1.dot(r);
        if (e <= 1e-6f) {
            // Second segment degenerates into a point
            t = 0.0f;
            s = std::min(std::max(-c / a, 0.0f), 1.0f);
        }
        else {
            // General case
            float b = d1.dot(d2);
            float denom = a * e - b * b;
            
            // If segments not parallel, compute closest point on line1 to line2
            // and clamp to segment
            if (denom != 0.0f) {
                s = std::min(std::max((b * f - c * e) / denom, 0.0f), 1.0f);
            }
            else {
                s = 0.0f;
            }
            
            // Compute point on line2 closest to segment1(s)
            t = (b * s + f) / e;
            
            // Clamp
            if (t < 0.0f) {
                t = 0.0f;
                s = std::min(std::max(-c / a, 0.0f), 1.0f);
            }
            else if (t > 1.0f) {
                t = 1.0f;
                s = std::min(std::max((b - c) / a, 0.0f), 1.0f);
            }
        }
    }
    
    pointOnLine1 = p1 + d1 * s;
    pointOnLine2 = p3 + d2 * t;
    
    return (pointOnLine1 - pointOnLine2).magnitudeSquared();
}

