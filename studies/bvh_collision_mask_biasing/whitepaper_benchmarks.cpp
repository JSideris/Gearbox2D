#include <iostream>
#include <vector>
#include <map>
#include <chrono>
#include <random>
#include <cmath>
#include <algorithm>
#include <iomanip>
#include "bvh.h"

// --- Constants ---
const int TOTAL_OBJECTS = 2000;
const int NUM_RUNS = 10;
const float AREA_SIZE = 100.0f;

// --- Data Structures for Results ---
struct BenchmarkResult {
    double meanTimeMs;
    int pairCount;
};

// --- Distribution Generators ---
std::vector<int> generateUniformDistribution(int numObjects, int numCategories) {
    std::vector<int> counts(numCategories, numObjects / numCategories);
    return counts;
}

std::vector<int> generateZipfianDistribution(int numObjects, int numCategories) {
    std::vector<int> counts(numCategories, 0);
    double sum = 0;
    for (int i = 1; i <= numCategories; ++i) {
        sum += 1.0 / i;
    }
    int allocated = 0;
    for (int i = 1; i <= numCategories; ++i) {
        counts[i-1] = static_cast<int>((numObjects * (1.0 / i)) / sum);
        allocated += counts[i-1];
    }
    counts[0] += (numObjects - allocated); // Add remainder to the most frequent
    return counts;
}

// --- Architectures ---

// 1. Single Tree (Standard BVH with our Bias)
BenchmarkResult benchmarkSingleTree(int numCategories, const std::vector<int>& dist, bool dense) {
    Bvh bvh;
    std::mt19937 gen(42);
    std::uniform_real_distribution<float> posDist(0, AREA_SIZE);

    for (int c = 0; c < numCategories; ++c) {
        CollisionProperties props;
        props.category = 1 << c;
        props.collidesWith = 1 << c; // Self-collision only for clear measurement
        
        for (int i = 0; i < dist[c]; ++i) {
            float x = dense ? 0 : posDist(gen);
            float y = dense ? 0 : posDist(gen);
            Aabb aabb(Vec2(x, y), Vec2(x + 1, y + 1));
            bvh.insert(aabb, (void*)(long)(c * 10000 + i + 1), props);
        }
    }

    // Warm up
    bvh.detectCollisions();
    
    double totalTime = 0;
    int lastPairCount = 0;
    for (int r = 0; r < NUM_RUNS; ++r) {
        auto start = std::chrono::high_resolution_clock::now();
        bvh.detectCollisions();
        auto end = std::chrono::high_resolution_clock::now();
        totalTime += std::chrono::duration<double, std::milli>(end - start).count();
        lastPairCount = bvh.collisionPairs.size();
    }

    return {totalTime / NUM_RUNS, lastPairCount};
}

// 2. Multi-Tree Architecture (Simulated baseline used by other engines)
BenchmarkResult benchmarkMultiTree(int numCategories, const std::vector<int>& dist, bool dense) {
    std::vector<Bvh*> trees;
    for (int i = 0; i < numCategories; ++i) trees.push_back(new Bvh());
    
    std::mt19937 gen(42);
    std::uniform_real_distribution<float> posDist(0, AREA_SIZE);

    for (int c = 0; c < numCategories; ++c) {
        CollisionProperties props;
        props.category = 1 << c;
        props.collidesWith = 1 << c;
        
        for (int i = 0; i < dist[c]; ++i) {
            float x = dense ? 0 : posDist(gen);
            float y = dense ? 0 : posDist(gen);
            Aabb aabb(Vec2(x, y), Vec2(x + 1, y + 1));
            trees[c]->insert(aabb, (void*)(long)(c * 10000 + i + 1), props);
        }
    }

    auto detectAll = [&]() {
        int totalPairs = 0;
        for (int c = 0; c < numCategories; ++c) {
            trees[c]->detectCollisions();
            totalPairs += trees[c]->collisionPairs.size();
        }
        return totalPairs;
    };

    // Warm up
    detectAll();

    double totalTime = 0;
    int lastPairCount = 0;
    for (int r = 0; r < NUM_RUNS; ++r) {
        auto start = std::chrono::high_resolution_clock::now();
        lastPairCount = detectAll();
        auto end = std::chrono::high_resolution_clock::now();
        totalTime += std::chrono::duration<double, std::milli>(end - start).count();
    }

    for (auto t : trees) delete t;
    return {totalTime / NUM_RUNS, lastPairCount};
}

void printHeader(const std::string& title) {
    std::cout << "\n" << std::string(60, '=') << "\n";
    std::cout << title << "\n";
    std::cout << std::string(60, '=') << "\n";
    std::cout << std::left << std::setw(15) << "Categories" 
              << std::setw(15) << "Single(ms)" 
              << std::setw(15) << "Multi(ms)" 
              << std::setw(15) << "Speedup" << "\n";
    std::cout << std::string(60, '-') << "\n";
}

int main() {
    std::vector<int> categoryCounts = {2, 4, 8, 16, 32};

    // Test 1: Scalability (Uniform, Dense)
    printHeader("Test 1: Scalability (Uniform Distribution, High Density)");
    for (int n : categoryCounts) {
        auto dist = generateUniformDistribution(TOTAL_OBJECTS, n);
        auto single = benchmarkSingleTree(n, dist, true);
        auto multi = benchmarkMultiTree(n, dist, true);
        std::cout << std::left << std::setw(15) << n 
                  << std::setw(15) << std::fixed << std::setprecision(4) << single.meanTimeMs 
                  << std::setw(15) << multi.meanTimeMs 
                  << (multi.meanTimeMs / single.meanTimeMs) << "x\n";
    }

    // Test 2: Power-law Distribution (Zipfian, Dense)
    printHeader("Test 2: Distribution Bias (Zipfian Distribution, High Density)");
    for (int n : categoryCounts) {
        auto dist = generateZipfianDistribution(TOTAL_OBJECTS, n);
        auto single = benchmarkSingleTree(n, dist, true);
        auto multi = benchmarkMultiTree(n, dist, true);
        std::cout << std::left << std::setw(15) << n 
                  << std::setw(15) << std::fixed << std::setprecision(4) << single.meanTimeMs 
                  << std::setw(15) << multi.meanTimeMs 
                  << (multi.meanTimeMs / single.meanTimeMs) << "x\n";
    }

    // Test 3: Sparse Environment (Uniform, Spread)
    printHeader("Test 3: Sparse Environment (Uniform, Low Density)");
    for (int n : categoryCounts) {
        auto dist = generateUniformDistribution(TOTAL_OBJECTS, n);
        auto single = benchmarkSingleTree(n, dist, false);
        auto multi = benchmarkMultiTree(n, dist, false);
        std::cout << std::left << std::setw(15) << n 
                  << std::setw(15) << std::fixed << std::setprecision(4) << single.meanTimeMs 
                  << std::setw(15) << multi.meanTimeMs 
                  << (multi.meanTimeMs / single.meanTimeMs) << "x\n";
    }

    return 0;
}

