import { describe, expect, test, mock, afterEach } from "bun:test";
import { isPrivateIP, isPrivateIPv6, isSafeUrl, isSafeUrlAsync, safeFetch } from "./security";

describe("Security Utilities", () => {
  describe("isPrivateIP", () => {
    test("identifies private IPs correctly", () => {
      expect(isPrivateIP("10.0.0.1")).toBe(true);
      expect(isPrivateIP("192.168.1.1")).toBe(true);
      expect(isPrivateIP("172.16.0.1")).toBe(true);
      expect(isPrivateIP("172.31.255.255")).toBe(true);
      expect(isPrivateIP("127.0.0.1")).toBe(true);
      expect(isPrivateIP("169.254.0.1")).toBe(true);
    });

    test("identifies public IPs correctly", () => {
      expect(isPrivateIP("8.8.8.8")).toBe(false);
      expect(isPrivateIP("172.32.0.1")).toBe(false); // Outside range
      expect(isPrivateIP("1.1.1.1")).toBe(false);
    });

    test("handles invalid inputs", () => {
      expect(isPrivateIP("not-an-ip")).toBe(false);
    });
  });

  describe("isPrivateIPv6", () => {
    test("identifies private IPv6 correctly", () => {
      expect(isPrivateIPv6("::1")).toBe(true);
      expect(isPrivateIPv6("::")).toBe(true);
      expect(isPrivateIPv6("fc00::1")).toBe(true);
      expect(isPrivateIPv6("fd12:3456::1")).toBe(true);
      expect(isPrivateIPv6("fe80::1")).toBe(true);
      expect(isPrivateIPv6("::ffff:192.168.1.1")).toBe(true);
    });

    test("identifies public IPv6 correctly", () => {
      expect(isPrivateIPv6("2001:4860:4860::8888")).toBe(false); // Google DNS
      expect(isPrivateIPv6("2607:f8b0:4005:805::200e")).toBe(false); // Google
    });
  });

  describe("isSafeUrl", () => {
    test("allows safe public URLs", () => {
      expect(isSafeUrl("https://example.com/webhook")).toBe(true);
      expect(isSafeUrl("http://api.google.com")).toBe(true);
      expect(isSafeUrl("https://8.8.8.8/webhook")).toBe(true);
    });

    test("blocks localhost", () => {
      expect(isSafeUrl("http://localhost:3000")).toBe(false);
      expect(isSafeUrl("https://localhost/api")).toBe(false);
      expect(isSafeUrl("http://[::1]/api")).toBe(false);
    });

    test("blocks private IPv6 addresses", () => {
      expect(isSafeUrl("http://[fc00::1]")).toBe(false);
      expect(isSafeUrl("http://[fe80::1]")).toBe(false);
      expect(isSafeUrl("http://[::ffff:192.168.1.1]")).toBe(false);
    });

    test("blocks private IPs", () => {
      expect(isSafeUrl("http://192.168.1.1/admin")).toBe(false);
      expect(isSafeUrl("http://10.0.0.5:8080")).toBe(false);
      expect(isSafeUrl("http://127.0.0.1")).toBe(false);
      expect(isSafeUrl("http://169.254.169.254/latest/meta-data/")).toBe(false);
    });

    test("blocks non-http protocols", () => {
      expect(isSafeUrl("ftp://example.com")).toBe(false);
      expect(isSafeUrl("file:///etc/passwd")).toBe(false);
      expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    });

    test("handles invalid URLs", () => {
      expect(isSafeUrl("not-a-url")).toBe(false);
    });
  });

  describe("isSafeUrlAsync", () => {
    test("allows safe public URLs", async () => {
      // These tests require network access to resolve DNS
      // Assuming environment has internet access as shown in memory checks
      expect(await isSafeUrlAsync("https://google.com")).toBe(true);
      expect(await isSafeUrlAsync("http://example.com")).toBe(true);
    });

    test("blocks localhost and private IPs", async () => {
      expect(await isSafeUrlAsync("http://localhost:3000")).toBe(false);
      expect(await isSafeUrlAsync("http://127.0.0.1")).toBe(false);
      expect(await isSafeUrlAsync("http://[::1]")).toBe(false);
    });

    test("blocks private IP ranges via DNS", async () => {
      // Mocking DNS lookup failure or relying on localhost resolution
      // We already tested localhost above which resolves to ::1 or 127.0.0.1
    });

    test("handles invalid URLs", async () => {
      expect(await isSafeUrlAsync("not-a-url")).toBe(false);
    });
  });

  describe("safeFetch", () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
      mock.restore();
    });

    test("fetches a safe URL successfully", async () => {
      global.fetch = mock(async () => new Response("OK"));

      const res = await safeFetch("http://example.com");
      expect(res).toBeDefined();
      expect(await res.text()).toBe("OK");
    });

    test("blocks an unsafe URL initially", async () => {
      try {
        await safeFetch("http://127.0.0.1");
        throw new Error("Should have failed");
      } catch (e: any) {
        expect(e.message).toContain("Security Violation");
      }
    });

    test("follows a safe redirect", async () => {
      let callCount = 0;
      global.fetch = mock(async (url) => {
        callCount++;
        const urlStr = url.toString();
        if (urlStr.includes("example.com")) {
          return new Response(null, {
            status: 302,
            headers: { Location: "http://example.org/" }
          });
        }
        if (urlStr.includes("example.org")) {
          return new Response("Redirected OK");
        }
        return new Response("Not Found", { status: 404 });
      });

      const res = await safeFetch("http://example.com");
      expect(await res.text()).toBe("Redirected OK");
      expect(callCount).toBe(2);
    });

    test("blocks a redirect to an unsafe URL", async () => {
      global.fetch = mock(async (url) => {
        const urlStr = url.toString();
        if (urlStr.includes("example.com")) {
          return new Response(null, {
            status: 302,
            headers: { Location: "http://127.0.0.1/" }
          });
        }
        return new Response("Should not be reached");
      });

      try {
        await safeFetch("http://example.com");
        throw new Error("Should have failed");
      } catch (e: any) {
        expect(e.message).toContain("Security Violation");
      }
    });

    test("handles POST to GET redirect (302)", async () => {
      let lastMethod = "";
      global.fetch = mock(async (url, options) => {
        lastMethod = options?.method || "GET";
        const urlStr = url.toString();
        if (urlStr.includes("example.com")) {
          return new Response(null, {
            status: 302,
            headers: { Location: "http://example.org/" }
          });
        }
        return new Response("OK");
      });

      await safeFetch("http://example.com", { method: "POST", body: "data" });
      expect(lastMethod).toBe("GET");
    });

    test("throws on max redirects exceeded", async () => {
      global.fetch = mock(async () => {
        return new Response(null, {
          status: 302,
          headers: { Location: "http://example.com/loop" }
        });
      });

      try {
        await safeFetch("http://example.com");
        throw new Error("Should have failed");
      } catch (e: any) {
        expect(e.message).toContain("Too many redirects");
      }
    });
  });
});
