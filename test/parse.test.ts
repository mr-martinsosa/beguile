import { describe, it, expect } from "vitest";
import { tryParse } from "../src/parse";
import type { Validator } from "../src/types";

type User = { name: string };

// A hand-written validator: proof the seam needs no validation library at all.
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

describe("tryParse", () => {
  it("parses and validates clean JSON", () => {
    const r = tryParse('{"name":"Ada"}', { validate: userValidator });
    expect(r).toEqual({ ok: true, value: { name: "Ada" } });
  });

  it("parses fenced JSON via the default preprocess", () => {
    const r = tryParse('```json\n{"name":"Ada"}\n```', { validate: userValidator });
    expect(r.ok && r.value.name).toBe("Ada");
  });

  it("returns ok:false with a SyntaxError on non-JSON", () => {
    const r = tryParse("not json at all", { validate: userValidator });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toBeInstanceOf(SyntaxError);
      expect(r.error.cause).toBeInstanceOf(Error);
    }
  });

  it("surfaces the validator's error on a wrong shape", () => {
    const r = tryParse('{"nope":1}', { validate: userValidator });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/name/);
  });

  it("catches a throwing validator instead of propagating (never throws)", () => {
    const throwing: Validator<User> = () => {
      throw new Error("validator boom");
    };
    const r = tryParse('{"name":"Ada"}', { validate: throwing });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/boom/);
  });

  it("honors a custom preprocess", () => {
    const r = tryParse('DATA:{"name":"Ada"}', {
      validate: userValidator,
      preprocess: (s) => s.replace(/^DATA:/, ""),
    });
    expect(r.ok && r.value.name).toBe("Ada");
  });
});
