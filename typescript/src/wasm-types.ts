export interface WasmVector<T = number> {
	size(): number;
	get(index: number): T;
	delete(): void;
}

export interface CppVec2 {
	x: number;
	y: number;
	new (x: number, y: number): CppVec2;
}

export interface CppFixture {
	setSensor(v: boolean): void;
	setDensity(v: number): void;
}

export interface CppJoint {
	getReactionForce(invDt: number): { x: number; y: number };
	getReactionTorque(invDt: number): number;
	getLocalAnchorA(): { x: number; y: number };
	setLocalAnchorA(v: { x: number; y: number }): void;
	getLocalAnchorB(): { x: number; y: number };
	setLocalAnchorB(v: { x: number; y: number }): void;
	getLength?(): number;
	setLength?(v: number): void;
	getFrequencyHz?(): number;
	setFrequencyHz?(v: number): void;
	getDampingRatio?(): number;
	setDampingRatio?(v: number): void;
	getRatio?(): number;
	setRatio?(v: number): void;
}

export interface CppWorld {
	new (): CppWorld;
	getLiveBodyFloatData(): Float32Array;
	getLiveBodyIntData(): Int32Array;
	getLiveFixtureFloatData(): Float32Array;
	getLiveFixtureIntData(): Int32Array;
	clear(): void;
	delete(): void;
	addFixture(bodyId: number, fixtureId: number, options: any, isMain: boolean): number;
	removeObject(id: number): void;
	getBodyCount(): number;
	getFixtureCount(): number;
	createHingeJoint(id: number, bodyIdA: number, bodyIdB: number, axA: number, ayA: number, axB: number, ayB: number): void;
	createDistanceJoint(id: number, bodyIdA: number, bodyIdB: number, axA: number, ayA: number, axB: number, ayB: number, length: number): void;
	createSpringJoint(id: number, bodyIdA: number, bodyIdB: number, axA: number, ayA: number, axB: number, ayB: number, length: number, frequencyHz: number, dampingRatio: number): void;
	createGearJoint(id: number, jointId1: number, jointId2: number, ratio: number): void;
	removeJoint(id: number): void;
	getJoint(id: number): CppJoint | null;
	getFixture(id: number): CppFixture | null;
	setTimeStep(dt: number): void;
	setGravity(x: number, y: number): void;
	setHasPenetrationResolution(v: boolean): void;
	setHasRestitution(v: boolean): void;
	setHasFriction(v: boolean): void;
	setSpeculativeMargin(v: number): void;
	getSpeculativeMargin(): number;
	queryBodiesAtPoint(x: number, y: number, mask: number): WasmVector;
	queryFixturesAtPoint(x: number, y: number, mask: number): WasmVector;
	step(): void;
	getEventCount(): number;
	getEventData(): Float32Array;
}

export interface WasmModule {
	Vec2: { new (x: number, y: number): CppVec2 };
	World: { new (): CppWorld };
	HEAP8?: { buffer: ArrayBuffer };
	HEAPU8?: { buffer: ArrayBuffer };
	wasmMemory?: { buffer: ArrayBuffer };
	buffer?: ArrayBuffer;
}
