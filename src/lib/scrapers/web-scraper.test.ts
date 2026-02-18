import { mock, test, expect, describe, afterEach } from "bun:test";

// Mock safeFetch before importing web-scraper
const safeFetchMock = mock();
mock.module("@/lib/security", () => {
  return {
    safeFetch: safeFetchMock,
  };
});

import { scrapeRSSFeed } from "./web-scraper";

describe("Web Scraper", () => {
  afterEach(() => {
    safeFetchMock.mockReset();
  });

  test("returns empty array when safeFetch throws security error", async () => {
    safeFetchMock.mockRejectedValue(new Error("Security Violation: Unsafe URL blocked"));

    const source = {
      id: "test",
      name: "Test Source",
      rssUrl: "http://unsafe-internal-ip/feed",
      baseUrl: "http://unsafe-internal-ip",
    };

    const articles = await scrapeRSSFeed(source);
    expect(articles).toEqual([]);
    expect(safeFetchMock).toHaveBeenCalledTimes(1);
  });

  test("parses valid RSS feed correctly", async () => {
    const rssContent = `
      <rss version="2.0">
        <channel>
          <title>Security News</title>
          <item>
            <title>New Vulnerability</title>
            <link>http://example.com/vuln</link>
            <description>A critical vulnerability found.</description>
            <pubDate>Mon, 01 Jan 2024 10:00:00 GMT</pubDate>
          </item>
        </channel>
      </rss>
    `;

    safeFetchMock.mockResolvedValue(new Response(rssContent));

    const source = {
      id: "test",
      name: "Test Source",
      rssUrl: "http://example.com/feed",
      baseUrl: "http://example.com",
    };

    const articles = await scrapeRSSFeed(source);
    expect(articles).toHaveLength(1);
    expect(articles[0].title).toBe("New Vulnerability");
    expect(articles[0].url).toBe("http://example.com/vuln");
    expect(safeFetchMock).toHaveBeenCalledTimes(1);
  });
});
