import gearbox from "./engine.js";

/**
 * Standalone CDN entry point.
 * This file is bundled by esbuild with the WASM inlined as a Base64 string.
 * It attaches the gearbox engine to the global window object.
 */

// @ts-ignore
const inlinedWasmBase64 = typeof __WASM_BASE64__ !== "undefined" ? __WASM_BASE64__ : null;

if (inlinedWasmBase64) {
	const binaryString = atob(inlinedWasmBase64);
	const len = binaryString.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}

	const originalInit = gearbox.init.bind(gearbox);
	gearbox.init = async (options: { wasmBinary?: Uint8Array } = {}) => {
		return originalInit({ wasmBinary: bytes, ...options });
	};
}

(window as any).gearbox = gearbox;

export default gearbox;
