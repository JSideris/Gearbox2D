const fs = require('fs');
const path = require('path');

/**
 * Generates a binary patch to reconstruct mtData from stData
 * @param {Buffer} stData 
 * @param {Buffer} mtData 
 * @param {number} minMatchLen
 * @returns {Buffer}
 */
function generatePatch(stData, mtData, minMatchLen = 16) {
    const lookup = new Map();
    for (let i = 0; i <= stData.length - minMatchLen; i++) {
        const chunk = stData.toString('latin1', i, i + minMatchLen);
        if (!lookup.has(chunk)) {
            lookup.set(chunk, []);
        }
        lookup.get(chunk).push(i);
    }
    
    let mtIdx = 0;
    const patchParts = [];
    
    while (mtIdx < mtData.length) {
        let bestMatchIdx = -1;
        let bestMatchLen = 0;
        
        if (mtIdx <= mtData.length - minMatchLen) {
            const chunk = mtData.toString('latin1', mtIdx, mtIdx + minMatchLen);
            const matches = lookup.get(chunk);
            if (matches) {
                for (const stIdx of matches) {
                    let matchLen = minMatchLen;
                    // Extend match
                    while (
                        mtIdx + matchLen < mtData.length && 
                        stIdx + matchLen < stData.length && 
                        mtData[mtIdx + matchLen] === stData[stIdx + matchLen]
                    ) {
                        matchLen++;
                    }
                    if (matchLen > bestMatchLen) {
                        bestMatchLen = matchLen;
                        bestMatchIdx = stIdx;
                    }
                }
            }
        }
        
        if (bestMatchLen >= minMatchLen) {
            // Because max length of our field is 65535, we need to cap bestMatchLen
            if (bestMatchLen > 65535) bestMatchLen = 65535;

            // COPY instruction: opcode 1, offset (3 bytes), length (2 bytes)
            const buf = Buffer.alloc(6);
            buf[0] = 1;
            buf.writeUIntBE(bestMatchIdx, 1, 3);
            buf.writeUInt16BE(bestMatchLen, 4);
            patchParts.push(buf);
            mtIdx += bestMatchLen;
        } else {
            // Accumulate raw bytes until we find a match or hit 65535 limit
            let insertLen = 0;
            while (mtIdx + insertLen < mtData.length && insertLen < 65535) {
                if (mtIdx + insertLen <= mtData.length - minMatchLen) {
                    const chunk = mtData.toString('latin1', mtIdx + insertLen, mtIdx + insertLen + minMatchLen);
                    if (lookup.has(chunk)) {
                        break;
                    }
                }
                insertLen++;
            }
            
            // INSERT instruction: opcode 2, length (2 bytes), raw bytes
            const buf = Buffer.alloc(3 + insertLen);
            buf[0] = 2;
            buf.writeUInt16BE(insertLen, 1);
            mtData.copy(buf, 3, mtIdx, mtIdx + insertLen);
            patchParts.push(buf);
            mtIdx += insertLen;
        }
    }
    
    const finalSizeBuf = Buffer.alloc(4);
    finalSizeBuf.writeUInt32BE(mtData.length, 0);
    return Buffer.concat([finalSizeBuf, ...patchParts]);
}

module.exports = { generatePatch };

// Quick test
if (require.main === module) {
    const stPath = path.resolve(__dirname, '../../dist/wasm/gearbox-module-st.wasm');
    const mtPath = path.resolve(__dirname, '../../dist/wasm/gearbox-module-mt.wasm');
    const stData = fs.readFileSync(stPath);
    const mtData = fs.readFileSync(mtPath);
    
    console.time('generatePatch');
    const patch = generatePatch(stData, mtData);
    console.timeEnd('generatePatch');
    
    console.log(`ST Size: ${stData.length}`);
    console.log(`MT Size: ${mtData.length}`);
    console.log(`Patch Size: ${patch.length}`);

    // Decode test
    console.time('decodePatch');
    const targetSize = patch.readUInt32BE(0);
    const outData = Buffer.alloc(targetSize);
    
    let pIdx = 4;
    let oIdx = 0;
    while (pIdx < patch.length) {
        const opcode = patch[pIdx++];
        if (opcode === 1) { // COPY
            const offset = (patch[pIdx] << 16) | (patch[pIdx+1] << 8) | patch[pIdx+2];
            pIdx += 3;
            const length = patch.readUInt16BE(pIdx);
            pIdx += 2;
            stData.copy(outData, oIdx, offset, offset + length);
            oIdx += length;
        } else if (opcode === 2) { // INSERT
            const length = patch.readUInt16BE(pIdx);
            pIdx += 2;
            patch.copy(outData, oIdx, pIdx, pIdx + length);
            pIdx += length;
            oIdx += length;
        } else {
            throw new Error(`Unknown opcode: ${opcode} at ${pIdx-1}`);
        }
    }
    console.timeEnd('decodePatch');
    
    if (outData.equals(mtData)) {
        console.log("SUCCESS: Reconstructed MT buffer perfectly matches original!");
    } else {
        console.error("ERROR: Reconstructed MT buffer does NOT match!");
    }
}
