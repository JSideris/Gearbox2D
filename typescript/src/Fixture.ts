
import { 
    FIXTURE_SIZE_I, FIXTURE_SIZE_F, FIXTURE_ID_OFFSET, FIXTURE_BODY_INDEX_OFFSET,
    FIXTURE_SHAPE_OFFSET, FIXTURE_CATEGORY_BITS_OFFSET, FIXTURE_MASK_BITS_OFFSET,
    FIXTURE_FLAGS_OFFSET, FIXTURE_LOCAL_X_OFFSET, FIXTURE_LOCAL_Y_OFFSET,
    FIXTURE_LOCAL_R_OFFSET, FIXTURE_RADIUS_OFFSET, FIXTURE_WIDTH_OFFSET,
    FIXTURE_HEIGHT_OFFSET, FIXTURE_RESTITUTION_OFFSET, FIXTURE_S_FRICTION_OFFSET,
    FIXTURE_K_FRICTION_OFFSET, FIXTURE_AX1_OFFSET, FIXTURE_AY1_OFFSET,
    FIXTURE_AX2_OFFSET, FIXTURE_AY2_OFFSET, FIXTURE_MAX_EXTENT_OFFSET,
    FIXTURE_DENSITY_OFFSET, FIXTURE_VERTEX_COUNT_OFFSET, FIXTURE_VERTEX_START_OFFSET, FIXTURE_FLAGS
} from './constants.js';
import type { Body } from './Body.js';

export class Fixture {
    body: Body;
    /** @internal Internal sub-fixtures for concave polygons */
    subFixtures: { id: number, index: number }[] = [];

    constructor(index: number, body: Body, id?: number) {
        this.body = body;
        const actualId = id ?? body.world.liveFixtureIntData[index * FIXTURE_SIZE_I + FIXTURE_ID_OFFSET];
        this.subFixtures.push({ id: actualId, index });
    }

    /** The primary sub-fixture ID (used as the user-facing ID) */
    get id() { return this.subFixtures[0].id; }
    /** The primary sub-fixture index in the data buffers */
    get index() { return this.subFixtures[0].index; }
    /** @internal For backward compatibility and syncIndices */
    set index(v: number) { this.subFixtures[0].index = v; }

    /** @internal Updates the index of a specific sub-fixture */
    updateSubIndex(id: number, index: number) {
        for (const sub of this.subFixtures) {
            if (sub.id === id) {
                sub.index = index;
                return;
            }
        }
    }

    get shape() { return this.body.world.liveFixtureIntData[this.index * FIXTURE_SIZE_I + FIXTURE_SHAPE_OFFSET]; }
    get categoryBits() { return this.body.world.liveFixtureIntData[this.index * FIXTURE_SIZE_I + FIXTURE_CATEGORY_BITS_OFFSET]; }
    get maskBits() { return this.body.world.liveFixtureIntData[this.index * FIXTURE_SIZE_I + FIXTURE_MASK_BITS_OFFSET]; }
    get flags() { return this.body.world.liveFixtureIntData[this.index * FIXTURE_SIZE_I + FIXTURE_FLAGS_OFFSET]; }
    
    get isSensor() { return (this.flags & FIXTURE_FLAGS.IS_SENSOR) !== 0; }
    set isSensor(v: boolean) {
        for (const sub of this.subFixtures) {
            const cppObj = this.body.world.world.getFixture(sub.id);
            if (cppObj) {
                cppObj.setSensor(v);
            }
        }
        this.body.world.refreshViews();
    }

    get wantsEvents() { return (this.flags & FIXTURE_FLAGS.WANTS_EVENTS) !== 0; }
    set wantsEvents(v: boolean) {
        for (const sub of this.subFixtures) {
            if (v) {
                this.body.world.liveFixtureIntData[sub.index * FIXTURE_SIZE_I + FIXTURE_FLAGS_OFFSET] |= FIXTURE_FLAGS.WANTS_EVENTS;
            } else {
                this.body.world.liveFixtureIntData[sub.index * FIXTURE_SIZE_I + FIXTURE_FLAGS_OFFSET] &= ~FIXTURE_FLAGS.WANTS_EVENTS;
            }
        }
    }

    get localX() { return this.body.world.liveFixtureFloatData[this.index * FIXTURE_SIZE_F + FIXTURE_LOCAL_X_OFFSET]; }
    get localY() { return this.body.world.liveFixtureFloatData[this.index * FIXTURE_SIZE_F + FIXTURE_LOCAL_Y_OFFSET]; }
    get localR() { return this.body.world.liveFixtureFloatData[this.index * FIXTURE_SIZE_F + FIXTURE_LOCAL_R_OFFSET]; }
    
    get radius() { return this.body.world.liveFixtureFloatData[this.index * FIXTURE_SIZE_F + FIXTURE_RADIUS_OFFSET]; }
    set radius(v) { 
        for (const sub of this.subFixtures) {
            this.body.world.liveFixtureFloatData[sub.index * FIXTURE_SIZE_F + FIXTURE_RADIUS_OFFSET] = v;
        }
    }

    get width() { return this.body.world.liveFixtureFloatData[this.index * FIXTURE_SIZE_F + FIXTURE_WIDTH_OFFSET]; }
    set width(v) {
        for (const sub of this.subFixtures) {
            this.body.world.liveFixtureFloatData[sub.index * FIXTURE_SIZE_F + FIXTURE_WIDTH_OFFSET] = v;
        }
    }

    get height() { return this.body.world.liveFixtureFloatData[this.index * FIXTURE_SIZE_F + FIXTURE_HEIGHT_OFFSET]; }
    set height(v) {
        for (const sub of this.subFixtures) {
            this.body.world.liveFixtureFloatData[sub.index * FIXTURE_SIZE_F + FIXTURE_HEIGHT_OFFSET] = v;
        }
    }
    
    get restitution() { return this.body.world.liveFixtureFloatData[this.index * FIXTURE_SIZE_F + FIXTURE_RESTITUTION_OFFSET]; }
    set restitution(v) {
        for (const sub of this.subFixtures) {
            this.body.world.liveFixtureFloatData[sub.index * FIXTURE_SIZE_F + FIXTURE_RESTITUTION_OFFSET] = v;
        }
    }

    get staticFriction() { return this.body.world.liveFixtureFloatData[this.index * FIXTURE_SIZE_F + FIXTURE_S_FRICTION_OFFSET]; }
    set staticFriction(v) {
        for (const sub of this.subFixtures) {
            this.body.world.liveFixtureFloatData[sub.index * FIXTURE_SIZE_F + FIXTURE_S_FRICTION_OFFSET] = v;
        }
    }

    get kineticFriction() { return this.body.world.liveFixtureFloatData[this.index * FIXTURE_SIZE_F + FIXTURE_K_FRICTION_OFFSET]; }
    set kineticFriction(v) {
        for (const sub of this.subFixtures) {
            this.body.world.liveFixtureFloatData[sub.index * FIXTURE_SIZE_F + FIXTURE_K_FRICTION_OFFSET] = v;
        }
    }
    
    get ax1() { return this.body.world.liveFixtureFloatData[this.index * FIXTURE_SIZE_F + FIXTURE_AX1_OFFSET]; }
    get ay1() { return this.body.world.liveFixtureFloatData[this.index * FIXTURE_SIZE_F + FIXTURE_AY1_OFFSET]; }
    get ax2() { return this.body.world.liveFixtureFloatData[this.index * FIXTURE_SIZE_F + FIXTURE_AX2_OFFSET]; }
    get ay2() { return this.body.world.liveFixtureFloatData[this.index * FIXTURE_SIZE_F + FIXTURE_AY2_OFFSET]; }
    get maxExtent() { return this.body.world.liveFixtureFloatData[this.index * FIXTURE_SIZE_F + FIXTURE_MAX_EXTENT_OFFSET]; }
    
    get density() { return this.body.world.liveFixtureFloatData[this.index * FIXTURE_SIZE_F + FIXTURE_DENSITY_OFFSET]; }
    set density(v) {
        for (const sub of this.subFixtures) {
            this.body.world.liveFixtureFloatData[sub.index * FIXTURE_SIZE_F + FIXTURE_DENSITY_OFFSET] = v;
            const cppObj = this.body.world.world.getFixture(sub.id);
            if (cppObj) {
                cppObj.setDensity(v);
            }
        }
        this.body.world.refreshViews();
    }

    /** @internal Returns vertices for all internal sub-fixtures for debugging/rendering */
    get debugVertices(): { x: number, y: number }[][] {
        return this.subFixtures.map(sub => {
            const count = this.body.world.liveFixtureFloatData[sub.index * FIXTURE_SIZE_F + FIXTURE_VERTEX_COUNT_OFFSET];
            const verts: { x: number, y: number }[] = [];
            const start = sub.index * FIXTURE_SIZE_F + FIXTURE_VERTEX_START_OFFSET;
            for (let i = 0; i < count; i++) {
                verts.push({
                    x: this.body.world.liveFixtureFloatData[start + i * 2],
                    y: this.body.world.liveFixtureFloatData[start + i * 2 + 1]
                });
            }
            return verts;
        });
    }

    get vertexCount() { return this.body.world.liveFixtureFloatData[this.index * FIXTURE_SIZE_F + FIXTURE_VERTEX_COUNT_OFFSET]; }
    get vertices() {
        const count = this.vertexCount;
        const verts: { x: number, y: number }[] = [];
        const start = this.index * FIXTURE_SIZE_F + FIXTURE_VERTEX_START_OFFSET;
        for (let i = 0; i < count; i++) {
            verts.push({
                x: this.body.world.liveFixtureFloatData[start + i * 2],
                y: this.body.world.liveFixtureFloatData[start + i * 2 + 1]
            });
        }
        return verts;
    }
}
