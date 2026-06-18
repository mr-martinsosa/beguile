import type { ZodType } from "zod";
import type { Validator } from "./types";

/**
 * Adapt a zod schema to a beguile `Validator`. Imported from `beguile/zod` so
 * that zod stays an optional peer dependency the core entry never references.
 */
export function zodValidator<T>(schema: ZodType<T>): Validator<T> {
  return (input) => {
    const result = schema.safeParse(input);
    return result.success
      ? { ok: true, value: result.data }
      : { ok: false, error: result.error };
  };
}
