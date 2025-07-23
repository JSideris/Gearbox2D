#include <unordered_set>
#include <utility>
#include <algorithm>
#include <vector>
#include <string>

// Custom hash function for unordered pairs
struct PairHash {
    size_t operator()(const std::pair<int, int>& p) const {
        int a = std::min(p.first, p.second);
        int b = std::max(p.first, p.second);
        // Combine hashes in a commutative way
        return std::hash<int>{}(a) ^ (std::hash<int>{}(b) << 1);
    }
};

// Custom equality for unordered pairs
struct PairEqual {
    bool operator()(const std::pair<int, int>& p1, const std::pair<int, int>& p2) const {
        return (std::min(p1.first, p1.second) == std::min(p2.first, p2.second)) && 
               (std::max(p1.first, p1.second) == std::max(p2.first, p2.second));
    }
};

class ContactTracker {
private:
    std::unordered_set<std::pair<int, int>, PairHash, PairEqual> prev_pairs;

public:
    void processIteration(const std::vector<std::pair<int, int>>& current_pairs) {
        // Create set of current pairs
        std::unordered_set<std::pair<int, int>, PairHash, PairEqual> current_set;
        for (const auto& pair : current_pairs) {
            current_set.insert(pair);
        }
        
        // Find missing pairs
        for (const auto& pair : prev_pairs) {
            if (current_set.find(pair) == current_set.end()) {
                raiseEvent(pair);
            }
        }
        
        // Update for next iteration
        prev_pairs = std::move(current_set);
    }
    
    void raiseEvent(const std::pair<int, int>& pair) {
        // Replace with your event system
        printf("Contact between %d and %d lost\n", pair.first, pair.second);
    }
};