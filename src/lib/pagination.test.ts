import { expect, test, describe } from "bun:test";
import { validatePagination } from "@/lib/pagination";

describe("validatePagination", () => {
  test("uses defaults when no params provided", () => {
    const { limit, offset } = validatePagination(null, null);
    expect(limit).toBe(100);
    expect(offset).toBe(0);
  });

  test("parses valid parameters", () => {
    const { limit, offset } = validatePagination("50", "10");
    expect(limit).toBe(50);
    expect(offset).toBe(10);
  });

  test("caps limit at 100", () => {
    const { limit, offset } = validatePagination("1000", "0");
    expect(limit).toBe(100);
    expect(offset).toBe(0);
  });

  test("enforces minimum limit of 1", () => {
    // 0 is invalid for limit (take: 0 is useless but maybe valid, but usually we want at least 1)
    // My code: if (limit < 1) limit = 100
    // So if limit is 0, it becomes 100.
    const { limit } = validatePagination("0", "0");
    expect(limit).toBe(100);

    const { limit: limitNegative } = validatePagination("-10", "0");
    expect(limitNegative).toBe(100);
  });

  test("handles invalid numbers", () => {
    const { limit, offset } = validatePagination("abc", "xyz");
    expect(limit).toBe(100);
    expect(offset).toBe(0);
  });

  test("enforces non-negative offset", () => {
    const { offset } = validatePagination("10", "-5");
    expect(offset).toBe(0);
  });
});
