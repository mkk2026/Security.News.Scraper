import { describe, expect, test, mock, beforeEach } from "bun:test";
import { scrapeRSSFeed } from "./web-scraper";

// Mock safeFetch
const safeFetchMock = mock(async () => new Response(`
  <rss version="2.0">
    <channel>
      <item>
        <title>Test Article</title>
        <link>http://example.com/article</link>
        <description>Test Summary</description>
        <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
      </item>
    </channel>
  </rss>
`));

mock.module("@/lib/security", () => {
  return {
    safeFetch: safeFetchMock,
    isSafeUrl: () => true,
    isSafeUrlAsync: async () => true,
  };
});

describe("scrapeRSSFeed", () => {
  beforeEach(() => {
    safeFetchMock.mockClear();
  });

  test("uses safeFetch instead of native fetch", async () => {
    const source = {
      id: "test",
      name: "Test Source",
      rssUrl: "http://example.com/feed",
      baseUrl: "http://example.com",
    };

    const articles = await scrapeRSSFeed(source);

    expect(safeFetchMock).toHaveBeenCalled();
    expect(safeFetchMock).toHaveBeenCalledWith(source.rssUrl, expect.any(Object));
    expect(articles).toHaveLength(1);
    expect(articles[0].title).toBe("Test Article");
  });
});
