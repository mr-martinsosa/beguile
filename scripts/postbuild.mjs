import { readdirSync, copyFileSync } from "node:fs";
import { join } from "node:path";

// tsc emits ESM-flavored declarations (index.d.ts). Under node16/nodenext
// resolution a CJS consumer looks for a sibling .d.cts, and an unbundled
// declaration graph means each internal file needs its .d.cts too (index.d.cts
// imports ./parse, which must resolve to parse.d.cts). Declaration syntax is
// identical for both module formats, so copy every emitted .d.ts to a .d.cts.
// This reproduces what a dts bundler ships, without the deprecated baseUrl path.
const dir = "dist";
let copied = 0;
for (const file of readdirSync(dir)) {
  if (file.endsWith(".d.ts")) {
    copyFileSync(join(dir, file), join(dir, file.replace(/\.d\.ts$/, ".d.cts")));
    copied++;
  }
}
console.log(`postbuild: wrote ${copied} .d.cts declaration file(s)`);
