import { expect, test, mock, describe, beforeAll, afterAll } from "bun:test";
import { scrapeAllSources } from "./web-scraper";

describe("Web Scraper Performance", () => {
  const originalFetch = global.fetch;

  test("scrapeAllSources runs in parallel", async () => {
    // Mock fetch with a 100ms delay per request
    global.fetch = mock(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return new Response(`
        <rss>
          <channel>
            <item>
              <title>Test Article</title>
              <link>http://example.com/article</link>
              <description>Test Description</description>
              <pubDate>Mon, 01 Jan 2024 12:00:00 GMT</pubDate>
            </item>
          </channel>
        </rss>
      `);
    });

    const start = performance.now();
    await scrapeAllSources();
    const end = performance.now();
    const duration = end - start;

    console.log(`Scraping duration: ${duration.toFixed(2)}ms`);

    // Restore original fetch
    global.fetch = originalFetch;

    // There are 4 sources.
    // Sequential execution: ~400ms (4 * 100ms) + overhead
    // Parallel execution: ~100ms (max(100ms)) + overhead
    // We expect < 300ms if parallelized properly.
    expect(duration).toBeLessThan(300);
  });
});
