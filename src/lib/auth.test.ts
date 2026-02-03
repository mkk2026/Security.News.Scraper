import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { validateApiRequest } from "./auth";

describe("validateApiRequest", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    process.env.API_SECRET_TOKEN = "secret-token-123";
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  test("returns true for valid token", () => {
    const req = new Request("http://localhost", {
      headers: {
        Authorization: "Bearer secret-token-123",
      },
    });
    expect(validateApiRequest(req)).toBe(true);
  });

  test("returns false for invalid token", () => {
    const req = new Request("http://localhost", {
      headers: {
        Authorization: "Bearer wrong-token",
      },
    });
    expect(validateApiRequest(req)).toBe(false);
  });

  test("returns false for missing header", () => {
    const req = new Request("http://localhost");
    expect(validateApiRequest(req)).toBe(false);
  });

  test("returns false for malformed header", () => {
    const req = new Request("http://localhost", {
      headers: {
        Authorization: "Basic secret-token-123",
      },
    });
    expect(validateApiRequest(req)).toBe(false);
  });

  test("returns false when API_SECRET_TOKEN is not set", () => {
    delete process.env.API_SECRET_TOKEN;
    const req = new Request("http://localhost", {
      headers: {
        Authorization: "Bearer secret-token-123",
      },
    });
    // This logs an error, which is expected
    expect(validateApiRequest(req)).toBe(false);
  });

  test("returns false for token of different length", () => {
      const req = new Request("http://localhost", {
        headers: {
          Authorization: "Bearer secret-token-1234",
        },
      });
      expect(validateApiRequest(req)).toBe(false);
  });
});
