import { expect, test, describe } from "bun:test";
import { escapeHtml, highlightCves, hasCves } from "./text-utils";

describe("text-utils", () => {
  describe("hasCves", () => {
    test("returns true for uppercase CVE", () => {
      expect(hasCves("CVE-2023-1234")).toBe(true);
    });

    test("returns true for lowercase CVE", () => {
      expect(hasCves("cve-2023-1234")).toBe(true);
    });

    test("returns true for mixed case CVE", () => {
      expect(hasCves("CvE-2023-1234")).toBe(true);
    });

    test("returns true for text containing CVE", () => {
      expect(hasCves("This contains CVE-2023-1234")).toBe(true);
    });

    test("returns false for text without CVE", () => {
      expect(hasCves("No vulnerabilities found")).toBe(false);
    });

    test("returns false for empty string", () => {
      expect(hasCves("")).toBe(false);
    });
  });

  describe("escapeHtml", () => {
    test("escapes special characters", () => {
      const input = '<script>alert("XSS")</script> & \'test\'';
      const expected = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt; &amp; &#039;test&#039;';
      expect(escapeHtml(input)).toBe(expected);
    });

    test("returns original string if no special characters", () => {
      const input = "Hello World";
      expect(escapeHtml(input)).toBe(input);
    });

    test("handles empty string", () => {
      expect(escapeHtml("")).toBe("");
    });
  });

  describe("highlightCves", () => {
    test("highlights single CVE", () => {
      const input = "Vulnerability found in CVE-2023-12345.";
      const expected = 'Vulnerability found in <span class="bg-gradient-to-r from-amber-200 to-orange-200 text-slate-900 font-bold px-1.5 py-0.5 rounded text-xs border border-amber-300/50">CVE-2023-12345</span>.';
      expect(highlightCves(input)).toBe(expected);
    });

    test("highlights multiple CVEs", () => {
      const input = "CVE-2023-0001 and CVE-2023-0002 are critical.";
      const expected = '<span class="bg-gradient-to-r from-amber-200 to-orange-200 text-slate-900 font-bold px-1.5 py-0.5 rounded text-xs border border-amber-300/50">CVE-2023-0001</span> and <span class="bg-gradient-to-r from-amber-200 to-orange-200 text-slate-900 font-bold px-1.5 py-0.5 rounded text-xs border border-amber-300/50">CVE-2023-0002</span> are critical.';
      expect(highlightCves(input)).toBe(expected);
    });

    test("escapes HTML in input", () => {
      const input = "<b>CVE-2023-12345</b>";
      const expected = '&lt;b&gt;<span class="bg-gradient-to-r from-amber-200 to-orange-200 text-slate-900 font-bold px-1.5 py-0.5 rounded text-xs border border-amber-300/50">CVE-2023-12345</span>&lt;/b&gt;';
      expect(highlightCves(input)).toBe(expected);
    });

    test("handles case insensitivity", () => {
      const input = "cve-2023-12345";
      const expected = '<span class="bg-gradient-to-r from-amber-200 to-orange-200 text-slate-900 font-bold px-1.5 py-0.5 rounded text-xs border border-amber-300/50">cve-2023-12345</span>';
      expect(highlightCves(input)).toBe(expected);
    });
  });
});
