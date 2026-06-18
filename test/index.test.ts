import { describe, it, expect } from "vitest";
import { ping } from "../src/index";

describe("scaffold", () => {
  it("builds, exports, and runs under vitest", () => {
    expect(ping()).toBe("pong");
  });
});
