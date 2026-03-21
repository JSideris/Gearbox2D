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
