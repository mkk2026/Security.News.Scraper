import { describe, expect, test } from "bun:test";
import { escapeHtml } from "./text-utils";

describe("escapeHtml", () => {
  test("escapes basic HTML characters", () => {
    expect(escapeHtml("<div>")).toBe("&lt;div&gt;");
  });

  test("escapes quotes and ampersands", () => {
    expect(escapeHtml('foo "bar" & baz')).toBe("foo &quot;bar&quot; &amp; baz");
  });

  test("escapes single quotes", () => {
    expect(escapeHtml("It's me")).toBe("It&#039;s me");
  });

  test("handles empty strings", () => {
    expect(escapeHtml("")).toBe("");
  });

  test("handles strings without special characters", () => {
    expect(escapeHtml("Hello World")).toBe("Hello World");
  });

  test("handles mixed content", () => {
    const input = `<script>alert('XSS "attack"')</script>`;
    const expected = "&lt;script&gt;alert(&#039;XSS &quot;attack&quot;&#039;)&lt;/script&gt;";
    expect(escapeHtml(input)).toBe(expected);
  });
});
