const fs = require('fs');

const baseFile = process.argv[2];
const currentFile = process.argv[3];

if (!baseFile || !currentFile) {
	console.error('Usage: node format-benchmark-comparison.js <base_file> <current_file>');
	process.exit(1);
}

function parseBenchmarks(content) {
	const benchmarks = {};
	const lines = content.split('\n');
	// Regex matches: Name | Avg: Xms | P95: Xms | Min: Xms | Max: Xms
	const regex = /(.+?)\s+\|\s+Avg:\s+([\d.]+)\s*ms\s+\|\s+P95:\s+([\d.]+)\s*ms\s+\|\s+Min:\s+([\d.]+)\s*ms\s+\|\s+Max:\s+([\d.]+)\s*ms/;

	for (const line of lines) {
		const match = line.match(regex);
		if (match) {
			const name = match[1].trim();
			benchmarks[name] = {
				avg: parseFloat(match[2]),
				p95: parseFloat(match[3]),
				min: parseFloat(match[4]),
				max: parseFloat(match[5]),
			};
		}
	}
	return benchmarks;
}

try {
	const baseData = fs.readFileSync(baseFile, 'utf8');
	const currentData = fs.readFileSync(currentFile, 'utf8');

	const baseResults = parseBenchmarks(baseData);
	const currentResults = parseBenchmarks(currentData);

	if (Object.keys(baseResults).length === 0 || Object.keys(currentResults).length === 0) {
		console.log('Error: Could not parse benchmark results. Check output format.');
		process.exit(1);
	}

	// Output table
	console.log('--- Gearbox2D Benchmark Comparison ---');
	console.log('-'.repeat(125));
	console.log(`${'Scenario'.padEnd(20)} | ${'Base (Avg)'.padStart(12)} | ${'New (Avg)'.padStart(12)} | ${'Diff (Avg)'.padStart(12)} | ${'Base (P95)'.padStart(12)} | ${'New (P95)'.padStart(12)} | ${'Diff (P95)'.padStart(12)}`);
	console.log('-'.repeat(125));

	// Colors for terminal
	const colorReset = '\x1b[0m';
	const colorRed = '\x1b[31m';
	const colorGreen = '\x1b[32m';

	for (const name in baseResults) {
		const base = baseResults[name];
		const current = currentResults[name];

		if (current) {
			const avgDiff = ((current.avg - base.avg) / base.avg) * 100;
			const p95Diff = ((current.p95 - base.p95) / base.p95) * 100;

			const avgDiffStr = `${avgDiff > 0 ? '+' : ''}${avgDiff.toFixed(2)}%`;
			const p95DiffStr = `${p95Diff > 0 ? '+' : ''}${p95Diff.toFixed(2)}%`;

			// Threshold for color coding: 0.5% change is considered significant
			const avgColor = avgDiff > 0.5 ? colorRed : (avgDiff < -0.5 ? colorGreen : colorReset);
			const p95Color = p95Diff > 0.5 ? colorRed : (p95Diff < -0.5 ? colorGreen : colorReset);

			console.log(`${name.padEnd(20)} | ${base.avg.toFixed(4).padStart(10)}ms | ${current.avg.toFixed(4).padStart(10)}ms | ${avgColor}${avgDiffStr.padStart(10)}${colorReset} | ${base.p95.toFixed(4).padStart(10)}ms | ${current.p95.toFixed(4).padStart(10)}ms | ${p95Color}${p95DiffStr.padStart(10)}${colorReset}`);
		}
	}
	console.log('-'.repeat(125));
	console.log('Note: Negative percentages mean improvement (faster), positive means regression (slower).');
} catch (err) {
	console.error('Error reading benchmark files:', err.message);
	process.exit(1);
}
