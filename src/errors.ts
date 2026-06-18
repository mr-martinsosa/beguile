/**
 * Thrown by `beguile` when every attempt fails to parse and validate.
 *
 * Aggregates the error from each attempt (so nothing is silently swallowed)
 * and the last raw output, for logging or a final human-readable diagnostic.
 */
export class RetryExhaustedError extends Error {
  /** Number of attempts made (equal to `errors.length`). */
  readonly attempts: number;
  /** The parse/validation error from each attempt, in order. */
  readonly errors: Error[];
  /** The raw string produced on the final attempt, if any. */
  readonly lastOutput: string | undefined;

  constructor(errors: Error[], lastOutput?: string) {
    const last = errors[errors.length - 1];
    super(
      `beguile failed after ${errors.length} attempt(s): ${last ? last.message : "no attempts made"}`,
      last ? { cause: last } : undefined,
    );
    this.name = "RetryExhaustedError";
    this.attempts = errors.length;
    this.errors = errors;
    this.lastOutput = lastOutput;
  }
}
