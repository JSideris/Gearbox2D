import { PhysicsEngineAdapter, DebugFrame, ShapeType, JointType } from "../../physics-protocol";

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
				if (type === 0) {
					// Circle
					const circle = this.box2d.castObject(shape, this.box2d.b2CircleShape);
					fixtures.push({
						shape: ShapeType.CIRCLE,
						radius: circle.get_m_radius(),
						localX: circle.get_m_p().get_x(),
						localY: -circle.get_m_p().get_y(),
						localR: 0,
					});
				} else if (type === 2) {
					// Polygon
					const poly = this.box2d.castObject(shape, this.box2d.b2PolygonShape);
					const points: { x: number; y: number }[] = [];
					const count = poly.get_m_count();
					for (let i = 0; i < count; i++) {
						const v = poly.get_m_vertices(i);
						points.push({ x: v.get_x(), y: -v.get_y() });
					}
					fixtures.push({
						shape: ShapeType.POLYGON,
						points,
						localX: 0,
						localY: 0,
						localR: 0,
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
				fixtures,
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
				anchorB,
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

	createBox(
		id: number | string,
		x: number,
		y: number,
		w: number,
		h: number,
		isStatic: boolean,
		options: any = {},
	): void {
		const bd = new this.box2d.b2BodyDef();
		bd.set_type(isStatic ? this.box2d.b2_staticBody : this.box2d.b2_dynamicBody);
		bd.set_position(new this.box2d.b2Vec2(x, -y));
		if (options.linearDamping !== undefined) bd.set_linearDamping(options.linearDamping);
		if (options.angularDamping !== undefined) bd.set_angularDamping(options.angularDamping);
		if (options.canSleep === false && bd.set_allowSleep) bd.set_allowSleep(false);
		const body = this.world.CreateBody(bd);
		if (options.canSleep === false && body.SetSleepingAllowed) body.SetSleepingAllowed(false);

		if (options.vx !== undefined || options.vy !== undefined) {
			body.SetLinearVelocity(new this.box2d.b2Vec2(options.vx || 0, -(options.vy || 0)));
		}

		const shape = new this.box2d.b2PolygonShape();
		shape.SetAsBox(w / 2, h / 2);
		const fixture = body.CreateFixture(shape, isStatic ? 0 : options.mass || 1.0);
		fixture.SetFriction(options.sFriction ?? 0.5);
		fixture.SetRestitution(options.restitution ?? 0);
		this.bodies.set(id, body);
	}

	createCircle(
		id: number | string,
		x: number,
		y: number,
		radius: number,
		isStatic: boolean,
		options: any = {},
	): void {
		const bd = new this.box2d.b2BodyDef();
		bd.set_type(isStatic ? this.box2d.b2_staticBody : this.box2d.b2_dynamicBody);
		bd.set_position(new this.box2d.b2Vec2(x, -y));
		if (options.linearDamping !== undefined) bd.set_linearDamping(options.linearDamping);
		if (options.angularDamping !== undefined) bd.set_angularDamping(options.angularDamping);
		if (options.canSleep === false && bd.set_allowSleep) bd.set_allowSleep(false);
		const body = this.world.CreateBody(bd);
		if (options.canSleep === false && body.SetSleepingAllowed) body.SetSleepingAllowed(false);

		if (options.vx !== undefined || options.vy !== undefined) {
			body.SetLinearVelocity(new this.box2d.b2Vec2(options.vx || 0, -(options.vy || 0)));
		}

		const shape = new this.box2d.b2CircleShape();
		shape.set_m_radius(radius);
		const fixture = body.CreateFixture(shape, isStatic ? 0 : options.mass || 1.0);
		fixture.SetFriction(options.sFriction ?? 0.5);
		fixture.SetRestitution(options.restitution ?? 0);
		this.bodies.set(id, body);
	}

	createDistanceJoint(
		id: number | string,
		bodyAId: number | string,
		bodyBId: number | string,
		options: any = {},
	): void {
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
			console.error("Failed to create Box2D joint:", e);
		}

		this.box2d.destroy(vA);
		this.box2d.destroy(vB);
		this.box2d.destroy(vWorldA);
		this.box2d.destroy(vWorldB);
		try {
			this.box2d.destroy(rawWorldA);
		} catch (e) {}
		try {
			this.box2d.destroy(rawWorldB);
		} catch (e) {}
		this.box2d.destroy(jd);
	}

	createHingeJoint(id: number | string, bodyAId: number | string, bodyBId: number | string, options: any = {}): void {
		const bodyA = this.bodies.get(bodyAId);
		const bodyB = this.bodies.get(bodyBId);
		if (!bodyA || !bodyB) return;

		const jd = new this.box2d.b2RevoluteJointDef();
		if (options.worldAnchor) {
			const vAnchor = new this.box2d.b2Vec2(options.worldAnchor.x, -options.worldAnchor.y);
			jd.Initialize(bodyA, bodyB, vAnchor);
			this.box2d.destroy(vAnchor);
		} else {
			if (options.localAnchorA)
				jd.set_localAnchorA(new this.box2d.b2Vec2(options.localAnchorA.x, -options.localAnchorA.y));
			if (options.localAnchorB)
				jd.set_localAnchorB(new this.box2d.b2Vec2(options.localAnchorB.x, -options.localAnchorB.y));
		}

		try {
			this.world.CreateJoint(jd);
		} catch (e) {
			console.error("Failed to create Box2D hinge joint:", e);
		}
		this.box2d.destroy(jd);
	}

	createPoint(id: number | string, x: number, y: number, isStatic: boolean, options: any = {}): void {
		this.createCircle(id, x, y, 0.05, isStatic, options);
	}

	getBodyCount(): number {
		return this.world.GetBodyCount();
	}

	getVelocity(id: number | string): { x: number; y: number } {
		const body = this.bodies.get(id);
		if (!body) return { x: 0, y: 0 };
		const v = body.GetLinearVelocity();
		return { x: v.get_x(), y: -v.get_y() };
	}

	getPosition(id: number | string): { x: number; y: number } {
		const body = this.bodies.get(id);
		if (!body) return { x: 0, y: 0 };
		const p = body.GetPosition();
		return { x: p.get_x(), y: -p.get_y() };
	}

	setGravity(x: number, y: number): void {
		if (this.world) {
			this.world.SetGravity(new this.box2d.b2Vec2(x, -y));
		}
	}
}
