import { describe, it, expect } from "vitest";
import { generateRefCode } from "../generateRefCode";

describe("generateRefCode", () => {
  it("returns a string matching the expected format", () => {
    const code = generateRefCode();
    expect(code).toMatch(/^#SEE-\d{4}-\d{4}$/);
  });

  it("includes the current year", () => {
    const code = generateRefCode();
    const year = new Date().getFullYear();
    expect(code).toContain(`#SEE-${year}-`);
  });

  it("generates a 4-digit random number between 1000 and 9999", () => {
    const code = generateRefCode();
    const num = parseInt(code.split("-").pop()!, 10);
    expect(num).toBeGreaterThanOrEqual(1000);
    expect(num).toBeLessThanOrEqual(9999);
  });

  it("generates different codes on multiple calls", () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateRefCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});
