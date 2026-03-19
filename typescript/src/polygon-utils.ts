export interface Point {
	x: number;
	y: number;
}

function wrap(a: number, b: number): number {
	return a < 0 ? (a % b) + b : a % b;
}

function at<T>(v: T[], i: number): T {
	return v[wrap(i, v.length)];
}

function area(a: Point, b: Point, c: Point): number {
	return (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y);
}

function left(a: Point, b: Point, c: Point): boolean {
	return area(a, b, c) > 0;
}

function leftOn(a: Point, b: Point, c: Point): boolean {
	return area(a, b, c) >= 0;
}

function right(a: Point, b: Point, c: Point): boolean {
	return area(a, b, c) < 0;
}

function rightOn(a: Point, b: Point, c: Point): boolean {
	return area(a, b, c) <= 0;
}

function sqdist(a: Point, b: Point): number {
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	return dx * dx + dy * dy;
}

function eq(a: number, b: number): boolean {
	return Math.abs(a - b) <= 1e-8;
}

function intersection(p1: Point, p2: Point, q1: Point, q2: Point): Point {
	const i = { x: 0, y: 0 };
	const a1 = p2.y - p1.y;
	const b1 = p1.x - p2.x;
	const c1 = a1 * p1.x + b1 * p1.y;
	const a2 = q2.y - q1.y;
	const b2 = q1.x - q2.x;
	const c2 = a2 * q1.x + b2 * q1.y;
	const det = a1 * b2 - a2 * b1;
	if (!eq(det, 0)) {
		i.x = (b2 * c1 - b1 * c2) / det;
		i.y = (a1 * c2 - a2 * c1) / det;
	}
	return i;
}

function isReflex(poly: Point[], i: number): boolean {
	return right(at(poly, i - 1), at(poly, i), at(poly, i + 1));
}

function makeCCW(poly: Point[]): Point[] {
	let br = 0;

	// find bottom right point
	for (let i = 1; i < poly.length; ++i) {
		if (poly[i].y < poly[br].y || (poly[i].y === poly[br].y && poly[i].x > poly[br].x)) {
			br = i;
		}
	}

	// reverse poly if clockwise
	if (!left(at(poly, br - 1), at(poly, br), at(poly, br + 1))) {
		return [...poly].reverse();
	}
	return poly;
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
		const cp = area(p0, p1, p2);

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
 */
export function decompose(poly: Point[]): Point[][] {
	const polys: Point[][] = [];

	// Ensure CCW order
	const ccwPoly = makeCCW(poly);

	function decomposeInternal(currentPoly: Point[]) {
		for (let i = 0; i < currentPoly.length; ++i) {
			if (isReflex(currentPoly, i)) {
				let upperInt = { x: 0, y: 0 };
				let lowerInt = { x: 0, y: 0 };
				let p = { x: 0, y: 0 };
				let upperDist = Number.MAX_VALUE;
				let lowerDist = Number.MAX_VALUE;
				let d = 0;
				let closestDist = Number.MAX_VALUE;
				let upperIndex = -1;
				let lowerIndex = -1;
				let closestIndex = -1;
				let lowerPoly: Point[] = [];
				let upperPoly: Point[] = [];

				for (let j = 0; j < currentPoly.length; ++j) {
					if (
						left(at(currentPoly, i - 1), at(currentPoly, i), at(currentPoly, j)) &&
						rightOn(at(currentPoly, i - 1), at(currentPoly, i), at(currentPoly, j - 1))
					) {
						// if line intersects with an edge
						p = intersection(
							at(currentPoly, i - 1),
							at(currentPoly, i),
							at(currentPoly, j),
							at(currentPoly, j - 1),
						);
						if (right(at(currentPoly, i + 1), at(currentPoly, i), p)) {
							// make sure it's inside the poly
							d = sqdist(currentPoly[i], p);
							if (d < lowerDist) {
								// keep only the closest intersection
								lowerDist = d;
								lowerInt = p;
								lowerIndex = j;
							}
						}
					}
					if (
						left(at(currentPoly, i + 1), at(currentPoly, i), at(currentPoly, j + 1)) &&
						rightOn(at(currentPoly, i + 1), at(currentPoly, i), at(currentPoly, j))
					) {
						p = intersection(
							at(currentPoly, i + 1),
							at(currentPoly, i),
							at(currentPoly, j),
							at(currentPoly, j + 1),
						);
						if (left(at(currentPoly, i - 1), at(currentPoly, i), p)) {
							d = sqdist(currentPoly[i], p);
							if (d < upperDist) {
								upperDist = d;
								upperInt = p;
								upperIndex = j;
							}
						}
					}
				}

				// if there are no vertices to connect to, choose a point in the middle
				if (lowerIndex === (upperIndex + 1) % currentPoly.length) {
					p = {
						x: (lowerInt.x + upperInt.x) / 2,
						y: (lowerInt.y + upperInt.y) / 2,
					};

					if (i < upperIndex) {
						lowerPoly = [...currentPoly.slice(i, upperIndex + 1), p];
						upperPoly = [p];
						if (lowerIndex !== 0) upperPoly.push(...currentPoly.slice(lowerIndex));
						upperPoly.push(...currentPoly.slice(0, i + 1));
					} else {
						lowerPoly = [];
						if (i !== 0) lowerPoly.push(...currentPoly.slice(i));
						lowerPoly.push(...currentPoly.slice(0, upperIndex + 1), p);
						upperPoly = [p, ...currentPoly.slice(lowerIndex, i + 1)];
					}
				} else {
					// connect to the closest point within the triangle
					if (lowerIndex > upperIndex) {
						upperIndex += currentPoly.length;
					}
					closestDist = Number.MAX_VALUE;
					for (let j = lowerIndex; j <= upperIndex; ++j) {
						if (
							leftOn(at(currentPoly, i - 1), at(currentPoly, i), at(currentPoly, j)) &&
							rightOn(at(currentPoly, i + 1), at(currentPoly, i), at(currentPoly, j))
						) {
							d = sqdist(at(currentPoly, i), at(currentPoly, j));
							if (d < closestDist) {
								closestDist = d;
								closestIndex = j % currentPoly.length;
							}
						}
					}

					if (i < closestIndex) {
						lowerPoly = [...currentPoly.slice(i, closestIndex + 1)];
						upperPoly = [];
						if (closestIndex !== 0) upperPoly.push(...currentPoly.slice(closestIndex));
						upperPoly.push(...currentPoly.slice(0, i + 1));
					} else {
						lowerPoly = [];
						if (i !== 0) lowerPoly.push(...currentPoly.slice(i));
						lowerPoly.push(...currentPoly.slice(0, closestIndex + 1));
						upperPoly = [...currentPoly.slice(closestIndex, i + 1)];
					}
				}

				// solve smallest poly first
				if (lowerPoly.length < upperPoly.length) {
					decomposeInternal(lowerPoly);
					decomposeInternal(upperPoly);
				} else {
					decomposeInternal(upperPoly);
					decomposeInternal(lowerPoly);
				}
				return;
			}
		}
		polys.push(currentPoly);
	}

	decomposeInternal(ccwPoly);
	return polys;
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
			y: Math.sin(angle) * radius,
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
			y: Math.sin(angle) * r,
		});
	}
	return vertices;
}
