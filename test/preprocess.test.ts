import { describe, it, expect } from "vitest";
import { stripCodeFences } from "../src/preprocess";

describe("stripCodeFences", () => {
  it("trims plain JSON without touching it", () => {
    expect(stripCodeFences('  {"a":1}  ')).toBe('{"a":1}');
  });

  it("strips a ```json fence", () => {
    expect(stripCodeFences('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it("strips a bare ``` fence", () => {
    expect(stripCodeFences('```\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it("leaves backticks inside the payload alone", () => {
    expect(stripCodeFences('{"a":"`x`"}')).toBe('{"a":"`x`"}');
  });
});
