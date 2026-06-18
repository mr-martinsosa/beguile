import type { ZodType } from "zod";
import type { Validator } from "./types";

/**
 * Adapt a zod schema to a beguile `Validator`.
 *
 * zod is an OPTIONAL peer dependency. This adapter lives at the `beguile/zod`
 * subpath, imported only by code that uses zod, so the core `beguile` entry
 * never references zod in its types or at runtime. (In fact this needs only
 * zod's types: it calls `schema.safeParse`, which the caller's schema provides,
 * so the compiled output imports nothing from zod.)
 */
export function zodValidator<T>(schema: ZodType<T>): Validator<T> {
  return (input) => {
    const result = schema.safeParse(input);
    return result.success
      ? { ok: true, value: result.data }
      : { ok: false, error: result.error };
  };
}
