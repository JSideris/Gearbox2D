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

bool CollisionSolver::solve(int indexA, int indexB) {
    _indexA = indexA;
    _indexB = indexB;

    int shapeA = world.liveFixtureIntData[_indexA * FIXTURE_IDATA_EPO + FIXTURE_IDATA_SHAPE];
    int shapeB = world.liveFixtureIntData[_indexB * FIXTURE_IDATA_EPO + FIXTURE_IDATA_SHAPE];

    int bIdxA = world.liveFixtureIntData[_indexA * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX];
    int bIdxB = world.liveFixtureIntData[_indexB * FIXTURE_IDATA_EPO + FIXTURE_IDATA_BODY_INDEX];

    _relativeVelocity = Vec2(
        world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_VX] - world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_VX],
        world.liveBodyFloatData[bIdxB * BODY_FDATA_EPO + BODY_FDATA_VY] - world.liveBodyFloatData[bIdxA * BODY_FDATA_EPO + BODY_FDATA_VY]
    );

    switch(static_cast<ObjectShape>(shapeA)){
        case ObjectShape::AABB:
            switch(static_cast<ObjectShape>(shapeB)){
                case ObjectShape::AABB: return _solveAabbAabb();
                case ObjectShape::CIRCLE: return _solveAabbCircle();
                case ObjectShape::BOX: return _solveBoxBox();
                case ObjectShape::POINT: return _solveAabbPoint();
                default: break;
            }
            break;
        case ObjectShape::BOX:
            switch(static_cast<ObjectShape>(shapeB)){
                case ObjectShape::AABB: _swap(); return _solveBoxBox();
                case ObjectShape::CIRCLE: _swap(); return _solveCircleBox();
                case ObjectShape::BOX: return _solveBoxBox();
                case ObjectShape::POINT: return _solveBoxPoint();
                default: break;
            }
            break;
        case ObjectShape::CIRCLE:
            switch(static_cast<ObjectShape>(shapeB)){
                case ObjectShape::CIRCLE: return _solveCircleCircle();
                case ObjectShape::AABB: _swap(); return _solveAabbCircle();
                case ObjectShape::BOX: return _solveCircleBox();
                case ObjectShape::POINT: return _solveCirclePoint();
                default: break;
            }
            break;
        case ObjectShape::POINT:
            switch(static_cast<ObjectShape>(shapeB)){
                case ObjectShape::POINT: return false;
                case ObjectShape::AABB: _swap(); return _solveAabbPoint();
                case ObjectShape::CIRCLE: _swap(); return _solveCirclePoint();
                case ObjectShape::BOX: _swap(); return _solveBoxPoint();
                default: break;
            }
            break;
        default: break;
    }
    return false;
}
