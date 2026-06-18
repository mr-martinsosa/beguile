import type { Validator, Preprocess, ParseResult } from "./types";
import { tryParse } from "./parse";
import { RetryExhaustedError } from "./errors";

export interface RetryContext {
  /** 1-based number of the attempt about to run. */
  attempt: number;
  /** Error from the previous attempt; undefined on the first attempt. */
  lastError?: Error;
  /** Raw output from the previous attempt; undefined on the first attempt. */
  lastOutput?: string;
}

/**
 * Produces a candidate string for a single attempt. It receives the previous
 * attempt's error and output, so it can self-correct, for example by appending
 * "your last reply was invalid: <error>" to an LLM prompt. May be sync or async.
 */
export type Producer = (ctx: RetryContext) => string | Promise<string>;

/** Reported to `onAttempt` after each attempt, for logging or metrics. */
export interface AttemptInfo<T> {
  /** 1-based attempt number that just ran. */
  attempt: number;
  /** The raw string the producer returned. */
  output: string;
  /** The outcome of parsing and validating `output`. */
  result: ParseResult<T>;
}

export interface BeguileOptions<T> {
  /** Produces the candidate string for each attempt. */
  produce: Producer;
  /** Validates the parsed JSON. The schema-agnostic seam. */
  validate: Validator<T>;
  /**
   * How many times to retry after the first attempt. Default 2, i.e. up to 3
   * attempts in total. Must be a non-negative integer.
   */
  retries?: number;
  /** Cleans each raw string before JSON.parse. Defaults to `stripCodeFences`. */
  preprocess?: Preprocess;
  /**
   * Called synchronously after every attempt, for logging or metrics. A thrown
   * error propagates and aborts the loop. Keep it synchronous: a returned
   * promise is not awaited.
   */
  onAttempt?: (info: AttemptInfo<T>) => void;
}

/**
 * Coax schema-valid data out of an unreliable producer: produce a string,
 * parse and validate it, and on failure retry with the previous error and
 * output fed back so the producer can self-correct. Resolves with the validated
 * value, or rejects with `RetryExhaustedError` once all attempts are spent.
 *
 * Retries parse and validation failures only. A throw from `produce` itself
 * propagates unchanged (handle transport retries inside `produce`).
 */
export async function beguile<T>(options: BeguileOptions<T>): Promise<T> {
  const { produce, validate, preprocess, onAttempt } = options;
  const retries = options.retries ?? 2;
  if (!Number.isInteger(retries) || retries < 0) {
    throw new RangeError(`retries must be a non-negative integer, received ${retries}`);
  }

  const maxAttempts = retries + 1;
  const errors: Error[] = [];
  let lastError: Error | undefined;
  let lastOutput: string | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const output = await produce({ attempt, lastError, lastOutput });
    const result = tryParse(output, { validate, preprocess });
    onAttempt?.({ attempt, output, result });

    if (result.ok) return result.value;

    lastError = result.error;
    lastOutput = output;
    errors.push(result.error);
  }

  throw new RetryExhaustedError(errors, lastOutput);
}
