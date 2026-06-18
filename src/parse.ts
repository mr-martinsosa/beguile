import type { ParseResult, Validator, Preprocess } from "./types";
import { stripCodeFences } from "./preprocess";

export interface TryParseOptions<T> {
  /** Validates the parsed JSON. The seam that makes the library schema-agnostic. */
  validate: Validator<T>;
  /** Cleans the raw string before JSON.parse. Defaults to `stripCodeFences`. */
  preprocess?: Preprocess;
}

/**
 * Parse a string as JSON and validate it against a schema, in a single shot.
 *
 * The pipeline is preprocess -> JSON.parse -> validate. It never throws: a
 * parse failure, and any error thrown by the validator, are returned as
 * `{ ok: false, error }`. Callers branch on `.ok`. `beguile`'s retry loop is
 * built directly on top of this.
 */
export function tryParse<T>(raw: string, options: TryParseOptions<T>): ParseResult<T> {
  const preprocess = options.preprocess ?? stripCodeFences;
  const cleaned = preprocess(raw);

  let json: unknown;
  try {
    json = JSON.parse(cleaned);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    return {
      ok: false,
      error: new SyntaxError(`Response was not valid JSON: ${message}`, { cause }),
    };
  }

  try {
    return options.validate(json);
  } catch (cause) {
    return { ok: false, error: cause instanceof Error ? cause : new Error(String(cause)) };
  }
}
