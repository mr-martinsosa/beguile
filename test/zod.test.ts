import { describe, it, expect } from "vitest";
import { z } from "zod";
import { zodValidator } from "../src/zod";
import { tryParse } from "../src/parse";

const schema = z.object({ name: z.string(), age: z.number() });

describe("zodValidator", () => {
  it("returns ok:true with typed data on a match", () => {
    const validate = zodValidator(schema);
    const r = validate({ name: "Ada", age: 36 });
    expect(r).toEqual({ ok: true, value: { name: "Ada", age: 36 } });
  });

  it("returns ok:false with a ZodError on a mismatch", () => {
    const validate = zodValidator(schema);
    const r = validate({ name: "Ada" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBeInstanceOf(z.ZodError);
  });

  it("composes with tryParse on a fenced response", () => {
    const r = tryParse('```json\n{"name":"Ada","age":36}\n```', {
      validate: zodValidator(schema),
    });
    expect(r.ok && r.value.age).toBe(36);
  });
});
