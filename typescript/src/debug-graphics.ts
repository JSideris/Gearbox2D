
import { World, PhysicalObject, SHAPES, IS_ASLEEP, HAS_PHYSICAL_COLLISION, HAS_AABB_COLLISION } from './gb2d.js';

const ANIMSCALE = 100;

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

    constructor() {}

    enableDebugGraphics(canvas: HTMLCanvasElement, world: World) {
        this.disableDebugGraphics();

        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.debugWorld = world;

        this.animFrame = requestAnimationFrame(() => this.animate());
    }

    disableDebugGraphics() {
        this.ctx = null;
        this.debugWorld = null;
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
        this.animFrame = null;
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
            this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        }

        this.ctx.beginPath();
        this.ctx.rect(x0, y0, x1 - x0, y1 - y0);
        if (obj.hasCollisionFlags) this.ctx.fill();
        this.ctx.stroke();
    }

    private drawShape(obj: PhysicalObject) {
        if (!this.ctx) return;

        this.ctx.strokeStyle = 'black';
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

        { // Force vector
            this.ctx.strokeStyle = 'red';
            this.ctx.beginPath();

            this.ctx.moveTo(obj.x * ANIMSCALE, obj.y * ANIMSCALE);
            this.ctx.lineTo(obj.x * ANIMSCALE + obj.fx * ANIMSCALE / 3, obj.y * ANIMSCALE + obj.fy * ANIMSCALE / 3);
            this.ctx.stroke();

            let forceScale = ((obj.fx) * (obj.fx) + (obj.fy) * (obj.fy));

            if (forceScale > 3) {
                let arrowSize = Math.min(10, Math.sqrt(forceScale) * 10);
                let angle = Math.atan2(obj.fy, obj.fx);
                let arrowX = obj.x * ANIMSCALE + obj.fx * ANIMSCALE / 3;
                let arrowY = obj.y * ANIMSCALE + obj.fy * ANIMSCALE / 3;
                this.ctx.save();
                this.ctx.translate(arrowX, arrowY);
                this.ctx.rotate(angle);
                this.ctx.beginPath();
                this.ctx.moveTo(0, 0);
                this.ctx.lineTo(-arrowSize, -arrowSize / 2);
                this.ctx.lineTo(-arrowSize, arrowSize / 2);
                this.ctx.closePath();
                this.ctx.fillStyle = 'red';
                this.ctx.fill();
                this.ctx.restore();
            }
        }

        { // Impulse vector
            this.ctx.strokeStyle = 'blue';
            this.ctx.beginPath();
            this.ctx.moveTo(obj.x * ANIMSCALE, obj.y * ANIMSCALE);
            this.ctx.lineTo(obj.x * ANIMSCALE + obj.ix * 30.0, obj.y * ANIMSCALE + obj.iy * 30.0);
            this.ctx.stroke();

            let impulseScale = ((obj.ix) * (obj.ix) + (obj.iy) * (obj.iy)) * 100;
            if (impulseScale > 100) {
                let arrowSize = Math.min(10, Math.sqrt(impulseScale));
                let angle = Math.atan2(obj.iy, obj.ix);
                let arrowX = obj.x * ANIMSCALE + obj.ix * 30;
                let arrowY = obj.y * ANIMSCALE + obj.iy * 30;
                this.ctx.save();
                this.ctx.translate(arrowX, arrowY);
                this.ctx.rotate(angle);
                this.ctx.beginPath();
                this.ctx.moveTo(0, 0);
                this.ctx.lineTo(-arrowSize, -arrowSize / 2);
                this.ctx.lineTo(-arrowSize, arrowSize / 2);
                this.ctx.closePath();
                this.ctx.fillStyle = 'blue';
                this.ctx.fill();
                this.ctx.restore();
            }
        }
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
            if (this.debugWorld!.objectCount < 100) {
                this.drawAabb(obj);
            }

            this.drawShape(obj);

            if (this.debugWorld!.objectCount <= 100) {
                this.drawVectors(obj);
            }
        });

        this.ctx.restore();

        this.animFrame = requestAnimationFrame(() => this.animate());
    }
}

