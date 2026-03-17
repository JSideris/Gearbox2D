
export interface Point {
	x: number;
	y: number;
}

/**
 * Returns the cross product of (p1 - p0) and (p2 - p0).
 * If > 0, the points are in counter-clockwise order.
 * If < 0, they are in clockwise order.
 * If 0, they are collinear.
 */
function crossProduct(p0: Point, p1: Point, p2: Point): number {
	return (p1.x - p0.x) * (p2.y - p0.y) - (p1.y - p0.y) * (p2.x - p0.x);
}

/**
 * Checks if a polygon is concave using the cross-product method.
 * Assumes vertices are in a consistent order (CCW or CW).
 */
export function isConcave(vertices: Point[]): boolean {
	const n = vertices.length;
	if (n < 4) return false;

	let sign = 0;
	for (let i = 0; i < n; i++) {
		const p0 = vertices[i];
		const p1 = vertices[(i + 1) % n];
		const p2 = vertices[(i + 2) % n];
		const cp = crossProduct(p0, p1, p2);

		if (cp === 0) continue;

		if (sign === 0) {
			sign = cp > 0 ? 1 : -1;
		} else if ((cp > 0 ? 1 : -1) !== sign) {
			return true;
		}
	}
	return false;
}

/**
 * Simple Bayazit's algorithm implementation for convex decomposition.
 * Ported/inspired by common open-source implementations.
 */
export function decompose(vertices: Point[]): Point[][] {
	// 1. Ensure CCW order (Area > 0 in y-up is CCW)
	let area = 0;
	for (let i = 0; i < vertices.length; i++) {
		const p1 = vertices[i];
		const p2 = vertices[(i + 1) % vertices.length];
		area += (p1.x * p2.y - p2.x * p1.y);
	}
	if (area < 0) {
		vertices = [...vertices].reverse();
	}

	const reflexVertices: number[] = [];
	for (let i = 0; i < vertices.length; i++) {
		const p0 = vertices[(i - 1 + vertices.length) % vertices.length];
		const p1 = vertices[i];
		const p2 = vertices[(i + 1) % vertices.length];
		if (crossProduct(p0, p1, p2) < 0) {
			reflexVertices.push(i);
		}
	}

	if (reflexVertices.length === 0) {
		return [vertices];
	}

	// For simplicity in this v1 implementation, we will use a basic recursive decomposition.
	// Find the first reflex vertex and split the polygon.
	const reflexIdx = reflexVertices[0];
	const p0 = vertices[(reflexIdx - 1 + vertices.length) % vertices.length];
	const p1 = vertices[reflexIdx];
	const p2 = vertices[(reflexIdx + 1) % vertices.length];

	// Bayazit's logic: Find a vertex to connect to that "fixes" the reflex vertex.
	// We look for a vertex that is visible from p1 and splits the reflex angle.
	let bestSplitIdx = -1;
	let minDistance = Infinity;

	for (let i = 0; i < vertices.length; i++) {
		if (i === reflexIdx || i === (reflexIdx - 1 + vertices.length) % vertices.length || i === (reflexIdx + 1) % vertices.length) continue;

		const p = vertices[i];
		
		// Check if p is within the "reflex cone" (for CCW order)
		const cp1 = crossProduct(p1, p0, p);
		const cp2 = crossProduct(p1, p2, p);
		
		if (cp1 <= 0 && cp2 >= 0) {
			// Check visibility (simplified: check if any edge intersects the split segment)
			if (isVisible(vertices, reflexIdx, i)) {
				const distSq = (p.x - p1.x) ** 2 + (p.y - p1.y) ** 2;
				if (distSq < minDistance) {
					minDistance = distSq;
					bestSplitIdx = i;
				}
			}
		}
	}

	if (bestSplitIdx !== -1) {
		const poly1: Point[] = [];
		const poly2: Point[] = [];

		let i = reflexIdx;
		while (i !== bestSplitIdx) {
			poly1.push(vertices[i]);
			i = (i + 1) % vertices.length;
		}
		poly1.push(vertices[bestSplitIdx]);

		i = bestSplitIdx;
		while (i !== reflexIdx) {
			poly2.push(vertices[i]);
			i = (i + 1) % vertices.length;
		}
		poly2.push(vertices[reflexIdx]);

		return [...decompose(poly1), ...decompose(poly2)];
	}

	// Fallback if no split found (should not happen for simple polygons)
	return [vertices];
}

function isVisible(vertices: Point[], idx1: number, idx2: number): boolean {
	const p1 = vertices[idx1];
	const p2 = vertices[idx2];

	for (let i = 0; i < vertices.length; i++) {
		const v1 = vertices[i];
		const v2 = vertices[(i + 1) % vertices.length];

		// Skip edges connected to the vertices of interest
		if (i === idx1 || i === idx2 || (i + 1) % vertices.length === idx1 || (i + 1) % vertices.length === idx2) continue;

		if (segmentsIntersect(p1, p2, v1, v2)) {
			return false;
		}
	}
	return true;
}


/**
 * Generates vertices for a regular polygon (triangle, square, pentagon, etc.)
 */
export function makeRegularPolygon(sides: number, radius: number): Point[] {
	if (sides < 3) throw new Error("A polygon must have at least 3 sides");
	const vertices: Point[] = [];
	for (let i = 0; i < sides; i++) {
		const angle = (i / sides) * Math.PI * 2;
		vertices.push({
			x: Math.cos(angle) * radius,
			y: Math.sin(angle) * radius
		});
	}
	return vertices;
}

/**
 * Generates vertices for a star shape.
 */
export function makeStar(points: number, outerRadius: number, innerRadius: number): Point[] {
	if (points < 3) throw new Error("A star must have at least 3 points");
	const vertices: Point[] = [];
	for (let i = 0; i < points * 2; i++) {
		const r = i % 2 === 0 ? outerRadius : innerRadius;
		const angle = (i / (points * 2)) * Math.PI * 2;
		vertices.push({
			x: Math.cos(angle) * r,
			y: Math.sin(angle) * r
		});
	}
	return vertices;
}

function segmentsIntersect(a: Point, b: Point, c: Point, d: Point): boolean {
	const det = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x);
	if (det === 0) return false;

	const u = ((c.x - a.x) * (d.y - c.y) - (c.y - a.y) * (d.x - c.x)) / det;
	const v = ((c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x)) / det;

	return u > 0 && u < 1 && v > 0 && v < 1;
}
