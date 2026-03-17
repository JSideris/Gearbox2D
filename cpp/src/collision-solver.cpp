#include "collision-solver.h"
#include "world.h"
#include "constants.h"
#include <cmath>
#include <algorithm>
#include <iostream>

CollisionSolver::CollisionSolver(World& world) : world(world) {}

void CollisionSolver::clear() {
    collisions.clear();
}

void CollisionSolver::_swap() {
    std::swap(_indexA, _indexB);
    _relativeVelocity = _relativeVelocity * -1.0f;
}

bool CollisionSolver::solve(int indexA, int indexB, float dt) {
    _indexA = indexA;
    _indexB = indexB;
    _dt = dt;

    int shapeA = world.liveFixtureIntData[_indexA * FIXTURE_IDATA_EPO + FIXTURE_IDATA_SHAPE];
    int shapeB = world.liveFixtureIntData[_indexB * FIXTURE_IDATA_EPO + FIXTURE_IDATA_SHAPE];

    int bIdxA = world.liveFixtureIntData[_indexA * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX];
    int bIdxB = world.liveFixtureIntData[_indexB * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX];

    _relativeVelocity = Vec2(
        world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_VX] - world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_VX],
        world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_VY] - world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_VY]
    );

    float globalSpecMargin = world.getSpeculativeMargin();
    
    // Dynamic Speculative Margin logic:
    // Only enable speculative contacts for objects moving fast relative to their size.
    // This fixes stability issues in stacks (Pyramids) and Newton's Cradle.
    auto getMinThickness = [&](int fIdx, int shape) {
        float w = world.liveFixtureFloatData[fIdx * FIXTURE_FDATA_EPO + FIXTURE_FDATA_W];
        float h = world.liveFixtureFloatData[fIdx * FIXTURE_FDATA_EPO + FIXTURE_FDATA_H];
        if (shape == (int)ObjectShape::CIRCLE || shape == (int)ObjectShape::POINT || shape == (int)ObjectShape::CAPSULE) return w * 2.0f;
        return std::min(w, h);
    };

    float minSize = std::min(getMinThickness(_indexA, shapeA), getMinThickness(_indexB, shapeB));
    
    float relSpeed = _relativeVelocity.magnitude();
    float travelDist = relSpeed * _dt;
    
    // If travel distance is less than 25% of the object size, we don't need speculative contacts.
    // This preserves high-fidelity discrete physics for slow/resting objects.
    if (travelDist < minSize * 0.25f) {
        _speculativeMargin = 0.0f;
    } else {
        // Otherwise, ensure the margin is large enough to catch the collision this frame.
        _speculativeMargin = std::max(globalSpecMargin, travelDist);
    }

    switch(static_cast<ObjectShape>(shapeA)){
        case ObjectShape::AABB:
            switch(static_cast<ObjectShape>(shapeB)){
                case ObjectShape::AABB: return _solveAabbAabb();
                case ObjectShape::CIRCLE: return _solveAabbCircle();
                case ObjectShape::BOX: return _solveBoxBox();
                case ObjectShape::POINT: return _solveAabbPoint();
                case ObjectShape::CAPSULE: _swap(); return _solveCapsuleBox();
                case ObjectShape::POLYGON: _swap(); return _solvePolygonAabb();
                default: break;
            }
            break;
        case ObjectShape::BOX:
            switch(static_cast<ObjectShape>(shapeB)){
                case ObjectShape::AABB: _swap(); return _solveBoxBox();
                case ObjectShape::CIRCLE: _swap(); return _solveCircleBox();
                case ObjectShape::BOX: return _solveBoxBox();
                case ObjectShape::POINT: return _solveBoxPoint();
                case ObjectShape::CAPSULE: _swap(); return _solveCapsuleBox();
                case ObjectShape::POLYGON: _swap(); return _solvePolygonBox();
                default: break;
            }
            break;
        case ObjectShape::CIRCLE:
            switch(static_cast<ObjectShape>(shapeB)){
                case ObjectShape::CIRCLE: return _solveCircleCircle();
                case ObjectShape::AABB: _swap(); return _solveAabbCircle();
                case ObjectShape::BOX: return _solveCircleBox();
                case ObjectShape::POINT: return _solveCirclePoint();
                case ObjectShape::CAPSULE: _swap(); return _solveCapsuleCircle();
                case ObjectShape::POLYGON: _swap(); return _solvePolygonCircle();
                default: break;
            }
            break;
        case ObjectShape::CAPSULE:
            switch(static_cast<ObjectShape>(shapeB)){
                case ObjectShape::CIRCLE: return _solveCapsuleCircle();
                case ObjectShape::BOX: return _solveCapsuleBox();
                case ObjectShape::CAPSULE: return _solveCapsuleCapsule();
                case ObjectShape::POINT: return _solveCapsulePoint();
                case ObjectShape::AABB: return _solveCapsuleBox(); // AABB is treated as oriented box
                case ObjectShape::POLYGON: _swap(); return _solvePolygonCapsule();
                default: break;
            }
            break;
        case ObjectShape::POINT:
            switch(static_cast<ObjectShape>(shapeB)){
                case ObjectShape::POINT: return false;
                case ObjectShape::AABB: _swap(); return _solveAabbPoint();
                case ObjectShape::CIRCLE: _swap(); return _solveCirclePoint();
                case ObjectShape::BOX: _swap(); return _solveBoxPoint();
                case ObjectShape::CAPSULE: _swap(); return _solveCapsulePoint();
                case ObjectShape::POLYGON: _swap(); return _solvePolygonPoint();
                default: break;
            }
            break;
        case ObjectShape::POLYGON:
            switch(static_cast<ObjectShape>(shapeB)){
                case ObjectShape::POLYGON: return _solvePolygonPolygon();
                case ObjectShape::POINT: return _solvePolygonPoint();
                case ObjectShape::CIRCLE: return _solvePolygonCircle();
                case ObjectShape::BOX: return _solvePolygonBox();
                case ObjectShape::CAPSULE: return _solvePolygonCapsule();
                case ObjectShape::AABB: return _solvePolygonAabb();
                default: break;
            }
            break;
        default: break;
    }
    return false;
}
