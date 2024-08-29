
// #pragma once

// class Engine {
// private:
//     std::vector<std::shared_ptr<World>> worldList;

// public:
// 	// Add a new world to the engine
// 	void addWorld(std::shared_ptr<World> world) {
// 		worldList.push_back(world);
// 	}

// 	// Remove a world from the engine
// 	void removeWorld(int index) {
// 		if (index >= 0 && index < worldList.size()) {
// 			std::iter_swap(worldList.begin() + index, worldList.end() - 1);
// 			worldList.pop_back();
// 		}
// 	}

// 	// Access a world by its index
// 	std::shared_ptr<World> getWorld(int index) const {
// 		if (index >= 0 && index < worldList.size()) {
// 			return worldList[index];
// 		}
// 		return nullptr;
// 	}

// 	// Step function to update all worlds
// 	void step(float dt) {
// 		for (int i = 0; i < worldList.size(); i++) {
// 			worldList[i]->step(dt);
// 		}
// 	}
// };