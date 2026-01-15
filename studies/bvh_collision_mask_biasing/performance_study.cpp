#include <iostream>
#include <vector>
#include "bvh.h"
#include <chrono>

// Note: These were used for instrumentation during the study.
// Since the instrumentation was removed from the core engine,
// this script now tests the final production performance.
struct BvhStats {
    void reset() {}
    void log(const std::string&, const std::string&) {}
};
BvhStats g_bvhStats;
float g_maskWeight = 1.0f; 

void runBenchmark(const std::string& runId, float weight);
void runBenchmarkSpread(const std::string& runId, float weight);

int main() {
    std::cout << "Starting BVH Mask Biasing Performance Study...\n" << std::endl;
    
    std::cout << "--- SCENARIO 1: 1000 overlapping objects ---" << std::endl;
    runBenchmark("unbiased_overlap", 0.0f);
    runBenchmark("biased_1_overlap", 1.0f);
    
    std::cout << "\n--- SCENARIO 2: 1000 objects spread out ---" << std::endl;
    runBenchmarkSpread("unbiased_spread", 0.0f);
    runBenchmarkSpread("biased_1_spread", 1.0f);
    
    return 0;
}

void runBenchmark(const std::string& runId, float weight) {
    Bvh bvh;
    Aabb overlapAabb(Vec2(0, 0), Vec2(1, 1));
    const int numCategories = 10;
    const int objectsPerCategory = 100;
    for (int c = 0; c < numCategories; ++c) {
        CollisionProperties props;
    props.userCategory = 1 << c;
    props.userMask = 1 << c;
    props.systemCategory = CATEGORY_DYNAMIC;
        for (int i = 0; i < objectsPerCategory; ++i) {
            bvh.insert(overlapAabb, (void*)(long)(c * objectsPerCategory + i + 1), props);
        }
    }
    bvh.detectCollisions(); 
    auto start = std::chrono::high_resolution_clock::now();
    bvh.detectCollisions();
    auto end = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double, std::milli> duration = end - start;
    std::cout << "Weight " << weight << " | Time: " << duration.count() << "ms" << std::endl;
}

void runBenchmarkSpread(const std::string& runId, float weight) {
    Bvh bvh;
    const int numCategories = 10;
    const int objectsPerCategory = 100;
    for (int c = 0; c < numCategories; ++c) {
        CollisionProperties props;
    props.userCategory = 1 << c;
    props.userMask = 1 << c;
    props.systemCategory = CATEGORY_DYNAMIC;
        for (int i = 0; i < objectsPerCategory; ++i) {
            float x = (float)rand() / RAND_MAX * 100.0f;
            float y = (float)rand() / RAND_MAX * 100.0f;
            Aabb aabb(Vec2(x, y), Vec2(x + 1, y + 1));
            bvh.insert(aabb, (void*)(long)(c * objectsPerCategory + i + 1), props);
        }
    }
    bvh.detectCollisions(); 
    auto start = std::chrono::high_resolution_clock::now();
    bvh.detectCollisions();
    auto end = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double, std::milli> duration = end - start;
    std::cout << "Weight " << weight << " | Time: " << duration.count() << "ms" << std::endl;
}

