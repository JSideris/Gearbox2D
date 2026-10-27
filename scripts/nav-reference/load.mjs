// Bundles the vendored g3e-ai planner (TypeScript) with esbuild and imports it, so the parity test and
// the benchmark run the exact JS that gear3engine ships. Set G3E_AI_SRC to a gear3engine
// plugins/g3e-ai/src directory to test against another version instead.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

export async function loadReference() {
	const here = path.dirname(fileURLToPath(import.meta.url));
	const dir = process.env.G3E_AI_SRC ? path.resolve(process.env.G3E_AI_SRC) : here;
	const entry = process.env.G3E_AI_SRC
		? { contents: `export { NavGrid } from "./nav-grid"; export { NavHierarchy } from "./nav-hierarchy";`, resolveDir: dir, loader: "ts" }
		: undefined;
	const res = await build({
		...(entry ? { stdin: entry } : { entryPoints: [path.join(here, "index.ts")] }),
		bundle: true,
		format: "esm",
		platform: "node",
		target: "node18",
		write: false,
	});
	const code = res.outputFiles[0].text;
	const mod = await import("data:text/javascript;base64," + Buffer.from(code).toString("base64"));
	return { ...mod, source: dir };
}
