#include "world.h"
#include "body.h"
#include "hinge-joint.h"
#include "distance-joint.h"
#include "spring-joint.h"
#include "gear-joint.h"
#include <algorithm>
#include <vector>

#include "island-internal.h"

void World::_colorIsland(Island& island) {
    island.contactBatches.clear();
    island.jointBatches.clear();

    if (island.contacts.empty() && island.joints.empty()) {
        return;
    }

    // 1. Color Contacts
    if (!island.contacts.empty()) {
        std::vector<uint64_t> bodyBatchMasks(bodiesList.size(), 0);
        for (ContactConstraint* c : island.contacts) {
            uint64_t mask = 0;
            if (c->a->type != ObjectType::FIXED_OBJECT) mask |= bodyBatchMasks[c->a->worldIndex];
            if (c->b->type != ObjectType::FIXED_OBJECT) mask |= bodyBatchMasks[c->b->worldIndex];

            int batchIdx = 0;
            while ((mask >> batchIdx) & 1) {
                batchIdx++;
                if (batchIdx >= 64) break;
            }
            if (batchIdx >= 64) batchIdx = 63;

            if (batchIdx >= (int)island.contactBatches.size()) {
                island.contactBatches.resize(batchIdx + 1);
            }
            island.contactBatches[batchIdx].push_back(c);

            if (c->a->type != ObjectType::FIXED_OBJECT) bodyBatchMasks[c->a->worldIndex] |= (1ULL << batchIdx);
            if (c->b->type != ObjectType::FIXED_OBJECT) bodyBatchMasks[c->b->worldIndex] |= (1ULL << batchIdx);
        }
    }

    // 2. Color Joints
    if (!island.joints.empty()) {
        std::vector<uint64_t> bodyBatchMasks(bodiesList.size(), 0);
        for (Joint* j : island.joints) {
            uint64_t mask = 0;
            
            Body* bodies[6];
            int bodyCount = 0;
            bodies[bodyCount++] = j->bodyA;
            bodies[bodyCount++] = j->bodyB;
            
            GearJoint* gear = dynamic_cast<GearJoint*>(j);
            if (gear) {
                bodies[bodyCount++] = gear->joint1->bodyA;
                bodies[bodyCount++] = gear->joint1->bodyB;
                bodies[bodyCount++] = gear->joint2->bodyA;
                bodies[bodyCount++] = gear->joint2->bodyB;
            }

            for (int i = 0; i < bodyCount; ++i) {
                if (bodies[i]->type != ObjectType::FIXED_OBJECT) {
                    mask |= bodyBatchMasks[bodies[i]->worldIndex];
                }
            }

            int batchIdx = 0;
            while ((mask >> batchIdx) & 1) {
                batchIdx++;
                if (batchIdx >= 64) break;
            }
            if (batchIdx >= 64) batchIdx = 63;

            if (batchIdx >= (int)island.jointBatches.size()) {
                island.jointBatches.resize(batchIdx + 1);
            }
            island.jointBatches[batchIdx].push_back(j);

            for (int i = 0; i < bodyCount; ++i) {
                if (bodies[i]->type != ObjectType::FIXED_OBJECT) {
                    bodyBatchMasks[bodies[i]->worldIndex] |= (1ULL << batchIdx);
                }
            }
        }
    }
}

void World::_solveIslandVelocity(Island& island, float dt, int substepIndex, std::vector<Vec2>& prePgsAll) {
    // 1. Sort constraints for deterministic solving
    std::sort(island.contacts.begin(), island.contacts.end(), [](ContactConstraint* a, ContactConstraint* b) {
        return a->id.key < b->id.key;
    });
    std::sort(island.joints.begin(), island.joints.end(), [](Joint* a, Joint* b) {
        return a->id < b->id;
    });

    auto getSolverBody = [&](Body* b) -> SolverData& {
        return solverBodies[b->worldIndex];
    };

    // 2. Process the island
    // NOTE: Bodies were already woken up in _buildAndProcessIslands
    
    // Set up context
    for (ContactConstraint* c : island.contacts) {
        c->context.a = &getSolverBody(c->a);
        c->context.b = &getSolverBody(c->b);
    }

    std::vector<Vec2> prePgsV(solverBodies.size());
    for (Body* b : island.bodies) {
        prePgsV[b->worldIndex] = solverBodies[b->worldIndex].v;
        if (b->worldIndex >= 0 && static_cast<size_t>(b->worldIndex) < prePgsAll.size()) {
            prePgsAll[b->worldIndex] = solverBodies[b->worldIndex].v;
        }
    }

    // Apply warm starting impulses
    for (ContactConstraint* c : island.contacts) {
        SolverData& sA = *static_cast<SolverData*>(c->context.a);
        SolverData& sB = *static_cast<SolverData*>(c->context.b);
        
        if (c->normalImpulse != 0 || c->frictionImpulse != 0) {
            Vec2 impulse = c->normal * c->normalImpulse + c->tangent * c->frictionImpulse;
            if (sA.im > 0) {
                sA.v.x -= impulse.x * sA.im;
                sA.v.y -= impulse.y * sA.im;
                sA.w -= c->rA.cross(impulse) * sA.iI;
            }
            if (sB.im > 0) {
                sB.v.x += impulse.x * sB.im;
                sB.v.y += impulse.y * sB.im;
                sB.w += c->rB.cross(impulse) * sB.iI;
            }
        }
    }
    
    // Prepare joints
    const bool overlapping = islandHasOverlappingContact(island);
    for (Joint* j : island.joints) {
        j->context.a = &getSolverBody(j->bodyA);
        j->context.b = &getSolverBody(j->bodyB);
        GearJoint* gear = dynamic_cast<GearJoint*>(j);
        if (gear) {
            gear->context.a = &getSolverBody(gear->joint1->bodyA);
            gear->context.b = &getSolverBody(gear->joint1->bodyB);
            gear->context.c = &getSolverBody(gear->joint2->bodyA);
            gear->context.d = &getSolverBody(gear->joint2->bodyB);
        }
    }

    // Velocity Iterations
    auto solveIslandContacts = [&]() {
        for (const auto& batch : island.contactBatches) {
            size_t i = 0;
            for (; i + 3 < batch.size(); i += 4) {
                ContactConstraint* b[4] = {batch[i], batch[i + 1], batch[i + 2], batch[i + 3]};
                ContactConstraint::solveFastSIMD(b);
            }
            for (; i < batch.size(); ++i) {
                batch[i]->solveFast();
            }
        }
    };

    // Springs already ran before contacts; run them again so contacts-last PGS
    // does not fully cancel mouse joints or spring-pairs in overlapping islands.
    auto solveIslandSprings = [&]() {
        for (const auto& batch : island.jointBatches) {
            for (size_t i = 0; i < batch.size(); ) {
                if (i + 3 < batch.size()) {
                    Joint* j0 = batch[i];
                    Joint* j1 = batch[i + 1];
                    Joint* j2 = batch[i + 2];
                    Joint* j3 = batch[i + 3];
                    if (j0->getType() == JointType::SPRING &&
                        j1->getType() == JointType::SPRING &&
                        j2->getType() == JointType::SPRING &&
                        j3->getType() == JointType::SPRING) {
                        SpringJoint* sjs[4] = {
                            static_cast<SpringJoint*>(j0),
                            static_cast<SpringJoint*>(j1),
                            static_cast<SpringJoint*>(j2),
                            static_cast<SpringJoint*>(j3)
                        };
                        SpringJoint::solveFastSIMD(sjs);
                        i += 4;
                        continue;
                    }
                }
                Joint* joint = batch[i];
                if (joint && joint->getType() == JointType::SPRING) {
                    joint->solveFast();
                }
                i++;
            }
        }
    };

    bool islandHasSpringJoint = false;
    for (Joint* j : island.joints) {
        if (j && j->getType() == JointType::SPRING) {
            islandHasSpringJoint = true;
            break;
        }
    }

    bool islandHasHingeOrGear = false;
    for (Joint* j : island.joints) {
        if (j && (j->getType() == JointType::HINGE || j->getType() == JointType::GEAR)) {
            islandHasHingeOrGear = true;
            break;
        }
    }

    bool islandHasDistanceJoint = false;
    for (Joint* j : island.joints) {
        if (j && j->getType() == JointType::DISTANCE) {
            islandHasDistanceJoint = true;
            break;
        }
    }

    for (int iter = 0; iter < velocityIterations; ++iter) {
        const bool iterOverlapping = islandHasOverlappingContact(island);
        const bool contactFreeMechanical =
            !overlapping && island.contacts.empty();
        const bool runHingeFast =
            islandHasHingeOrGear &&
            (iterOverlapping || contactFreeMechanical);
        const bool runGearFast =
            islandHasHingeOrGear &&
            (islandHasSpringJoint || contactFreeMechanical);
        const bool enterJointLoop =
            iterOverlapping || islandHasSpringJoint ||
            (islandHasHingeOrGear && !overlapping) ||
            islandHasDistanceJoint;
        if (enterJointLoop) {
        for (int springPass = 0; springPass < 2; ++springPass) {
        for (const auto& batch : island.jointBatches) {
            for (size_t i = 0; i < batch.size(); ) {
                if (i + 3 < batch.size()) {
                    Joint* j0 = batch[i];
                    Joint* j1 = batch[i+1];
                    Joint* j2 = batch[i+2];
                    Joint* j3 = batch[i+3];

                    if (springPass == 0 && j0->getType() == JointType::SPRING &&
                        j1->getType() == JointType::SPRING &&
                        j2->getType() == JointType::SPRING &&
                        j3->getType() == JointType::SPRING) {
                        i += 4;
                        continue;
                    }
                    if (springPass == 1 && (j0->getType() != JointType::SPRING ||
                        j1->getType() != JointType::SPRING ||
                        j2->getType() != JointType::SPRING ||
                        j3->getType() != JointType::SPRING)) {
                        i += 4;
                        continue;
                    }

                    if (j0->getType() == JointType::DISTANCE &&
                        j1->getType() == JointType::DISTANCE &&
                        j2->getType() == JointType::DISTANCE &&
                        j3->getType() == JointType::DISTANCE) {
                        DistanceJoint* djs[4] = {
                            static_cast<DistanceJoint*>(j0),
                            static_cast<DistanceJoint*>(j1),
                            static_cast<DistanceJoint*>(j2),
                            static_cast<DistanceJoint*>(j3)
                        };
                        DistanceJoint::solveFastSIMD(djs);
                        i += 4;
                        continue;
                    }

                    if (j0->getType() == JointType::SPRING &&
                        j1->getType() == JointType::SPRING &&
                        j2->getType() == JointType::SPRING &&
                        j3->getType() == JointType::SPRING) {
                        SpringJoint* sjs[4] = {
                            static_cast<SpringJoint*>(j0),
                            static_cast<SpringJoint*>(j1),
                            static_cast<SpringJoint*>(j2),
                            static_cast<SpringJoint*>(j3)
                        };
                        SpringJoint::solveFastSIMD(sjs);
                        i += 4;
                        continue;
                    }

                    if (j0->getType() == JointType::HINGE &&
                        j1->getType() == JointType::HINGE &&
                        j2->getType() == JointType::HINGE &&
                        j3->getType() == JointType::HINGE) {
                        if (runHingeFast) {
                            HingeJoint* hjs[4] = {
                                static_cast<HingeJoint*>(j0),
                                static_cast<HingeJoint*>(j1),
                                static_cast<HingeJoint*>(j2),
                                static_cast<HingeJoint*>(j3)
                            };
                            HingeJoint::solveFastSIMD(hjs);
                        }
                        i += 4;
                        continue;
                    }

                    if (j0->getType() == JointType::GEAR &&
                        j1->getType() == JointType::GEAR &&
                        j2->getType() == JointType::GEAR &&
                        j3->getType() == JointType::GEAR) {
                        if (runGearFast) {
                            GearJoint* gjs[4] = {
                                static_cast<GearJoint*>(j0),
                                static_cast<GearJoint*>(j1),
                                static_cast<GearJoint*>(j2),
                                static_cast<GearJoint*>(j3)
                            };
                            GearJoint::solveFastSIMD(gjs);
                        }
                        i += 4;
                        continue;
                    }
                }
                Joint* joint = batch[i];
                if ((springPass == 0 && joint->getType() == JointType::SPRING) ||
                    (springPass == 1 && joint->getType() != JointType::SPRING)) {
                    i++;
                    continue;
                }
                if (!runHingeFast && joint->getType() == JointType::HINGE) {
                    i++;
                    continue;
                }
                if (!runGearFast && joint->getType() == JointType::GEAR) {
                    i++;
                    continue;
                }
                joint->solveFast();
                i++;
            }
        }
        }
        if (iterOverlapping || islandHasSpringJoint) {
            solveIslandContacts();
            solveIslandSprings();
        }
        }
        if (!iterOverlapping) {
            solveIslandContacts();
            solveIslandSprings();
        }
    }

    _characterizeIslandChainResidual(island);
    _applyIslandChainRestitution(island, prePgsV);
    _reprojectIslandJointsAfterChainMap(island);

    // Sync velocities back
    for (Body* b : island.bodies) {
        if (b->type != ObjectType::FIXED_OBJECT) {
            b->setSolverData(solverBodies[b->worldIndex]);
        }
    }
}

void World::_solveIslandPosition(Island& island, float dt, int substepIndex) {
    const int jointPositionIters = islandHasOverlappingContact(island) ? positionIterations : 1;
    bool islandHasSpringJoint = false;
    for (Joint* j : island.joints) {
        if (j && j->getType() == JointType::SPRING) {
            islandHasSpringJoint = true;
            break;
        }
    }
    for (int p = 0; p < positionIterations; ++p) {
        for (const auto& batch : island.contactBatches) {
            for (ContactConstraint* c : batch) c->solvePosition();
        }
        if (p >= jointPositionIters) {
            continue;
        }
        if (islandHasOverlappingContact(island) && islandHasSpringJoint) {
            for (const auto& batch : island.jointBatches) {
                for (Joint* j : batch) {
                    if (!j || j->getType() == JointType::SPRING) {
                        continue;
                    }
                    j->solvePosition();
                }
            }
            for (const auto& batch : island.jointBatches) {
                for (Joint* j : batch) {
                    if (j && j->getType() == JointType::SPRING) {
                        j->solvePosition();
                    }
                }
            }
            for (const auto& batch : island.contactBatches) {
                for (ContactConstraint* c : batch) {
                    c->solvePosition();
                }
            }
        } else {
            for (const auto& batch : island.jointBatches) {
                for (Joint* j : batch) {
                    if (!j) {
                        continue;
                    }
                    if (j->getType() == JointType::GEAR && !islandHasSpringJoint &&
                        islandHasOverlappingContact(island)) {
                        continue;
                    }
                    j->solvePosition();
                }
            }
        }
    }

    // 3. Check if the island can go to sleep
    if (substepIndex == velocitySubSteps - 1) {
        bool canIslandSleep = true;
        for (Body* b : island.bodies) {
            if (b->getSleepTimer() < b->sleepTimeRequired) {
                canIslandSleep = false;
                break;
            }
        }
        
        if (canIslandSleep) {
            island.canSleep = true;
        }
    }
}
