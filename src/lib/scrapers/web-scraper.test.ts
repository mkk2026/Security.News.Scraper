import { describe, expect, test, mock, beforeAll, afterAll } from "bun:test";
import { scrapeRSSFeed, type SecuritySource } from "./web-scraper";
import * as security from "../security";

const xmlContent = `
<rss version="2.0">
  <channel>
    <item>
      <title>Test Security Article</title>
      <link>http://example.com/article/1</link>
      <description>This is a test summary about a security vulnerability.</description>
      <pubDate>Mon, 01 Jan 2024 12:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>
`;

// Spy on safeFetch
// We can't easily spy on the imported function if we don't mock the module.
// But if we mock the module, we replace the implementation.
// That's fine, we want to verify it's called.

mock.module("../security", () => {
  return {
    // We can't easily spread the original module here because it's being evaluated.
    // But we can just mock safeFetch.
    safeFetch: mock(async (url) => {
      return new Response(xmlContent, { status: 200 });
    }),
    isSafeUrl: mock(() => true),
    isSafeUrlAsync: mock(async () => true),
    isPrivateIP: mock(() => false),
    isPrivateIPv6: mock(() => false),
    validateApiRequest: mock(() => true),
  };
});

// Import the mocked module to get access to the spy
import { safeFetch } from "../security";

describe("Web Scraper", () => {
  const source: SecuritySource = {
    id: "test",
    name: "Test Source",
    rssUrl: "http://example.com/feed",
    baseUrl: "http://example.com",
  };

  test("scrapeRSSFeed calls safeFetch", async () => {
    const articles = await scrapeRSSFeed(source);

    expect(articles).toHaveLength(1);
    expect(articles[0].title).toBe("Test Security Article");

    // Verify safeFetch was called
    expect(safeFetch).toHaveBeenCalled();
    expect(safeFetch).toHaveBeenCalledWith(source.rssUrl, expect.any(Object));
  });
});
