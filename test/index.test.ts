import { describe, it, expect } from "vitest";
import * as beguile from "../src/index";

describe("public surface", () => {
  it("exports the documented runtime values", () => {
    expect(typeof beguile.beguile).toBe("function");
    expect(typeof beguile.tryParse).toBe("function");
    expect(typeof beguile.stripCodeFences).toBe("function");
    expect(typeof beguile.RetryExhaustedError).toBe("function");
  });
});
