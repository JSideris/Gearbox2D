import gearbox, { GearboxMode } from "./engine.js";

/**
 * Standalone CDN entry point.
 * This file is bundled by esbuild with the WASM inlined as a Base64 string.
 * It attaches the gearbox engine to the global window object.
 */

// @ts-ignore
const inlinedWasmMTPatchBase64 = typeof __WASM_MT_PATCH_BASE64__ !== "undefined" ? __WASM_MT_PATCH_BASE64__ : null;
// @ts-ignore
const inlinedWasmSTBase64 = typeof __WASM_ST_BASE64__ !== "undefined" ? __WASM_ST_BASE64__ : null;

function base64ToUint8Array(base64: string) {
	const binaryString = atob(base64);
	const len = binaryString.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	return bytes;
}

function decodePatch(stData: Uint8Array, patchData: Uint8Array): Uint8Array {
	const view = new DataView(patchData.buffer, patchData.byteOffset, patchData.byteLength);
	const targetSize = view.getUint32(0, false);
	const outData = new Uint8Array(targetSize);

	let pIdx = 4;
	let oIdx = 0;
	while (pIdx < patchData.length) {
		const opcode = patchData[pIdx++];
		if (opcode === 1) {
			// COPY
			const offset = (patchData[pIdx] << 16) | (patchData[pIdx + 1] << 8) | patchData[pIdx + 2];
			pIdx += 3;
			const length = view.getUint16(pIdx, false);
			pIdx += 2;
			outData.set(stData.subarray(offset, offset + length), oIdx);
			oIdx += length;
		} else if (opcode === 2) {
			// INSERT
			const length = view.getUint16(pIdx, false);
			pIdx += 2;
			outData.set(patchData.subarray(pIdx, pIdx + length), oIdx);
			pIdx += length;
			oIdx += length;
		} else {
			throw new Error(`Unknown patch opcode: ${opcode}`);
		}
	}
	return outData;
}

const originalInit = gearbox.init.bind(gearbox);
gearbox.init = async (options: { wasmBinary?: Uint8Array; mode?: GearboxMode } = {}) => {
	if (options.wasmBinary) {
		return originalInit(options);
	}

	const requestedMode = options.mode || "auto";
	const isIsolated = typeof self !== "undefined" && self.crossOriginIsolated;
	const supportsThreads = isIsolated && typeof SharedArrayBuffer !== "undefined";

	let useMT = false;
	if (requestedMode === "mt") {
		useMT = true;
	} else if (requestedMode === "st") {
		useMT = false;
	} else {
		useMT = supportsThreads;
	}

	if (inlinedWasmSTBase64) {
		const stBinary = base64ToUint8Array(inlinedWasmSTBase64);

		if (useMT && inlinedWasmMTPatchBase64) {
			const patchBinary = base64ToUint8Array(inlinedWasmMTPatchBase64);
			const mtBinary = decodePatch(stBinary, patchBinary);
			return originalInit({ wasmBinary: mtBinary, ...options });
		}

		return originalInit({ wasmBinary: stBinary, ...options });
	}

	return originalInit(options);
};

(window as any).gearbox = gearbox;

export default gearbox;
