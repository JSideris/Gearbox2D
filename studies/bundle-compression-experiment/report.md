# WASM Bundle Compression Experiment Report

## Scientific Findings

Our goal was to determine if we could reconstruct the Multi-Threaded (MT) WASM bundle from the Single-Threaded (ST) WASM bundle to save CDN payload size.

### 1. The Base64 Problem
Diffing or compressing the Base64 strings directly is fundamentally flawed. Base64 encodes 3 bytes into 4 characters. When the MT build inserts even a single byte (like an atomic instruction) into the binary, it shifts the entire 3-byte boundary for the rest of the file. This destroys any string-level similarity, which is why standard compression and diffing algorithms failed to find redundancy across the two base64 strings. We must operate on the **raw binary**.

### 2. The Greedy Block Matching Theory
Since the files share about 89% of their bytes but are "shifted" irregularly due to threaded memory instructions, we tested a "Greedy Block Matcher" operating directly on the decoded bytes. 

The algorithm scans the MT binary and looks for the longest matching sequence of bytes in the ST binary. If it finds a match longer than `N` bytes, it creates a `COPY` instruction. If it doesn't, it creates an `INSERT` instruction with the raw MT bytes.

### 3. Experimental Results
We ran the algorithm across multiple minimum match lengths (`N`). The sweet spot was `N = 16`.

**Uncompressed Sizes:**
*   ST WASM: 152.4 KB
*   MT WASM: 168.6 KB
*   **Raw Patch: 71.4 KB**
*(A 57% reduction compared to shipping the MT WASM separately!)*

**Compressed Sizes (Simulating CDN gzip/zlib):**
*   ST (Zlib): 58.9 KB
*   MT (Zlib): 68.1 KB
*   **Patch (Zlib): 32.9 KB**

**Total CDN Payload:**
*   Shipping Separately (ST + MT): **127.0 KB**
*   Shipping Patch (ST + Patch): **91.8 KB (27.6% savings)**

### 4. Conclusion
The "witchcraft" is entirely viable. By building a simple WASM binary patcher, we can drastically cut down the shipped bundle size. The patch format is simple enough that the runtime decoder will be extremely lightweight in JS (just a loop processing `COPY` and `INSERT` byte commands).
