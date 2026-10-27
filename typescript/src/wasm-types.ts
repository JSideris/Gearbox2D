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
	setSensorContacts(v: boolean): void;
	getSensorContacts(): boolean;
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
	createBody(id: number, options: any): number;
	createFixture(bodyId: number, fixtureId: number, options: any, isMain: boolean): number;
	removeObject(id: number): void;
	getBody(id: number): any;
	getFixture(id: number): CppFixture | null;
	getBodyCount(): number;
	getFixtureCount(): number;
	createHingeJoint(
		id: number,
		bodyIdA: number,
		bodyIdB: number,
		axA: number,
		ayA: number,
		axB: number,
		ayB: number,
	): void;
	createDistanceJoint(
		id: number,
		bodyIdA: number,
		bodyIdB: number,
		axA: number,
		ayA: number,
		axB: number,
		ayB: number,
		length: number,
	): void;
	createSpringJoint(
		id: number,
		bodyIdA: number,
		bodyIdB: number,
		axA: number,
		ayA: number,
		axB: number,
		ayB: number,
		length: number,
		frequencyHz: number,
		dampingRatio: number,
	): void;
	createGearJoint(id: number, jointId1: number, jointId2: number, ratio: number): void;
	removeJoint(id: number): void;
	getJoint(id: number): CppJoint | null;
	getFixture(id: number): CppFixture | null;
	setTimeStep(dt: number): void;
	setGravity(x: number, y: number): void;
	setHasPenetrationResolution(v: boolean): void;
	setHasRestitution(v: boolean): void;
	setHasFriction(v: boolean): void;
	setHasKrb(v: boolean): void;
	setSpeculativeMargin(v: number): void;
	getSpeculativeMargin(): number;
	queryBodiesAtPoint(x: number, y: number, mask: number): WasmVector;
	queryFixturesAtPoint(x: number, y: number, mask: number): WasmVector;
	queryAABB(minX: number, minY: number, maxX: number, maxY: number, mask: number, flags: number): number;
	queryRadius(x: number, y: number, radius: number, mask: number, flags: number): number;
	raycast(x1: number, y1: number, x2: number, y2: number, mask: number, flags: number, excludeBodyId: number): number;
	queryRadiusBatch(count: number, mask: number, flags: number): number;
	reserveQueryBatch(count: number): void;
	getQueryHeader(): Int32Array;
	getQueryHitsView(): Int32Array;
	getRayHitsView(): Float32Array;
	getBatchOffsetsView(): Int32Array;
	getBatchInputView(): Float32Array;
	getBatchExcludeView(): Int32Array;
	step(): void;
	navCreate(
		minX: number,
		minY: number,
		maxX: number,
		maxY: number,
		cell: number,
		clearance: number,
		flags: number,
	): void;
	navDestroy(): void;
	navHasGrid(): boolean;
	navCols(): number;
	navRows(): number;
	navAddBox(x: number, y: number, w: number, h: number, angle: number): void;
	navAddDisc(x: number, y: number, r: number, keepOut: number): void;
	navCommitBase(c0: number, r0: number, c1: number, r1: number): void;
	navTrack(mask: number, flags: number): void;
	navSetDynamic(count: number): void;
	navPushDynamic(count: number): void;
	navPopDynamic(): void;
	navDynamicLayers(): number;
	navBuildHierarchy(cluster: number, wideEntrance: number): void;
	navSync(): void;
	navReserve(requests: number, discs: number): void;
	findPaths(budget: number, minSlice: number, newCount: number): number;
	navFindPath(fx: number, fy: number, tx: number, ty: number, mode: number, maxExpanded: number): number;
	navCancel(id: number): void;
	navClearRequests(): void;
	navGetHeader(): Int32Array;
	navGetRequestView(): Float64Array;
	navGetDiscView(): Float64Array;
	navGetOutView(): Float64Array;
	navGetBaseView(): Uint8Array;
	navGetBlockedView(): Uint8Array;
	navGetDynamicView(): Uint8Array;
	updateBodyId(oldId: number, newId: number): void;
	updateFixtureId(oldId: number, newId: number): void;
	updateJointId(oldId: number, newId: number): void;
	syncDefragmentedIds(): void;
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
