import { PhysicsEngineAdapter, DebugFrame, ShapeType, JointType } from '../physics-protocol.ts';

// --- Matter.js Adapter ---
export class MatterAdapter implements PhysicsEngineAdapter {
    private engine: any = null;
    private world: any = null;
    private Matter: any = (window as any).Matter;
    private readonly SCALE = 100;
    private bodies = new Map<number | string, any>();

    async init(): Promise<void> {
        this.Matter = (window as any).Matter;
        if (!this.Matter) throw new Error("Matter.js not loaded");
        this.engine = this.Matter.Engine.create({
            enableSleeping: true
        });
        this.world = this.engine.world;
        // Adjust gravity to feel similar to the other engines at this scale
        this.world.gravity.y = 1.0;
    }

    step(dt: number): void {
        this.Matter.Engine.update(this.engine, dt * 1000);
    }

    getDebugFrame(): DebugFrame {
        const bodies = this.Matter.Composite.allBodies(this.world).map((body: any) => ({
            id: body.id,
            x: body.position.x / this.SCALE,
            y: body.position.y / this.SCALE,
            r: body.angle,
            isSleeping: body.isSleeping,
            fixtures: body.parts.filter((part: any) => part !== body).map((part: any) => ({
                shape: part.circleRadius ? ShapeType.CIRCLE : ShapeType.POLYGON,
                radius: part.circleRadius ? part.circleRadius / this.SCALE : undefined,
                points: part.vertices.map((v: any) => ({ 
                    x: (v.x - part.position.x) / this.SCALE, 
                    y: (v.y - part.position.y) / this.SCALE 
                })),
                localX: (part.position.x - body.position.x) / this.SCALE,
                localY: (part.position.y - body.position.y) / this.SCALE,
                localR: part.angle - body.angle
            }))
        }));

        // Basic support for single-part bodies
        bodies.forEach(b => {
            if (b.fixtures.length === 0) {
                const body = this.Matter.Composite.allBodies(this.world).find((mb: any) => mb.id === b.id);
                b.fixtures.push({
                    shape: body.circleRadius ? ShapeType.CIRCLE : ShapeType.POLYGON,
                    radius: body.circleRadius ? body.circleRadius / this.SCALE : undefined,
                    points: body.vertices.map((v: any) => ({ 
                        x: (v.x - body.position.x) / this.SCALE, 
                        y: (v.y - body.position.y) / this.SCALE 
                    })),
                    localX: 0, localY: 0, localR: 0
                });
            }
        });

        const joints = this.Matter.Composite.allConstraints(this.world).map((c: any) => {
            const anchorA = c.pointA;
            const anchorB = c.pointB;
            const worldA = c.bodyA ? {
                x: (c.bodyA.position.x + anchorA.x) / this.SCALE,
                y: (c.bodyA.position.y + anchorA.y) / this.SCALE
            } : { x: anchorA.x / this.SCALE, y: anchorA.y / this.SCALE };
            const worldB = c.bodyB ? {
                x: (c.bodyB.position.x + anchorB.x) / this.SCALE,
                y: (c.bodyB.position.y + anchorB.y) / this.SCALE
            } : { x: anchorB.x / this.SCALE, y: anchorB.y / this.SCALE };

            return {
                id: c.id,
                type: JointType.DISTANCE,
                bodyAId: c.bodyA?.id,
                bodyBId: c.bodyB?.id,
                anchorA: worldA,
                anchorB: worldB
            };
        });

        return { bodies, joints, interpolationAlpha: 1.0 };
    }

    clear(): void {
        this.Matter.Composite.clear(this.world, false);
        this.bodies.clear();
    }

    createBox(id: number | string, x: number, y: number, w: number, h: number, isStatic: boolean, options: any = {}): void {
        const body = this.Matter.Bodies.rectangle(
            x * this.SCALE, 
            y * this.SCALE, 
            w * this.SCALE, 
            h * this.SCALE, 
            { 
                isStatic, 
                restitution: options.restitution ?? 0,
                friction: options.sFriction ?? 0.5,
                frictionStatic: options.sFriction ?? 0.5,
                frictionAir: 0,
                ...options 
            }
        );
        this.Matter.Composite.add(this.world, body);
        this.bodies.set(id, body);
    }

    createCircle(id: number | string, x: number, y: number, radius: number, isStatic: boolean, options: any = {}): void {
        const body = this.Matter.Bodies.circle(
            x * this.SCALE, 
            y * this.SCALE, 
            radius * this.SCALE, 
            { 
                isStatic, 
                restitution: options.restitution ?? 0,
                friction: options.sFriction ?? 0.5,
                frictionStatic: options.sFriction ?? 0.5,
                frictionAir: 0,
                ...options 
            }
        );
        this.Matter.Composite.add(this.world, body);
        this.bodies.set(id, body);
    }

    createDistanceJoint(id: number | string, bodyAId: number | string, bodyBId: number | string, options: any = {}): void {
        const bodyA = this.bodies.get(bodyAId);
        const bodyB = this.bodies.get(bodyBId);
        const constraint = this.Matter.Constraint.create({
            bodyA,
            bodyB,
            pointA: options.anchorA ? { x: options.anchorA.x * this.SCALE, y: options.anchorA.y * this.SCALE } : { x: 0, y: 0 },
            pointB: options.anchorB ? { x: options.anchorB.x * this.SCALE, y: options.anchorB.y * this.SCALE } : { x: 0, y: 0 },
            length: options.length !== undefined ? options.length * this.SCALE : undefined,
            stiffness: 1.0
        });
        this.Matter.Composite.add(this.world, constraint);
    }

    getBodyCount(): number {
        return this.Matter.Composite.allBodies(this.world).length;
    }
}

// --- P2.js Adapter ---
export class P2Adapter implements PhysicsEngineAdapter {
    private world: any = null;
    private p2: any = (window as any).p2;
    private bodies = new Map<number | string, any>();

    async init(): Promise<void> {
        this.p2 = (window as any).p2;
        if (!this.p2) throw new Error("P2.js not loaded");
        this.world = new this.p2.World({ gravity: [0, -9.8] });
    }

    step(dt: number): void {
        this.world.step(dt);
    }

    getDebugFrame(): DebugFrame {
        const bodies = this.world.bodies.map((body: any) => ({
            id: body.id,
            x: body.position[0],
            y: -body.position[1],
            r: -body.angle,
            isSleeping: body.sleepState === 2, // SLEEPING
            fixtures: body.shapes.map((shape: any) => ({
                shape: shape instanceof this.p2.Circle ? ShapeType.CIRCLE : ShapeType.BOX,
                radius: shape.radius,
                width: shape.width,
                height: shape.height,
                localX: shape.position[0],
                localY: -shape.position[1],
                localR: -shape.angle
            }))
        }));

        const joints = this.world.constraints.map((c: any) => {
            if (c instanceof this.p2.DistanceConstraint) {
                const pA = [0, 0];
                const pB = [0, 0];
                c.bodyA.toWorldFrame(pA, c.localAnchorA);
                c.bodyB.toWorldFrame(pB, c.localAnchorB);
                return {
                    id: Math.random(), // p2 doesn't have constraint IDs by default
                    type: JointType.DISTANCE,
                    bodyAId: c.bodyA.id,
                    bodyBId: c.bodyB.id,
                    anchorA: { x: pA[0], y: -pA[1] },
                    anchorB: { x: pB[0], y: -pB[1] }
                };
            }
            return null;
        }).filter((j: any) => j !== null);

        return { bodies, joints, interpolationAlpha: 1.0 };
    }

    clear(): void {
        this.world.clear();
        this.bodies.clear();
    }

    createBox(id: number | string, x: number, y: number, w: number, h: number, isStatic: boolean, options: any = {}): void {
        const body = new this.p2.Body({
            mass: isStatic ? 0 : (options.mass || 1),
            position: [x, -y],
            type: isStatic ? this.p2.Body.STATIC : this.p2.Body.DYNAMIC
        });
        body.addShape(new this.p2.Box({ width: w, height: h }));
        this.world.addBody(body);
        this.bodies.set(id, body);
    }

    createCircle(id: number | string, x: number, y: number, radius: number, isStatic: boolean, options: any = {}): void {
        const body = new this.p2.Body({
            mass: isStatic ? 0 : (options.mass || 1),
            position: [x, -y],
            type: isStatic ? this.p2.Body.STATIC : this.p2.Body.DYNAMIC
        });
        body.addShape(new this.p2.Circle({ radius }));
        this.world.addBody(body);
        this.bodies.set(id, body);
    }

    createDistanceJoint(id: number | string, bodyAId: number | string, bodyBId: number | string, options: any = {}): void {
        const bodyA = this.bodies.get(bodyAId);
        const bodyB = this.bodies.get(bodyBId);
        const constraint = new this.p2.DistanceConstraint(bodyA, bodyB, {
            localAnchorA: options.anchorA ? [options.anchorA.x, -options.anchorA.y] : [0, 0],
            localAnchorB: options.anchorB ? [options.anchorB.x, -options.anchorB.y] : [0, 0],
            distance: options.length
        });
        this.world.addConstraint(constraint);
    }

    getBodyCount(): number {
        return this.world.bodies.length;
    }
}

// --- Box2D-WASM Adapter ---
export class Box2DAdapter implements PhysicsEngineAdapter {
    private world: any = null;
    private box2d: any = null;
    private bodies = new Map<number | string, any>();

    async init(): Promise<void> {
        if (!(window as any).Box2D) throw new Error("Box2D-WASM not loaded");
        this.box2d = await (window as any).Box2D();
        this.world = new this.box2d.b2World(new this.box2d.b2Vec2(0, -9.8));
    }

    step(dt: number): void {
        this.world.Step(dt, 8, 3);
    }

    getDebugFrame(): DebugFrame {
        const bodies: any[] = [];
        for (let b = this.world.GetBodyList(); this.box2d.getPointer(b) !== 0; b = b.GetNext()) {
            const fixtures: any[] = [];
            for (let f = b.GetFixtureList(); this.box2d.getPointer(f) !== 0; f = f.GetNext()) {
                const shape = f.GetShape();
                const type = shape.GetType();
                if (type === 0) { // Circle
                    const circle = this.box2d.castObject(shape, this.box2d.b2CircleShape);
                    fixtures.push({
                        shape: ShapeType.CIRCLE,
                        radius: circle.get_m_radius(),
                        localX: circle.get_m_p().get_x(),
                        localY: -circle.get_m_p().get_y(),
                        localR: 0
                    });
                } else if (type === 2) { // Polygon
                    const poly = this.box2d.castObject(shape, this.box2d.b2PolygonShape);
                    const points: {x: number, y: number}[] = [];
                    const count = poly.get_m_count();
                    for (let i = 0; i < count; i++) {
                        const v = poly.get_m_vertices(i);
                        points.push({ x: v.get_x(), y: -v.get_y() });
                    }
                    fixtures.push({
                        shape: ShapeType.POLYGON,
                        points,
                        localX: 0, localY: 0, localR: 0
                    });
                }
            }
            const pos = b.GetPosition();
            bodies.push({
                id: this.box2d.getPointer(b),
                x: pos.get_x(),
                y: -pos.get_y(),
                r: -b.GetAngle(),
                isSleeping: !b.IsAwake(),
                fixtures
            });
        }

        const joints: any[] = [];
        for (let j = this.world.GetJointList(); this.box2d.getPointer(j) !== 0; j = j.GetNext()) {
            const rawAnchorA = j.GetAnchorA();
            const anchorA = { x: rawAnchorA.get_x(), y: -rawAnchorA.get_y() };
            const rawAnchorB = j.GetAnchorB();
            const anchorB = { x: rawAnchorB.get_x(), y: -rawAnchorB.get_y() };
            
            joints.push({
                id: this.box2d.getPointer(j),
                type: JointType.DISTANCE,
                bodyAId: this.box2d.getPointer(j.GetBodyA()),
                bodyBId: this.box2d.getPointer(j.GetBodyB()),
                anchorA,
                anchorB
            });
        }
        
        return { bodies, joints, interpolationAlpha: 1.0 };
    }

    clear(): void {
        if (this.world) {
            for (let b = this.world.GetBodyList(); this.box2d.getPointer(b) !== 0; ) {
                const next = b.GetNext();
                this.world.DestroyBody(b);
                b = next;
            }
        }
        this.bodies.clear();
    }

    createBox(id: number | string, x: number, y: number, w: number, h: number, isStatic: boolean, options: any = {}): void {
        const bd = new this.box2d.b2BodyDef();
        bd.set_type(isStatic ? this.box2d.b2_staticBody : this.box2d.b2_dynamicBody);
        bd.set_position(new this.box2d.b2Vec2(x, -y));
        const body = this.world.CreateBody(bd);
        
        const shape = new this.box2d.b2PolygonShape();
        shape.SetAsBox(w / 2, h / 2);
        const fixture = body.CreateFixture(shape, isStatic ? 0 : (options.mass || 1.0));
        fixture.SetFriction(options.sFriction ?? 0.5);
        fixture.SetRestitution(options.restitution ?? 0);
        this.bodies.set(id, body);
    }

    createCircle(id: number | string, x: number, y: number, radius: number, isStatic: boolean, options: any = {}): void {
        const bd = new this.box2d.b2BodyDef();
        bd.set_type(isStatic ? this.box2d.b2_staticBody : this.box2d.b2_dynamicBody);
        bd.set_position(new this.box2d.b2Vec2(x, -y));
        const body = this.world.CreateBody(bd);

        const shape = new this.box2d.b2CircleShape();
        shape.set_m_radius(radius);
        const fixture = body.CreateFixture(shape, isStatic ? 0 : (options.mass || 1.0));
        fixture.SetFriction(options.sFriction ?? 0.5);
        fixture.SetRestitution(options.restitution ?? 0);
        this.bodies.set(id, body);
    }

    createDistanceJoint(id: number | string, bodyAId: number | string, bodyBId: number | string, options: any = {}): void {
        const bodyA = this.bodies.get(bodyAId);
        const bodyB = this.bodies.get(bodyBId);
        if (!bodyA || !bodyB) return;

        const jd = new this.box2d.b2DistanceJointDef();
        
        // Use Initialize to set up anchors and length automatically based on world positions
        const vA = new this.box2d.b2Vec2(options.anchorA?.x || 0, -(options.anchorA?.y || 0));
        const vB = new this.box2d.b2Vec2(options.anchorB?.x || 0, -(options.anchorB?.y || 0));
        
        // Capture world points into distinct objects immediately to avoid shared buffer issues in some WASM versions
        const rawWorldA = bodyA.GetWorldPoint(vA);
        const worldA = { x: rawWorldA.get_x(), y: rawWorldA.get_y() };
        
        const rawWorldB = bodyB.GetWorldPoint(vB);
        const worldB = { x: rawWorldB.get_x(), y: rawWorldB.get_y() };
        
        const vWorldA = new this.box2d.b2Vec2(worldA.x, worldA.y);
        const vWorldB = new this.box2d.b2Vec2(worldB.x, worldB.y);
        
        jd.Initialize(bodyA, bodyB, vWorldA, vWorldB);
        
        if (options.length !== undefined) {
            jd.set_length(options.length);
        }
        
        // Ensure the joint is rigid
        if (jd.set_stiffness) jd.set_stiffness(0); 
        if (jd.set_damping) jd.set_damping(0);
        if (jd.set_frequencyHz) jd.set_frequencyHz(0);
        if (jd.set_dampingRatio) jd.set_dampingRatio(0);

        try {
            this.world.CreateJoint(jd);
        } catch (e) {
            console.error('Failed to create Box2D joint:', e);
        }

        this.box2d.destroy(vA);
        this.box2d.destroy(vB);
        this.box2d.destroy(vWorldA);
        this.box2d.destroy(vWorldB);
        try { this.box2d.destroy(rawWorldA); } catch(e) {}
        try { this.box2d.destroy(rawWorldB); } catch(e) {}
        this.box2d.destroy(jd);
    }

    getBodyCount(): number {
        return this.world.GetBodyCount();
    }
}
