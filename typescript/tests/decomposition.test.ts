export interface Point {
	x: number;
	y: number;
}

function crossProduct(p0: Point, p1: Point, p2: Point): number {
	return (p1.x - p0.x) * (p2.y - p0.y) - (p1.y - p0.y) * (p2.x - p0.x);
}

function segmentsIntersect(a: Point, b: Point, c: Point, d: Point): boolean {
	const det = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x);
	if (det === 0) return false;

	const u = ((c.x - a.x) * (d.y - c.y) - (c.y - a.y) * (d.x - c.x)) / det;
	const v = ((c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x)) / det;

	return u > 0 && u < 1 && v > 0 && v < 1;
}

export function isSimplePolygon(vertices: Point[]): boolean {
    const n = vertices.length;
    for (let i = 0; i < n; i++) {
        const a = vertices[i];
        const b = vertices[(i + 1) % n];
        for (let j = i + 2; j < n; j++) {
            if (i === 0 && j === n - 1) continue; // adjacent edges
            const c = vertices[j];
            const d = vertices[(j + 1) % n];
            if (segmentsIntersect(a, b, c, d)) return false;
        }
    }
    return true;
}

export function polygonArea(vertices: Point[]): number {
    let area = 0;
    const n = vertices.length;
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        area += vertices[i].x * vertices[j].y;
        area -= vertices[j].x * vertices[i].y;
    }
    return Math.abs(area / 2);
}

import { decompose, makeStar, isConcave } from '../src/polygon-utils';

describe('Polygon Decomposition', () => {
  test('should decompose star 5 into only convex polygons', () => {
    const star = makeStar(5, 5, 2);
    const originalArea = polygonArea(star);
    const pieces = decompose(star);
    console.log('Star 5 pieces:', pieces.length);
    let sumArea = 0;
    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i];
      sumArea += polygonArea(piece);
      console.log(`Piece ${i} length: ${piece.length}, isConcave: ${isConcave(piece)}, isSimple: ${isSimplePolygon(piece)}`);
      for (const p of piece) {
        console.log(`  (${p.x.toFixed(2)}, ${p.y.toFixed(2)})`);
      }
      expect(isConcave(piece)).toBe(false);
      expect(isSimplePolygon(piece)).toBe(true);
    }
    expect(sumArea).toBeCloseTo(originalArea, 5);
  });

  test('should decompose a U-shape into only convex polygons', () => {
    const uShape = [
      {x: 0, y: 0},
      {x: 10, y: 0},
      {x: 10, y: 10},
      {x: 0, y: 10},
      {x: 0, y: 8},
      {x: 8, y: 8},
      {x: 8, y: 2},
      {x: 0, y: 2}
    ];
    const originalArea = polygonArea(uShape);
    const pieces = decompose(uShape);
    console.log('U-shape pieces:', pieces.length);
    let sumArea = 0;
    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i];
      sumArea += polygonArea(piece);
      console.log(`Piece ${i} length: ${piece.length}, isConcave: ${isConcave(piece)}, isSimple: ${isSimplePolygon(piece)}`);
      for (const p of piece) {
        console.log(`  (${p.x.toFixed(2)}, ${p.y.toFixed(2)})`);
      }
      expect(isConcave(piece)).toBe(false);
      expect(isSimplePolygon(piece)).toBe(true);
    }
    expect(sumArea).toBeCloseTo(originalArea, 5);
  });

  test('should decompose a C-shape into only convex polygons', () => {
    const cShape = [
      {x: 10, y: 10},
      {x: 0, y: 10},
      {x: 0, y: 0},
      {x: 10, y: 0},
      {x: 10, y: 2},
      {x: 2, y: 2},
      {x: 2, y: 8},
      {x: 10, y: 8}
    ];
    const originalArea = polygonArea(cShape);
    const pieces = decompose(cShape);
    console.log('C-shape pieces:', pieces.length);
    let sumArea = 0;
    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i];
      sumArea += polygonArea(piece);
      console.log(`Piece ${i} length: ${piece.length}, isConcave: ${isConcave(piece)}, isSimple: ${isSimplePolygon(piece)}`);
      for (const p of piece) {
        console.log(`  (${p.x.toFixed(2)}, ${p.y.toFixed(2)})`);
      }
      expect(isConcave(piece)).toBe(false);
      expect(isSimplePolygon(piece)).toBe(true);
    }
    expect(sumArea).toBeCloseTo(originalArea, 5);
  });

  test('should decompose various stars into only convex polygons', () => {
    for (let i = 3; i <= 10; i++) {
      const star = makeStar(i, 5, 2);
      const originalArea = polygonArea(star);
      const pieces = decompose(star);
      
      let sumArea = 0;
      for (const piece of pieces) {
        sumArea += polygonArea(piece);
        expect(isConcave(piece)).toBe(false);
        expect(isSimplePolygon(piece)).toBe(true);
        expect(piece.length).toBeLessThanOrEqual(8);
      }
      expect(sumArea).toBeCloseTo(originalArea, 5);
    }
  });
});
