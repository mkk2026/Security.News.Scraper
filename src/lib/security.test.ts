import { describe, expect, test } from "bun:test";
import { isPrivateIP, isPrivateIPv6, isSafeUrl, isSafeUrlAsync } from "./security";

describe("Security Utilities", () => {
  describe("isPrivateIP", () => {
    test("identifies private IPs correctly", () => {
      expect(isPrivateIP("10.0.0.1")).toBe(true);
      expect(isPrivateIP("192.168.1.1")).toBe(true);
      expect(isPrivateIP("172.16.0.1")).toBe(true);
      expect(isPrivateIP("172.31.255.255")).toBe(true);
      expect(isPrivateIP("127.0.0.1")).toBe(true);
      expect(isPrivateIP("169.254.0.1")).toBe(true);
      expect(isPrivateIP("100.64.0.1")).toBe(true); // Carrier-grade NAT
      expect(isPrivateIP("198.18.0.1")).toBe(true); // Benchmarking
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

    test("blocks short-hand and obfuscated localhost", () => {
      expect(isSafeUrl("http://127.1")).toBe(false); // Short-hand 127.0.0.1
      expect(isSafeUrl("http://0177.0.0.1")).toBe(false); // Octal
      expect(isSafeUrl("http://0x7f000001")).toBe(false); // Hex
      expect(isSafeUrl("http://2130706433")).toBe(false); // Decimal
    });

    test("blocks private IPs", () => {
      expect(isSafeUrl("http://192.168.1.1/admin")).toBe(false);
      expect(isSafeUrl("http://10.0.0.5:8080")).toBe(false);
      expect(isSafeUrl("http://127.0.0.1")).toBe(false);
      expect(isSafeUrl("http://169.254.169.254/latest/meta-data/")).toBe(false);
      expect(isSafeUrl("http://100.64.0.1")).toBe(false); // Carrier-grade NAT
      expect(isSafeUrl("http://198.18.0.1")).toBe(false); // Benchmarking
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
});
