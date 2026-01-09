
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

async function build() {
    console.log('Building standalone CDN bundle...');

    // Paths
    const wasmPath = path.resolve(__dirname, '../dist/wasm/gb2d-module.wasm');
    const entryPath = path.resolve(__dirname, '../typescript/src/cdn.ts');
    const outputPath = path.resolve(__dirname, '../dist/standalone/gb2d.js');

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Check if WASM exists
    if (!fs.existsSync(wasmPath)) {
        console.error(`Error: WASM file not found at ${wasmPath}`);
        console.error('Please run "npm run build:cpp" first.');
        process.exit(1);
    }

    // Read WASM and convert to Base64
    const wasmBinary = fs.readFileSync(wasmPath);
    const wasmBase64 = wasmBinary.toString('base64');

    try {
        await esbuild.build({
            entryPoints: [entryPath],
            bundle: true,
            outfile: outputPath,
            format: 'iife',
            globalName: 'gb2dStandalone',
            minify: true,
            sourcemap: true,
            platform: 'browser',
            external: ['module'],
            define: {
                '__WASM_BASE64__': JSON.stringify(wasmBase64),
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

