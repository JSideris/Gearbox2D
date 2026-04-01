const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '../dist');
const cloneDir = path.resolve(__dirname, '../dist-clone');

if (!fs.existsSync(distDir)) {
    console.error('Error: dist directory does not exist. Please build first.');
    process.exit(1);
}

// Remove existing clone
if (fs.existsSync(cloneDir)) {
    fs.rmSync(cloneDir, { recursive: true, force: true });
}

// Copy dist to dist-clone
fs.cpSync(distDir, cloneDir, { recursive: true });

// Patch the paths in the cloned engine.js
const enginePath = path.resolve(cloneDir, 'js/engine.js');
if (fs.existsSync(enginePath)) {
    let engineContent = fs.readFileSync(enginePath, 'utf8');
    // Replace paths pointing to dist/wasm with dist-clone/wasm
    engineContent = engineContent.replace(/\.\.\/\.\.\/dist\/wasm/g, '../../dist-clone/wasm');
    fs.writeFileSync(enginePath, engineContent, 'utf8');
    console.log('Successfully cloned dist to dist-clone and patched engine.js');
} else {
    console.warn('Warning: engine.js not found in cloned dist directory.');
}
