
import { World, PhysicalObject, HingeJoint, DistanceJoint, SpringJoint, GearJoint, SHAPES, IS_ASLEEP, HAS_PHYSICAL_COLLISION, HAS_AABB_COLLISION } from './gb2d.js';

const ANIMSCALE = 100;
const MAX_VECTOR_MAGNITUDE = 3.0; // Approximately 3cm when scaled
const MAX_ANGULAR_ARC = Math.PI;

export type LabelPosition = 'left' | 'right' | 'above' | 'below' | 'on-top';

export interface DebugLabel {
    text: string;
    x?: number; // World coordinates
    y?: number; // World coordinates
    objectId?: number; // Pinned to an object
    position?: LabelPosition;
    offset?: number; // Distance from object
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

    private labels: DebugLabel[] = [];
    private resizeObserver: ResizeObserver | null = null;
    defaultLabelFontSize: string = '12px Arial';
    defaultLabelColor: string = '#f1f5f9';
    defaultLabelOffset: number = 5;

    constructor() {}

    addLabel(label: DebugLabel) {
        this.labels.push(label);
    }

    clearLabels() {
        this.labels = [];
    }

    removeObjectLabels(objectId: number) {
        this.labels = this.labels.filter(l => l.objectId !== objectId);
    }

    enableDebugGraphics(canvas: HTMLCanvasElement, world: World) {
        this.disableDebugGraphics();

        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.debugWorld = world;

        // Initialize size immediately
        this.syncSize();

        // Use ResizeObserver to keep canvas buffer size in sync with CSS display size
        this.resizeObserver = new ResizeObserver(() => {
            this.syncSize();
        });
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
            
            // Maintain centering during resize
            if (oldWidth > 0 && oldHeight > 0) {
                const centerX = (oldWidth / 2 - this.offsetX) / (ANIMSCALE * this.zoom);
                const centerY = (oldHeight / 2 - this.offsetY) / (ANIMSCALE * this.zoom);
                
                this.canvas.width = width;
                this.canvas.height = height;
                
                this.offsetX = width / 2 - (centerX * ANIMSCALE * this.zoom);
                this.offsetY = height / 2 - (centerY * ANIMSCALE * this.zoom);
            } else {
                this.canvas.width = width;
                this.canvas.height = height;
            }
        }
    }

    centerCamera(worldX: number, worldY: number) {
        if (!this.canvas) return;
        this.offsetX = (this.canvas.width / 2) - (worldX * ANIMSCALE * this.zoom);
        this.offsetY = (this.canvas.height / 2) - (worldY * ANIMSCALE * this.zoom);
    }

    private drawAabb(obj: PhysicalObject) {
        if (!this.ctx) return;

        let x0 = obj.ax1 * ANIMSCALE;
        let y0 = obj.ay1 * ANIMSCALE;
        let x1 = obj.ax2 * ANIMSCALE;
        let y1 = obj.ay2 * ANIMSCALE;

        if (obj.hasCollisionFlags & IS_ASLEEP) {
            this.ctx.strokeStyle = 'rgba(58, 58, 58, 0.7)';
            this.ctx.fillStyle = 'rgba(101, 101, 101, 0.1)';
        }
        else if (obj.hasCollisionFlags & HAS_PHYSICAL_COLLISION) {
            this.ctx.strokeStyle = 'rgba(255,100,100,0.7)';
            this.ctx.fillStyle = 'rgba(255,100,100,0.1)';
        }
        else if (obj.hasCollisionFlags & HAS_AABB_COLLISION) {
            this.ctx.strokeStyle = 'rgba(100,255,100,0.7)';
            this.ctx.fillStyle = 'rgba(100,255,100,0.1)';
        }
        else {
            this.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        }

        this.ctx.beginPath();
        this.ctx.rect(x0, y0, x1 - x0, y1 - y0);
        if (obj.hasCollisionFlags) this.ctx.fill();
        this.ctx.stroke();
    }

    private drawShape(obj: PhysicalObject) {
        if (!this.ctx) return;

        this.ctx.strokeStyle = obj.color || '#f1f5f9';
        this.ctx.lineWidth = 2;
        let shape = obj.shape;

        this.ctx.beginPath();
        switch (shape) {
            case SHAPES.POINT: {
                if (this.debugWorld!.objectCount > 100) {
                    this.ctx.moveTo(obj.x * ANIMSCALE, obj.y * ANIMSCALE);
                    this.ctx.lineTo(obj.x * ANIMSCALE + 1, obj.y * ANIMSCALE);
                }
                else {
                    let radius = 2;
                    this.ctx.arc(obj.x * ANIMSCALE, obj.y * ANIMSCALE, radius, 0, 2 * Math.PI);
                }
                break;
            }
            case SHAPES.CIRCLE: {
                this.ctx.arc(obj.x * ANIMSCALE, obj.y * ANIMSCALE, obj.radius * ANIMSCALE, 0, 2 * Math.PI);
                this.ctx.moveTo(obj.x * ANIMSCALE, obj.y * ANIMSCALE);
                this.ctx.lineTo(obj.x * ANIMSCALE + Math.cos(obj.r) * obj.radius * ANIMSCALE, obj.y * ANIMSCALE + Math.sin(obj.r) * obj.radius * ANIMSCALE);
                break;
            }
            case SHAPES.AABB: {
                let width = obj.width * ANIMSCALE;
                let height = obj.height * ANIMSCALE;

                this.ctx.rect(obj.x * ANIMSCALE - width / 2, obj.y * ANIMSCALE - height / 2, width, height);
                this.ctx.stroke();

                this.ctx.beginPath();
                this.ctx.save();
                this.ctx.setLineDash([2, 10]);
                this.ctx.rect(obj.x * ANIMSCALE - width / 2 + 2, obj.y * ANIMSCALE - height / 2 + 2, width - 4, height - 4);
                this.ctx.stroke();
                this.ctx.restore();

                this.ctx.beginPath();
                break;
            }
            case SHAPES.BOX: {
                let width = obj.width * ANIMSCALE;
                let height = obj.height * ANIMSCALE;
                let r = obj.r;
                this.ctx.save();
                this.ctx.translate(obj.x * ANIMSCALE, obj.y * ANIMSCALE);
                this.ctx.rotate(r);
                this.ctx.rect(-width / 2, -height / 2, width, height);
                this.ctx.restore();
                break;
            }
        }

        this.ctx.stroke();
        this.ctx.lineWidth = 1;
    }

    private drawVectors(obj: PhysicalObject) {
        if (!this.ctx) return;

        if (this.showForceVectors) { // Force vector
            let fx = obj.fx;
            let fy = obj.fy;
            let magSq = fx * fx + fy * fy;
            let mag = Math.sqrt(magSq);

            if (mag > MAX_VECTOR_MAGNITUDE) {
                fx = (fx / mag) * MAX_VECTOR_MAGNITUDE;
                fy = (fy / mag) * MAX_VECTOR_MAGNITUDE;
                mag = MAX_VECTOR_MAGNITUDE;
                magSq = mag * mag;
            }

            this.ctx.strokeStyle = '#ff4444';
            this.ctx.beginPath();

            this.ctx.moveTo(obj.x * ANIMSCALE, obj.y * ANIMSCALE);
            this.ctx.lineTo(obj.x * ANIMSCALE + fx * ANIMSCALE / 3, obj.y * ANIMSCALE + fy * ANIMSCALE / 3);
            this.ctx.stroke();

            if (magSq > 3) {
                let arrowSize = Math.min(10, mag * 10);
                let angle = Math.atan2(fy, fx);
                let arrowX = obj.x * ANIMSCALE + fx * ANIMSCALE / 3;
                let arrowY = obj.y * ANIMSCALE + fy * ANIMSCALE / 3;
                this.ctx.save();
                this.ctx.translate(arrowX, arrowY);
                this.ctx.rotate(angle);
                this.ctx.beginPath();
                this.ctx.moveTo(0, 0);
                this.ctx.lineTo(-arrowSize, -arrowSize / 2);
                this.ctx.lineTo(-arrowSize, arrowSize / 2);
                this.ctx.closePath();
                this.ctx.fillStyle = '#ff4444';
                this.ctx.fill();
                this.ctx.restore();
            }
        }

        if (this.showImpulseVectors) { // Impulse vector
            let ix = obj.ix;
            let iy = obj.iy;
            let magSq = ix * ix + iy * iy;
            let mag = Math.sqrt(magSq);

            if (mag > MAX_VECTOR_MAGNITUDE) {
                ix = (ix / mag) * MAX_VECTOR_MAGNITUDE;
                iy = (iy / mag) * MAX_VECTOR_MAGNITUDE;
                mag = MAX_VECTOR_MAGNITUDE;
                magSq = mag * mag;
            }

            this.ctx.strokeStyle = '#4488ff';
            this.ctx.beginPath();
            this.ctx.moveTo(obj.x * ANIMSCALE, obj.y * ANIMSCALE);
            this.ctx.lineTo(obj.x * ANIMSCALE + ix * 30.0, obj.y * ANIMSCALE + iy * 30.0);
            this.ctx.stroke();

            if (magSq > 1) { // magSq > 100/100
                let arrowSize = Math.min(10, mag * 10);
                let angle = Math.atan2(iy, ix);
                let arrowX = obj.x * ANIMSCALE + ix * 30;
                let arrowY = obj.y * ANIMSCALE + iy * 30;
                this.ctx.save();
                this.ctx.translate(arrowX, arrowY);
                this.ctx.rotate(angle);
                this.ctx.beginPath();
                this.ctx.moveTo(0, 0);
                this.ctx.lineTo(-arrowSize, -arrowSize / 2);
                this.ctx.lineTo(-arrowSize, arrowSize / 2);
                this.ctx.closePath();
                this.ctx.fillStyle = '#4488ff';
                this.ctx.fill();
                this.ctx.restore();
            }
        }

        if (obj.angularImpulse !== 0) {
            this.ctx.strokeStyle = '#a855f7';
            this.ctx.beginPath();
            let radius = 25;
            if (obj.shape === SHAPES.CIRCLE) radius = obj.radius * ANIMSCALE + 5;
            else radius = Math.max(obj.width, obj.height) * ANIMSCALE * 0.7;

            let impulse = obj.angularImpulse;
            let arcDistance = impulse * 2;
            if (Math.abs(arcDistance) > MAX_ANGULAR_ARC) {
                arcDistance = Math.sign(arcDistance) * MAX_ANGULAR_ARC;
            }

            let startAngle = obj.r;
            let endAngle = obj.r + arcDistance;

            this.ctx.arc(obj.x * ANIMSCALE, obj.y * ANIMSCALE, radius, startAngle, endAngle, impulse < 0);
            this.ctx.stroke();

            // Arrow head
            let arrowSize = 5;
            this.ctx.save();
            this.ctx.translate(obj.x * ANIMSCALE + Math.cos(endAngle) * radius, obj.y * ANIMSCALE + Math.sin(endAngle) * radius);
            this.ctx.rotate(endAngle + (impulse > 0 ? Math.PI / 2 : -Math.PI / 2));
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(-arrowSize, -arrowSize);
            this.ctx.lineTo(arrowSize, -arrowSize);
            this.ctx.closePath();
            this.ctx.fillStyle = '#a855f7';
            this.ctx.fill();
            this.ctx.restore();
        }
    }

    private drawJoints() {
        if (!this.ctx || !this.debugWorld) return;

        for (const id in this.debugWorld.jointsById) {
            const joint = this.debugWorld.jointsById[id];

            // Currently only HingeJoint is implemented in the engine
            if (joint instanceof HingeJoint) {
                this.drawHingeJoint(joint);
            }
            else if (joint instanceof DistanceJoint) {
                this.drawDistanceJoint(joint);
            }
            else if (joint instanceof SpringJoint) {
                const anchorA = joint.bodyA.localToWorld(joint.localAnchorA);
                const anchorB = joint.bodyB.localToWorld(joint.localAnchorB);
                this.drawSpringJoint(anchorA, anchorB);
            }
            else if (joint instanceof GearJoint) {
                this.drawGearJoint(joint);
            }
        }
    }

    private drawHingeJoint(joint: HingeJoint) {
        if (!this.ctx) return;
        const anchorA = joint.bodyA.localToWorld(joint.localAnchorA);
        const anchorB = joint.bodyB.localToWorld(joint.localAnchorB);

        // Draw dashed lines from centers to anchor
        this.ctx.save();
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)'; // Gold
        this.ctx.beginPath();
        this.ctx.moveTo(joint.bodyA.x * ANIMSCALE, joint.bodyA.y * ANIMSCALE);
        this.ctx.lineTo(anchorA.x * ANIMSCALE, anchorA.y * ANIMSCALE);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(joint.bodyB.x * ANIMSCALE, joint.bodyB.y * ANIMSCALE);
        this.ctx.lineTo(anchorB.x * ANIMSCALE, anchorB.y * ANIMSCALE);
        this.ctx.stroke();
        this.ctx.restore();

        // Draw the pivot point
        this.ctx.beginPath();
        this.ctx.arc(anchorA.x * ANIMSCALE, anchorA.y * ANIMSCALE, 4, 0, 2 * Math.PI);
        this.ctx.strokeStyle = '#fff';
        this.ctx.fillStyle = '#FFD700'; // Gold
        this.ctx.fill();
        this.ctx.stroke();
    }

    private drawDistanceJoint(joint: DistanceJoint) {
        if (!this.ctx) return;
        const anchorA = joint.bodyA.localToWorld(joint.localAnchorA);
        const anchorB = joint.bodyB.localToWorld(joint.localAnchorB);
        
        // Draw the rod
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.7)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(anchorA.x * ANIMSCALE, anchorA.y * ANIMSCALE);
        this.ctx.lineTo(anchorB.x * ANIMSCALE, anchorB.y * ANIMSCALE);
        this.ctx.stroke();
        this.ctx.lineWidth = 1;

        // Draw anchor points
        this.ctx.fillStyle = 'cyan';
        this.ctx.beginPath();
        this.ctx.arc(anchorA.x * ANIMSCALE, anchorA.y * ANIMSCALE, 3, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(anchorB.x * ANIMSCALE, anchorB.y * ANIMSCALE, 3, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    private drawSpringJoint(anchorA: { x: number, y: number }, anchorB: { x: number, y: number }) {
        if (!this.ctx) return;

        const x1 = anchorA.x * ANIMSCALE;
        const y1 = anchorA.y * ANIMSCALE;
        const x2 = anchorB.x * ANIMSCALE;
        const y2 = anchorB.y * ANIMSCALE;

        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        this.ctx.save();
        this.ctx.translate(x1, y1);
        this.ctx.rotate(angle);

        this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.7)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);

        const segments = 10;
        const segmentLength = dist / segments;
        const amplitude = 5;

        for (let i = 1; i <= segments; i++) {
            const x = i * segmentLength;
            const y = (i % 2 === 0) ? amplitude : -amplitude;
            if (i === segments) {
                this.ctx.lineTo(x, 0);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.stroke();
        this.ctx.restore();
    }

    private drawGearJoint(joint: GearJoint) {
        if (!this.ctx) return;

        const drawCog = (hinge: HingeJoint) => {
            const anchor = hinge.bodyB.localToWorld(hinge.localAnchorB);
            const x = anchor.x * ANIMSCALE;
            const y = anchor.y * ANIMSCALE;
            const r = 15; // fixed size for cog icon
            const teeth = 8;

            this.ctx!.save();
            this.ctx!.translate(x, y);
            this.ctx!.rotate(hinge.bodyB.r);
            this.ctx!.strokeStyle = 'rgba(255, 165, 0, 0.8)';
            this.ctx!.beginPath();
            this.ctx!.arc(0, 0, r, 0, 2 * Math.PI);
            
            for (let i = 0; i < teeth; i++) {
                const angle = (i / teeth) * 2 * Math.PI;
                this.ctx!.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
                this.ctx!.lineTo(Math.cos(angle) * (r + 5), Math.sin(angle) * (r + 5));
            }
            this.ctx!.stroke();
            this.ctx!.restore();
            return { x, y };
        };

        const pos1 = drawCog(joint.joint1);
        const pos2 = drawCog(joint.joint2);

        // Dotted connection line
        this.ctx.save();
        this.ctx.setLineDash([2, 4]);
        this.ctx.strokeStyle = 'rgba(255, 165, 0, 0.5)';
        this.ctx.beginPath();
        this.ctx.moveTo(pos1.x, pos1.y);
        this.ctx.lineTo(pos2.x, pos2.y);
        this.ctx.stroke();
        this.ctx.restore();
    }


    private animate() {
        if (!this.ctx || !this.canvas || !this.debugWorld) return;

        let now = Date.now();
        let delta = now - this.lastTick;
        this.lastTick = now;
        this.debugFrameTime = delta;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.zoom, this.zoom);

        this.debugWorld.iterateObjects((obj: PhysicalObject) => {
            if (this.showAabbs && this.debugWorld!.objectCount < 100) {
                this.drawAabb(obj);
            }

            this.drawShape(obj);

            if (this.debugWorld!.objectCount <= 100) {
                this.drawVectors(obj);
            }
        });

        this.drawJoints();

        this.ctx.restore();

        this.drawLabels();

        this.animFrame = requestAnimationFrame(() => this.animate());
    }

    private drawLabels() {
        if (!this.ctx || !this.debugWorld) return;

        this.ctx.save();
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.zoom, this.zoom);

        // Filter out labels for removed objects.
        this.labels = this.labels.filter(label => {
            if (label.objectId !== undefined) {
                const obj = this.debugWorld!.getObjectById(label.objectId);
                if (!obj) return false;
            }
            return true;
        });

        for (const label of this.labels) {
            let x = 0;
            let y = 0;
            let width = 0;
            let height = 0;

            if (label.objectId !== undefined) {
                const obj = this.debugWorld.getObjectById(label.objectId);
                if (obj) {
                    x = obj.x * ANIMSCALE;
                    y = obj.y * ANIMSCALE;
                    if (obj.shape === SHAPES.CIRCLE) {
                        width = obj.radius * 2 * ANIMSCALE;
                        height = obj.radius * 2 * ANIMSCALE;
                    } else {
                        width = obj.width * ANIMSCALE;
                        height = obj.height * ANIMSCALE;
                    }
                }
            } else {
                x = (label.x || 0) * ANIMSCALE;
                y = (label.y || 0) * ANIMSCALE;
            }

            this.ctx.font = label.fontSize || this.defaultLabelFontSize;
            this.ctx.fillStyle = label.color || this.defaultLabelColor;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            const offset = (label.offset !== undefined ? label.offset : this.defaultLabelOffset);
            const pos = label.position || 'right';

            let lx = x;
            let ly = y;

            const metrics = this.ctx.measureText(label.text);
            const textWidth = metrics.width;
            const textHeight = parseInt(this.ctx.font) || 12;

            switch (pos) {
                case 'left':
                    lx = x - width / 2 - textWidth / 2 - offset;
                    break;
                case 'right':
                    lx = x + width / 2 + textWidth / 2 + offset;
                    break;
                case 'above':
                    ly = y - height / 2 - textHeight / 2 - offset;
                    break;
                case 'below':
                    ly = y + height / 2 + textHeight / 2 + offset;
                    break;
                case 'on-top':
                    // lx = x, ly = y (default)
                    break;
            }

            this.ctx.fillText(label.text, lx, ly);
        }

        this.ctx.restore();
    }
}



