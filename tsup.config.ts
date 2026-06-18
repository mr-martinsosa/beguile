import { defineConfig } from "tsup";

// Dual-publish the JavaScript: ESM (dist/index.js) + CJS (dist/index.cjs).
//
// Declarations are intentionally NOT built here (`dts: false`). tsup's dts
// bundler hardcodes the `baseUrl` compiler option, which TypeScript 6 has
// deprecated and TypeScript 7 will remove. Rather than silence that with
// `ignoreDeprecations`, the build script emits declarations with plain `tsc`
// (see package.json), which never sets baseUrl. Standard TS, no deprecated path.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: false,
  clean: true,
  sourcemap: true,
  treeshake: true,
  target: "node20",
});
