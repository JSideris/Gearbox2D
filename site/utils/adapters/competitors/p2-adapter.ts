import { PhysicsEngineAdapter, DebugFrame, ShapeType, JointType } from '../../physics-protocol';

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
            velocity: [options.vx || 0, -(options.vy || 0)],
            type: isStatic ? this.p2.Body.STATIC : this.p2.Body.DYNAMIC,
            damping: options.linearDamping !== undefined ? options.linearDamping : 0.1,
            angularDamping: options.angularDamping !== undefined ? options.angularDamping : 0.1
        });
        body.addShape(new this.p2.Box({ width: w, height: h }));
        this.world.addBody(body);
        this.bodies.set(id, body);
        this.applyRestitution(options.restitution, options.sFriction);
    }

    createCircle(id: number | string, x: number, y: number, radius: number, isStatic: boolean, options: any = {}): void {
        const body = new this.p2.Body({
            mass: isStatic ? 0 : (options.mass || 1),
            position: [x, -y],
            velocity: [options.vx || 0, -(options.vy || 0)],
            type: isStatic ? this.p2.Body.STATIC : this.p2.Body.DYNAMIC,
            damping: options.linearDamping !== undefined ? options.linearDamping : 0.1,
            angularDamping: options.angularDamping !== undefined ? options.angularDamping : 0.1
        });
        body.addShape(new this.p2.Circle({ radius }));
        this.world.addBody(body);
        this.bodies.set(id, body);
        this.applyRestitution(options.restitution, options.sFriction);
    }

    private applyRestitution(restitution?: number, friction?: number): void {
        if (restitution !== undefined) {
            // P2 uses contact materials for bounciness. For simplicity in this adapter,
            // we update the default contact material.
            this.world.defaultContactMaterial.restitution = Math.max(
                this.world.defaultContactMaterial.restitution, 
                restitution
            );
        }
        if (friction !== undefined) {
            this.world.defaultContactMaterial.friction = friction;
        }
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

    createPoint(id: number | string, x: number, y: number, isStatic: boolean, options: any = {}): void {
        this.createCircle(id, x, y, 0.05, isStatic, options);
    }

    getBodyCount(): number {
        return this.world.bodies.length;
    }

    getVelocity(id: number | string): { x: number, y: number } {
        const body = this.bodies.get(id);
        return body ? { x: body.velocity[0], y: -body.velocity[1] } : { x: 0, y: 0 };
    }

    getPosition(id: number | string): { x: number, y: number } {
        const body = this.bodies.get(id);
        return body ? { x: body.position[0], y: -body.position[1] } : { x: 0, y: 0 };
    }

    setGravity(x: number, y: number): void {
        if (this.world) {
            this.world.gravity = [x, -y];
        }
    }
}
