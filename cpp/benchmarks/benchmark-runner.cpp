#include <iostream>
#include <chrono>
#include <vector>
#include <numeric>
#include <algorithm>
#include <iomanip>
#include "world.h"
#include "scenarios.h"

struct BenchResult {
    std::string name;
    double avg;
    double min;
    double max;
    double p95;
    int steps;
};

void printResult(const BenchResult& res) {
    std::cout << std::left << std::setw(25) << res.name
              << " | Avg: " << std::fixed << std::setprecision(4) << std::setw(8) << res.avg << "ms"
              << " | P95: " << std::setw(8) << res.p95 << "ms"
              << " | Min: " << std::setw(8) << res.min << "ms"
              << " | Max: " << std::setw(8) << res.max << "ms"
              << " (" << res.steps << " steps)" << std::endl;
}

BenchResult runBenchmark(const Scenario& scenario, int steps = 1000) {
    World world;
    scenario.setup(world);

    // Warm-up
    for (int i = 0; i < 100; ++i) {
        world.step();
    }

    std::vector<double> times;
    times.reserve(steps);

    for (int i = 0; i < steps; ++i) {
        auto start = std::chrono::high_resolution_clock::now();
        world.step();
        auto end = std::chrono::high_resolution_clock::now();
        
        std::chrono::duration<double, std::milli> elapsed = end - start;
        times.push_back(elapsed.count());
    }

    std::sort(times.begin(), times.end());
    double sum = std::accumulate(times.begin(), times.end(), 0.0);
    
    BenchResult res;
    res.name = scenario.name;
    res.avg = sum / steps;
    res.min = times.front();
    res.max = times.back();
    res.p95 = times[(int)(steps * 0.95)];
    res.steps = steps;
    
    return res;
}

int main(int argc, char** argv) {
    std::cout << "--- Gearbox2D C++ Performance Benchmarks ---" << std::endl;
    std::cout << "Starting benchmarks with 1000 steps each..." << std::endl;
    std::cout << std::string(100, '-') << std::endl;

    std::vector<Scenario> scenarios = {
        {"Large Stack", setupLargeStack},
        {"High Density", setupHighDensity},
        {"Joint Chain", setupJointChain}
    };

    for (const auto& scenario : scenarios) {
        auto result = runBenchmark(scenario, 1000);
        printResult(result);
    }

    std::cout << std::string(100, '-') << std::endl;
    std::cout << "Benchmarks completed." << std::endl;
    return 0;
}
