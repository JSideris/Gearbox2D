#ifndef SCENARIOS_H
#define SCENARIOS_H

#include "world.h"
#include <string>
#include <functional>
#include <vector>

struct Scenario {
    std::string name;
    std::function<void(World&)> setup;
};

extern std::vector<Scenario> g_scenarios;

void setupLargeStack(World& world);
void setupHighDensity(World& world);
void setupJointChain(World& world);
void setupParticlesStress(World& world);
void setupMixedJoints(World& world);

#endif
