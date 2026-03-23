#ifndef SOLVER_DATA_H
#define SOLVER_DATA_H

#include "vec2.h"

struct alignas(16) SolverData {
    Vec2 v;
    float w;
    float im;
    float iI;
};

#endif
