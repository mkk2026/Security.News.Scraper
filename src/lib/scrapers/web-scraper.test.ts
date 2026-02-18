import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { scrapeAllSources, getSources } from "./web-scraper";

describe("web-scraper performance", () => {
  const originalFetch = global.fetch;
  const delay = 100;

  beforeAll(() => {
    // Mock fetch to simulate delay
    global.fetch = async () => {
      await new Promise(resolve => setTimeout(resolve, delay));
      return new Response("<rss></rss>", { status: 200 });
    };
  });

  afterAll(() => {
    // Restore fetch
    global.fetch = originalFetch;
  });

  it("should scrape sources in parallel", async () => {
    const sources = getSources();
    const sourcesCount = sources.length;
    console.log(`Testing with ${sourcesCount} sources`);

    const start = performance.now();
    await scrapeAllSources();
    const end = performance.now();
    const duration = end - start;

    console.log(`Duration: ${duration.toFixed(2)}ms`);

    // Parallel execution: duration should be roughly equal to max delay (100ms)
    // We allow some overhead (up to 200ms total)
    expect(duration).toBeLessThan(200);
  });
});
