import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { beguile } from "../src/beguile";
import { RetryExhaustedError } from "../src/errors";
import { zodValidator } from "../src/zod";
import type { Validator } from "../src/types";

type User = { name: string };
const userValidator: Validator<User> = (input) => {
  if (
    typeof input === "object" &&
    input !== null &&
    typeof (input as Record<string, unknown>).name === "string"
  ) {
    return { ok: true, value: input as User };
  }
  return { ok: false, error: new Error("expected { name: string }") };
};

describe("beguile", () => {
  it("resolves on the first attempt when valid", async () => {
    const produce = vi.fn(() => '{"name":"Ada"}');
    const value = await beguile({ produce, validate: userValidator });
    expect(value).toEqual({ name: "Ada" });
    expect(produce).toHaveBeenCalledTimes(1);
  });

  it("retries and succeeds, feeding the error and output back", async () => {
    const produce = vi.fn((ctx) => {
      if (ctx.attempt === 1) return "not json";
      // the retry sees what failed last time
      expect(ctx.lastError).toBeInstanceOf(SyntaxError);
      expect(ctx.lastOutput).toBe("not json");
      return '{"name":"Ada"}';
    });
    const value = await beguile({ produce, validate: userValidator });
    expect(value).toEqual({ name: "Ada" });
    expect(produce).toHaveBeenCalledTimes(2);
  });

  it("supports async producers", async () => {
    const produce = async (ctx: { attempt: number }) =>
      ctx.attempt === 1 ? '{"bad":1}' : '{"name":"Ada"}';
    expect(await beguile({ produce, validate: userValidator })).toEqual({ name: "Ada" });
  });

  it("throws RetryExhaustedError after exhausting retries", async () => {
    const produce = vi.fn(() => "still bad");
    const promise = beguile({ produce, validate: userValidator, retries: 1 });
    await expect(promise).rejects.toBeInstanceOf(RetryExhaustedError);
    expect(produce).toHaveBeenCalledTimes(2); // 1 + retries
  });

  it("aggregates per-attempt errors and the last output on exhaustion", async () => {
    let caught: RetryExhaustedError | undefined;
    try {
      await beguile({ produce: () => "nope", validate: userValidator, retries: 2 });
    } catch (e) {
      caught = e as RetryExhaustedError;
    }
    expect(caught).toBeInstanceOf(RetryExhaustedError);
    expect(caught?.attempts).toBe(3);
    expect(caught?.errors).toHaveLength(3);
    expect(caught?.lastOutput).toBe("nope");
    expect(caught?.cause).toBe(caught?.errors[2]);
  });

  it("retries: 0 means exactly one attempt", async () => {
    const produce = vi.fn(() => "bad");
    await expect(
      beguile({ produce, validate: userValidator, retries: 0 }),
    ).rejects.toBeInstanceOf(RetryExhaustedError);
    expect(produce).toHaveBeenCalledTimes(1);
  });

  it("rejects with RangeError on an invalid retries value", async () => {
    await expect(
      beguile({ produce: () => "x", validate: userValidator, retries: -1 }),
    ).rejects.toBeInstanceOf(RangeError);
  });

  it("propagates a producer throw unchanged (does not wrap or retry it)", async () => {
    const boom = new Error("transport down");
    const produce = vi.fn(() => {
      throw boom;
    });
    await expect(beguile({ produce, validate: userValidator })).rejects.toBe(boom);
    expect(produce).toHaveBeenCalledTimes(1);
  });

  it("reports every attempt to onAttempt", async () => {
    const seen: string[] = [];
    await beguile({
      produce: (ctx) => (ctx.attempt === 1 ? "bad" : '{"name":"Ada"}'),
      validate: userValidator,
      onAttempt: (info) => seen.push(`${info.attempt}:${info.result.ok}`),
    });
    expect(seen).toEqual(["1:false", "2:true"]);
  });

  it("works end to end with zodValidator on fenced, self-correcting output", async () => {
    const schema = z.object({ name: z.string() });
    const produce = (ctx: { attempt: number }) =>
      ctx.attempt === 1 ? '```json\n{"name":42}\n```' : '```json\n{"name":"Ada"}\n```';
    const value = await beguile({ produce, validate: zodValidator(schema) });
    expect(value).toEqual({ name: "Ada" });
  });
});
