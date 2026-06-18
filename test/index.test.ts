import { describe, it, expect } from "vitest";
import * as beguile from "../src/index";

describe("public surface", () => {
  it("exports the public surface", () => {
    expect(typeof beguile.tryParse).toBe("function");
    expect(typeof beguile.stripCodeFences).toBe("function");
  });
});
