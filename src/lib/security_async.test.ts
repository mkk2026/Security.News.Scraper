import { describe, expect, test, mock } from "bun:test";

const mockLookup = mock(async (hostname: string) => {
  if (hostname === 'localtest.me') return { address: '127.0.0.1', family: 4 };
  if (hostname === 'ipv6-local.com') return { address: '::1', family: 6 };
  if (hostname === 'example.com') return { address: '93.184.216.34', family: 4 };
  if (hostname === 'error.com') throw new Error("DNS Error");
  return { address: '0.0.0.0', family: 4 };
});

mock.module("node:dns/promises", () => ({
  lookup: mockLookup
}));

// Import after mocking
const { isSafeUrlAsync, isPrivateIPv6 } = await import("./security");

describe("Security Async Utilities", () => {
  describe("isPrivateIPv6", () => {
    test("identifies private IPv6 correctly", () => {
      expect(isPrivateIPv6("::")).toBe(true);
      expect(isPrivateIPv6("::1")).toBe(true);
      expect(isPrivateIPv6("fe80::1")).toBe(true);
      expect(isPrivateIPv6("fc00::1")).toBe(true);
      expect(isPrivateIPv6("fd00::1")).toBe(true);
      expect(isPrivateIPv6("::ffff:192.168.1.1")).toBe(true);
      expect(isPrivateIPv6("::ffff:127.0.0.1")).toBe(true);
    });

    test("identifies public IPv6 correctly", () => {
      expect(isPrivateIPv6("2001:db8::1")).toBe(false);
      expect(isPrivateIPv6("2607:f8b0:4005:801::200e")).toBe(false);
    });
  });

  describe("isSafeUrlAsync", () => {
    test("blocks domains resolving to private IPv4", async () => {
      expect(await isSafeUrlAsync("http://localtest.me")).toBe(false);
    });

    test("blocks domains resolving to private IPv6", async () => {
      expect(await isSafeUrlAsync("http://ipv6-local.com")).toBe(false);
    });

    test("allows domains resolving to public IPs", async () => {
      expect(await isSafeUrlAsync("http://example.com")).toBe(true);
    });

    test("fails closed on DNS error", async () => {
      expect(await isSafeUrlAsync("http://error.com")).toBe(false);
    });
  });
});
