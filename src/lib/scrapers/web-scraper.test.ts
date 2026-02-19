import { expect, test, describe, mock, beforeAll, afterAll } from "bun:test";
import { scrapeAllSources, getSources } from "./web-scraper";

describe("web-scraper", () => {
  const originalFetch = global.fetch;

  beforeAll(() => {
    // Basic mock implementation for functional tests
    global.fetch = mock(async (url) => {
      return new Response(`
        <rss>
          <channel>
            <item>
              <title>Test Article from ${url}</title>
              <link>${url}/article</link>
              <description>Test Description</description>
              <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
            </item>
          </channel>
        </rss>
      `);
    });
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  test("scrapeAllSources fetches from all sources", async () => {
    const sources = getSources();
    const articles = await scrapeAllSources();

    // Check that we got results
    expect(articles.length).toBe(sources.length);

    // Check that fetch was called for each source
    expect(global.fetch).toHaveBeenCalledTimes(sources.length);
  });

  test("scrapeAllSources runs in parallel", async () => {
    // Reset mock
    (global.fetch as any).mockClear();

    // Add delay to mock
    global.fetch = mock(async () => {
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
      return new Response("<rss></rss>");
    });

    const start = performance.now();
    await scrapeAllSources();
    const end = performance.now();

    const duration = end - start;
    const sourcesCount = getSources().length;

    // If sequential: ~100ms * 4 = ~400ms
    // If parallel: ~100ms

    // We expect it to be FASTER than sequential execution
    // Sequential would be at least sourcesCount * 100ms
    // We allow a small buffer for execution overhead
    const sequentialThreshold = sourcesCount * 90; // 360ms

    // This assertion will FAIL if code is sequential (which it is currently)
    // We use this to verify the optimization later.
    expect(duration).toBeLessThan(sequentialThreshold);
  });
});
