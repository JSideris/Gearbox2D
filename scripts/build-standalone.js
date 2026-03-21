
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const { generatePatch } = require('./patcher/generate-patch.js');

async function build() {
    console.log('Building standalone CDN bundle...');

    // Paths
    const wasmMTPath = path.resolve(__dirname, '../dist/wasm/gearbox-module-mt.wasm');
    const wasmSTPath = path.resolve(__dirname, '../dist/wasm/gearbox-module-st.wasm');
    const entryPath = path.resolve(__dirname, '../typescript/src/cdn.ts');
    const outputPath = path.resolve(__dirname, '../dist/standalone/gearbox.js');

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Check if WASM exists
    if (!fs.existsSync(wasmMTPath) || !fs.existsSync(wasmSTPath)) {
        console.error(`Error: WASM files not found at ${wasmMTPath} or ${wasmSTPath}`);
        console.error('Please run "npm run build:cpp" first.');
        process.exit(1);
    }

    // Read WASM
    const mtData = fs.readFileSync(wasmMTPath);
    const stData = fs.readFileSync(wasmSTPath);
    
    // Generate Patch
    console.log('Generating WASM patch...');
    const patchData = generatePatch(stData, mtData);
    
    // Convert to Base64
    const wasmMTPatchBase64 = patchData.toString('base64');
    const wasmSTBase64 = stData.toString('base64');

    try {
        await esbuild.build({
            entryPoints: [entryPath],
            bundle: true,
            outfile: outputPath,
            format: 'iife',
            globalName: 'gearboxStandalone',
            minify: true,
            sourcemap: true,
            platform: 'browser',
            external: ['module'],
            define: {
                '__WASM_MT_PATCH_BASE64__': JSON.stringify(wasmMTPatchBase64),
                '__WASM_ST_BASE64__': JSON.stringify(wasmSTBase64),
                // Silence warnings about import.meta.url in IIFE format.
                // Since we provide the WASM binary directly, this isn't needed at runtime.
                'import.meta.url': 'undefined'
            },
            // Loader for any other assets if needed
            loader: {
                '.ts': 'ts'
            }
        });

        const stats = fs.statSync(outputPath);
        const fileSizeInKB = (stats.size / 1024).toFixed(2);
        console.log(`Successfully built: ${outputPath}`);
        console.log(`Bundle size: ${fileSizeInKB} KB`);
    } catch (err) {
        console.error('Build failed:', err);
        process.exit(1);
    }
}

build();

