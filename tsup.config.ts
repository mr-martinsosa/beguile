import { defineConfig } from "tsup";

// Bundle both JS and type declarations to a single self-contained file per
// entry (ESM, CJS, .d.ts, .d.cts). Bundled declarations are what keep the types
// resolvable under node16/nodenext: an unbundled `tsc` emit ships extensionless
// relative imports (e.g. `from "./types"`) that fail node16 resolution and that
// @arethetypeswrong/cli flags. A bundled .d.ts has no internal imports at all.
//
// tsup's declaration bundler still sets the `baseUrl` compiler option, which
// TypeScript 6 deprecates; `ignoreDeprecations` in tsconfig.json silences that.
// It is a build-time-only concession to the bundler and never reaches consumers.
export default defineConfig({
  entry: ["src/index.ts", "src/zod.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  target: "node20",
});
