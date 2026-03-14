import { PhysicsEngineAdapter, DebugFrame, ShapeType, JointType } from '../physics-protocol.ts';

// --- Matter.js Adapter ---
export class MatterAdapter implements PhysicsEngineAdapter {
    private engine: any = null;
    private world: any = null;
    private Matter: any = (window as any).Matter;
    private readonly SCALE = 100;

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

        return { bodies, joints: [], interpolationAlpha: 1.0 };
    }

    clear(): void {
        this.Matter.Composite.clear(this.world, false);
    }

    createBox(id: number | string, x: number, y: number, w: number, h: number, isStatic: boolean, options: any = {}): void {
        const body = this.Matter.Bodies.rectangle(
            x * this.SCALE, 
            y * this.SCALE, 
            w * this.SCALE, 
            h * this.SCALE, 
            { isStatic, ...options }
        );
        this.Matter.Composite.add(this.world, body);
    }

    createCircle(id: number | string, x: number, y: number, radius: number, isStatic: boolean, options: any = {}): void {
        const body = this.Matter.Bodies.circle(
            x * this.SCALE, 
            y * this.SCALE, 
            radius * this.SCALE, 
            { isStatic, ...options }
        );
        this.Matter.Composite.add(this.world, body);
    }

    getBodyCount(): number {
        return this.Matter.Composite.allBodies(this.world).length;
    }
}

// --- P2.js Adapter ---
export class P2Adapter implements PhysicsEngineAdapter {
    private world: any = null;
    private p2: any = (window as any).p2;

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

        return { bodies, joints: [], interpolationAlpha: 1.0 };
    }

    clear(): void {
        this.world.clear();
    }

    createBox(id: number | string, x: number, y: number, w: number, h: number, isStatic: boolean, options: any = {}): void {
        const body = new this.p2.Body({
            mass: isStatic ? 0 : (options.mass || 1),
            position: [x, -y],
            type: isStatic ? this.p2.Body.STATIC : this.p2.Body.DYNAMIC
        });
        body.addShape(new this.p2.Box({ width: w, height: h }));
        this.world.addBody(body);
    }

    createCircle(id: number | string, x: number, y: number, radius: number, isStatic: boolean, options: any = {}): void {
        const body = new this.p2.Body({
            mass: isStatic ? 0 : (options.mass || 1),
            position: [x, -y],
            type: isStatic ? this.p2.Body.STATIC : this.p2.Body.DYNAMIC
        });
        body.addShape(new this.p2.Circle({ radius }));
        this.world.addBody(body);
    }

    getBodyCount(): number {
        return this.world.bodies.length;
    }
}

// --- Box2D-WASM Adapter ---
export class Box2DAdapter implements PhysicsEngineAdapter {
    private world: any = null;
    private box2d: any = null;

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
        return { bodies, joints: [], interpolationAlpha: 1.0 };
    }

    clear(): void {
        if (this.world) {
            for (let b = this.world.GetBodyList(); this.box2d.getPointer(b) !== 0; ) {
                const next = b.GetNext();
                this.world.DestroyBody(b);
                b = next;
            }
        }
    }

    createBox(id: number | string, x: number, y: number, w: number, h: number, isStatic: boolean, options: any = {}): void {
        const bd = new this.box2d.b2BodyDef();
        bd.set_type(isStatic ? this.box2d.b2_staticBody : this.box2d.b2_dynamicBody);
        bd.set_position(new this.box2d.b2Vec2(x, -y));
        const body = this.world.CreateBody(bd);
        
        const shape = new this.box2d.b2PolygonShape();
        shape.SetAsBox(w / 2, h / 2);
        body.CreateFixture(shape, isStatic ? 0 : (options.mass || 1.0));
    }

    createCircle(id: number | string, x: number, y: number, radius: number, isStatic: boolean, options: any = {}): void {
        const bd = new this.box2d.b2BodyDef();
        bd.set_type(isStatic ? this.box2d.b2_staticBody : this.box2d.b2_dynamicBody);
        bd.set_position(new this.box2d.b2Vec2(x, -y));
        const body = this.world.CreateBody(bd);

        const shape = new this.box2d.b2CircleShape();
        shape.set_m_radius(radius);
        body.CreateFixture(shape, isStatic ? 0 : (options.mass || 1.0));
    }

    getBodyCount(): number {
        return this.world.GetBodyCount();
    }
}
