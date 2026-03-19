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
	wantsEvents?: boolean;
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
	wantsEvents?: boolean;
	vertices?: { x: number; y: number }[];
}

export interface JointOptions {
	anchorA?: { x: number; y: number };
	anchorB?: { x: number; y: number };
	worldAnchor?: { x: number; y: number };
	length?: number;
	frequencyHz?: number;
	dampingRatio?: number;
}

export type Joint = any; // Will be refined in Phase 3
