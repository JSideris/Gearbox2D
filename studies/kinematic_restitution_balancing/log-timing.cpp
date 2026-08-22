#include "world.h"
#include "body.h"
#include "fixture.h"
#include "constants.h"

#include <algorithm>
#include <array>
#include <chrono>
#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <numeric>
#include <string>
#include <vector>

#ifdef GEARBOX_DISABLE_KRB
static const char* kKrbTag = "nokrb";
static const bool kKrbOn = false;
#else
static const char* kKrbTag = "krb";
static const bool kKrbOn = true;
#endif

static constexpr float kDt = 1.0f / 60.0f;

static emscripten_val bodyOptions(float x, float y, float mass = 1.0f) {
	emscripten_val options;
	options.properties["x"] = x;
	options.properties["y"] = y;
	options.properties["mass"] = mass;
	options.properties["type"] = (int)ObjectType::DYNAMIC_OBJECT;
	options.properties["shape"] = (int)ObjectShape::BOX;
	options.properties["width"] = 1.0f;
	options.properties["height"] = 1.0f;
	return options;
}

struct TimingStats {
	double meanMs = 0.0;
	double p95Ms = 0.0;
};

static TimingStats measureSteps(World& world, int warmupSteps, int timedSteps) {
	for (int i = 0; i < warmupSteps; ++i) {
		world.step();
	}

	std::vector<double> times;
	times.reserve((size_t)timedSteps);
	for (int i = 0; i < timedSteps; ++i) {
		const auto t0 = std::chrono::high_resolution_clock::now();
		world.step();
		const auto t1 = std::chrono::high_resolution_clock::now();
		const double ms = std::chrono::duration<double, std::milli>(t1 - t0).count();
		times.push_back(ms);
	}

	std::sort(times.begin(), times.end());
	TimingStats stats;
	stats.meanMs = std::accumulate(times.begin(), times.end(), 0.0) / (double)timedSteps;
	stats.p95Ms = times[(size_t)((timedSteps * 95) / 100)];
	return stats;
}

static void setupFloorBounce(World& world) {
	const float gy = 10.0f;
	const float mass = 1.0f;
	const float startY = 0.0f;
	const float floorY = 10.0f;
	const float floorH = 1.0f;
	const float radius = 0.5f;

	world.setGravity(0.0f, gy);
	world.setTimeStep(kDt);

	emscripten_val floor = bodyOptions(0.0f, floorY, 0.0f);
	floor.properties["type"] = (int)ObjectType::FIXED_OBJECT;
	floor.properties["width"] = 20.0f;
	floor.properties["height"] = floorH;
	floor.properties["restitution"] = 1.0f;
	world.createBody(1, floor);

	emscripten_val ballOpts = bodyOptions(0.0f, startY, mass);
	ballOpts.properties["shape"] = (int)ObjectShape::CIRCLE;
	ballOpts.properties["radius"] = radius;
	ballOpts.properties["restitution"] = 1.0f;
	ballOpts.properties["sFriction"] = 0.0f;
	ballOpts.properties["kFriction"] = 0.0f;
	ballOpts.properties["linearDamping"] = 0.0f;
	ballOpts.properties["angularDamping"] = 0.0f;
	ballOpts.properties["canSleep"] = false;
	world.createBody(2, ballOpts);
}

static void setupBounceCircle(World& world) {
	const float gy = 400.0f;
	const float mass = 1.0f;
	const float radius = 0.5f;
	const float thickness = 1.0f;
	const float innerWidth = 10.0f;
	const float innerHeight = 3.0f;
	const float startY = -0.85f;

	auto wallOpts = [&](float x, float y, float w, float h) {
		emscripten_val options;
		options.properties["x"] = x;
		options.properties["y"] = y;
		options.properties["type"] = (int)ObjectType::FIXED_OBJECT;
		options.properties["shape"] = (int)ObjectShape::BOX;
		options.properties["width"] = w;
		options.properties["height"] = h;
		options.properties["restitution"] = 1.0f;
		options.properties["sFriction"] = 0.0f;
		options.properties["kFriction"] = 0.0f;
		options.properties["linearDamping"] = 0.0f;
		options.properties["angularDamping"] = 0.0f;
		return options;
	};

	world.setGravity(0.0f, gy);
	world.setTimeStep(kDt);
	world.setHasRestitution(true);
	world.setHasFriction(true);
	world.setHasPenetrationResolution(true);

	world.createBody(1, wallOpts(0.0f, innerHeight / 2.0f + thickness / 2.0f, innerWidth, thickness));
	world.createBody(2, wallOpts(0.0f, -innerHeight / 2.0f - thickness / 2.0f, innerWidth, thickness));
	world.createBody(3, wallOpts(-innerWidth / 2.0f - thickness / 2.0f, 0.0f, thickness, innerHeight));
	world.createBody(4, wallOpts(innerWidth / 2.0f + thickness / 2.0f, 0.0f, thickness, innerHeight));

	emscripten_val circle = bodyOptions(0.0f, startY, mass);
	circle.properties["shape"] = (int)ObjectShape::CIRCLE;
	circle.properties["radius"] = radius;
	circle.properties["restitution"] = 1.0f;
	circle.properties["sFriction"] = 0.0f;
	circle.properties["kFriction"] = 0.0f;
	circle.properties["linearDamping"] = 0.0f;
	circle.properties["angularDamping"] = 0.0f;
	circle.properties["canSleep"] = false;
	world.createBody(10, circle);
}

static void setupCradle(World& world) {
	const int count = 5;
	const float radius = 0.4f;
	const float startY = -2.0f;
	const float length = 4.0f;
	const float spacing = radius * 2.01f;
	const float gy = 9.8f;

	world.setGravity(0.0f, gy);
	world.setTimeStep(kDt);

	for (int i = 0; i < count; ++i) {
		const float x = (i - (count - 1) / 2.0f) * spacing;
		const int anchorId = 100 + i;
		const int ballId = 200 + i;

		emscripten_val anchorOpts = bodyOptions(x, startY, 0.0f);
		anchorOpts.properties["type"] = (int)ObjectType::FIXED_OBJECT;
		anchorOpts.properties["width"] = 0.2f;
		anchorOpts.properties["height"] = 0.2f;
		world.createBody(anchorId, anchorOpts);

		const float ballX = (i == 0) ? x - 3.0f : x;
		const float ballY = (i == 0) ? startY + std::sqrt(length * length - 9.0f) : startY + length;

		emscripten_val ballOpts = bodyOptions(ballX, ballY, 1.0f);
		ballOpts.properties["shape"] = (int)ObjectShape::CIRCLE;
		ballOpts.properties["radius"] = radius;
		ballOpts.properties["restitution"] = 1.0f;
		ballOpts.properties["sFriction"] = 0.0f;
		ballOpts.properties["kFriction"] = 0.0f;
		ballOpts.properties["linearDamping"] = 0.0f;
		ballOpts.properties["angularDamping"] = 0.0f;
		ballOpts.properties["canSleep"] = false;
		world.createBody(ballId, ballOpts);
		world.createDistanceJoint(300 + i, anchorId, ballId, 0.0f, 0.0f, 0.0f, 0.0f, length);
	}
}

static emscripten_val fixtureOptions(ObjectShape shape, float width, float height) {
	emscripten_val options;
	options.properties["shape"] = (int)shape;
	options.properties["width"] = width;
	options.properties["height"] = height;
	options.properties["radius"] = 0.5f;
	options.properties["density"] = 1.0f;
	options.properties["restitution"] = 0.1f;
	options.properties["sFriction"] = 0.5f;
	options.properties["kFriction"] = 0.5f;
	options.properties["categoryBits"] = (uint32_t)0xFFFF;
	options.properties["maskBits"] = (uint32_t)0xFFFF;
	return options;
}

static void setupLargeStack(World& world) {
	world.clear();
	world.setGravity(0.0f, 9.81f);
	world.setTimeStep(kDt);

	emscripten_val ground = bodyOptions(0.0f, 10.0f, 0.0f);
	ground.properties["type"] = (int)ObjectType::FIXED_OBJECT;
	world.createBody(10000, ground);
	world.createFixture(10000, 0, fixtureOptions(ObjectShape::BOX, 100.0f, 1.0f));

	int nextId = 0;
	for (float x = -4.0f; x <= 4.0f; x += 1.2f) {
		for (int y = 0; y < 15; ++y) {
			const int id = ++nextId;
			world.createBody(id, bodyOptions(x, 4.0f - y * 0.6f, 1.0f));
			world.createFixture(id, 0, fixtureOptions(ObjectShape::BOX, 1.0f, 0.5f));
		}
	}
}

struct SceneSpec {
	const char* name;
	void (*setup)(World&);
};

static const SceneSpec kScenes[] = {
	{"floor-bounce", setupFloorBounce},
	{"bounce-circle", setupBounceCircle},
	{"cradle", setupCradle},
	{"large-stack", setupLargeStack},
};

static bool sceneRequested(const std::string& list, const char* name) {
	if (list.empty() || list == "all" || list == "paper") {
		return std::strcmp(name, "large-stack") != 0;
	}
	if (list == "paper+dense" || list == "all+dense") {
		return true;
	}
	std::string token;
	for (size_t i = 0; i <= list.size(); ++i) {
		if (i == list.size() || list[i] == ',') {
			if (token == name) {
				return true;
			}
			token.clear();
		} else {
			token.push_back(list[i]);
		}
	}
	return false;
}


static std::string readCommandOutput(const char* cmd) {
	std::string out;
	FILE* pipe = popen(cmd, "r");
	if (pipe == nullptr) {
		return out;
	}
	std::array<char, 256> buf{};
	while (fgets(buf.data(), (int)buf.size(), pipe) != nullptr) {
		out += buf.data();
	}
	pclose(pipe);
	while (!out.empty() && (out.back() == '\n' || out.back() == '\r')) {
		out.pop_back();
	}
	return out;
}

static void printHostMetadata(const World& world, int warmupSteps, int timedSteps, int repeats) {
	std::cout << "# host=" << readCommandOutput("uname -n")
			  << " kernel=" << readCommandOutput("uname -sr")
			  << " cpu=" << readCommandOutput("grep -m1 'model name' /proc/cpuinfo | cut -d: -f2 | sed 's/^ //'")
			  << " compiler=" << readCommandOutput("g++ --version | head -n1")
			  << " build=native_g++"
			  << " product_note=WASM_shipped_numbers_are_native_ablation"
			  << " dt=" << kDt
			  << " velocity_iterations=" << world.getVelocityIterations()
			  << " position_iterations=" << world.getPositionIterations()
			  << " warmup_steps=" << warmupSteps
			  << " timed_steps=" << timedSteps
			  << " repeats=" << repeats
			  << "\n";
}

static void printUsage(const char* argv0) {
	std::cerr << "Usage: " << argv0
			  << " --out <dir> [--scene list] [--warmup N] [--steps N] [--repeats N]\n"
			  << "  KRB compile-time ablation wall-time per world.step().\n"
			  << "  --scene: floor-bounce,bounce-circle,cradle,large-stack,all,paper,paper+dense\n"
			  << "  Writes timing-summary-{krb|nokrb}.csv into --out.\n";
}

int main(int argc, char** argv) {
	std::string outDir = "studies/kinematic_restitution_balancing/data/timing";
	std::string scenes = "paper";
	int warmupSteps = 100;
	int timedSteps = 1000;
	int repeats = 3;

	for (int i = 1; i < argc; ++i) {
		if (std::strcmp(argv[i], "--out") == 0 && i + 1 < argc) {
			outDir = argv[++i];
		} else if (std::strcmp(argv[i], "--scene") == 0 && i + 1 < argc) {
			scenes = argv[++i];
		} else if (std::strcmp(argv[i], "--warmup") == 0 && i + 1 < argc) {
			warmupSteps = std::max(0, std::atoi(argv[++i]));
		} else if (std::strcmp(argv[i], "--steps") == 0 && i + 1 < argc) {
			timedSteps = std::max(1, std::atoi(argv[++i]));
		} else if (std::strcmp(argv[i], "--repeats") == 0 && i + 1 < argc) {
			repeats = std::max(1, std::atoi(argv[++i]));
		} else if (std::strcmp(argv[i], "--help") == 0 || std::strcmp(argv[i], "-h") == 0) {
			printUsage(argv[0]);
			return 0;
		} else {
			printUsage(argv[0]);
			return 2;
		}
	}

	std::error_code ec;
	std::filesystem::create_directories(outDir, ec);
	if (ec) {
		std::cerr << "failed to create " << outDir << ": " << ec.message() << "\n";
		return 1;
	}

	const std::filesystem::path summaryPath =
		std::filesystem::path(outDir) / ("timing-summary-" + std::string(kKrbTag) + ".csv");
	std::ofstream summary(summaryPath, std::ios::trunc);
	if (!summary) {
		std::cerr << "failed to write " << summaryPath << "\n";
		return 1;
	}

	World metaWorld;
	printHostMetadata(metaWorld, warmupSteps, timedSteps, repeats);
	summary << "# krb=" << (kKrbOn ? "on" : "off")
			<< " dt=" << kDt
			<< " warmup_steps=" << warmupSteps
			<< " timed_steps=" << timedSteps
			<< " repeats=" << repeats
			<< " build=native_g++"
			<< " product_note=WASM_shipped_numbers_are_native_ablation"
			<< "\n";
	summary << "scene,krb,repeat,mean_ms,p95_ms,notes\n";

	int selected = 0;
	for (const SceneSpec& scene : kScenes) {
		if (!sceneRequested(scenes, scene.name)) {
			continue;
		}
		++selected;
		const char* notes = (std::strcmp(scene.name, "large-stack") == 0) ? "not-dataset-a" : "dataset-a-scene";
		for (int repeat = 0; repeat < repeats; ++repeat) {
			World world;
			scene.setup(world);
			const TimingStats stats = measureSteps(world, warmupSteps, timedSteps);
			summary << scene.name << "," << (kKrbOn ? "on" : "off") << ","
					<< repeat << "," << stats.meanMs << "," << stats.p95Ms << ","
					<< notes << "\n";
			std::cout << scene.name << " repeat=" << repeat
					  << " mean_ms=" << stats.meanMs
					  << " p95_ms=" << stats.p95Ms << "\n";
		}
	}

	if (selected == 0) {
		std::cerr << "no scenes selected\n";
		return 2;
	}

	std::cout << "wrote " << summaryPath << "\n";
	return 0;
}
