/**
 * Constants for estimating JS object memory usage in bytes.
 * These are based on typical V8 overheads.
 */
export const JS_OVERHEAD = {
	OBJECT_BASE: 40,
	ARRAY_BASE: 40,
	ARRAY_ELEMENT: 8,
	MAP_BASE: 64,
	MAP_ENTRY: 32,
	BUFFER_VIEW: 40,
	ROW_VIEW: 40,
	STRING_BASE: 24,
	STRING_CHAR: 2,
};

/**
 * Estimates the memory usage of a string.
 */
export function estimateStringMemory(str?: string): number {
	if (!str) return 0;
	return JS_OVERHEAD.STRING_BASE + str.length * JS_OVERHEAD.STRING_CHAR;
}

/**
 * Estimates the memory usage of an array.
 */
export function estimateArrayMemory<T>(arr: T[]): number {
	return JS_OVERHEAD.ARRAY_BASE + arr.length * JS_OVERHEAD.ARRAY_ELEMENT;
}

/**
 * Estimates the memory usage of a map or object used as a map.
 */
export function estimateMapMemory(obj: Record<string | number, any>): number {
	const entries = Object.keys(obj).length;
	return JS_OVERHEAD.MAP_BASE + entries * (JS_OVERHEAD.MAP_ENTRY + JS_OVERHEAD.ARRAY_ELEMENT);
}
