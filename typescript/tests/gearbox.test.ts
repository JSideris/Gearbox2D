jest.mock(
	"../../dist/wasm/gearbox-module.js",
	() => ({
		__esModule: true,
		default: jest.fn(),
	}),
	{ virtual: true },
);

import { SHAPES, BODY_TYPES } from "../src/constants";

describe("Gearbox constants", () => {
	test("SHAPES should be defined correctly", () => {
		expect(SHAPES.CIRCLE).toBe(1);
		expect(SHAPES.BOX).toBe(3);
	});

	test("BODY_TYPES should be defined correctly", () => {
		expect(BODY_TYPES.DYNAMIC_OBJECT).toBe(0);
		expect(BODY_TYPES.FIXED_OBJECT).toBe(1);
	});
});
