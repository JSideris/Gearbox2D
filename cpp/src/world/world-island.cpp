#include "world.h"
#include "body.h"
#include "fixture.h"
#include "constants.h"
#include "hinge-joint.h"
#include "distance-joint.h"
#include "spring-joint.h"
#include "gear-joint.h"
#include <algorithm>
#include <cmath>
#include <unordered_map>
#include <unordered_set>
#include <vector>

namespace {

constexpr float kChainResidualEps = 1e-4f;
constexpr float kChainRestitutionMin = 1.0f - 1e-6f;
constexpr int kChainJointReprojectIters = 2;
constexpr float kChainJointReprojectMinDist = 1e-4f;

float computeContactVn(ContactConstraint* c) {
    SolverData& sA = *static_cast<SolverData*>(c->context.a);
    SolverData& sB = *static_cast<SolverData*>(c->context.b);
    Vec2 vrA(-sA.w * c->rA.y, sA.w * c->rA.x);
    Vec2 vrB(-sB.w * c->rB.y, sB.w * c->rB.x);
    Vec2 relVel = (sB.v + vrB) - (sA.v + vrA);
    return relVel.dot(c->normal);
}

bool isChainEligible(ContactConstraint* c, float vn) {
    if (c->restitution < kChainRestitutionMin) {
        return false;
    }
    SolverData& sA = *static_cast<SolverData*>(c->context.a);
    SolverData& sB = *static_cast<SolverData*>(c->context.b);
    if (sA.im <= 0.0f || sB.im <= 0.0f) {
        return false;
    }
    if (!std::isfinite(vn)) {
        return false;
    }
    if (c->depth < 0.0f && vn >= -kChainResidualEps) {
        return false;
    }
    return true;
}

bool isPathComponent(
    const std::vector<Body*>& component,
    const std::unordered_map<Body*, std::vector<Body*>>& adj) {
    std::unordered_map<Body*, int> degree;
    for (Body* b : component) {
        degree[b] = 0;
    }
    for (Body* b : component) {
        for (Body* nb : adj.at(b)) {
            if (degree.find(nb) != degree.end()) {
                degree[b]++;
            }
        }
    }

    int edgeCount = 0;
    for (const auto& degEntry : degree) {
        int d = degEntry.second;
        edgeCount += d;
        if (d > 2) {
            return false;
        }
    }
    edgeCount /= 2;
    return edgeCount >= 2;
}

bool isPairComponent(
    const std::vector<Body*>& component,
    const std::unordered_map<Body*, std::vector<Body*>>& adj) {
    if (component.size() != 2) {
        return false;
    }
    for (Body* b : component) {
        if (adj.at(b).size() != 1) {
            return false;
        }
    }
    return true;
}

void walkOrderedPath(
    const std::unordered_map<Body*, std::vector<Body*>>& adj,
    const std::vector<Body*>& component,
    std::vector<Body*>& ordered) {
    ordered.clear();
    if (component.empty()) {
        return;
    }

    Body* start = component[0];
    for (Body* b : component) {
        if (adj.at(b).size() == 1) {
            start = b;
            break;
        }
    }

    ordered.push_back(start);
    Body* prev = nullptr;
    Body* cur = start;
    while (ordered.size() < component.size()) {
        Body* next = nullptr;
        for (Body* nb : adj.at(cur)) {
            if (nb != prev) {
                next = nb;
                break;
            }
        }
        if (!next) {
            break;
        }
        ordered.push_back(next);
        prev = cur;
        cur = next;
    }
}

ContactConstraint* findEligibleContact(Island& island, Body* a, Body* b) {
    for (ContactConstraint* c : island.contacts) {
        if ((c->a == a && c->b == b) || (c->a == b && c->b == a)) {
            float vn = computeContactVn(c);
            if (isChainEligible(c, vn)) {
                return c;
            }
        }
    }
    return nullptr;
}

float endpointApproachingSignal(ContactConstraint* c) {
    if (!c) {
        return 0.0f;
    }
    float vn = computeContactVn(c);
    if (vn < -kChainResidualEps) {
        return std::abs(vn);
    }
    return 0.0f;
}

bool bodiesEqualMass(
    const std::vector<Body*>& ordered,
    const std::vector<SolverData>& solverBodies) {
    float refIm = 0.0f;
    for (Body* b : ordered) {
        float im = solverBodies[b->worldIndex].im;
        if (im <= 0.0f) {
            return false;
        }
        if (refIm == 0.0f) {
            refIm = im;
        } else {
            float ratio = im / refIm;
            if (ratio < 0.999999f || ratio > 1.000001f) {
                return false;
            }
        }
    }
    return true;
}

bool isFrictionDominatedEdge(ContactConstraint* c) {
    return c->staticFriction > kChainResidualEps || c->kineticFriction > kChainResidualEps;
}

bool orderedComponentHasFriction(Island& island, const std::vector<Body*>& ordered) {
    for (size_t i = 0; i + 1 < ordered.size(); ++i) {
        ContactConstraint* c = findEligibleContact(island, ordered[i], ordered[i + 1]);
        if (c && isFrictionDominatedEdge(c)) {
            return true;
        }
    }
    return false;
}

Vec2 prePgsVelocity(const std::vector<Vec2>& prePgsV, Body* body, const SolverData& current) {
    if (body->worldIndex >= 0 && static_cast<size_t>(body->worldIndex) < prePgsV.size()) {
        return prePgsV[body->worldIndex];
    }
    return current.v;
}

bool bodyHasDistanceJoint(Body* body);
float circleRadius(Body* body);

float prePgsSpeed(const std::vector<Vec2>& prePgsV, Body* body) {
    if (!body || body->worldIndex < 0 || static_cast<size_t>(body->worldIndex) >= prePgsV.size()) {
        return 0.0f;
    }
    const Vec2& v = prePgsV[body->worldIndex];
    return std::sqrt(v.x * v.x + v.y * v.y);
}

void zeroPackContactImpulses(Island& island, const std::vector<Body*>& pack) {
    std::unordered_set<Body*> inPack(pack.begin(), pack.end());
    for (ContactConstraint* c : island.contacts) {
        if (!c || inPack.count(c->a) == 0 || inPack.count(c->b) == 0) {
            continue;
        }
        c->normalImpulse = 0.0f;
        c->frictionImpulse = 0.0f;
    }
}

bool hasFasterPendulumOutsider(
    const std::vector<Body*>& worldBodies,
    const std::vector<SolverData>& solverBodies,
    const std::vector<Vec2>& prePgsV,
    const std::vector<Body*>& pack,
    Body* incoming) {
    if (!incoming || incoming->worldIndex < 0 ||
        static_cast<size_t>(incoming->worldIndex) >= solverBodies.size()) {
        return false;
    }
    float refIm = solverBodies[incoming->worldIndex].im;
    if (refIm <= 0.0f) {
        return false;
    }
    float refR = circleRadius(incoming);
    float inSpeed = prePgsSpeed(prePgsV, incoming);
    std::unordered_set<Body*> inPack(pack.begin(), pack.end());
    for (Body* cand : worldBodies) {
        if (!cand || cand == incoming || cand->type == ObjectType::FIXED_OBJECT) {
            continue;
        }
        if (inPack.count(cand) != 0) {
            continue;
        }
        if (!bodyHasDistanceJoint(cand)) {
            continue;
        }
        if (cand->worldIndex < 0 || static_cast<size_t>(cand->worldIndex) >= solverBodies.size()) {
            continue;
        }
        float im = solverBodies[cand->worldIndex].im;
        if (im <= 0.0f) {
            continue;
        }
        float ratio = im / refIm;
        if (ratio < 0.999999f || ratio > 1.000001f) {
            continue;
        }
        float r = circleRadius(cand);
        if (r > 0.0f && refR > 0.0f && std::abs(r - refR) > 0.25f * std::max(refR, r)) {
            continue;
        }
        if (prePgsSpeed(prePgsV, cand) > inSpeed + kChainResidualEps) {
            return true;
        }
    }
    return false;
}

bool orientPathIncoming(
    Island& island,
    std::vector<Body*>& ordered,
    const std::vector<Vec2>& prePgsV,
    Vec2& n_chain) {
    if (ordered.size() < 2) {
        return false;
    }

    ContactConstraint* firstEdge = findEligibleContact(island, ordered[0], ordered[1]);
    if (!firstEdge) {
        return false;
    }

    n_chain = firstEdge->normal;
    if (firstEdge->a != ordered[0]) {
        n_chain.x = -n_chain.x;
        n_chain.y = -n_chain.y;
    }

    ContactConstraint* edge0 = findEligibleContact(island, ordered[0], ordered[1]);
    ContactConstraint* edge1 = findEligibleContact(island, ordered[ordered.size() - 2], ordered[ordered.size() - 1]);

    float signal0 = endpointApproachingSignal(edge0);
    float signal1 = endpointApproachingSignal(edge1);
    float u0 = 0.0f;
    float u1 = 0.0f;
    if (ordered.front()->worldIndex >= 0 && static_cast<size_t>(ordered.front()->worldIndex) < prePgsV.size()) {
        u0 = std::abs(prePgsV[ordered.front()->worldIndex].dot(n_chain));
    }
    if (ordered.back()->worldIndex >= 0 && static_cast<size_t>(ordered.back()->worldIndex) < prePgsV.size()) {
        u1 = std::abs(prePgsV[ordered.back()->worldIndex].dot(n_chain));
    }
    signal0 = std::max(signal0, u0);
    signal1 = std::max(signal1, u1);

    if (signal0 < kChainResidualEps && signal1 < kChainResidualEps) {
        return false;
    }

    if (signal1 > signal0) {
        std::reverse(ordered.begin(), ordered.end());
        n_chain.x = -n_chain.x;
        n_chain.y = -n_chain.y;
    }

    return true;
}

float incomingEdgeApproachingVn(Island& island, Body* a, Body* b) {
    ContactConstraint* c = findEligibleContact(island, a, b);
    if (!c) {
        return 0.0f;
    }
    float vn = computeContactVn(c);
    if (vn < -kChainResidualEps) {
        return std::abs(vn);
    }
    return 0.0f;
}

bool bodyHasDistanceJoint(Body* body) {
    for (Joint* joint : body->joints) {
        if (joint->getType() == JointType::DISTANCE) {
            return true;
        }
    }
    return false;
}

bool allBodiesHaveDistanceJoints(const std::vector<Body*>& ordered) {
    if (ordered.empty()) {
        return false;
    }
    for (Body* b : ordered) {
        if (!bodyHasDistanceJoint(b)) {
            return false;
        }
    }
    return true;
}

float circleRadius(Body* body) {
    if (!body) {
        return 0.0f;
    }
    for (Fixture* f : body->fixtures) {
        if (f && f->shape == ObjectShape::CIRCLE) {
            float r = f->getRadius();
            if (r > 0.0f) {
                return r;
            }
        }
    }
    return 0.0f;
}

int reprojectDistanceJointsForBodies(
    const std::vector<Body*>& bodies,
    std::vector<SolverData>& solverBodies);

Vec2 pendulumTangent(Body* body, Vec2 n_chain) {
    if (!body) {
        return n_chain;
    }
    for (Joint* joint : body->joints) {
        if (joint->getType() != JointType::DISTANCE) {
            continue;
        }
        Body* other = (joint->bodyA == body) ? joint->bodyB : joint->bodyA;
        if (!other) {
            continue;
        }
        Vec2 localThis = (joint->bodyA == body) ? joint->getLocalAnchorA() : joint->getLocalAnchorB();
        Vec2 localOther = (joint->bodyA == body) ? joint->getLocalAnchorB() : joint->getLocalAnchorA();
        Vec2 pThis = body->getPosition() + localThis.rotate(body->getRotation());
        Vec2 pOther = other->getPosition() + localOther.rotate(other->getRotation());
        Vec2 rod = pThis - pOther;
        float rodMag = rod.magnitude();
        if (rodMag <= kChainJointReprojectMinDist) {
            continue;
        }
        Vec2 tangent(-rod.y / rodMag, rod.x / rodMag);
        if (tangent.dot(n_chain) < 0.0f) {
            tangent.x = -tangent.x;
            tangent.y = -tangent.y;
        }
        return tangent;
    }
    return n_chain;
}

float pendulumHeightAboveRest(Body* body) {
    if (!body) {
        return 0.0f;
    }
    Vec2 g = body->world.getGravity();
    float gMag = g.magnitude();
    if (gMag <= kChainResidualEps) {
        return 0.0f;
    }
    Vec2 gHat = g / gMag;
    for (Joint* joint : body->joints) {
        if (joint->getType() != JointType::DISTANCE) {
            continue;
        }
        Body* other = (joint->bodyA == body) ? joint->bodyB : joint->bodyA;
        if (!other || other->type != ObjectType::FIXED_OBJECT) {
            continue;
        }
        DistanceJoint* distanceJoint = static_cast<DistanceJoint*>(joint);
        Vec2 rod = body->getPosition() - other->getPosition();
        float alongG = rod.dot(gHat);
        float h = distanceJoint->getLength() - alongG;
        if (h < 0.0f) {
            h = 0.0f;
        }
        return h;
    }
    return 0.0f;
}

void snapPendulumVelocityToTangent(Body* body, SolverData& s) {
    if (!body || s.im <= 0.0f) {
        return;
    }
    Vec2 t = pendulumTangent(body, s.v);
    float u = s.v.x * t.x + s.v.y * t.y;
    if (!std::isfinite(u)) {
        return;
    }
    s.v.x = t.x * u;
    s.v.y = t.y * u;
    s.w = 0.0f;
}

bool extendPendulumPack(
    const std::vector<Body*>& worldBodies,
    const std::vector<SolverData>& solverBodies,
    const std::vector<Vec2>& prePgsV,
    std::vector<Body*>& ordered,
    Vec2 n_chain) {
    if (ordered.size() < 2 || !allBodiesHaveDistanceJoints(ordered)) {
        return false;
    }

    Body* seed = ordered[0];
    if (seed->worldIndex < 0 || static_cast<size_t>(seed->worldIndex) >= solverBodies.size()) {
        return false;
    }
    float refIm = solverBodies[seed->worldIndex].im;
    if (refIm <= 0.0f) {
        return false;
    }

    float nMag = n_chain.magnitude();
    if (nMag <= kChainResidualEps) {
        return false;
    }
    Vec2 origin = ordered[0]->getPosition();
    float spacing = (ordered[1]->getPosition() - origin).magnitude();
    if (spacing < 1e-3f) {
        return false;
    }

    float refR = circleRadius(seed);
    if (refR <= 0.0f) {
        refR = 0.5f * spacing;
    }
    float walkStep = std::max(spacing, refR * 2.0f);
    float maxGap = walkStep * 0.5f;

    auto massOk = [&](Body* b) {
        if (b->worldIndex < 0 || static_cast<size_t>(b->worldIndex) >= solverBodies.size()) {
            return false;
        }
        float im = solverBodies[b->worldIndex].im;
        if (im <= 0.0f) {
            return false;
        }
        float ratio = im / refIm;
        return ratio >= 0.999999f && ratio <= 1.000001f;
    };

    auto radiusOk = [&](Body* b) {
        float r = circleRadius(b);
        if (r <= 0.0f) {
            return true;
        }
        return std::abs(r - refR) <= 0.25f * std::max(refR, r);
    };

    auto isPendulumSibling = [&](Body* cand) {
        if (!cand || cand->type == ObjectType::FIXED_OBJECT) {
            return false;
        }
        return bodyHasDistanceJoint(cand) && massOk(cand) && radiusOk(cand);
    };

    const float maxDy = std::max(spacing, refR * 2.0f);
    std::vector<Body*> row;
    std::unordered_set<Body*> seen;
    for (Body* b : ordered) {
        if (b && seen.insert(b).second) {
            row.push_back(b);
        }
    }
    float yRef = ordered[1]->getY();
    for (Body* cand : worldBodies) {
        if (!cand || seen.count(cand) != 0 || !isPendulumSibling(cand)) {
            continue;
        }
        if (std::abs(cand->getY() - yRef) > maxDy) {
            continue;
        }
        seen.insert(cand);
        row.push_back(cand);
    }
    if (row.size() <= ordered.size()) {
        return false;
    }

    std::sort(row.begin(), row.end(), [](Body* a, Body* b) {
        return a->getX() < b->getX();
    });

    int start = -1;
    int end = -1;
    std::unordered_set<Body*> seedSet(ordered.begin(), ordered.end());
    for (int i = 0; i < static_cast<int>(row.size()); ++i) {
        if (seedSet.count(row[i]) != 0) {
            if (start < 0) {
                start = i;
            }
            end = i;
        }
    }
    if (start < 0) {
        return false;
    }

    while (end + 1 < static_cast<int>(row.size())) {
        float dx = row[end + 1]->getX() - row[end]->getX();
        if (dx <= kChainResidualEps || dx > walkStep + maxGap) {
            break;
        }
        if (std::abs(row[end + 1]->getY() - yRef) > maxDy) {
            break;
        }
        end++;
    }
    while (start - 1 >= 0) {
        float dx = row[start]->getX() - row[start - 1]->getX();
        if (dx <= kChainResidualEps || dx > walkStep + maxGap) {
            break;
        }
        if (std::abs(row[start - 1]->getY() - yRef) > maxDy) {
            break;
        }
        start--;
    }

    std::vector<Body*> pack;
    pack.reserve(static_cast<size_t>(end - start + 1));
    for (int i = start; i <= end; ++i) {
        pack.push_back(row[i]);
    }
    if (pack.size() <= ordered.size()) {
        return false;
    }
    if (pack.front() != ordered.front() && pack.back() == ordered.front()) {
        std::reverse(pack.begin(), pack.end());
    }
    if (pack.front() != ordered.front()) {
        return false;
    }
    ordered.swap(pack);
    return true;
}

bool applyEnergyBoundedIncomingPair(
    std::vector<SolverData>& solverBodies,
    const std::vector<Vec2>& prePgsV,
    Body* incoming,
    Body* outgoing,
    Vec2 n_chain) {
    SolverData& s0 = solverBodies[incoming->worldIndex];
    SolverData& s1 = solverBodies[outgoing->worldIndex];
    if (s0.im <= 0.0f || s1.im <= 0.0f) {
        return false;
    }

    Vec2 v0Pre = prePgsVelocity(prePgsV, incoming, s0);
    Vec2 v1Pre = prePgsVelocity(prePgsV, outgoing, s1);
    float u0 = v0Pre.dot(n_chain);
    float u1 = v1Pre.dot(n_chain);
    if (!std::isfinite(u0) || !std::isfinite(u1) || !std::isfinite(s0.v.x) || !std::isfinite(s0.v.y) ||
        !std::isfinite(s1.v.x) || !std::isfinite(s1.v.y)) {
        return false;
    }

    float m0 = 1.0f / s0.im;
    float m1 = 1.0f / s1.im;
    float keBefore = 0.5f * (m0 * u0 * u0 + m1 * u1 * u1);
    float u0n = 0.0f;
    float u1n = u0 + u1;
    float keAfter = 0.5f * (m0 * u0n * u0n + m1 * u1n * u1n);

    if (keAfter > keBefore * (1.0f + 1e-8f) && keAfter > keBefore) {
        float mag = std::sqrt(u0 * u0 + u1 * u1);
        u1n = std::copysign(mag, u0 + u1);
        u0n = 0.0f;
    }

    if (!std::isfinite(u0n) || !std::isfinite(u1n)) {
        return false;
    }

    float u0Now = s0.v.dot(n_chain);
    float u1Now = s1.v.dot(n_chain);
    s0.v.x = s0.v.x - n_chain.x * u0Now + n_chain.x * u0n;
    s0.v.y = s0.v.y - n_chain.y * u0Now + n_chain.y * u0n;
    s1.v.x = s1.v.x - n_chain.x * u1Now + n_chain.x * u1n;
    s1.v.y = s1.v.y - n_chain.y * u1Now + n_chain.y * u1n;
    return true;
}

bool applyEnergyBoundedFarEndPath(
    std::vector<SolverData>& solverBodies,
    const std::vector<Vec2>& prePgsV,
    const std::vector<Body*>& ordered,
    Vec2 n_chain) {
    if (ordered.size() < 3) {
        return false;
    }

    float nMag = n_chain.magnitude();
    if (nMag <= kChainResidualEps) {
        return false;
    }
    n_chain = n_chain / nMag;

    const bool useTangent = allBodiesHaveDistanceJoints(ordered);
    std::vector<SolverData*> bodies;
    std::vector<Vec2> axis;
    std::vector<Vec2> vPre;
    std::vector<float> u;
    std::vector<float> uNow;
    std::vector<float> mass;
    bodies.reserve(ordered.size());
    axis.reserve(ordered.size());
    vPre.reserve(ordered.size());
    u.reserve(ordered.size());
    uNow.reserve(ordered.size());
    mass.reserve(ordered.size());

    float incomingKe = 0.0f;
    bool first = true;
    for (Body* b : ordered) {
        SolverData& s = solverBodies[b->worldIndex];
        if (s.im <= 0.0f) {
            return false;
        }
        Vec2 ai = useTangent ? pendulumTangent(b, n_chain) : n_chain;
        Vec2 vP = prePgsVelocity(prePgsV, b, s);
        float ui = vP.dot(ai);
        float uiNow = s.v.dot(ai);
        if (!std::isfinite(ui) || !std::isfinite(uiNow) || !std::isfinite(s.v.x) || !std::isfinite(s.v.y)) {
            return false;
        }
        float m = 1.0f / s.im;
        if (first) {
            incomingKe = 0.5f * m * (vP.x * vP.x + vP.y * vP.y);
            if (useTangent) {
                float gMag = b->world.getGravity().magnitude();
                incomingKe += m * gMag * pendulumHeightAboveRest(b);
                float peak = b->world.getPendulumPeakMechE(b->worldIndex);
                if (peak > incomingKe) {
                    incomingKe = peak;
                }
            }
            first = false;
        }
        bodies.push_back(&s);
        axis.push_back(ai);
        vPre.push_back(vP);
        u.push_back(ui);
        uNow.push_back(uiNow);
        mass.push_back(m);
    }

    const size_t n = ordered.size();
    std::vector<float> un(n, 0.0f);
    un[0] = 0.0f;
    un[n - 1] = u[0];
    if (useTangent && incomingKe > 0.0f && mass[n - 1] > 0.0f) {
        float sign = (u[0] >= 0.0f) ? 1.0f : -1.0f;
        if (std::abs(u[0]) <= kChainResidualEps) {
            sign = (axis[n - 1].dot(n_chain) >= 0.0f) ? 1.0f : -1.0f;
        }
        un[n - 1] = sign * std::sqrt(2.0f * incomingKe / mass[n - 1]);
    }

    float keMapped = 0.5f * mass[n - 1] * un[n - 1] * un[n - 1];
    if (keMapped > incomingKe * (1.0f + 1e-8f) && keMapped > incomingKe) {
        un[n - 1] = std::copysign(std::sqrt(2.0f * incomingKe / mass[n - 1]), un[n - 1]);
    }

    for (size_t i = 0; i < n; ++i) {
        if (!std::isfinite(un[i])) {
            return false;
        }
        SolverData& s = *bodies[i];
        if (useTangent) {
            if (i == n - 1) {
                s.v.x = axis[i].x * un[i];
                s.v.y = axis[i].y * un[i];
            } else {
                s.v.x = 0.0f;
                s.v.y = 0.0f;
            }
            s.w = 0.0f;
        } else {
            s.v.x = s.v.x - axis[i].x * uNow[i] + axis[i].x * un[i];
            s.v.y = s.v.y - axis[i].y * uNow[i] + axis[i].y * un[i];
        }
    }
    if (useTangent) {
        for (size_t i = 0; i + 1 < n; ++i) {
            ordered[i]->world.setPendulumPeakMechE(ordered[i]->worldIndex, 0.0f);
        }
        ordered.back()->world.setPendulumPeakMechE(ordered.back()->worldIndex, incomingKe);
    }
    return true;
}

void applyElasticMapToPathComponents(
    std::vector<SolverData>& solverBodies,
    const std::vector<Vec2>& prePgsV,
    Island& island,
    const std::vector<Body*>& worldBodies,
    bool applyExtendedPacks,
    int& visitedPathCount,
    int& appliedPathCount,
    int& reprojectedJointCount) {
    std::unordered_map<Body*, std::vector<Body*>> adj;
    for (ContactConstraint* c : island.contacts) {
        if (c->context.a == nullptr || c->context.b == nullptr) {
            continue;
        }
        float vn = computeContactVn(c);
        if (!isChainEligible(c, vn)) {
            continue;
        }
        adj[c->a].push_back(c->b);
        adj[c->b].push_back(c->a);
    }

    std::unordered_set<Body*> visited;
    for (const auto& entry : adj) {
        Body* start = entry.first;
        if (visited.count(start) != 0) {
            continue;
        }

        std::vector<Body*> component;
        std::vector<Body*> stack;
        stack.push_back(start);
        visited.insert(start);

        while (!stack.empty()) {
            Body* b = stack.back();
            stack.pop_back();
            component.push_back(b);
            for (Body* nb : adj.at(b)) {
                if (visited.insert(nb).second) {
                    stack.push_back(nb);
                }
            }
        }

        bool isPath = isPathComponent(component, adj);
        bool isPair = isPairComponent(component, adj);
        if (!isPath && !isPair) {
            continue;
        }

        std::vector<Body*> ordered;
        walkOrderedPath(adj, component, ordered);
        if (ordered.size() != component.size() || ordered.size() < 2) {
            continue;
        }

        visitedPathCount++;

        if (!bodiesEqualMass(ordered, solverBodies)) {
            continue;
        }
        if (orderedComponentHasFriction(island, ordered)) {
            continue;
        }

        Vec2 n_chain;
        if (!orientPathIncoming(island, ordered, prePgsV, n_chain)) {
            continue;
        }

        Body* incoming = ordered[0];
        Body* neighbor = ordered[1];
        Body* far = ordered.back();
        ContactConstraint* applyEdge = findEligibleContact(island, incoming, neighbor);
        if (!applyEdge || applyEdge->depth < 0.0f) {
            continue;
        }
        if (isFrictionDominatedEdge(applyEdge) || applyEdge->restitution < kChainRestitutionMin) {
            continue;
        }

        float maxVn = incomingEdgeApproachingVn(island, incoming, neighbor);
        float incomingU = 0.0f;
        float neighborU = 0.0f;
        if (incoming->worldIndex >= 0 && static_cast<size_t>(incoming->worldIndex) < prePgsV.size()) {
            incomingU = std::abs(prePgsV[incoming->worldIndex].dot(n_chain));
        }
        if (neighbor->worldIndex >= 0 && static_cast<size_t>(neighbor->worldIndex) < prePgsV.size()) {
            neighborU = std::abs(prePgsV[neighbor->worldIndex].dot(n_chain));
        }
        const bool allDJ = allBodiesHaveDistanceJoints(ordered);
        if (allDJ) {
            incomingU = prePgsSpeed(prePgsV, incoming);
            neighborU = prePgsSpeed(prePgsV, neighbor);
        }
        bool hasApproach = maxVn > kChainResidualEps;
        bool incomingDominant =
            incomingU > kChainResidualEps && incomingU > neighborU + kChainResidualEps;
        if (allDJ || applyExtendedPacks) {
            if (!incomingDominant) {
                continue;
            }
        } else if (!hasApproach && !incomingDominant) {
            continue;
        }

        std::vector<Body*> pack = ordered;
        if (allDJ) {
            extendPendulumPack(worldBodies, solverBodies, prePgsV, pack, n_chain);
        }

        auto farAlreadyCarries = [&](const std::vector<Body*>& mapped) {
            if (mapped.size() < 2) {
                return false;
            }
            float inSpeed = prePgsSpeed(prePgsV, mapped.front());
            float farSpeed = prePgsSpeed(prePgsV, mapped.back());
            return farSpeed > inSpeed * 1.25f + 0.5f;
        };

        bool applied = false;
        if (applyExtendedPacks) {
            if (pack.size() < 3) {
                continue;
            }
            if (farAlreadyCarries(pack) ||
                hasFasterPendulumOutsider(worldBodies, solverBodies, prePgsV, pack, pack.front())) {
                continue;
            }
            applied = applyEnergyBoundedFarEndPath(solverBodies, prePgsV, pack, n_chain);
            if (applied) {
                zeroPackContactImpulses(island, pack);
            }
        } else {
            if (allDJ) {
                continue;
            }
            if (ordered.size() == 2) {
                applied = applyEnergyBoundedIncomingPair(solverBodies, prePgsV, incoming, neighbor, n_chain);
            } else {
                ContactConstraint* farEdge = findEligibleContact(island, ordered[ordered.size() - 2], far);
                if (!farEdge || farEdge->depth < 0.0f) {
                    continue;
                }
                if (farAlreadyCarries(ordered)) {
                    continue;
                }
                applied = applyEnergyBoundedFarEndPath(solverBodies, prePgsV, ordered, n_chain);
            }
        }
        if (applied) {
            appliedPathCount++;
        }
    }
}

struct BodyVelocitySnapshot {
    int worldIndex = -1;
    Vec2 v;
    float w = 0.0f;
};

float computeIslandDynamicKe(const Island& island, const std::vector<SolverData>& solverBodies) {
    float ke = 0.0f;
    for (Body* b : island.bodies) {
        const SolverData& s = solverBodies[b->worldIndex];
        if (s.im <= 0.0f) {
            continue;
        }
        float m = 1.0f / s.im;
        ke += 0.5f * m * (s.v.x * s.v.x + s.v.y * s.v.y);
        if (s.iI > 0.0f) {
            float I = 1.0f / s.iI;
            ke += 0.5f * I * s.w * s.w;
        }
    }
    return ke;
}

std::vector<BodyVelocitySnapshot> snapshotIslandVelocities(
    const Island& island,
    const std::vector<SolverData>& solverBodies) {
    std::vector<BodyVelocitySnapshot> snapshot;
    snapshot.reserve(island.bodies.size());
    for (Body* b : island.bodies) {
        const SolverData& s = solverBodies[b->worldIndex];
        if (s.im <= 0.0f) {
            continue;
        }
        BodyVelocitySnapshot entry;
        entry.worldIndex = b->worldIndex;
        entry.v = s.v;
        entry.w = s.w;
        snapshot.push_back(entry);
    }
    return snapshot;
}

void restoreIslandVelocities(
    const std::vector<BodyVelocitySnapshot>& snapshot,
    std::vector<SolverData>& solverBodies) {
    for (const BodyVelocitySnapshot& entry : snapshot) {
        SolverData& s = solverBodies[entry.worldIndex];
        s.v = entry.v;
        s.w = entry.w;
    }
}

bool applyDistanceJointCdotOnly(DistanceJoint* joint, std::vector<SolverData>& solverBodies) {
    Body* bodyA = joint->bodyA;
    Body* bodyB = joint->bodyB;
    SolverData& sA = solverBodies[bodyA->worldIndex];
    SolverData& sB = solverBodies[bodyB->worldIndex];
    if (sA.im <= 0.0f && sB.im <= 0.0f) {
        return false;
    }

    Vec2 rA = joint->getLocalAnchorA().rotate(bodyA->getRotation());
    Vec2 rB = joint->getLocalAnchorB().rotate(bodyB->getRotation());
    Vec2 pA = bodyA->getPosition();
    Vec2 pB = bodyB->getPosition();
    Vec2 d = (pB + rB) - (pA + rA);
    float dMag = d.magnitude();
    if (dMag <= kChainJointReprojectMinDist) {
        return false;
    }

    Vec2 n = d / dMag;
    float rnA = rA.cross(n);
    float rnB = rB.cross(n);
    float k = sA.im + sB.im + sA.iI * rnA * rnA + sB.iI * rnB * rnB;
    if (k <= 0.0f) {
        return false;
    }
    float mass = 1.0f / k;

    Vec2 vrA(-sA.w * rA.y, sA.w * rA.x);
    Vec2 vrB(-sB.w * rB.y, sB.w * rB.x);
    float Cdot = (sB.v + vrB - (sA.v + vrA)).dot(n);
    if (!std::isfinite(Cdot)) {
        return false;
    }

    float lambda = -mass * Cdot;
    if (!std::isfinite(lambda)) {
        return false;
    }

    Vec2 p = n * lambda;
    if (sA.im > 0.0f) {
        sA.v.x -= p.x * sA.im;
        sA.v.y -= p.y * sA.im;
        sA.w -= rA.cross(p) * sA.iI;
    }
    if (sB.im > 0.0f) {
        sB.v.x += p.x * sB.im;
        sB.v.y += p.y * sB.im;
        sB.w += rB.cross(p) * sB.iI;
    }
    return true;
}

int reprojectDistanceJointsForBodies(
    const std::vector<Body*>& bodies,
    std::vector<SolverData>& solverBodies) {
    std::unordered_set<DistanceJoint*> joints;
    std::unordered_set<Body*> involved;
    for (Body* b : bodies) {
        if (!b) {
            continue;
        }
        involved.insert(b);
        for (Joint* joint : b->joints) {
            if (joint->getType() != JointType::DISTANCE) {
                continue;
            }
            DistanceJoint* distanceJoint = static_cast<DistanceJoint*>(joint);
            joints.insert(distanceJoint);
            involved.insert(distanceJoint->bodyA);
            involved.insert(distanceJoint->bodyB);
        }
    }
    if (joints.empty()) {
        return 0;
    }

    std::vector<BodyVelocitySnapshot> snapshot;
    float keBefore = 0.0f;
    for (Body* b : involved) {
        if (!b || b->worldIndex < 0 || static_cast<size_t>(b->worldIndex) >= solverBodies.size()) {
            continue;
        }
        const SolverData& s = solverBodies[b->worldIndex];
        if (s.im <= 0.0f) {
            continue;
        }
        BodyVelocitySnapshot entry;
        entry.worldIndex = b->worldIndex;
        entry.v = s.v;
        entry.w = s.w;
        snapshot.push_back(entry);
        float m = 1.0f / s.im;
        keBefore += 0.5f * m * (s.v.x * s.v.x + s.v.y * s.v.y);
        if (s.iI > 0.0f) {
            float I = 1.0f / s.iI;
            keBefore += 0.5f * I * s.w * s.w;
        }
    }

    for (int iter = 0; iter < kChainJointReprojectIters; ++iter) {
        for (DistanceJoint* joint : joints) {
            applyDistanceJointCdotOnly(joint, solverBodies);
        }
    }

    float keAfter = 0.0f;
    for (const BodyVelocitySnapshot& entry : snapshot) {
        const SolverData& s = solverBodies[entry.worldIndex];
        float m = 1.0f / s.im;
        keAfter += 0.5f * m * (s.v.x * s.v.x + s.v.y * s.v.y);
        if (s.iI > 0.0f) {
            float I = 1.0f / s.iI;
            keAfter += 0.5f * I * s.w * s.w;
        }
    }
    if (keAfter > keBefore * (1.0f + 1e-8f) && keAfter > keBefore) {
        restoreIslandVelocities(snapshot, solverBodies);
        return 0;
    }
    return static_cast<int>(joints.size());
}

bool islandHasOverlappingContact(const Island& island) {
    for (ContactConstraint* c : island.contacts) {
        if (c && c->depth >= 0.0f) {
            return true;
        }
    }
    return false;
}

} // namespace

void World::_buildAndProcessIslands(float dt, int substepIndex) {
    int bodyCount = bodiesList.size();
    std::vector<bool> visited(bodyCount, false);
    std::vector<Body*> stack;

    // Reset joint inIsland flags
    for (auto& pair : jointsMap) {
        pair.second->inIsland = false;
    }
    
    // 1. Generate all contact constraints first, so we can follow them in DFS
    contactConstraints.clear();
    for (auto& col : collisionSolver.collisions) {
        Fixture* fA = fixturesList[col.indexA];
        Fixture* fB = fixturesList[col.indexB];
        Body* bA = fA->body;
        Body* bB = fB->body;

        if (fA->isSensor() || fB->isSensor()) continue;
        if (bA->getInverseMass() + bB->getInverseMass() == 0) continue;

        ContactConstraint c;
        c.a = bA; c.b = bB;
        c.fA = fA; c.fB = fB;
        c.point = col.contactPoint;
        c.normal = col.normal;
        c.depth = col.penetrationDepth;
        
        float resA = fA->getRestitution();
        float resB = fB->getRestitution();
        c.restitution = std::max(resA, resB);
        
        float sFricA = fA->getStaticFriction();
        float sFricB = fB->getStaticFriction();
        c.staticFriction = std::sqrt(sFricA * sFricB);
        
        float kFricA = fA->getKineticFriction();
        float kFricB = fB->getKineticFriction();
        c.kineticFriction = std::sqrt(kFricA * kFricB);
        c.id = col.id;

        // Warm Starting
        std::pair<int, int> fPair = {fA->id, fB->id};
        if (fPair.first > fPair.second) std::swap(fPair.first, fPair.second);

        auto it = warmStartImpulses.find(fPair);
        if (it != warmStartImpulses.end()) {
            int bestMatchIdx = -1;
            for (int i = 0; i < it->second.count; ++i) {
                if (it->second.impulses[i].id.key == c.id.key) {
                    bestMatchIdx = i;
                    break;
                }
            }
            if (bestMatchIdx != -1) {
                c.normalImpulse = it->second.impulses[bestMatchIdx].normalImpulse;
                c.frictionImpulse = it->second.impulses[bestMatchIdx].frictionImpulse;
            }
        }
        contactConstraints.push_back(c);
    }
    
    // KRB split: contact/joint bias is computed here before island DFS.
    // Coupled contact+joint island PE tax is not applied (attempt-2 overlay removed).
    // 1.5 SIMD preSolve for contacts
    int contactCount = contactConstraints.size();
    int contactVectorizedCount = (contactCount / 4) * 4;
    for (int i = 0; i < contactVectorizedCount; i += 4) {
        ContactConstraint* batch[4] = {
            &contactConstraints[i],
            &contactConstraints[i+1],
            &contactConstraints[i+2],
            &contactConstraints[i+3]
        };
        ContactConstraint::preSolveSIMD(batch, dt, hasRestitution, hasPenetrationResolution, hasFriction);
    }
    for (int i = contactVectorizedCount; i < contactCount; ++i) {
        contactConstraints[i].preSolve(dt, hasRestitution, hasPenetrationResolution, hasFriction);
    }
    
    // 2. Pre-solve all joints globally so they can modify body velocities for warm-starting
    
    // 2.1 DistanceJoints: skip preSolve (Baumgarte warm-start) for isolated pendulums
    std::unordered_set<Body*> overlappingBodies;
    for (ContactConstraint& c : contactConstraints) {
        if (c.depth < 0.0f) {
            continue;
        }
        if (c.a) {
            overlappingBodies.insert(c.a);
        }
        if (c.b) {
            overlappingBodies.insert(c.b);
        }
    }
    int djCount = distanceJoints.size();
    for (int i = 0; i < djCount; ++i) {
        DistanceJoint* joint = distanceJoints[i];
        bool aHit = joint->bodyA && joint->bodyA->type != ObjectType::FIXED_OBJECT &&
            overlappingBodies.count(joint->bodyA) != 0;
        bool bHit = joint->bodyB && joint->bodyB->type != ObjectType::FIXED_OBJECT &&
            overlappingBodies.count(joint->bodyB) != 0;
        if (!aHit && !bHit) {
            continue;
        }
        joint->preSolve(dt);
    }

    // 2.2 Vectorized SpringJoints
    int sjCount = springJoints.size();
    int sjVectorizedCount = (sjCount / 4) * 4;
    for (int i = 0; i < sjVectorizedCount; i += 4) {
        SpringJoint::preSolveSIMD(&springJoints[i], dt);
    }
    for (int i = sjVectorizedCount; i < sjCount; ++i) {
        springJoints[i]->preSolve(dt);
    }

    // 2.3 Other joints (Hinge, Gear, etc.)
    for (auto& pair : jointsMap) {
        Joint* j = pair.second.get();
        // Skip if already processed
        if (dynamic_cast<DistanceJoint*>(j) || dynamic_cast<SpringJoint*>(j)) continue;
        j->preSolve(dt);
    }
    
    // Map bodies to their contact constraints for fast DFS
    std::vector<std::vector<ContactConstraint*>> bodyToContacts(bodyCount);
    for (auto& c : contactConstraints) {
        bodyToContacts[c.a->worldIndex].push_back(&c);
        bodyToContacts[c.b->worldIndex].push_back(&c);
    }
    
    // 2. DFS partitioning
    std::vector<Island> islands;
    lastChainResidual = ChainResidualStats();

    // 2.1 Pre-initialize solver data for all bodies to avoid race conditions
    // when multiple islands share a static body.
    for (int i = 0; i < bodyCount; ++i) {
        solverBodies[i] = bodiesList[i]->getSolverData();
        solverBodyActive[i] = 1; // Mark as initialized
    }
    if (pendulumPeakMechE.size() < solverBodies.size()) {
        pendulumPeakMechE.resize(solverBodies.size(), 0.0f);
    }
    for (int i = 0; i < bodyCount; ++i) {
        Body* b = bodiesList[i];
        if (!b || b->type == ObjectType::FIXED_OBJECT || !bodyHasDistanceJoint(b)) {
            continue;
        }
        SolverData& s = solverBodies[i];
        if (s.im <= 0.0f) {
            continue;
        }
        float m = 1.0f / s.im;
        float ke = 0.5f * m * (s.v.x * s.v.x + s.v.y * s.v.y);
        float pe = m * b->world.getGravity().magnitude() * pendulumHeightAboveRest(b);
        float e = ke + pe;
        int idx = b->worldIndex;
        if (idx >= 0 && static_cast<size_t>(idx) < pendulumPeakMechE.size() && e > pendulumPeakMechE[idx]) {
            pendulumPeakMechE[idx] = e;
        }
    }

    std::vector<Vec2> prePgsAll(solverBodies.size());
    for (int i = 0; i < bodyCount; ++i) {
        prePgsAll[i] = solverBodies[i].v;
    }

    for (int i = 0; i < bodyCount; ++i) {
        Body* seed = bodiesList[i];
        if (visited[i] || seed->type == ObjectType::FIXED_OBJECT || seed->isSleeping) continue;
        
        Island currentIsland;
        currentIsland.bodies.reserve(bodyCount / 4 + 1); // Heuristic
        currentIsland.contacts.reserve(contactConstraints.size() / 4 + 1);
        currentIsland.joints.reserve(jointsMap.size() / 4 + 1);
        
        stack.push_back(seed);
        visited[i] = true;
        
        while (!stack.empty()) {
            Body* b = stack.back();
            stack.pop_back();
            
            currentIsland.bodies.push_back(b);
            // Wake up body if it was sleeping (main thread safe)
            if (b->isSleeping) b->wakeUp();
            
            // Follow contacts
            for (ContactConstraint* c : bodyToContacts[b->worldIndex]) {
                // Add contact to island if not already added
                if (!c->inIsland) {
                    c->inIsland = true;
                    currentIsland.contacts.push_back(c);
                }
                
                Body* other = (c->a == b) ? c->b : c->a;
                if (other->type != ObjectType::FIXED_OBJECT && !visited[other->worldIndex]) {
                    visited[other->worldIndex] = true;
                    stack.push_back(other);
                }
            }
            
            // Follow joints
            for (Joint* j : b->joints) {
                if (!j->inIsland) {
                    j->inIsland = true;
                    currentIsland.joints.push_back(j);
                }
                
                Body* bodies[6];
                int count = 0;
                bodies[count++] = j->bodyA;
                bodies[count++] = j->bodyB;
                GearJoint* gear = dynamic_cast<GearJoint*>(j);
                if (gear) {
                    bodies[count++] = gear->joint1->bodyA;
                    bodies[count++] = gear->joint1->bodyB;
                    bodies[count++] = gear->joint2->bodyA;
                    bodies[count++] = gear->joint2->bodyB;
                }
                
                for (int k = 0; k < count; ++k) {
                    Body* other = bodies[k];
                    if (other->type != ObjectType::FIXED_OBJECT && !visited[other->worldIndex]) {
                        visited[other->worldIndex] = true;
                        stack.push_back(other);
                    }
                }
            }
        }
        
        if (!currentIsland.bodies.empty()) {
            _colorIsland(currentIsland);
            islands.push_back(std::move(currentIsland));
        }
    }
    
    // 3. Process the islands
    if (!islands.empty()) {
        // --- Velocity Pass ---
        if (islands.size() == 1) {
            _solveIslandVelocity(islands[0], dt, substepIndex, prePgsAll);
        } else {
#ifdef GEARBOX_MT
            for (auto& isl : islands) {
                threadPool->enqueue([this, &isl, dt, substepIndex, &prePgsAll]() {
                    this->_solveIslandVelocity(isl, dt, substepIndex, prePgsAll);
                });
            }
            threadPool->wait();
#else
            for (auto& isl : islands) {
                _solveIslandVelocity(isl, dt, substepIndex, prePgsAll);
            }
#endif
        }

        ChainResidualStats agg;
        for (const Island& isl : islands) {
            agg.pathCount += isl.chainPathCount;
            agg.eligibleContactCount += isl.chainEligibleContactCount;
            if (isl.chainMaxApproachingVn > agg.maxApproachingVn) {
                agg.maxApproachingVn = isl.chainMaxApproachingVn;
            }
            agg.visitedPathCount += isl.chainPassVisitedPathCount;
            agg.appliedPathCount += isl.chainPassAppliedPathCount;
            agg.reprojectedJointCount += isl.chainPassReprojectedJointCount;
        }
        lastChainResidual = agg;
        _applyWorldPendulumPackChainMap(prePgsAll);
        {
            std::unordered_set<Body*> contacted;
            for (ContactConstraint& c : contactConstraints) {
                if (!c.inIsland || c.depth < 0.0f) {
                    continue;
                }
                if (c.a) {
                    contacted.insert(c.a);
                }
                if (c.b) {
                    contacted.insert(c.b);
                }
            }
            int snapped = 0;
            for (Body* b : bodiesList) {
                if (!b || b->type == ObjectType::FIXED_OBJECT || contacted.count(b) != 0) {
                    continue;
                }
                if (b->worldIndex < 0 || static_cast<size_t>(b->worldIndex) >= solverBodies.size()) {
                    continue;
                }
                if (!bodyHasDistanceJoint(b)) {
                    continue;
                }
                snapPendulumVelocityToTangent(b, solverBodies[b->worldIndex]);
                snapped++;
            }
            lastChainResidual.reprojectedJointCount += snapped;
        }
        for (Body* b : bodiesList) {
            if (b && b->type != ObjectType::FIXED_OBJECT &&
                b->worldIndex >= 0 && static_cast<size_t>(b->worldIndex) < solverBodies.size()) {
                b->setSolverData(solverBodies[b->worldIndex]);
            }
        }

        // --- Global Position Integration (SIMD) ---
        _doIntegratePositionsSIMD(dt);

        // --- Position Correction Pass ---
        if (islands.size() == 1) {
            _solveIslandPosition(islands[0], dt, substepIndex);
        } else {
#ifdef GEARBOX_MT
            for (auto& isl : islands) {
                threadPool->enqueue([this, &isl, dt, substepIndex]() {
                    this->_solveIslandPosition(isl, dt, substepIndex);
                });
            }
            threadPool->wait();
#else
            for (auto& isl : islands) {
                _solveIslandPosition(isl, dt, substepIndex);
            }
#endif
        }

        // 4. Main-thread processing for sleeping (thread-safety for BVH)
        if (substepIndex == velocitySubSteps - 1) {
            for (auto& isl : islands) {
                if (isl.canSleep) {
                    for (Body* b : isl.bodies) b->sleep();
                }
            }
        }
    }
    
    // Reset solverBodyActive for all bodies (safe now that parallel processing is done)
    std::fill(solverBodyActive.begin(), solverBodyActive.end(), 0);
    
    // 4. Update warm start storage on every substep
    warmStartImpulses.clear();
    if (substepIndex == velocitySubSteps - 1) {
        resolvedImpulses.clear();
    }
    
    for (auto& c : contactConstraints) {
        std::pair<int, int> pair = {c.fA->id, c.fB->id};
        if (pair.first > pair.second) std::swap(pair.first, pair.second);
        
        if (substepIndex == velocitySubSteps - 1) {
            resolvedImpulses[pair] += c.normalImpulse;
        }
        
        Body* bFirst = (c.fA->id < c.fB->id) ? c.a : c.b;
        float prFirst = bFirst->getRotation();
        float cosFirst = std::cos(-prFirst), sinFirst = std::sin(-prFirst);
        Vec2 rFirst_world = c.point - bFirst->getPosition();
        Vec2 localPointFirst(rFirst_world.x * cosFirst - rFirst_world.y * sinFirst, rFirst_world.x * sinFirst + rFirst_world.y * cosFirst);
        
        auto& data = warmStartImpulses[pair];
        if (data.count < 2) {
            data.impulses[data.count++] = {c.id, localPointFirst, c.normalImpulse, c.frictionImpulse};
        }
    }
    
    // 5. Re-synchronize AABBs after position correction using SIMD
    if (positionIterations > 0) {
        _syncFixturesSIMD();
    }
}

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

void World::_characterizeIslandChainResidual(Island& island) {
    island.chainPathCount = 0;
    island.chainEligibleContactCount = 0;
    island.chainMaxApproachingVn = 0.0f;

    if (island.contacts.empty()) {
        return;
    }

    std::unordered_map<Body*, std::vector<Body*>> adj;

    for (ContactConstraint* c : island.contacts) {
        float vn = computeContactVn(c);
        if (!isChainEligible(c, vn)) {
            continue;
        }

        island.chainEligibleContactCount++;
        if (vn < -kChainResidualEps) {
            float mag = std::abs(vn);
            if (mag > island.chainMaxApproachingVn) {
                island.chainMaxApproachingVn = mag;
            }
        }

        adj[c->a].push_back(c->b);
        adj[c->b].push_back(c->a);
    }

    std::unordered_set<Body*> visited;
    for (const auto& entry : adj) {
        Body* start = entry.first;
        if (visited.count(start) != 0) {
            continue;
        }

        std::vector<Body*> component;
        std::vector<Body*> stack;
        stack.push_back(start);
        visited.insert(start);

        while (!stack.empty()) {
            Body* b = stack.back();
            stack.pop_back();
            component.push_back(b);
            for (Body* nb : adj[b]) {
                if (visited.insert(nb).second) {
                    stack.push_back(nb);
                }
            }
        }

        std::unordered_map<Body*, int> degree;
        for (Body* b : component) {
            degree[b] = 0;
        }
        for (Body* b : component) {
            for (Body* nb : adj[b]) {
                if (degree.find(nb) != degree.end()) {
                    degree[b]++;
                }
            }
        }

        int edgeCount = 0;
        bool isBranch = false;
        for (const auto& degEntry : degree) {
            int d = degEntry.second;
            edgeCount += d;
            if (d > 2) {
                isBranch = true;
            }
        }
        edgeCount /= 2;

        if (edgeCount >= 2 && !isBranch) {
            island.chainPathCount++;
        }
    }
}

void World::_applyIslandChainRestitution(Island& island, const std::vector<Vec2>& prePgsV) {
    island.chainPassVisitedPathCount = 0;
    island.chainPassAppliedPathCount = 0;
    island.chainPassReprojectedJointCount = 0;

    if (island.contacts.empty() || island.chainEligibleContactCount < 1) {
        return;
    }

    applyElasticMapToPathComponents(
        solverBodies,
        prePgsV,
        island,
        bodiesList,
        false,
        island.chainPassVisitedPathCount,
        island.chainPassAppliedPathCount,
        island.chainPassReprojectedJointCount);
}

void World::_applyWorldPendulumPackChainMap(const std::vector<Vec2>& prePgsV) {
    if (contactConstraints.empty()) {
        return;
    }

    Island packIsland;
    packIsland.contacts.reserve(contactConstraints.size());
    for (ContactConstraint& c : contactConstraints) {
        if (!c.inIsland || c.context.a == nullptr || c.context.b == nullptr) {
            continue;
        }
        packIsland.contacts.push_back(&c);
    }
    if (packIsland.contacts.empty()) {
        return;
    }

    int visited = 0;
    int applied = 0;
    int reprojected = 0;
    applyElasticMapToPathComponents(
        solverBodies,
        prePgsV,
        packIsland,
        bodiesList,
        true,
        visited,
        applied,
        reprojected);
    lastChainResidual.appliedPathCount += applied;
    lastChainResidual.reprojectedJointCount += reprojected;
}

void World::_reprojectIslandJointsAfterChainMap(Island& island) {
    island.chainPassReprojectedJointCount = 0;

    if (island.joints.empty() || island.chainPassAppliedPathCount < 1) {
        return;
    }

    std::vector<BodyVelocitySnapshot> snapshot = snapshotIslandVelocities(island, solverBodies);
    float keBefore = computeIslandDynamicKe(island, solverBodies);
    std::unordered_set<DistanceJoint*> touched;

    for (int iter = 0; iter < kChainJointReprojectIters; ++iter) {
        for (Joint* joint : island.joints) {
            if (joint->getType() != JointType::DISTANCE) {
                continue;
            }
            DistanceJoint* distanceJoint = static_cast<DistanceJoint*>(joint);
            if (applyDistanceJointCdotOnly(distanceJoint, solverBodies)) {
                touched.insert(distanceJoint);
            }
        }
    }

    float keAfter = computeIslandDynamicKe(island, solverBodies);
    if (keAfter > keBefore * (1.0f + 1e-8f) && keAfter > keBefore) {
        restoreIslandVelocities(snapshot, solverBodies);
        return;
    }

    island.chainPassReprojectedJointCount = static_cast<int>(touched.size());
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

    bool islandHasSpringJoint = false;
    for (Joint* j : island.joints) {
        if (j && j->getType() == JointType::SPRING) {
            islandHasSpringJoint = true;
            break;
        }
    }

    for (int iter = 0; iter < velocityIterations; ++iter) {
        if (islandHasOverlappingContact(island)) {
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
                        HingeJoint* hjs[4] = {
                            static_cast<HingeJoint*>(j0),
                            static_cast<HingeJoint*>(j1),
                            static_cast<HingeJoint*>(j2),
                            static_cast<HingeJoint*>(j3)
                        };
                        HingeJoint::solveFastSIMD(hjs);
                        i += 4;
                        continue;
                    }

                    if (j0->getType() == JointType::GEAR &&
                        j1->getType() == JointType::GEAR &&
                        j2->getType() == JointType::GEAR &&
                        j3->getType() == JointType::GEAR) {
                        GearJoint* gjs[4] = {
                            static_cast<GearJoint*>(j0),
                            static_cast<GearJoint*>(j1),
                            static_cast<GearJoint*>(j2),
                            static_cast<GearJoint*>(j3)
                        };
                        GearJoint::solveFastSIMD(gjs);
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
                joint->solveFast();
                i++;
            }
        }
        }
        solveIslandContacts();
        }
        if (!islandHasOverlappingContact(island)) {
            solveIslandContacts();
            for (Joint* j : island.joints) {
                if (j && j->getType() == JointType::DISTANCE) {
                    applyDistanceJointCdotOnly(static_cast<DistanceJoint*>(j), solverBodies);
                }
            }
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
                    if (j->getType() == JointType::GEAR && !islandHasSpringJoint) {
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
                    if (j->getType() == JointType::GEAR && !islandHasSpringJoint) {
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
