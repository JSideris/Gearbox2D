import {
	World,
	Body,
	Fixture,
	HingeJoint,
	DistanceJoint,
	SpringJoint,
	GearJoint,
	Joint,
	SHAPES,
	IS_SLEEPING,
	HAS_PHYSICAL_COLLISION,
	HAS_AABB_COLLISION,
	JOINT_TYPES,
} from "./gearbox.js";

const ANIMSCALE = 100;
const MAX_VECTOR_MAGNITUDE = 3.0;
const MAX_ANGULAR_ARC = Math.PI;

export type LabelPosition = "left" | "right" | "above" | "below" | "on-top";

export interface DebugLabel {
	text: string;
	x?: number;
	y?: number;
	objectId?: number;
	position?: LabelPosition;
	offset?: number;
	fontSize?: string;
	color?: string;
}

export class DebugGraphics {
	debugWorld: World | null = null;
	debugFrameTime: number = 0;
	animFrame: number | null = 0;
	debugFps: number = 0;
	ctx: CanvasRenderingContext2D | null = null;
	canvas: HTMLCanvasElement | null = null;
	zoom: number = 1.0;
	offsetX: number = 0;
	offsetY: number = 0;
	private lastTick: number = Date.now();
	showForceVectors: boolean = true;
	showImpulseVectors: boolean = true;
	showAabbs: boolean = true;
	showJoints: boolean = true;
	interpolationEnabled: boolean = true;

	private labels: DebugLabel[] = [];
	private resizeObserver: ResizeObserver | null = null;
	defaultLabelFontSize: string = "12px Arial";
	defaultLabelColor: string = "#f1f5f9";
	defaultLabelOffset: number = 5;

	constructor() {}

	addLabel(label: DebugLabel) {
		this.labels.push(label);
	}

	clearLabels() {
		this.labels = [];
	}

	removeObjectLabels(objectId: number) {
		this.labels = this.labels.filter((l) => l.objectId !== objectId);
	}

	enableDebugGraphics(canvas: HTMLCanvasElement, world: World) {
		this.disableDebugGraphics();
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		this.debugWorld = world;
		this.syncSize();
		this.resizeObserver = new ResizeObserver(() => this.syncSize());
		this.resizeObserver.observe(canvas);
		this.animFrame = requestAnimationFrame(() => this.animate());
	}

	disableDebugGraphics() {
		this.ctx = null;
		this.debugWorld = null;
		if (this.animFrame) cancelAnimationFrame(this.animFrame);
		this.animFrame = null;
		if (this.resizeObserver) {
			this.resizeObserver.disconnect();
			this.resizeObserver = null;
		}
	}

	syncSize() {
		if (!this.canvas) return;
		const width = this.canvas.clientWidth;
		const height = this.canvas.clientHeight;
		if (width > 0 && height > 0 && (this.canvas.width !== width || this.canvas.height !== height)) {
			const oldWidth = this.canvas.width;
			const oldHeight = this.canvas.height;
			if (oldWidth > 0 && oldHeight > 0) {
				const centerX = (oldWidth / 2 - this.offsetX) / (ANIMSCALE * this.zoom);
				const centerY = (oldHeight / 2 - this.offsetY) / (ANIMSCALE * this.zoom);
				this.canvas.width = width;
				this.canvas.height = height;
				this.offsetX = width / 2 - centerX * ANIMSCALE * this.zoom;
				this.offsetY = height / 2 - centerY * ANIMSCALE * this.zoom;
			} else {
				this.canvas.width = width;
				this.canvas.height = height;
			}
		}
	}

	centerCamera(worldX: number, worldY: number) {
		if (!this.canvas) return;
		this.offsetX = this.canvas.width / 2 - worldX * ANIMSCALE * this.zoom;
		this.offsetY = this.canvas.height / 2 - worldY * ANIMSCALE * this.zoom;
	}

	private getRenderX(body: Body): number {
		if (!this.interpolationEnabled || !this.debugWorld || this.debugWorld.interpolationAlpha >= 1.0) return body.x;
		const alpha = this.debugWorld.interpolationAlpha;
		return body.x * alpha + body.prevX * (1 - alpha);
	}

	private getRenderY(body: Body): number {
		if (!this.interpolationEnabled || !this.debugWorld || this.debugWorld.interpolationAlpha >= 1.0) return body.y;
		const alpha = this.debugWorld.interpolationAlpha;
		return body.y * alpha + body.prevY * (1 - alpha);
	}

	private getRenderR(body: Body): number {
		if (!this.interpolationEnabled || !this.debugWorld || this.debugWorld.interpolationAlpha >= 1.0) return body.r;
		const alpha = this.debugWorld.interpolationAlpha;
		let r1 = body.prevR;
		let r2 = body.r;
		let diff = r2 - r1;
		if (diff > Math.PI) r1 += 2 * Math.PI;
		else if (diff < -Math.PI) r1 -= 2 * Math.PI;
		return r2 * alpha + r1 * (1 - alpha);
	}

	private drawFixtureAabb(fixture: Fixture) {
		if (!this.ctx) return;

		const isSleeping = (fixture.body.flags & IS_SLEEPING) !== 0;
		const hasPhysical = (fixture.flags & HAS_PHYSICAL_COLLISION) !== 0;
		const hasAabb = (fixture.flags & HAS_AABB_COLLISION) !== 0;

		let x0 = fixture.ax1 * ANIMSCALE;
		let y0 = fixture.ay1 * ANIMSCALE;
		let x1 = fixture.ax2 * ANIMSCALE;
		let y1 = fixture.ay2 * ANIMSCALE;

		this.ctx.save();
		this.ctx.beginPath();
		this.ctx.rect(x0, y0, x1 - x0, y1 - y0);

		if (isSleeping) {
			this.ctx.strokeStyle = "rgba(58, 58, 58, 0.7)";
			this.ctx.fillStyle = "rgba(101, 101, 101, 0.1)";
			this.ctx.fill();
		} else if (hasPhysical) {
			this.ctx.strokeStyle = "rgba(255,100,100,0.7)";
			this.ctx.fillStyle = "rgba(255,100,100,0.1)";
			this.ctx.fill();
		} else if (hasAabb) {
			this.ctx.strokeStyle = "rgba(100,255,100,0.7)";
			this.ctx.fillStyle = "rgba(100,255,100,0.1)";
			this.ctx.fill();
		} else {
			this.ctx.strokeStyle = "rgba(150, 150, 150, 0.5)";
		}

		this.ctx.stroke();
		this.ctx.restore();
	}

	private drawFixtureShape(fixture: Fixture) {
		if (!this.ctx) return;
		const body = fixture.body;

		const rx = this.getRenderX(body) * ANIMSCALE;
		const ry = this.getRenderY(body) * ANIMSCALE;
		const rr = this.getRenderR(body);

		const cos = Math.cos(rr);
		const sin = Math.sin(rr);
		const lx = fixture.localX * ANIMSCALE;
		const ly = fixture.localY * ANIMSCALE;

		const fx = rx + (lx * cos - ly * sin);
		const fy = ry + (lx * sin + ly * cos);
		const fr = rr + fixture.localR;

		this.ctx.save();

		const isSleeping = (body.flags & IS_SLEEPING) !== 0;
		if (isSleeping) {
			this.ctx.globalAlpha = 0.5;
			this.ctx.setLineDash([2, 2]);
		}

		this.ctx.strokeStyle = body.color || "#f1f5f9";
		this.ctx.lineWidth = 2;
		this.ctx.beginPath();

		switch (fixture.shape) {
			case SHAPES.POINT:
				this.ctx.arc(fx, fy, 2, 0, 2 * Math.PI);
				break;
			case SHAPES.CIRCLE:
				this.ctx.arc(fx, fy, fixture.radius * ANIMSCALE, 0, 2 * Math.PI);
				this.ctx.moveTo(fx, fy);
				this.ctx.lineTo(
					fx + Math.cos(fr) * fixture.radius * ANIMSCALE,
					fy + Math.sin(fr) * fixture.radius * ANIMSCALE,
				);
				break;
			case SHAPES.AABB:
				const aw = fixture.width * ANIMSCALE;
				const ah = fixture.height * ANIMSCALE;
				this.ctx.rect(fx - aw / 2, fy - ah / 2, aw, ah);
				this.ctx.stroke();

				this.ctx.beginPath();
				this.ctx.setLineDash([2, 10]);
				this.ctx.rect(fx - aw / 2 + 2, fy - ah / 2 + 2, aw - 4, ah - 4);
				this.ctx.stroke();
				// We're inside a switch, so we'll stroke again at the end of the function.
				// Reset path for the final stroke so it doesn't double-draw.
				this.ctx.beginPath();
				break;
			case SHAPES.BOX:
				const w = fixture.width * ANIMSCALE;
				const h = fixture.height * ANIMSCALE;
				this.ctx.translate(fx, fy);
				this.ctx.rotate(fr);
				this.ctx.rect(-w / 2, -h / 2, w, h);
				break;
			case SHAPES.CAPSULE:
				const cr = fixture.radius * ANIMSCALE;
				const ch = fixture.height * ANIMSCALE;
				const halfL = Math.max(0, ch / 2 - cr);
				this.ctx.translate(fx, fy);
				this.ctx.rotate(fr);

				this.ctx.arc(0, -halfL, cr, Math.PI, 0);
				this.ctx.lineTo(cr, halfL);
				this.ctx.arc(0, halfL, cr, 0, Math.PI);
				this.ctx.lineTo(-cr, -halfL);
				this.ctx.closePath();

				this.ctx.moveTo(0, -halfL);
				this.ctx.lineTo(0, halfL);
				break;
			case SHAPES.POLYGON:
				const pieces = fixture.debugVertices;
				this.ctx.translate(fx, fy);
				this.ctx.rotate(fr);
				for (const vertices of pieces) {
					if (vertices.length > 0) {
						this.ctx.beginPath();
						this.ctx.moveTo(vertices[0].x * ANIMSCALE, vertices[0].y * ANIMSCALE);
						for (let i = 1; i < vertices.length; i++) {
							this.ctx.lineTo(vertices[i].x * ANIMSCALE, vertices[i].y * ANIMSCALE);
						}
						this.ctx.closePath();
						this.ctx.stroke();
					}
				}
				// Return early so we don't double-stroke at the end
				this.ctx.restore();
				return;
			case SHAPES.BOX:
		}
		this.ctx.stroke();
		this.ctx.restore();
	}

	private drawVectors(body: Body) {
		if (!this.ctx) return;
		const rx = this.getRenderX(body) * ANIMSCALE;
		const ry = this.getRenderY(body) * ANIMSCALE;

		this.ctx.save();
		this.ctx.lineWidth = 2;

		if (this.showForceVectors) {
			let fx = body.fx + body.nfx,
				fy = body.fy + body.nfy;
			let mag = Math.sqrt(fx * fx + fy * fy);
			if (mag > 0.001) {
				if (mag > MAX_VECTOR_MAGNITUDE) {
					fx = (fx / mag) * MAX_VECTOR_MAGNITUDE;
					fy = (fy / mag) * MAX_VECTOR_MAGNITUDE;
					mag = MAX_VECTOR_MAGNITUDE;
				}
				this.ctx.strokeStyle = "#ff4444";
				this.ctx.fillStyle = "#ff4444";
				const ex = rx + (fx * ANIMSCALE) / 3;
				const ey = ry + (fy * ANIMSCALE) / 3;
				this.ctx.beginPath();
				this.ctx.moveTo(rx, ry);
				this.ctx.lineTo(ex, ey);
				this.ctx.stroke();
				this.drawArrowhead(rx, ry, ex, ey, 8);
			}
		}

		if (this.showImpulseVectors) {
			let ix = body.ix + body.nix,
				iy = body.iy + body.niy;
			let mag = Math.sqrt(ix * ix + iy * iy);
			if (mag > 0.001) {
				if (mag > MAX_VECTOR_MAGNITUDE) {
					ix = (ix / mag) * MAX_VECTOR_MAGNITUDE;
					iy = (iy / mag) * MAX_VECTOR_MAGNITUDE;
					mag = MAX_VECTOR_MAGNITUDE;
				}
				this.ctx.strokeStyle = "#4488ff";
				this.ctx.fillStyle = "#4488ff";
				const ex = rx + ix * 30;
				const ey = ry + iy * 30;
				this.ctx.beginPath();
				this.ctx.moveTo(rx, ry);
				this.ctx.lineTo(ex, ey);
				this.ctx.stroke();
				this.drawArrowhead(rx, ry, ex, ey, 8);
			}

			let ia = body.ia + body.nia;
			if (Math.abs(ia) > 0.001) {
				const torqueMag = Math.min(Math.abs(ia), MAX_ANGULAR_ARC);
				this.ctx.strokeStyle = "#4488ff";
				this.ctx.fillStyle = "#4488ff";
				const radius = 25;
				const startAngle = 0;
				const endAngle = torqueMag * (ia > 0 ? 1 : -1);
				this.ctx.beginPath();
				this.ctx.arc(rx, ry, radius, startAngle, endAngle, ia < 0);
				this.ctx.stroke();

				// Arrowhead for arc
				const ax = rx + Math.cos(endAngle) * radius;
				const ay = ry + Math.sin(endAngle) * radius;
				const tangentAngle = endAngle + (ia > 0 ? Math.PI / 2 : -Math.PI / 2);
				this.drawArrowhead(ax - Math.cos(tangentAngle), ay - Math.sin(tangentAngle), ax, ay, 8);
			}
		}
		this.ctx.restore();
	}

	private drawArrowhead(x1: number, y1: number, x2: number, y2: number, size: number) {
		if (!this.ctx) return;
		const angle = Math.atan2(y2 - y1, x2 - x1);
		this.ctx.beginPath();
		this.ctx.moveTo(x2, y2);
		this.ctx.lineTo(x2 - size * Math.cos(angle - Math.PI / 6), y2 - size * Math.sin(angle - Math.PI / 6));
		this.ctx.lineTo(x2 - size * Math.cos(angle + Math.PI / 6), y2 - size * Math.sin(angle + Math.PI / 6));
		this.ctx.closePath();
		this.ctx.fill();
	}

	private getJointWorldPoint(body: Body, localPoint: { x: number; y: number }) {
		const rx = this.getRenderX(body);
		const ry = this.getRenderY(body);
		const rr = this.getRenderR(body);
		const cos = Math.cos(rr);
		const sin = Math.sin(rr);
		return {
			x: (rx + (localPoint.x * cos - localPoint.y * sin)) * ANIMSCALE,
			y: (ry + (localPoint.x * sin + localPoint.y * cos)) * ANIMSCALE,
		};
	}

	private drawJoint(joint: Joint) {
		if (!this.ctx) return;
		this.ctx.save();
		this.ctx.lineWidth = 1;

		let type = joint.type;
		if (type === JOINT_TYPES.HINGE) {
			const hinge = joint as HingeJoint;
			const pA = this.getJointWorldPoint(hinge.bodyA, hinge.localAnchorA);
			const pB = this.getJointWorldPoint(hinge.bodyB, hinge.localAnchorB);

			const rxA = this.getRenderX(hinge.bodyA) * ANIMSCALE;
			const ryA = this.getRenderY(hinge.bodyA) * ANIMSCALE;
			const rxB = this.getRenderX(hinge.bodyB) * ANIMSCALE;
			const ryB = this.getRenderY(hinge.bodyB) * ANIMSCALE;

			// Draw dotted lines from body centers to anchors
			this.ctx.strokeStyle = "rgba(74, 222, 128, 0.4)"; // faint green
			this.ctx.setLineDash([2, 2]);
			this.ctx.beginPath();
			this.ctx.moveTo(rxA, ryA);
			this.ctx.lineTo(pA.x, pA.y);
			this.ctx.moveTo(rxB, ryB);
			this.ctx.lineTo(pB.x, pB.y);
			this.ctx.stroke();

			// Draw separation line if anchors diverge
			const dx = pB.x - pA.x;
			const dy = pB.y - pA.y;
			if (dx * dx + dy * dy > 0.1) {
				this.ctx.beginPath();
				this.ctx.moveTo(pA.x, pA.y);
				this.ctx.lineTo(pB.x, pB.y);
				this.ctx.stroke();
			}
			this.ctx.setLineDash([]);

			this.ctx.strokeStyle = "#4ade80"; // green-400
			// Draw small circles at both anchor points
			this.ctx.beginPath();
			this.ctx.arc(pA.x, pA.y, 3, 0, 2 * Math.PI);
			this.ctx.stroke();
			this.ctx.beginPath();
			this.ctx.arc(pB.x, pB.y, 3, 0, 2 * Math.PI);
			this.ctx.stroke();
		} else if (type === JOINT_TYPES.DISTANCE || type === JOINT_TYPES.SPRING) {
			const dj = joint as DistanceJoint | SpringJoint;
			const pA = this.getJointWorldPoint(dj.bodyA, dj.localAnchorA);
			const pB = this.getJointWorldPoint(dj.bodyB, dj.localAnchorB);

			const rxA = this.getRenderX(dj.bodyA) * ANIMSCALE;
			const ryA = this.getRenderY(dj.bodyA) * ANIMSCALE;
			const rxB = this.getRenderX(dj.bodyB) * ANIMSCALE;
			const ryB = this.getRenderY(dj.bodyB) * ANIMSCALE;

			// Draw dotted lines from body centers to anchors
			this.ctx.strokeStyle = type === JOINT_TYPES.SPRING ? "rgba(244, 114, 182, 0.4)" : "rgba(96, 165, 250, 0.4)";
			this.ctx.setLineDash([2, 2]);
			this.ctx.beginPath();
			this.ctx.moveTo(rxA, ryA);
			this.ctx.lineTo(pA.x, pA.y);
			this.ctx.moveTo(rxB, ryB);
			this.ctx.lineTo(pB.x, pB.y);
			this.ctx.stroke();
			this.ctx.setLineDash([]);

			this.ctx.strokeStyle = type === JOINT_TYPES.SPRING ? "#f472b6" : "#60a5fa"; // pink-400 : blue-400
			this.ctx.beginPath();
			if (type === JOINT_TYPES.SPRING) {
				this.drawSpringLine(pA, pB);
			} else {
				this.ctx.moveTo(pA.x, pA.y);
				this.ctx.lineTo(pB.x, pB.y);
			}
			this.ctx.stroke();
		} else if (type === JOINT_TYPES.GEAR) {
			const gear = joint as GearJoint;
			// Visualize gear connection as a dashed line between the two hinge centers
			const p1 = this.getJointWorldPoint(gear.joint1.bodyA, gear.joint1.localAnchorA);
			const p2 = this.getJointWorldPoint(gear.joint2.bodyA, gear.joint2.localAnchorA);

			this.ctx.strokeStyle = "#fbbf24"; // amber-400
			this.ctx.setLineDash([5, 5]);
			this.ctx.beginPath();
			this.ctx.moveTo(p1.x, p1.y);
			this.ctx.lineTo(p2.x, p2.y);
			this.ctx.stroke();
			this.ctx.setLineDash([]);

			// Draw gear icons at the hinge points using interpolated rotation
			const r1 = this.getRenderR(gear.joint1.bodyB);
			const r2 = this.getRenderR(gear.joint2.bodyB);
			this.drawGearIcon(p1, r1, 8);
			this.drawGearIcon(p2, r2, 8);
		}
		this.ctx.restore();
	}

	private drawGearIcon(pos: { x: number; y: number }, rotation: number, teeth: number) {
		if (!this.ctx) return;
		const radius = 16;
		const toothLen = 6;
		this.ctx.save();
		this.ctx.translate(pos.x, pos.y);
		this.ctx.rotate(rotation);

		this.ctx.lineWidth = 2;
		this.ctx.beginPath();
		this.ctx.arc(0, 0, radius - toothLen / 2, 0, 2 * Math.PI);
		this.ctx.stroke();

		for (let i = 0; i < teeth; i++) {
			const angle = (i / teeth) * Math.PI * 2;
			const x1 = Math.cos(angle) * (radius - toothLen);
			const y1 = Math.sin(angle) * (radius - toothLen);
			const x2 = Math.cos(angle) * radius;
			const y2 = Math.sin(angle) * radius;
			this.ctx.beginPath();
			this.ctx.moveTo(x1, y1);
			this.ctx.lineTo(x2, y2);
			this.ctx.stroke();
		}
		this.ctx.lineWidth = 1;
		this.ctx.restore();
	}

	private drawSpringLine(p1: { x: number; y: number }, p2: { x: number; y: number }) {
		const count = 12;
		const dx = p2.x - p1.x,
			dy = p2.y - p1.y;
		const len = Math.sqrt(dx * dx + dy * dy);
		if (len < 1e-6) return;
		const nx = (-dy / len) * 5,
			ny = (dx / len) * 5;

		this.ctx!.moveTo(p1.x, p1.y);
		for (let i = 1; i < count; i++) {
			const t = i / count;
			const offset = i % 2 === 0 ? 1 : -1;
			this.ctx!.lineTo(p1.x + dx * t + nx * offset, p1.y + dy * t + ny * offset);
		}
		this.ctx!.lineTo(p2.x, p2.y);
	}

	private animate() {
		if (!this.ctx || !this.canvas || !this.debugWorld) return;
		let now = Date.now();
		this.debugFrameTime = now - this.lastTick;
		this.lastTick = now;
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.save();
		this.ctx.translate(this.offsetX, this.offsetY);
		this.ctx.scale(this.zoom, this.zoom);

		const bodyCount = this.debugWorld.getBodyCount();
		const canShowAabbs = this.showAabbs && bodyCount < 100;

		this.debugWorld.iterateBodies((body: Body) => {
			for (const fixture of body.fixtures) {
				if (canShowAabbs) this.drawFixtureAabb(fixture);
				this.drawFixtureShape(fixture);
			}
			if (this.debugWorld!.getBodyCount() <= 100) {
				this.drawVectors(body);
			}
		});

		if (this.showJoints) {
			for (const id in this.debugWorld.jointsById) {
				this.drawJoint(this.debugWorld.jointsById[id]);
			}
		}

		this.ctx.restore();
		this.drawLabels();
		this.animFrame = requestAnimationFrame(() => this.animate());
	}

	private drawLabels() {
		if (!this.ctx || !this.debugWorld) return;
		this.ctx.save();
		this.ctx.translate(this.offsetX, this.offsetY);
		this.ctx.scale(this.zoom, this.zoom);
		this.labels = this.labels.filter((label) => {
			if (label.objectId !== undefined) {
				const body = this.debugWorld!.getBodyById(label.objectId);
				if (!body) return false;
			}
			return true;
		});
		for (const label of this.labels) {
			let x = 0,
				y = 0,
				width = 0,
				height = 0;
			if (label.objectId !== undefined) {
				const body = this.debugWorld.getBodyById(label.objectId);
				if (body) {
					x = this.getRenderX(body) * ANIMSCALE;
					y = this.getRenderY(body) * ANIMSCALE;
					if (body.fixtures.length > 0) {
						const f = body.fixtures[0];
						if (f.shape === SHAPES.CIRCLE) {
							width = f.radius * 2 * ANIMSCALE;
							height = f.radius * 2 * ANIMSCALE;
						} else {
							width = f.width * ANIMSCALE;
							height = f.height * ANIMSCALE;
						}
					}
				}
			} else {
				x = (label.x || 0) * ANIMSCALE;
				y = (label.y || 0) * ANIMSCALE;
			}
			this.ctx.font = label.fontSize || this.defaultLabelFontSize;
			this.ctx.fillStyle = label.color || this.defaultLabelColor;
			this.ctx.textAlign = "center";
			this.ctx.textBaseline = "middle";
			const offset = label.offset !== undefined ? label.offset : this.defaultLabelOffset;
			const pos = label.position || "right";
			let lx = x,
				ly = y;
			const metrics = this.ctx.measureText(label.text);
			const textWidth = metrics.width,
				textHeight = parseInt(this.ctx.font) || 12;
			switch (pos) {
				case "left":
					lx = x - width / 2 - textWidth / 2 - offset;
					break;
				case "right":
					lx = x + width / 2 + textWidth / 2 + offset;
					break;
				case "above":
					ly = y - height / 2 - textHeight / 2 - offset;
					break;
				case "below":
					ly = ly + height / 2 + textHeight / 2 + offset;
					break;
			}
			this.ctx.fillText(label.text, lx, ly);
		}
		this.ctx.restore();
	}
}
