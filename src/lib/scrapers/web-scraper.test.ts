import { describe, expect, test, mock, afterEach } from "bun:test";
import { scrapeRSSFeed, getSources } from "./web-scraper";

describe("Web Scraper Security", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test("should block javascript: URLs in RSS feed", async () => {
    // Mock fetch to return malicious XML
    const maliciousXml = `<?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <title>Malicious Feed</title>
          <item>
            <title>XSS Attack</title>
            <link>javascript:alert(1)</link>
            <description>Malicious content</description>
            <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
          </item>
          <item>
            <title>Valid Article</title>
            <link>https://example.com/valid</link>
            <description>Valid content</description>
            <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
          </item>
        </channel>
      </rss>
    `;

    global.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve(maliciousXml),
      } as Response)
    );

    // Use the first available source for testing
    const sources = getSources();
    const source = sources[0];

    const articles = await scrapeRSSFeed(source);

    // Verify valid article is present
    const validArticle = articles.find(a => a.title === "Valid Article");
    expect(validArticle).toBeDefined();
    expect(validArticle?.url).toBe("https://example.com/valid");

    // Vulnerability check: Verify malicious article is NOT present
    // This expectation will FAIL before the fix because currently it accepts everything
    const maliciousArticle = articles.find(a => a.title === "XSS Attack");
    expect(maliciousArticle).toBeUndefined();
  });
});
