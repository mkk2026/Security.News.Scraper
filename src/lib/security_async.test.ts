import { describe, expect, test, mock } from "bun:test";
import { isSafeUrlAsync } from "./security";

mock.module("node:dns", () => {
  return {
    default: {
      promises: {
        lookup: async (hostname: string, options: any) => {
            if (hostname === "malicious.local") {
                if (options?.all) return [{ address: "127.0.0.1", family: 4 }];
                return { address: "127.0.0.1", family: 4 };
            }
            if (hostname === "private.internal") {
                if (options?.all) return [{ address: "10.0.0.1", family: 4 }];
                return { address: "10.0.0.1", family: 4 };
            }
            if (hostname === "google.com") {
                if (options?.all) return [{ address: "8.8.8.8", family: 4 }];
                return { address: "8.8.8.8", family: 4 };
            }
            if (hostname === "ipv6.loopback") {
                if (options?.all) return [{ address: "::1", family: 6 }];
                return { address: "::1", family: 6 };
            }
            if (hostname === "ipv6.unique") {
                if (options?.all) return [{ address: "fd00::1", family: 6 }];
                return { address: "fd00::1", family: 6 };
            }
            if (hostname === "ipv6.linklocal") {
                if (options?.all) return [{ address: "fe80::1", family: 6 }];
                return { address: "fe80::1", family: 6 };
            }
            if (hostname === "ipv6.mapped") {
                if (options?.all) return [{ address: "::ffff:192.168.1.1", family: 6 }];
                return { address: "::ffff:192.168.1.1", family: 6 };
            }
            throw new Error("ENOTFOUND");
        }
      }
    }
  };
});

describe("isSafeUrlAsync", () => {
  test("allows safe public URLs", async () => {
    expect(await isSafeUrlAsync("https://google.com/webhook")).toBe(true);
  });

  test("blocks domain resolving to localhost", async () => {
    expect(await isSafeUrlAsync("http://malicious.local/api")).toBe(false);
  });

  test("blocks domain resolving to private IP", async () => {
    expect(await isSafeUrlAsync("http://private.internal/secret")).toBe(false);
  });

  test("blocks direct private IP", async () => {
    expect(await isSafeUrlAsync("http://127.0.0.1/api")).toBe(false);
  });

  test("blocks invalid URL", async () => {
      expect(await isSafeUrlAsync("not-a-url")).toBe(false);
  });

  // IPv6 tests
  test("blocks IPv6 loopback", async () => {
      expect(await isSafeUrlAsync("http://ipv6.loopback/")).toBe(false);
  });
  test("blocks IPv6 unique local", async () => {
      expect(await isSafeUrlAsync("http://ipv6.unique/")).toBe(false);
  });
  test("blocks IPv6 link local", async () => {
      expect(await isSafeUrlAsync("http://ipv6.linklocal/")).toBe(false);
  });
  test("blocks IPv4-mapped IPv6 private address", async () => {
      expect(await isSafeUrlAsync("http://ipv6.mapped/")).toBe(false);
  });
});
