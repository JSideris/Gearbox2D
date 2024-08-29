// gb2d.d.ts

// This doesn't work.

enum ObjectType {
	RIGID_BODY,
	SENSOR,
	FIXED_OBJECT
}

enum ObjectShape {
	POINT,
	CIRCLE,
	BOX,
	LINE,
	POLYGON
}

type World = {
	new(options?: {
		gravity?: Vec2;
		// allowSleep?: boolean;
	});
	
	addObject(object: PhysicalObject): void;
	removeObject(id: number): void;
	getObject(id: number): PhysicalObject | null;
	getObjectAtIndex(index: number): PhysicalObject | null;
	getObjectCount(): number;
	getLiveData(): Float32Array;
	getIds(): Int32Array;
	step(dt: number): void;
	clear(): void;
};

type Gb2d = {

	constructor();
        
	readonly World: typeof World;
	readonly Vec2: typeof Vec2;
	readonly PhysicalObject: typeof PhysicalObject;
	readonly ObjectType: typeof ObjectType;
	
	init(): Promise<void>;
	enableDebugGraphics(canvas: HTMLCanvasElement, world: World): void;
	disableDebugGraphics(): void;
	// animate(): void;
	
	// debugFps: number;

    Vec2: {
		new(x: number, y: number): Vec2;
        x: number;
        y: number;
        add(vec: Vec2): Vec2;
        subtract(vec: Vec2): Vec2;
        scale(scalar: number): Vec2;
        magnitude(): number;
        normalize(): Vec2;
    };

    PhysicalObject: {
        new(id: number, options?: {
            x?: number;
			y?: number;
			r?: number;
			vx?; number;
			vy?: number;
			rs?: number;

            type?: ObjectType;
            shape?: ObjectShape;

            damping?: number;
            rotationalDamping?: number;
        });

        id: number;
        position: Vec2;
        rotation: number;
        type: ObjectType;
        velocity: Vec2;
        rotationalSpeed: number;
        damping: number;
        rotationalDamping: number;
        
        getId(): number;
        getPosition(): Vec2;
        setPosition(position: Vec2): void;
        getRotation(): number;
        setRotation(rotation: number): void;
        getType(): ObjectType;
        setType(type: ObjectType): void;
        getVelocity(): Vec2;
        setVelocity(velocity: Vec2): void;
        getRotationalSpeed(): number;
        setRotationalSpeed(rotationalSpeed: number): void;
        getDamping(): number;
        setDamping(damping: number): void;
        getRotationalDamping(): number;
        setRotationalDamping(rotationalDamping: number): void;
        stepMovement(dt: number): void;
        destroy(): void;
    };

    World: World;
}

export {Gb2d};