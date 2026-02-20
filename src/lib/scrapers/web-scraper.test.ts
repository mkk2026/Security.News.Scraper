
import { describe, expect, test, mock, beforeAll, afterAll } from "bun:test";
import { scrapeAllSources } from './web-scraper';

// Mock fetch globally
const originalFetch = global.fetch;

describe('Web Scraper', () => {
  beforeAll(() => {
    global.fetch = mock(async (url: string | URL | Request) => {
      const urlString = url.toString();

      if (urlString.includes('krebsonsecurity.com')) {
        return new Response(`
          <rss version="2.0">
            <channel>
              <title>Krebs on Security</title>
              <item>
                <title>Krebs Article 1</title>
                <link>https://krebsonsecurity.com/article1</link>
                <description>Description for Krebs Article 1</description>
                <pubDate>Mon, 01 Jan 2024 10:00:00 GMT</pubDate>
              </item>
            </channel>
          </rss>
        `);
      }

      if (urlString.includes('thehackernews.com')) {
        // Simulate failure for this source
        throw new Error('Network error');
      }

      // Default empty response for other sources to keep tests clean
      return new Response(`
        <rss version="2.0">
          <channel>
            <title>Other Source</title>
          </channel>
        </rss>
      `);
    });
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  test('scrapeAllSources should aggregate articles from successful sources and ignore failures', async () => {
    const articles = await scrapeAllSources();

    // Should contain articles from Krebs
    const krebsArticle = articles.find(a => a.title === 'Krebs Article 1');
    expect(krebsArticle).toBeDefined();
    expect(krebsArticle?.source).toBe('krebs');

    // Should handle the thrown error from Hacker News gracefully (by just not having those articles)
    // Since we only mocked one article from Krebs, we expect at least 1 article.
    expect(articles.length).toBeGreaterThanOrEqual(1);
  });
});
