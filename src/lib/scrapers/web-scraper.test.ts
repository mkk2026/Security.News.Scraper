import { expect, test, describe, mock } from "bun:test";
import { scrapeRSSFeed, type SecuritySource } from "./web-scraper";

describe("Web Scraper Security", () => {
  const mockSource: SecuritySource = {
    id: "test-source",
    name: "Test Source",
    rssUrl: "https://example.com/feed",
    baseUrl: "https://example.com",
  };

  test("should extract valid articles", async () => {
    const rssXml = `
      <rss>
        <channel>
          <item>
            <title>Valid Article</title>
            <link>https://example.com/article</link>
            <description>Summary</description>
            <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
          </item>
        </channel>
      </rss>
    `;

    global.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve(rssXml),
      } as Response)
    );

    const articles = await scrapeRSSFeed(mockSource);
    expect(articles).toHaveLength(1);
    expect(articles[0].url).toBe("https://example.com/article");
  });

  test("should reject unsafe URLs (javascript:)", async () => {
    const rssXml = `
      <rss>
        <channel>
          <item>
            <title>Malicious Article</title>
            <link>javascript:alert(1)</link>
            <description>Summary</description>
            <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
          </item>
        </channel>
      </rss>
    `;

    global.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve(rssXml),
      } as Response)
    );

    const articles = await scrapeRSSFeed(mockSource);

    // VERIFICATION: The article should be skipped
    expect(articles).toHaveLength(0);
  });

  test("should reject internal URLs (localhost)", async () => {
    const rssXml = `
      <rss>
        <channel>
          <item>
            <title>Internal Article</title>
            <link>http://localhost:3000/admin</link>
            <description>Summary</description>
            <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
          </item>
        </channel>
      </rss>
    `;

    global.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve(rssXml),
      } as Response)
    );

    const articles = await scrapeRSSFeed(mockSource);

    // VERIFICATION: The article should be skipped
    expect(articles).toHaveLength(0);
  });
});
