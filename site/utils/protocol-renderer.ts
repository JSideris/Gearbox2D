import { DebugFrame, ShapeType, JointType, DebugBody, DebugFixture, DebugJoint } from './physics-protocol.ts';

const ANIMSCALE = 100;

export class ProtocolRenderer {
    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;
    public zoom: number = 1.0;
    public offsetX: number = 0;
    public offsetY: number = 0;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.offsetX = canvas.width / 2;
        this.offsetY = canvas.height / 2;
    }

    render(frame: DebugFrame) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.zoom, this.zoom);

        for (const body of frame.bodies) {
            this.drawBody(body, frame.interpolationAlpha);
        }

        for (const joint of frame.joints) {
            this.drawJoint(joint);
        }

        this.ctx.restore();
    }

    private drawBody(body: DebugBody, alpha: number) {
        // Simplified interpolation for now (assuming protocol already handled some or we just use current)
        const x = body.x * ANIMSCALE;
        const y = body.y * ANIMSCALE;
        const r = body.r;

        for (const fixture of body.fixtures) {
            this.drawFixture(x, y, r, fixture, body.color, body.isSleeping);
        }
    }

    private drawFixture(bx: number, by: number, br: number, fixture: DebugFixture, color?: string, isSleeping?: boolean) {
        const cos = Math.cos(br);
        const sin = Math.sin(br);
        const lx = fixture.localX * ANIMSCALE;
        const ly = fixture.localY * ANIMSCALE;
        
        const fx = bx + (lx * cos - ly * sin);
        const fy = by + (lx * sin + ly * cos);
        const fr = br + fixture.localR;

        this.ctx.save();
        this.ctx.strokeStyle = color || '#f1f5f9';
        this.ctx.lineWidth = 2;
        if (isSleeping) {
            this.ctx.globalAlpha = 0.5;
            this.ctx.setLineDash([2, 2]);
        }
        this.ctx.beginPath();

        switch (fixture.shape) {
            case ShapeType.CIRCLE:
                const radius = (fixture.radius || 0.1) * ANIMSCALE;
                this.ctx.arc(fx, fy, radius, 0, 2 * Math.PI);
                this.ctx.moveTo(fx, fy);
                this.ctx.lineTo(fx + Math.cos(fr) * radius, fy + Math.sin(fr) * radius);
                break;
            case ShapeType.BOX:
            case ShapeType.AABB:
                const w = (fixture.width || 0.1) * ANIMSCALE;
                const h = (fixture.height || 0.1) * ANIMSCALE;
                this.ctx.translate(fx, fy);
                this.ctx.rotate(fr);
                this.ctx.rect(-w / 2, -h / 2, w, h);
                break;
            case ShapeType.POLYGON:
                if (fixture.points && fixture.points.length > 0) {
                    this.ctx.translate(fx, fy);
                    this.ctx.rotate(fr);
                    this.ctx.moveTo(fixture.points[0].x * ANIMSCALE, fixture.points[0].y * ANIMSCALE);
                    for (let i = 1; i < fixture.points.length; i++) {
                        this.ctx.lineTo(fixture.points[i].x * ANIMSCALE, fixture.points[i].y * ANIMSCALE);
                    }
                    this.ctx.closePath();
                }
                break;
        }
        this.ctx.stroke();
        this.ctx.restore();
    }

    private drawJoint(joint: DebugJoint) {
        this.ctx.save();
        this.ctx.strokeStyle = '#4ade80';
        this.ctx.setLineDash([2, 2]);
        this.ctx.beginPath();
        this.ctx.moveTo(joint.anchorA.x * ANIMSCALE, joint.anchorA.y * ANIMSCALE);
        this.ctx.lineTo(joint.anchorB.x * ANIMSCALE, joint.anchorB.y * ANIMSCALE);
        this.ctx.stroke();
        this.ctx.restore();
    }
}
