#include "world.h"
#include "body.h"
#include "fixture.h"
#include "constants.h"

#include <chrono>
#include <cmath>
#include <cstdlib>
#include <cstring>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <string>
#include <vector>

#ifdef GEARBOX_DISABLE_KRB
static const char* kKrbTag = "nokrb";
static const bool kKrbOn = false;
#else
static const char* kKrbTag = "krb";
static const bool kKrbOn = true;
#endif

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

static void sumMechanicalEnergy(World& world, float gy, float yRef, float& keOut, float& peOut, bool includeRotationalKe = true) {
	keOut = 0.0f;
	peOut = 0.0f;
	const int n = world.getBodyCount();
	for (int i = 0; i < n; ++i) {
		Body* body = world.getBodyAtIndex(i);
		if (body == nullptr) {
			continue;
		}
		const float invMass = body->getInverseMass();
		if (invMass <= 0.0f) {
			continue;
		}
		const float mass = body->getMass();
		const float vx = body->getVelocityX();
		const float vy = body->getVelocityY();
		keOut += 0.5f * mass * (vx * vx + vy * vy);
		if (includeRotationalKe) {
			const float invI = body->getInverseInertia();
			if (invI > 0.0f) {
				const float w = body->getAngularVelocity();
				keOut += 0.5f * (1.0f / invI) * w * w;
			}
		}
		// y increases downward; PE = m g (yRef - y)
		peOut += mass * gy * (yRef - body->getY());
	}
}

struct SceneResult {
	std::string name;
	bool ok = true;
	std::string error;
};

static SceneResult logCradle(const std::string& outDir, int seconds, int sampleEvery, float dt, bool datasetB) {
	SceneResult result;
	result.name = "cradle";

	const int count = 5;
	const float radius = 0.4f;
	const float startY = -2.0f;
	const float length = 4.0f;
	const float spacing = radius * 2.01f;
	const float restingY = startY + length;
	const float gy = 9.8f;
	const int totalSteps = seconds * 60;

	World world;
	world.setGravity(0.0f, gy);
	world.setTimeStep(dt);

	Body* outerBalls[2] = {nullptr, nullptr};
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

		if (i == 0) {
			outerBalls[0] = world.getBody(ballId);
		}
		if (i == count - 1) {
			outerBalls[1] = world.getBody(ballId);
		}
	}

	if (outerBalls[0] == nullptr || outerBalls[1] == nullptr) {
		result.ok = false;
		result.error = "cradle outer balls missing";
		return result;
	}

	float ke0 = 0.0f;
	float pe0 = 0.0f;
	sumMechanicalEnergy(world, gy, restingY, ke0, pe0, !datasetB);
	const float e0 = datasetB ? pe0 : (ke0 + pe0);

	const std::filesystem::path path = std::filesystem::path(outDir) / (
		datasetB
			? "dataset-b-newtons-cradle-gearbox.csv"
			: ("cradle-" + std::string(kKrbTag) + ".csv"));
	std::ofstream out(path, std::ios::trunc);
	if (!out) {
		result.ok = false;
		result.error = "failed to write " + path.string();
		return result;
	}
	out << "# scene=" << (datasetB ? "newtons-cradle" : "cradle")
		<< " krb=" << (kKrbOn ? "on" : "off")
		<< " dt=" << dt << " seconds=" << seconds
		<< " sample_every=" << sampleEvery << " e0=" << e0
		<< " velocity_iterations=" << world.getVelocityIterations()
		<< " position_iterations=" << world.getPositionIterations()
		<< (datasetB ? " meter=translational e0=pe_only engine=gearbox2d" : "")
		<< "\n";
	if (datasetB) {
		out << "engine,t_s,e_over_e0\n";
	} else {
		out << "t_s,ke,pe,e_total,e_over_e0,peak_height\n";
	}

	const auto wall0 = std::chrono::steady_clock::now();
	const int progressEvery = std::max(sampleEvery, 60 * 60);
	for (int step = 0; step <= totalSteps; ++step) {
		if (step % sampleEvery == 0) {
			float ke = 0.0f;
			float pe = 0.0f;
			sumMechanicalEnergy(world, gy, restingY, ke, pe, !datasetB);
			const float e = ke + pe;
			const float ratio = (e0 != 0.0f ? e / e0 : 0.0f);
			if (datasetB) {
				out << "gearbox2d," << (step * dt) << "," << ratio << "\n";
			} else {
				const float h0 = restingY - outerBalls[0]->getY();
				const float h1 = restingY - outerBalls[1]->getY();
				const float peak = std::max(h0, h1);
				out << (step * dt) << "," << ke << "," << pe << "," << e << ","
					<< ratio << "," << peak << "\n";
			}
			if (step % progressEvery == 0) {
				out.flush();
				const auto wall = std::chrono::steady_clock::now();
				const double wallS = std::chrono::duration<double>(wall - wall0).count();
				std::cout << "  cradle t=" << (step * dt) << "s  E/E0="
						  << (e0 != 0.0f ? e / e0 : 0.0f) << "  wall=" << wallS << "s\n";
			}
		}
		if (step < totalSteps) {
			world.step();
		}
	}

	std::cout << "wrote " << path << "\n";
	return result;
}

static SceneResult logBounceCircle(const std::string& outDir, int seconds, int sampleEvery, float dt, bool datasetB) {
	if (datasetB) {
		SceneResult skip;
		skip.name = "bounce-circle";
		skip.ok = true;
		return skip;
	}
	SceneResult result;
	result.name = "bounce-circle";

	const float gy = 400.0f;
	const float mass = 1.0f;
	const float radius = 0.5f;
	const float thickness = 1.0f;
	const float innerWidth = 10.0f;
	const float innerHeight = 3.0f;
	const float startY = -0.85f;
	const int totalSteps = seconds * 60;

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

	World world;
	world.setGravity(0.0f, gy);
	world.setTimeStep(dt);
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
	Body* ball = world.getBody(10);
	if (ball == nullptr) {
		result.ok = false;
		result.error = "bounce-circle ball missing";
		return result;
	}

	const float e0 = mass * gy * -startY;
	const std::filesystem::path path = std::filesystem::path(outDir) / ("bounce-circle-" + std::string(kKrbTag) + ".csv");
	std::ofstream out(path, std::ios::trunc);
	if (!out) {
		result.ok = false;
		result.error = "failed to write " + path.string();
		return result;
	}
	out << "# scene=bounce-circle krb=" << (kKrbOn ? "on" : "off")
		<< " dt=" << dt << " seconds=" << seconds
		<< " sample_every=" << sampleEvery << " e0=" << e0
		<< " velocity_iterations=" << world.getVelocityIterations()
		<< " position_iterations=" << world.getPositionIterations() << "\n";
	out << "t_s,ke,pe,e_total,e_over_e0,peak_height\n";

	const float escapeMargin = 0.25f;
	const auto wall0 = std::chrono::steady_clock::now();
	const int progressEvery = std::max(sampleEvery, 60 * 60);
	for (int step = 0; step <= totalSteps; ++step) {
		if (std::abs(ball->getX()) > innerWidth / 2.0f + escapeMargin ||
			std::abs(ball->getY()) > innerHeight / 2.0f + escapeMargin) {
			out << "# escaped_at_step=" << step << " t_s=" << (step * dt) << "\n";
			std::cout << "wrote " << path << " (escaped at step " << step << ")\n";
			result.ok = false;
			result.error = "bounce-circle escaped at step " + std::to_string(step);
			return result;
		}
		if (step % sampleEvery == 0) {
			float ke = 0.0f;
			float pe = 0.0f;
			sumMechanicalEnergy(world, gy, 0.0f, ke, pe);
			const float e = ke + pe;
			out << (step * dt) << "," << ke << "," << pe << "," << e << ","
				<< (e0 != 0.0f ? e / e0 : 0.0f) << "," << -ball->getY() << "\n";
			if (step % progressEvery == 0) {
				out.flush();
				const auto wall = std::chrono::steady_clock::now();
				const double wallS = std::chrono::duration<double>(wall - wall0).count();
				std::cout << "  bounce-circle t=" << (step * dt) << "s  E/E0="
						  << (e0 != 0.0f ? e / e0 : 0.0f) << "  wall=" << wallS << "s\n";
			}
		}
		if (step < totalSteps) {
			world.step();
		}
	}

	std::cout << "wrote " << path << "\n";
	return result;
}

static SceneResult logFloorBounce(const std::string& outDir, int seconds, int sampleEvery, float dt, bool datasetB) {
	SceneResult result;
	result.name = "floor-bounce";

	const float gy = 10.0f;
	const float mass = 1.0f;
	const float startY = 0.0f;
	const float floorY = 10.0f;
	const float floorH = 1.0f;
	const float radius = 0.5f;
	const float yContact = floorY - floorH / 2.0f - radius;
	const int totalSteps = seconds * 60;

	World world;
	world.setGravity(0.0f, gy);
	world.setTimeStep(dt);

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
	Body* ball = world.getBody(2);
	if (ball == nullptr) {
		result.ok = false;
		result.error = "floor-bounce ball missing";
		return result;
	}

	// Energy relative to rest on the floor, so e0 is the drop energy (startY is above the floor).
	const float e0 = mass * gy * (yContact - startY);
	const std::filesystem::path path = std::filesystem::path(outDir) / (
		datasetB
			? "dataset-b-floor-bounce-gearbox.csv"
			: ("floor-bounce-" + std::string(kKrbTag) + ".csv"));
	std::ofstream out(path, std::ios::trunc);
	if (!out) {
		result.ok = false;
		result.error = "failed to write " + path.string();
		return result;
	}
	out << "# scene=floor-bounce krb=" << (kKrbOn ? "on" : "off")
		<< " dt=" << dt << " seconds=" << seconds
		<< " sample_every=" << sampleEvery << " e0=" << e0
		<< " velocity_iterations=" << world.getVelocityIterations()
		<< " position_iterations=" << world.getPositionIterations()
		<< (datasetB ? " meter=translational engine=gearbox2d" : "")
		<< "\n";
	if (datasetB) {
		out << "engine,t_s,e_over_e0\n";
	} else {
		out << "t_s,ke,pe,e_total,e_over_e0,peak_height\n";
	}

	for (int step = 0; step <= totalSteps; ++step) {
		if (step % sampleEvery == 0) {
			const float vx = ball->getVelocityX();
			const float vy = ball->getVelocityY();
			float ke = 0.5f * mass * (vx * vx + vy * vy);
			if (!datasetB) {
				const float invI = ball->getInverseInertia();
				if (invI > 0.0f) {
					const float w = ball->getAngularVelocity();
					ke += 0.5f * (1.0f / invI) * w * w;
				}
			}
			const float pe = mass * gy * (yContact - ball->getY());
			const float e = ke + pe;
			const float ratio = (e0 != 0.0f ? e / e0 : 0.0f);
			if (datasetB) {
				out << "gearbox2d," << (step * dt) << "," << ratio << "\n";
			} else {
				const float peak = startY - ball->getY();
				out << (step * dt) << "," << ke << "," << pe << "," << e << ","
					<< ratio << "," << peak << "\n";
			}
		}
		if (step < totalSteps) {
			world.step();
		}
	}

	std::cout << "wrote " << path << "\n";
	return result;
}

static bool sceneRequested(const std::string& list, const char* name) {
	if (list.empty() || list == "all") {
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

static void printUsage(const char* argv0) {
	std::cerr << "Usage: " << argv0
			  << " --out <dir> [--seconds N] [--sample-every N] [--scene list] [--format a|b]\n"
			  << "  Dataset A/C energy logger (KRB compile-time ablation).\n"
			  << "  --scene is a comma list: cradle,bounce-circle,floor-bounce (default: all).\n"
			  << "  --format a (default): writes <scene>-{krb|nokrb}.csv (rotational KE).\n"
			  << "  --format b: Gearbox Dataset B rows (translational; PE-only e0 on cradle).\n";
}

int main(int argc, char** argv) {
	std::string outDir = "studies/kinematic_restitution_balancing/data";
	std::string scenes = "all";
	int seconds = 600;
	int sampleEvery = 60;
	bool datasetB = false;
	const float dt = 1.0f / 60.0f;

	for (int i = 1; i < argc; ++i) {
		if (std::strcmp(argv[i], "--out") == 0 && i + 1 < argc) {
			outDir = argv[++i];
		} else if (std::strcmp(argv[i], "--seconds") == 0 && i + 1 < argc) {
			seconds = std::max(1, std::atoi(argv[++i]));
		} else if (std::strcmp(argv[i], "--sample-every") == 0 && i + 1 < argc) {
			sampleEvery = std::max(1, std::atoi(argv[++i]));
		} else if (std::strcmp(argv[i], "--scene") == 0 && i + 1 < argc) {
			scenes = argv[++i];
		} else if (std::strcmp(argv[i], "--format") == 0 && i + 1 < argc) {
			++i;
			if (std::strcmp(argv[i], "b") == 0 || std::strcmp(argv[i], "dataset-b") == 0) {
				datasetB = true;
			} else if (std::strcmp(argv[i], "a") == 0 || std::strcmp(argv[i], "dataset-a") == 0) {
				datasetB = false;
			} else {
				printUsage(argv[0]);
				return 2;
			}
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

	World knobs;
	std::cout << "KRB energy logger  krb=" << (kKrbOn ? "on" : "off")
			  << "  seconds=" << seconds << "  scenes=" << scenes
			  << "  format=" << (datasetB ? "b" : "a")
			  << "  velocity_iterations=" << knobs.getVelocityIterations()
			  << "  position_iterations=" << knobs.getPositionIterations()
			  << "  out=" << outDir << "\n";

	std::vector<SceneResult> results;
	if (sceneRequested(scenes, "cradle")) {
		results.push_back(logCradle(outDir, seconds, sampleEvery, dt, datasetB));
	}
	if (sceneRequested(scenes, "bounce-circle")) {
		results.push_back(logBounceCircle(outDir, seconds, sampleEvery, dt, datasetB));
	}
	if (sceneRequested(scenes, "floor-bounce")) {
		results.push_back(logFloorBounce(outDir, seconds, sampleEvery, dt, datasetB));
	}
	if (results.empty()) {
		std::cerr << "no scenes selected (use cradle,bounce-circle,floor-bounce, or all)\n";
		return 2;
	}

	int failed = 0;
	for (const SceneResult& r : results) {
		if (!r.ok) {
			std::cerr << r.name << " failed: " << r.error << "\n";
			++failed;
		}
	}
	return failed == 0 ? 0 : 1;
}
