import { describe, expect, test, mock, afterEach } from "bun:test";
import { scrapeRSSFeed } from "./web-scraper";

describe("web-scraper security", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    mock.restore();
  });

  test("scrapeRSSFeed uses safeFetch (verifying via redirect: manual)", async () => {
    let fetchOptions: RequestInit | undefined;

    global.fetch = mock(async (url, options) => {
      fetchOptions = options;
      return new Response("<rss></rss>");
    });

    await scrapeRSSFeed({
      id: "test",
      name: "Test",
      rssUrl: "http://example.com/feed",
      baseUrl: "http://example.com",
    });

    // Native fetch defaults to 'follow', safeFetch sets it to 'manual'
    // If this assertion fails, it means we are vulnerable to SSRF via redirects
    expect(fetchOptions?.redirect).toBe("manual");
  });
});
