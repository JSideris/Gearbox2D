export interface BodyOptions {
	id?: number;
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
	canSleep?: boolean;
	isSleeping?: boolean;
	sleepTimeRequired?: number;
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
	wantsEvents?: boolean;
	/** Sensor-vs-sensor contacts: two sensors report contacts only when both set this. Default false. */
	sensorContacts?: boolean;
	fixtures?: FixtureOptions[];
}

export interface FixtureOptions {
	id?: number;
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
	wantsEvents?: boolean;
	/** Sensor-vs-sensor contacts: two sensors report contacts only when both set this. Default false. */
	sensorContacts?: boolean;
	vertices?: { x: number; y: number }[];
}

export interface JointOptions {
	id?: number;
	anchorA?: { x: number; y: number };
	anchorB?: { x: number; y: number };
	worldAnchor?: { x: number; y: number };
	length?: number;
	frequencyHz?: number;
	dampingRatio?: number;
	ratio?: number;
}

/** Filters shared by the spatial queries. */
export interface QueryOptions {
	/** A fixture matches when (categoryBits & mask) != 0. Default: all. */
	mask?: number;
	/** Ignore sensor fixtures. Default false. */
	skipSensors?: boolean;
}

export interface RaycastOptions extends QueryOptions {
	/** Skip this body (e.g. the shooter). */
	exclude?: { internalId: number } | null;
	/** raycastAll only: keep the nearest hit per body. */
	uniqueBodies?: boolean;
}

export interface RaycastHit<B = unknown, F = unknown> {
	body: B;
	fixture: F;
	/** Fraction along the ray, 0..1. 0 when the ray starts inside the fixture. */
	fraction: number;
	x: number;
	y: number;
	/** Surface normal (unit, facing the ray; -direction when starting inside). */
	nx: number;
	ny: number;
}
