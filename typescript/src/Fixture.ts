
import { 
    FIXTURE_SIZE_I, FIXTURE_SIZE_F, FIXTURE_ID_OFFSET, FIXTURE_BODY_INDEX_OFFSET,
    FIXTURE_SHAPE_OFFSET, FIXTURE_CATEGORY_BITS_OFFSET, FIXTURE_MASK_BITS_OFFSET,
    FIXTURE_FLAGS_OFFSET, FIXTURE_LOCAL_X_OFFSET, FIXTURE_LOCAL_Y_OFFSET,
    FIXTURE_LOCAL_R_OFFSET, FIXTURE_RADIUS_OFFSET, FIXTURE_WIDTH_OFFSET,
    FIXTURE_HEIGHT_OFFSET, FIXTURE_RESTITUTION_OFFSET, FIXTURE_S_FRICTION_OFFSET,
    FIXTURE_K_FRICTION_OFFSET, FIXTURE_AX1_OFFSET, FIXTURE_AY1_OFFSET,
    FIXTURE_AX2_OFFSET, FIXTURE_AY2_OFFSET, FIXTURE_MAX_EXTENT_OFFSET,
    FIXTURE_DENSITY_OFFSET, FIXTURE_FLAGS
} from './constants.js';
import type { Body } from './Body.js';

export class Fixture {
    id: number;
    body: Body;
    index: number;

    constructor(index: number, body: Body) {
        this.index = index;
        this.body = body;
        this.id = body.world.liveFixtureIntData[index * FIXTURE_SIZE_I + FIXTURE_ID_OFFSET];
    }

    get shape() { return this.body.world.liveFixtureIntData[this.index * FIXTURE_SIZE_I + FIXTURE_SHAPE_OFFSET]; }
    get categoryBits() { return this.body.world.liveFixtureIntData[this.index * FIXTURE_SIZE_I + FIXTURE_CATEGORY_BITS_OFFSET]; }
    get maskBits() { return this.body.world.liveFixtureIntData[this.index * FIXTURE_SIZE_I + FIXTURE_MASK_BITS_OFFSET]; }
    get flags() { return this.body.world.liveFixtureIntData[this.index * FIXTURE_SIZE_I + FIXTURE_FLAGS_OFFSET]; }
    get isSensor() { return (this.flags & FIXTURE_FLAGS.IS_SENSOR) !== 0; }
    set isSensor(v: boolean) {
        const cppObj = this.body.world.world.getFixture(this.id);
        if (cppObj) {
            cppObj.setSensor(v);
            this.body.world.refreshViews();
        }
    }

    get localX() { return this.body.world.liveFixtureFloatData[this.index * FIXTURE_SIZE_F + FIXTURE_LOCAL_X_OFFSET]; }
    get localY() { return this.body.world.liveFixtureFloatData[this.index * FIXTURE_SIZE_F + FIXTURE_LOCAL_Y_OFFSET]; }
    get localR() { return this.body.world.liveFixtureFloatData[this.index * FIXTURE_SIZE_F + FIXTURE_LOCAL_R_OFFSET]; }
    
    get radius() { return this.body.world.liveFixtureFloatData[this.index * FIXTURE_SIZE_F + FIXTURE_RADIUS_OFFSET]; }
    set radius(v) { this.body.world.liveFixtureFloatData[this.index * FIXTURE_SIZE_F + FIXTURE_RADIUS_OFFSET] = v; }
    get width() { return this.body.world.liveFixtureFloatData[this.index * FIXTURE_SIZE_F + FIXTURE_WIDTH_OFFSET]; }
    set width(v) { this.body.world.liveFixtureFloatData[this.index * FIXTURE_SIZE_F + FIXTURE_WIDTH_OFFSET] = v; }
    get height() { return this.body.world.liveFixtureFloatData[this.index * FIXTURE_SIZE_F + FIXTURE_HEIGHT_OFFSET]; }
    set height(v) { this.body.world.liveFixtureFloatData[this.index * FIXTURE_SIZE_F + FIXTURE_HEIGHT_OFFSET] = v; }
    
    get restitution() { return this.body.world.liveFixtureFloatData[this.index * FIXTURE_SIZE_F + FIXTURE_RESTITUTION_OFFSET]; }
    set restitution(v) { this.body.world.liveFixtureFloatData[this.index * FIXTURE_SIZE_F + FIXTURE_RESTITUTION_OFFSET] = v; }
    get staticFriction() { return this.body.world.liveFixtureFloatData[this.index * FIXTURE_SIZE_F + FIXTURE_S_FRICTION_OFFSET]; }
    set staticFriction(v) { this.body.world.liveFixtureFloatData[this.index * FIXTURE_SIZE_F + FIXTURE_S_FRICTION_OFFSET] = v; }
    get kineticFriction() { return this.body.world.liveFixtureFloatData[this.index * FIXTURE_SIZE_F + FIXTURE_K_FRICTION_OFFSET]; }
    set kineticFriction(v) { this.body.world.liveFixtureFloatData[this.index * FIXTURE_SIZE_F + FIXTURE_K_FRICTION_OFFSET] = v; }
    
    get ax1() { return this.body.world.liveFixtureFloatData[this.index * FIXTURE_SIZE_F + FIXTURE_AX1_OFFSET]; }
    get ay1() { return this.body.world.liveFixtureFloatData[this.index * FIXTURE_SIZE_F + FIXTURE_AY1_OFFSET]; }
    get ax2() { return this.body.world.liveFixtureFloatData[this.index * FIXTURE_SIZE_F + FIXTURE_AX2_OFFSET]; }
    get ay2() { return this.body.world.liveFixtureFloatData[this.index * FIXTURE_SIZE_F + FIXTURE_AY2_OFFSET]; }
    get maxExtent() { return this.body.world.liveFixtureFloatData[this.index * FIXTURE_SIZE_F + FIXTURE_MAX_EXTENT_OFFSET]; }
    get density() { return this.body.world.liveFixtureFloatData[this.index * FIXTURE_SIZE_F + FIXTURE_DENSITY_OFFSET]; }
    set density(v) {
        this.body.world.liveFixtureFloatData[this.index * FIXTURE_SIZE_F + FIXTURE_DENSITY_OFFSET] = v;
        const cppObj = this.body.world.world.getFixture(this.id);
        if (cppObj) {
            cppObj.setDensity(v);
            this.body.world.refreshViews();
        }
    }
}
