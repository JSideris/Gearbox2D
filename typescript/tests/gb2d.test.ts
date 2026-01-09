jest.mock('../../dist/wasm/gb2d-module.js', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import { SHAPES, BODY_TYPES } from '../src/constants';

describe('Gb2d constants', () => {
  test('SHAPES should be defined correctly', () => {
    expect(SHAPES.CIRCLE).toBe(1);
    expect(SHAPES.BOX).toBe(3);
  });

  test('BODY_TYPES should be defined correctly', () => {
    expect(BODY_TYPES.RIGID_BODY).toBe(0);
    expect(BODY_TYPES.FIXED_OBJECT).toBe(2);
  });
});
