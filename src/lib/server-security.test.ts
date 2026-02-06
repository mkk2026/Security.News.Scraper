import { describe, expect, test, mock } from "bun:test";
import { isSafeUrlWithDns } from "./server-security";

// Mock dns/promises
mock.module("dns/promises", () => {
  return {
    default: {
      lookup: mock((hostname: string) => {
        if (hostname === "localtest.me") {
          return Promise.resolve({ address: "127.0.0.1", family: 4 });
        }
        if (hostname === "google.com") {
          return Promise.resolve({ address: "8.8.8.8", family: 4 });
        }
        if (hostname === "internal.corp") {
          return Promise.resolve({ address: "10.0.0.5", family: 4 });
        }
        if (hostname === "broken-dns.com") {
          return Promise.reject(new Error("DNS Error"));
        }
        return Promise.resolve({ address: "1.1.1.1", family: 4 }); // Default fallback safe IP
      }),
    },
    lookup: mock((hostname: string) => {
       if (hostname === "localtest.me") {
          return Promise.resolve({ address: "127.0.0.1", family: 4 });
        }
        if (hostname === "google.com") {
          return Promise.resolve({ address: "8.8.8.8", family: 4 });
        }
        if (hostname === "internal.corp") {
          return Promise.resolve({ address: "10.0.0.5", family: 4 });
        }
        if (hostname === "broken-dns.com") {
          return Promise.reject(new Error("DNS Error"));
        }
        return Promise.resolve({ address: "1.1.1.1", family: 4 });
    })
  };
});

describe("Server Security Utilities", () => {
  describe("isSafeUrlWithDns", () => {
    test("allows safe public URLs with safe IP", async () => {
      // Mocking google.com -> 8.8.8.8 (Public)
      const result = await isSafeUrlWithDns("https://google.com");
      expect(result).toBe(true);
    });

    test("blocks URLs that resolve to localhost IP (DNS Rebinding prevention)", async () => {
      // Mocking localtest.me -> 127.0.0.1 (Private)
      const result = await isSafeUrlWithDns("http://localtest.me");
      expect(result).toBe(false);
    });

    test("blocks URLs that resolve to private LAN IP", async () => {
      // Mocking internal.corp -> 10.0.0.5 (Private)
      const result = await isSafeUrlWithDns("http://internal.corp");
      expect(result).toBe(false);
    });

    test("blocks localhost (isSafeUrl check)", async () => {
      // This is caught by the sync isSafeUrl before DNS lookup
      const result = await isSafeUrlWithDns("http://localhost");
      expect(result).toBe(false);
    });

    test("blocks direct private IPs (isSafeUrl check)", async () => {
        const result = await isSafeUrlWithDns("http://192.168.1.1");
        expect(result).toBe(false);
    });

    test("fails securely on DNS error", async () => {
      const result = await isSafeUrlWithDns("http://broken-dns.com");
      expect(result).toBe(false);
    });
  });
});
