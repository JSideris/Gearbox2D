#include "world.h"
#include "body.h"
#include "fixture.h"
#include "joint.h"
#include "constants.h"
#include <algorithm>
#include <vector>

namespace {

bool bodyIsStaticLike(const Body* body) {
	return body != nullptr &&
		(body->type == ObjectType::FIXED_OBJECT || body->type == ObjectType::KINEMATIC_OBJECT);
}

// Isolated / airborne sleepers have no kept world contacts. Resume the whole
// joint component so they can fall instead of freezing in mid-air. Hanging
// islands (a joint to FIXED/kinematic) and piles with persisted contacts stay
// asleep. Do not use per-body contactCount==0: mask-0 engines and hanging
// pendulums would never remain sleeping.
void wakeUnsupportedSleepingIslands(const std::vector<Body*>& bodiesList) {
	int maxIndex = -1;
	for (Body* body : bodiesList) {
		if (body && body->worldIndex > maxIndex) {
			maxIndex = body->worldIndex;
		}
	}
	if (maxIndex < 0) {
		return;
	}

	std::vector<char> visited(static_cast<size_t>(maxIndex) + 1, 0);
	std::vector<Body*> stack;
	std::vector<Body*> component;

	for (Body* seed : bodiesList) {
		if (!seed || bodyIsStaticLike(seed)) {
			continue;
		}
		const int seedIdx = seed->worldIndex;
		if (seedIdx < 0 || visited[static_cast<size_t>(seedIdx)]) {
			continue;
		}

		stack.clear();
		component.clear();
		stack.push_back(seed);
		visited[static_cast<size_t>(seedIdx)] = 1;

		bool hasWorldContact = false;
		bool hasStaticJoint = false;

		while (!stack.empty()) {
			Body* body = stack.back();
			stack.pop_back();
			component.push_back(body);
			if (body->getContactCount() > 0) {
				hasWorldContact = true;
			}
			for (Joint* joint : body->joints) {
				if (!joint) {
					continue;
				}
				Body* other = (joint->bodyA == body) ? joint->bodyB : joint->bodyA;
				if (!other) {
					continue;
				}
				if (bodyIsStaticLike(other)) {
					hasStaticJoint = true;
					continue;
				}
				const int otherIdx = other->worldIndex;
				if (otherIdx < 0 || visited[static_cast<size_t>(otherIdx)]) {
					continue;
				}
				visited[static_cast<size_t>(otherIdx)] = 1;
				stack.push_back(other);
			}
		}

		if (hasWorldContact || hasStaticJoint) {
			continue;
		}
		for (Body* body : component) {
			if (body->isSleeping && !bodyIsStaticLike(body)) {
				body->wakeUp();
			}
		}
	}
}

struct DeferredGravity {
	int worldIndex;
	float gScale;
};

} // namespace

void World::step() {
    currentPairs.clear();

    // Propagate wakefulness along joints
    bool changed = true;
    while (changed) {
        changed = false;
        for (auto& pair : jointsMap) {
            Joint* j = pair.second.get();
            if (j->bodyA->isSleeping != j->bodyB->isSleeping) {
                if (j->bodyA->isSleeping && j->bodyA->type != ObjectType::FIXED_OBJECT) {
                    j->bodyA->wakeUp();
                    changed = true;
                } else if (j->bodyB->isSleeping && j->bodyB->type != ObjectType::FIXED_OBJECT) {
                    j->bodyB->wakeUp();
                    changed = true;
                }
            }
        }
    }

    // Clear collision flags on all bodies and fixtures
    for (int i = 0; i < (int)bodiesList.size(); ++i) {
        liveBodyIntData[GET_BODY_IDATA_INDEX(i, BODY_IDATA_FLAGS)] &= ~(HAS_AABB_COLLISION | HAS_PHYSICAL_COLLISION);
        
        // Reset forces and accumulated impulses from the previous frame
        liveBodyFloatData[GET_BODY_FDATA_INDEX(i, BODY_FDATA_FX)] = 0;
        liveBodyFloatData[GET_BODY_FDATA_INDEX(i, BODY_FDATA_FY)] = 0;
        liveBodyFloatData[GET_BODY_FDATA_INDEX(i, BODY_FDATA_IX)] = 0;
        liveBodyFloatData[GET_BODY_FDATA_INDEX(i, BODY_FDATA_IY)] = 0;
        liveBodyFloatData[GET_BODY_FDATA_INDEX(i, BODY_FDATA_IA)] = 0;
    }
    for (int i = 0; i < (int)fixturesList.size(); ++i) {
        liveFixtureIntData[GET_FIXTURE_IDATA_INDEX(i, FIXTURE_IDATA_FLAGS)] &= ~(HAS_AABB_COLLISION | HAS_PHYSICAL_COLLISION);
    }

    for (int i = 0; i < (int)bodiesList.size(); ++i) {
        liveBodyFloatData[GET_BODY_FDATA_INDEX(i, BODY_FDATA_PREV_X)] = liveBodyFloatData[GET_BODY_FDATA_INDEX(i, BODY_FDATA_X)];
        liveBodyFloatData[GET_BODY_FDATA_INDEX(i, BODY_FDATA_PREV_Y)] = liveBodyFloatData[GET_BODY_FDATA_INDEX(i, BODY_FDATA_Y)];
        liveBodyFloatData[GET_BODY_FDATA_INDEX(i, BODY_FDATA_PREV_R)] = liveBodyFloatData[GET_BODY_FDATA_INDEX(i, BODY_FDATA_R)];
    }

    eventData.clear();

    float subStepDt = timeStep / velocitySubSteps;
    
    // Apply position integration per substep as well
    for (int i = 0; i < velocitySubSteps; ++i) {
        _doIntegrateVelocitiesSubStep(subStepDt);
        _doBroadPhase();
        _doNarrowPhase(subStepDt);
        
        _buildAndProcessIslands(subStepDt, i);
    }
    _doContactManagement();
}

void World::_doIntegrateVelocities() {
    _doIntegrateVelocitiesSubStep(timeStep);
}

void World::_doIntegrateVelocitiesSubStep(float dt) {
    // 1. Scalar Pass: Wake up logic and discrete impulses
    // This pass is branchy, so we keep it scalar.
    wakeUnsupportedSleepingIslands(bodiesList);

    std::vector<DeferredGravity> deferredGravity;
    const float wakeWindow = 25.0f * dt + 1e-12f;

    for (auto* body : bodiesList) {
        int bIdx = body->worldIndex;
        if (body->isSleeping && body->type != ObjectType::FIXED_OBJECT) {
            if (liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_NIX)] != 0 || 
                liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_NIY)] != 0 || 
                liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_NIA)] != 0 || 
                liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_NFX)] != 0 || 
                liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_NFY)] != 0) {
                body->wakeUp();
            }
        }

        if (!body->isSleeping && body->type != ObjectType::FIXED_OBJECT) {
            body->timeSinceWake += dt;
            // Resting floor/terrain contacts already hold mg. Applying gΔt on
            // the same bodies after sleep() zeros v dumps that delta as KE.
            // Joint-only support (cradle hangers) still takes gravity.
            if (body->sleptOnWorldContact && body->timeSinceWake < wakeWindow) {
                float& gScale = liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_G_SCALE)];
                deferredGravity.push_back({bIdx, gScale});
                gScale = 0.0f;
            }
        }
    }

    for (auto* body : bodiesList) {
        int bIdx = body->worldIndex;
        if (body->isSleeping) continue;

        float im = liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_IM)];
        float invI = liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_INV_INERTIA)];
        
        // Apply discrete impulses (NIX, NIY, NIA)
        float nix = liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_NIX)];
        float niy = liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_NIY)];
        if (nix != 0 || niy != 0) {
            liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_IX)] += nix;
            liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_IY)] += niy;
            liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_VX)] += nix * im;
            liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_VY)] += niy * im;
            liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_NIX)] = 0;
            liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_NIY)] = 0;
        }
        
        float nia = liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_NIA)];
        if (nia != 0) {
            liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_IA)] += nia;
            liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_RS)] += nia * invI;
            liveBodyFloatData[GET_BODY_FDATA_INDEX(bIdx, BODY_FDATA_NIA)] = 0;
        }
    }

    // 2. Vectorized Pass: Dense math (forces, gravity, damping, velocity integration)
    _doIntegrateVelocitiesSIMD(dt);

    for (const DeferredGravity& saved : deferredGravity) {
        liveBodyFloatData[GET_BODY_FDATA_INDEX(saved.worldIndex, BODY_FDATA_G_SCALE)] = saved.gScale;
    }
}
