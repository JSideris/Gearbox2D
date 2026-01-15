
import { 
    BODY_SIZE_F, BODY_SIZE_I, FIXTURE_SIZE_F, FIXTURE_SIZE_I,
    BODY_ID_OFFSET, FIXTURE_ID_OFFSET, BODY_FIXTURE_COUNT_OFFSET
} from './constants.js';
import { Body } from './Body.js';
import { Fixture } from './Fixture.js';
import { HingeJoint, DistanceJoint, SpringJoint, GearJoint } from './joints.js';

export interface BodyOptions {
    type?: number;
    x?: number;
    y?: number;
    r?: number;
    vx?: number;
    vy?: number;
    rs?: number;
    mass?: number;
    gscale?: number;
    linearDamping?: number;
    angularDamping?: number;
    color?: string;

    // Initial fixture options
    shape?: number;
    fixtureId?: number;
    categoryBits?: number;
    maskBits?: number;
    localX?: number;
    localY?: number;
    localR?: number;
    radius?: number;
    width?: number;
    height?: number;
    restitution?: number;
    sFriction?: number;
    kFriction?: number;
    density?: number;
    isSensor?: boolean;
    fixtures?: FixtureOptions[];
}

export interface FixtureOptions {
    shape: number;
    categoryBits?: number;
    maskBits?: number;
    localX?: number;
    localY?: number;
    localR?: number;
    radius?: number;
    width?: number;
    height?: number;
    restitution?: number;
    sFriction?: number;
    kFriction?: number;
    density?: number;
    isSensor?: boolean;
}

export interface JointOptions {
    anchorA?: { x: number; y: number };
    anchorB?: { x: number; y: number };
    worldAnchor?: { x: number; y: number };
    length?: number;
    frequencyHz?: number;
    dampingRatio?: number;
}

export type Joint = HingeJoint | DistanceJoint | SpringJoint | GearJoint;

export class World {
    world: any;
    liveBodyFloatData: Float32Array;
    liveBodyIntData: Int32Array;
    liveFixtureFloatData: Float32Array;
    liveFixtureIntData: Int32Array;
    
    bodiesById: { [key: number]: Body } = {};
    fixturesById: { [key: number]: Fixture } = {};
    jointsById: { [key: number]: Joint } = {};
    
    interpolationAlpha: number = 1.0;
    stepCount: number = 0;

    onCollisionStart?: (idA: number, idB: number, fixtureIdA: number, fixtureIdB: number, impulse: number) => void;
    onCollisionEnd?: (idA: number, idB: number, fixtureIdA: number, fixtureIdB: number) => void;
    onSleep?: (id: number) => void;
    onWake?: (id: number) => void;

    constructor(world: any) {
        this.world = world;
        this.refreshViews();
    }

    refreshViews() {
        this.liveBodyFloatData = this.world.getLiveBodyFloatData();
        this.liveBodyIntData = this.world.getLiveBodyIntData();
        this.liveFixtureFloatData = this.world.getLiveFixtureFloatData();
        this.liveFixtureIntData = this.world.getLiveFixtureIntData();
    }

    clear() {
        this.world.clear();
        this.bodiesById = {};
        this.fixturesById = {};
        this.jointsById = {};
        this.refreshViews();
    }

    makeBody(id: number, options: BodyOptions): Body {
        const index = this.world.makeBody(id, options);
        this.refreshViews();
        const body = new Body(index, this);
        body.color = options.color;
        this.bodiesById[id] = body;

        // Fetch all fixtures created by C++ makeBody (could be multiple if options.fixtures was used)
        const totalFixtureCount = this.world.getFixtureCount();
        const currentBodyFixtureCount = this.liveBodyIntData[index * BODY_SIZE_I + BODY_FIXTURE_COUNT_OFFSET];
        
        if (currentBodyFixtureCount > 0) {
            for (let i = 0; i < currentBodyFixtureCount; i++) {
                const fIndex = totalFixtureCount - currentBodyFixtureCount + i;
                const fixture = new Fixture(fIndex, body);
                this.fixturesById[fixture.id] = fixture;
                body.fixtures.push(fixture);
            }
        }

        return body;
    }

    addFixture(bodyId: number, arg1: any, arg2?: any): Fixture {
        let options: FixtureOptions;
        let fixtureId: number;

        if (typeof arg1 === 'number') {
            // Old signature: addFixture(bodyId, fixtureId, options)
            fixtureId = arg1;
            options = arg2;
        } else {
            // New signature: addFixture(bodyId, options, fixtureId?)
            options = arg1;
            fixtureId = arg2 || 0;
        }

        const body = this.bodiesById[bodyId];
        if (!body) throw new Error(`Body with id ${bodyId} not found`);

        const fIndex = this.world.addFixture(bodyId, fixtureId, options);
        this.refreshViews();
        const fixture = new Fixture(fIndex, body);
        this.fixturesById[fixture.id] = fixture;
        body.fixtures.push(fixture);

        return fixture;
    }

    removeObject(id: number) {
        const body = this.bodiesById[id];
        if (body) {
            for (const fixture of body.fixtures) {
                delete this.fixturesById[fixture.id];
            }
        }
        this.world.removeObject(id);
        this.refreshViews();
        delete this.bodiesById[id];
        // Re-sync indices after swap-with-last
        this.syncIndices();
    }

    syncIndices() {
        const bodyCount = this.world.getBodyCount();
        for (let i = 0; i < bodyCount; i++) {
            const id = this.liveBodyIntData[i * BODY_SIZE_I + BODY_ID_OFFSET];
            if (this.bodiesById[id]) this.bodiesById[id].index = i;
        }
        const fixtureCount = this.world.getFixtureCount();
        for (let i = 0; i < fixtureCount; i++) {
            const id = this.liveFixtureIntData[i * FIXTURE_SIZE_I + FIXTURE_ID_OFFSET];
            if (this.fixturesById[id]) this.fixturesById[id].index = i;
        }
    }

    getBodyById(id: number): Body | undefined {
        return this.bodiesById[id];
    }

    getBodyCount(): number {
        return this.world.getBodyCount();
    }

    iterateBodies(callback: (body: Body) => void) {
        const count = this.world.getBodyCount();
        for (let i = 0; i < count; i++) {
            const id = this.liveBodyIntData[i * BODY_SIZE_I + BODY_ID_OFFSET];
            const body = this.bodiesById[id];
            if (body) callback(body);
        }
    }

    createHingeJoint(id: number, bodyA: Body, bodyB: Body, options: JointOptions): HingeJoint {
        const anchorA = options.anchorA || { x: 0, y: 0 };
        const anchorB = options.anchorB || { x: 0, y: 0 };

        if (options.worldAnchor) {
            const worldAnchor = options.worldAnchor;
            const cosA = Math.cos(-bodyA.r), sinA = Math.sin(-bodyA.r);
            const ax = worldAnchor.x - bodyA.x, ay = worldAnchor.y - bodyA.y;
            anchorA.x = ax * cosA - ay * sinA;
            anchorA.y = ax * sinA + ay * cosA;

            const cosB = Math.cos(-bodyB.r), sinB = Math.sin(-bodyB.r);
            const bx = worldAnchor.x - bodyB.x, by = worldAnchor.y - bodyB.y;
            anchorB.x = bx * cosB - by * sinB;
            anchorB.y = bx * sinB + by * cosB;
        }

        this.world.createHingeJoint(id, bodyA.id, bodyB.id, anchorA.x, anchorA.y, anchorB.x, anchorB.y);
        const joint = new HingeJoint(id, this, bodyA, bodyB, anchorA, anchorB);
        this.jointsById[id] = joint;
        return joint;
    }

    createDistanceJoint(id: number, bodyA: Body, bodyB: Body, options: JointOptions): DistanceJoint {
        const anchorA = options.anchorA || { x: 0, y: 0 };
        const anchorB = options.anchorB || { x: 0, y: 0 };

        if (options.worldAnchor) {
            const worldAnchor = options.worldAnchor;
            const cosA = Math.cos(-bodyA.r), sinA = Math.sin(-bodyA.r);
            const ax = worldAnchor.x - bodyA.x, ay = worldAnchor.y - bodyA.y;
            anchorA.x = ax * cosA - ay * sinA;
            anchorA.y = ax * sinA + ay * cosA;

            const cosB = Math.cos(-bodyB.r), sinB = Math.sin(-bodyB.r);
            const bx = worldAnchor.x - bodyB.x, by = worldAnchor.y - bodyB.y;
            anchorB.x = bx * cosB - by * sinB;
            anchorB.y = bx * sinB + by * cosB;
        }

        let length = options.length;
        if (length === undefined) {
            const wa = bodyA.localToWorld(anchorA);
            const wb = bodyB.localToWorld(anchorB);
            const dx = wb.x - wa.x, dy = wb.y - wa.y;
            length = Math.sqrt(dx * dx + dy * dy);
        }

        this.world.createDistanceJoint(id, bodyA.id, bodyB.id, anchorA.x, anchorA.y, anchorB.x, anchorB.y, length);
        const joint = new DistanceJoint(id, this, bodyA, bodyB, anchorA, anchorB, length);
        this.jointsById[id] = joint;
        return joint;
    }

    createSpringJoint(id: number, bodyA: Body, bodyB: Body, options: JointOptions): SpringJoint {
        const anchorA = options.anchorA || { x: 0, y: 0 };
        const anchorB = options.anchorB || { x: 0, y: 0 };
        const frequencyHz = options.frequencyHz !== undefined ? options.frequencyHz : 5.0;
        const dampingRatio = options.dampingRatio !== undefined ? options.dampingRatio : 0.7;

        if (options.worldAnchor) {
            const worldAnchor = options.worldAnchor;
            const cosA = Math.cos(-bodyA.r), sinA = Math.sin(-bodyA.r);
            const ax = worldAnchor.x - bodyA.x, ay = worldAnchor.y - bodyA.y;
            anchorA.x = ax * cosA - ay * sinA;
            anchorA.y = ax * sinA + ay * cosA;

            const cosB = Math.cos(-bodyB.r), sinB = Math.sin(-bodyB.r);
            const bx = worldAnchor.x - bodyB.x, by = worldAnchor.y - bodyB.y;
            anchorB.x = bx * cosB - by * sinB;
            anchorB.y = bx * sinB + by * cosB;
        }

        let length = options.length;
        if (length === undefined) {
            const wa = bodyA.localToWorld(anchorA);
            const wb = bodyB.localToWorld(anchorB);
            const dx = wb.x - wa.x, dy = wb.y - wa.y;
            length = Math.sqrt(dx * dx + dy * dy);
        }

        this.world.createSpringJoint(id, bodyA.id, bodyB.id, anchorA.x, anchorA.y, anchorB.x, anchorB.y, length, frequencyHz, dampingRatio);
        const joint = new SpringJoint(id, this, bodyA, bodyB, anchorA, anchorB, length, frequencyHz, dampingRatio);
        this.jointsById[id] = joint;
        return joint;
    }

    createGearJoint(id: number, joint1: HingeJoint, joint2: HingeJoint, ratio: number): GearJoint {
        this.world.createGearJoint(id, joint1.id, joint2.id, ratio);
        const joint = new GearJoint(id, this, joint1, joint2, ratio);
        this.jointsById[id] = joint;
        return joint;
    }

    removeJoint(id: number) {
        this.world.removeJoint(id);
        delete this.jointsById[id];
    }

    getJointById(id: number): Joint | undefined {
        return this.jointsById[id];
    }

    setGravity(x: number, y: number) {
        this.world.setGravity(x, y);
    }

    setHasPenetrationResolution(v: boolean) {
        this.world.setHasPenetrationResolution(v);
    }

    setHasRestitution(v: boolean) {
        this.world.setHasRestitution(v);
    }

    setHasFriction(v: boolean) {
        this.world.setHasFriction(v);
    }

    getMemoryUsage(): number {
        // 1. WASM Heap (C++ objects and buffers)
        const wasmHeap = (this as any)._wasmMemoryGetter?.() || 0;
        
        // 2. JS Wrapper Estimates
        const bodyCount = Object.keys(this.bodiesById).length;
        const fixtureCount = Object.keys(this.fixturesById).length;
        const jointCount = Object.keys(this.jointsById).length;
        
        // Estimates:
        // Body: ~160 bytes
        // Fixture: ~120 bytes
        // Joint: ~140 bytes
        const jsOverhead = (bodyCount * 160) + (fixtureCount * 120) + (jointCount * 140);

        return wasmHeap + jsOverhead;
    }

    /** @deprecated Use queryBodiesAtPoint instead */
    queryPoint(x: number, y: number, mask: number = 0xFFFFFFFF): number[] {
        return this.queryBodiesAtPoint(x, y, mask);
    }

    queryBodiesAtPoint(x: number, y: number, mask: number = 0xFFFFFFFF): number[] {
        const hits = this.world.queryBodiesAtPoint(x, y, mask);
        const results: number[] = [];
        for (let i = 0; i < hits.size(); i++) {
            results.push(hits.get(i));
        }
        hits.delete();
        return results;
    }

    queryFixturesAtPoint(x: number, y: number, mask: number = 0xFFFFFFFF): number[] {
        const hits = this.world.queryFixturesAtPoint(x, y, mask);
        const results: number[] = [];
        for (let i = 0; i < hits.size(); i++) {
            results.push(hits.get(i));
        }
        hits.delete();
        return results;
    }

    step() {
        this.world.step();
        this.stepCount++;

        // Process events
        const eventCount = this.world.getEventCount();
        if (eventCount > 0) {
            const eventData = this.world.getEventData();
            for (let i = 0; i < eventCount; i++) {
                const type = eventData[i * 6];
                const idA = eventData[i * 6 + 1];
                const idB = eventData[i * 6 + 2];
                const fIdA = eventData[i * 6 + 3];
                const fIdB = eventData[i * 6 + 4];
                const impulse = eventData[i * 6 + 5];

                if (type === 0 && this.onCollisionStart) this.onCollisionStart(idA, idB, fIdA, fIdB, impulse);
                else if (type === 1 && this.onCollisionEnd) this.onCollisionEnd(idA, idB, fIdA, fIdB);
                else if (type === 2 && this.onSleep) this.onSleep(idA);
                else if (type === 3 && this.onWake) this.onWake(idA);
            }
        }
    }
}
