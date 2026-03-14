export enum ShapeType {
    CIRCLE = 'circle',
    BOX = 'box',
    AABB = 'aabb',
    POINT = 'point',
    POLYGON = 'polygon'
}

export interface DebugFixture {
    shape: ShapeType;
    radius?: number;
    width?: number;
    height?: number;
    points?: { x: number, y: number }[];
    localX: number;
    localY: number;
    localR: number;
}

export interface DebugBody {
    id: number | string;
    x: number;
    y: number;
    r: number;
    color?: string;
    isSleeping?: boolean;
    fixtures: DebugFixture[];
}

export enum JointType {
    HINGE = 'hinge',
    DISTANCE = 'distance',
    SPRING = 'spring',
    GEAR = 'gear'
}

export interface DebugJoint {
    id: number | string;
    type: JointType;
    bodyAId: number | string;
    bodyBId: number | string;
    anchorA: { x: number, y: number }; // World coordinates or relative to bodies? Let's use world for protocol
    anchorB: { x: number, y: number };
    length?: number; // For distance/spring
    frequencyHz?: number; // For spring
}

export interface DebugFrame {
    bodies: DebugBody[];
    joints: DebugJoint[];
    interpolationAlpha: number;
}

export interface PhysicsEngineAdapter {
    init(): Promise<void>;
    step(dt: number): void;
    getDebugFrame(): DebugFrame;
    clear(): void;
    createBox(id: number | string, x: number, y: number, w: number, h: number, isStatic: boolean, options?: any): void;
    createCircle(id: number | string, x: number, y: number, radius: number, isStatic: boolean, options?: any): void;
    createDistanceJoint(id: number | string, bodyAId: number | string, bodyBId: number | string, options?: any): void;
    createPoint(id: number | string, x: number, y: number, isStatic: boolean, options?: any): void;
    getMemoryUsage?(): number;
    getBodyCount(): number;
    getVelocity(id: number | string): { x: number, y: number };
    getPosition(id: number | string): { x: number, y: number };
}
