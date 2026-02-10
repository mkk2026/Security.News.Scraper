import { describe, expect, test } from "bun:test";
import { isPrivateIP, isSafeUrl, isPrivateIPv6, isSafeUrlAsync } from "./security";

describe("Security Utilities", () => {
  describe("isPrivateIP", () => {
    test("identifies private IPv4 correctly", () => {
      expect(isPrivateIP("10.0.0.1")).toBe(true);
      expect(isPrivateIP("192.168.1.1")).toBe(true);
      expect(isPrivateIP("172.16.0.1")).toBe(true);
      expect(isPrivateIP("172.31.255.255")).toBe(true);
      expect(isPrivateIP("127.0.0.1")).toBe(true);
      expect(isPrivateIP("169.254.0.1")).toBe(true);
    });

    test("identifies private IPv6 correctly", () => {
      expect(isPrivateIP("::1")).toBe(true);
      expect(isPrivateIP("fc00::1")).toBe(true);
      expect(isPrivateIP("fe80::1")).toBe(true);
    });

    test("identifies public IPs correctly", () => {
      expect(isPrivateIP("8.8.8.8")).toBe(false);
      expect(isPrivateIP("172.32.0.1")).toBe(false); // Outside range
      expect(isPrivateIP("1.1.1.1")).toBe(false);
      expect(isPrivateIP("2606:4700:4700::1111")).toBe(false); // Cloudflare IPv6
    });

    test("handles invalid inputs", () => {
      expect(isPrivateIP("not-an-ip")).toBe(false);
    });
  });

  describe("isPrivateIPv6", () => {
    test("identifies loopback", () => {
      expect(isPrivateIPv6("::1")).toBe(true);
      expect(isPrivateIPv6("0:0:0:0:0:0:0:1")).toBe(true);
    });

    test("identifies unique local", () => {
      expect(isPrivateIPv6("fc00::1")).toBe(true);
      expect(isPrivateIPv6("fd00::1")).toBe(true);
    });

    test("identifies link local", () => {
      expect(isPrivateIPv6("fe80::1")).toBe(true);
      expect(isPrivateIPv6("feb0::1")).toBe(true);
    });

    test("identifies ipv4 mapped", () => {
      expect(isPrivateIPv6("::ffff:127.0.0.1")).toBe(true);
      expect(isPrivateIPv6("::ffff:192.168.1.1")).toBe(true);
      expect(isPrivateIPv6("::ffff:8.8.8.8")).toBe(false);
    });

    test("identifies public ipv6", () => {
        expect(isPrivateIPv6("2001:4860:4860::8888")).toBe(false); // Google
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

    test("blocks ipv6 literals", () => {
        expect(isSafeUrl("http://[::1]")).toBe(false);
        expect(isSafeUrl("http://[fc00::1]")).toBe(false);
    });
  });

  describe("isSafeUrlAsync", () => {
    test("allows safe public domains", async () => {
      expect(await isSafeUrlAsync("https://google.com")).toBe(true);
      expect(await isSafeUrlAsync("https://example.com")).toBe(true);
    });

    test("blocks localhost domains", async () => {
      expect(await isSafeUrlAsync("http://localhost")).toBe(false);
    });

    test("blocks ip literals", async () => {
        expect(await isSafeUrlAsync("http://127.0.0.1")).toBe(false);
        expect(await isSafeUrlAsync("http://192.168.1.1")).toBe(false);
    });
  });
});
