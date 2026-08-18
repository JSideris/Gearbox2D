#ifndef ISLAND_INTERNAL_H
#define ISLAND_INTERNAL_H

#include <vector>
#include "solver-data.h"

struct Island;
class Body;
class DistanceJoint;

constexpr float kChainResidualEps = 1e-4f;
constexpr float kChainRestitutionMin = 1.0f - 1e-6f;
constexpr int kChainJointReprojectIters = 2;
constexpr float kChainJointReprojectMinDist = 1e-4f;

bool islandHasOverlappingContact(const Island& island);
bool applyDistanceJointCdotOnly(DistanceJoint* joint, std::vector<SolverData>& solverBodies);
bool bodyHasDistanceJoint(Body* body);
float pendulumHeightAboveRest(Body* body);
void snapPendulumVelocityToTangent(Body* body, SolverData& s);

#endif
