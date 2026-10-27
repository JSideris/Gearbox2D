// Vendored verbatim from gear3engine plugins/g3e-ai/src/geometry2.ts at develop 339add4 (PER-871 parity reference). Do not edit.
/** 2D point / vector (world units). */
export type Vec2 = { x: number; y: number };

/** Rectangle of size w x h centred on (x, y), rotated by `angle` radians. */
export type OrientedBox = { x: number; y: number; w: number; h: number; angle: number };

/** Circle centred on (x, y). */
export type Disc = { x: number; y: number; r: number };

/** Signed distance from a point to an oriented box (negative inside, 0 on the edge). */
export function distToBox(p: Vec2, b: OrientedBox): number {
	const c = Math.cos(-b.angle), s = Math.sin(-b.angle);
	const dx = p.x - b.x, dy = p.y - b.y;
	const lx = Math.abs(dx * c - dy * s) - b.w / 2;
	const ly = Math.abs(dx * s + dy * c) - b.h / 2;
	return Math.hypot(Math.max(0, lx), Math.max(0, ly)) + Math.min(0, Math.max(lx, ly));
}

/** Does segment a-b touch the box grown by `pad` on every side? (slab test in box space) */
export function segmentHitsBox(a: Vec2, b: Vec2, box: OrientedBox, pad = 0): boolean {
	const c = Math.cos(-box.angle), s = Math.sin(-box.angle);
	const px = (a.x - box.x) * c - (a.y - box.y) * s, py = (a.x - box.x) * s + (a.y - box.y) * c;
	const qx = (b.x - box.x) * c - (b.y - box.y) * s, qy = (b.x - box.x) * s + (b.y - box.y) * c;
	const axes: [number, number, number][] = [[px, qx - px, box.w / 2 + pad], [py, qy - py, box.h / 2 + pad]];
	let t0 = 0, t1 = 1;
	for (const [o, d, h] of axes) {
		if (Math.abs(d) < 1e-12) {
			if (o < -h || o > h) return false;
			continue;
		}
		let u0 = (-h - o) / d, u1 = (h - o) / d;
		if (u0 > u1) [u0, u1] = [u1, u0];
		t0 = Math.max(t0, u0);
		t1 = Math.min(t1, u1);
		if (t0 > t1) return false;
	}
	return true;
}

/** Distance from point p to segment a-b. */
export function segmentPointDistance(a: Vec2, b: Vec2, p: Vec2): number {
	const dx = b.x - a.x, dy = b.y - a.y;
	const l2 = dx * dx + dy * dy;
	const t = l2 > 0 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2)) : 0;
	return Math.hypot(a.x + dx * t - p.x, a.y + dy * t - p.y);
}

/** Does segment a-b touch the disc grown by `pad`? */
export function segmentHitsDisc(a: Vec2, b: Vec2, disc: Disc, pad = 0): boolean {
	return segmentPointDistance(a, b, disc) <= disc.r + pad;
}

/** Do the oriented box and the axis-aligned rectangle [minX, maxX] x [minY, maxY] overlap? (separating axes) */
export function boxOverlapsRect(b: OrientedBox, minX: number, minY: number, maxX: number, maxY: number): boolean {
	const c = Math.cos(b.angle), s = Math.sin(b.angle);
	const hw = b.w / 2, hh = b.h / 2;
	// world-axis extents of the box
	const ex = Math.abs(c) * hw + Math.abs(s) * hh, ey = Math.abs(s) * hw + Math.abs(c) * hh;
	if (b.x + ex < minX || b.x - ex > maxX || b.y + ey < minY || b.y - ey > maxY) return false;
	// the box's own axes: project the rectangle onto them
	const rx = (maxX - minX) / 2, ry = (maxY - minY) / 2, cx = (minX + maxX) / 2 - b.x, cy = (minY + maxY) / 2 - b.y;
	for (const [ax, ay, h] of [[c, s, hw], [-s, c, hh]] as [number, number, number][]) {
		const d = Math.abs(cx * ax + cy * ay), r = rx * Math.abs(ax) + ry * Math.abs(ay);
		if (d > h + r) return false;
	}
	return true;
}

/** Does the disc overlap the axis-aligned rectangle? */
export function discOverlapsRect(d: Disc, minX: number, minY: number, maxX: number, maxY: number): boolean {
	const nx = Math.max(minX, Math.min(maxX, d.x)), ny = Math.max(minY, Math.min(maxY, d.y));
	return Math.hypot(d.x - nx, d.y - ny) <= d.r;
}
