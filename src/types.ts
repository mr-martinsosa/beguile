/**
 * Result of a single parse + validate attempt. A discriminated union rather
 * than a thrown exception, so callers (including beguile's retry loop) can
 * branch on success without try/catch. Mirrors the shape of zod's safeParse.
 */
export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: Error };

/**
 * Validates unknown input and returns a ParseResult instead of throwing.
 *
 * This is the seam that keeps beguile validator-agnostic: zod, valibot, yup, or
 * a hand-written check all reduce to this one function type. See `beguile/zod`
 * for the bundled zod adapter, or write your own in a line or two.
 */
export type Validator<T> = (input: unknown) => ParseResult<T>;

/**
 * Transforms a raw string before it is handed to JSON.parse, e.g. stripping
 * Markdown code fences. See `stripCodeFences` for the default.
 */
export type Preprocess = (raw: string) => string;
