#include <gtest/gtest.h>

#include <fstream>
#include <set>
#include <sstream>
#include <string>

static std::string readFile(const char* path) {
	std::ifstream in(path);
	std::stringstream buffer;
	buffer << in.rdbuf();
	return buffer.str();
}

TEST(DatasetDCost, LogTimingTargetUsesBenchFlags) {
	const std::string makefile = readFile("Makefile");
	ASSERT_FALSE(makefile.empty()) << "Makefile missing or unreadable";

	const std::string marker = "$(LOG_TIMING_BIN):";
	const auto rulePos = makefile.find(marker);
	ASSERT_NE(rulePos, std::string::npos) << "log-timing binary rule not found";

	const auto recipePos = makefile.find("$(CXX)", rulePos);
	ASSERT_NE(recipePos, std::string::npos) << "log-timing compile recipe not found";

	const auto lineEnd = makefile.find('\n', recipePos);
	const std::string recipeLine = makefile.substr(recipePos, lineEnd - recipePos);

	EXPECT_NE(recipeLine.find("BENCH_FLAGS"), std::string::npos)
		<< "log-timing must compile with BENCH_FLAGS (-O3 benchmark profile)";
	EXPECT_EQ(recipeLine.find("GTEST_FLAGS"), std::string::npos)
		<< "log-timing must not use GTEST_FLAGS (no -O3)";
}

TEST(DatasetDCost, LogTimingBinariesAreGitignored) {
	const std::string gitignore = readFile(".gitignore");
	ASSERT_FALSE(gitignore.empty()) << ".gitignore missing or unreadable";

	EXPECT_NE(gitignore.find("logTiming\n"), std::string::npos);
	EXPECT_NE(gitignore.find("logTiming-nokrb\n"), std::string::npos);
}

static std::set<std::string> readTimingScenes(const char* path, bool* ok = nullptr) {
	std::set<std::string> scenes;
	std::ifstream in(path);
	if (!in.is_open()) {
		if (ok != nullptr) {
			*ok = false;
		}
		return scenes;
	}
	if (ok != nullptr) {
		*ok = true;
	}
	std::string line;
	while (std::getline(in, line)) {
		if (line.empty() || line[0] == '#') {
			continue;
		}
		if (line.rfind("scene,", 0) == 0) {
			continue;
		}
		const auto comma = line.find(',');
		if (comma != std::string::npos) {
			scenes.insert(line.substr(0, comma));
		}
	}
	return scenes;
}

TEST(DatasetDCost, TimingSummaryCsvContract) {
	const char* paths[] = {
		"studies/kinematic_restitution_balancing/data/timing/timing-summary-krb.csv",
		"studies/kinematic_restitution_balancing/data/timing/timing-summary-nokrb.csv",
	};
	const std::set<std::string> required = {
		"floor-bounce", "bounce-circle", "cradle", "large-stack",
	};

	for (const char* path : paths) {
		const std::string contents = readFile(path);
		ASSERT_FALSE(contents.empty()) << path << " missing or empty";
		EXPECT_NE(contents.find("scene,krb,repeat,mean_ms,p95_ms,notes"), std::string::npos)
			<< path << " header row mismatch";

		bool scenesOk = false;
		const std::set<std::string> scenes = readTimingScenes(path, &scenesOk);
		ASSERT_TRUE(scenesOk) << path << " unreadable";
		for (const std::string& scene : required) {
			EXPECT_NE(scenes.find(scene), scenes.end()) << path << " missing scene " << scene;
		}
	}
}

TEST(DatasetDCost, ReadmeDocumentsBenchFlags) {
	const std::string readme =
		readFile("studies/kinematic_restitution_balancing/data/README.md");
	ASSERT_FALSE(readme.empty());

	EXPECT_NE(readme.find("BENCH_FLAGS"), std::string::npos)
		<< "Dataset D must document BENCH_FLAGS compile profile";
	EXPECT_NE(readme.find("-O3"), std::string::npos)
		<< "Dataset D must document -O3";
}
