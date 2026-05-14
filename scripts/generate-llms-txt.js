const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const docsDir = path.join(rootDir, 'docs');
const structureFile = path.join(docsDir, 'structure.md');
const outputFile = path.join(rootDir, 'site/public/llms-full.txt');

function generate() {
    if (!fs.existsSync(structureFile)) {
        console.error('Could not find docs/structure.md');
        return;
    }

    const structure = fs.readFileSync(structureFile, 'utf8');
    const lines = structure.split('\n');
    
    // Start with the README as the introduction
    let fullContent = '# Gearbox2D Full Documentation\n\n';
    const readmePath = path.join(rootDir, 'readme.md');
    if (fs.existsSync(readmePath)) {
        fullContent += fs.readFileSync(readmePath, 'utf8') + '\n\n';
    }

    // Append each file mentioned in the structure
    for (const line of lines) {
        const match = line.match(/- `([^`]+\.md)`/);
        if (match) {
            const fileName = match[1];
            const filePath = path.join(docsDir, fileName);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                fullContent += `\n\n--- SECTION: ${fileName} ---\n\n`;
                fullContent += content;
            } else if (fileName === 'plan.md') {
                // Special case for root files like plan.md
                const rootFilePath = path.join(rootDir, fileName);
                if (fs.existsSync(rootFilePath)) {
                    const content = fs.readFileSync(rootFilePath, 'utf8');
                    fullContent += `\n\n--- SECTION: ${fileName} ---\n\n`;
                    fullContent += content;
                }
            }
        }
    }

    fs.writeFileSync(outputFile, fullContent);
    console.log(`Successfully generated ${outputFile}`);
}

generate();
