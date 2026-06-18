import type { Preprocess } from "./types";

/**
 * Strip a leading Markdown code fence (with any info string, e.g. ```` ```json ````,
 * ```` ```json5 ````, ```` ```javascript ````, or a bare ```` ``` ````) and a trailing
 * ```` ``` ````, trimming surrounding whitespace. Conservative by design: it only
 * removes a fence at the very start and end, so backticks inside the payload are
 * left alone. This is the default preprocess.
 */
export const stripCodeFences: Preprocess = (raw) =>
  raw
    .trim()
    .replace(/^```[^\n]*\r?\n/, "")
    .replace(/\r?\n?```$/, "")
    .trim();
