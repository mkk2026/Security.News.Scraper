import { expect, test, mock, describe, beforeEach, afterAll } from "bun:test";
import { scrapeAllSources, getSources } from "./web-scraper";

// Keep a reference to the original fetch
const originalFetch = global.fetch;

describe("web-scraper", () => {
  const sources = getSources();

  beforeEach(() => {
    // Reset fetch mock before each test
    global.fetch = originalFetch;
  });

  afterAll(() => {
    // Restore original fetch after all tests
    global.fetch = originalFetch;
  });

  test("scrapeAllSources fetches all sources and combines results", async () => {
    const mockXml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <title>Test Feed</title>
          <item>
            <title>Test Article</title>
            <link>https://example.com/article</link>
            <description>Test Description</description>
            <pubDate>Mon, 01 Jan 2024 12:00:00 GMT</pubDate>
          </item>
        </channel>
      </rss>
    `;

    const mockFetch = mock(() =>
      Promise.resolve(new Response(mockXml, { status: 200 }))
    );
    global.fetch = mockFetch;

    const articles = await scrapeAllSources();

    // Each source returns 1 article, so total articles = sources.length
    expect(articles).toHaveLength(sources.length);
    expect(mockFetch).toHaveBeenCalledTimes(sources.length);

    // Verify all URLs were called
    const calledUrls = mockFetch.mock.calls.map(call => call[0]);
    sources.forEach((source) => {
      if (source.rssUrl) {
        expect(calledUrls).toContain(source.rssUrl);
      }
    });
  });

  test("scrapeAllSources handles errors gracefully", async () => {
     let callCount = 0;
     const mockFetch = mock(() => {
       callCount++;
       // Fail for the first call
       if (callCount === 1) {
         return Promise.reject(new Error("Network error"));
       }

       const mockXml = `
         <?xml version="1.0" encoding="UTF-8"?>
         <rss version="2.0">
           <channel>
             <title>Test Feed</title>
             <item>
               <title>Test Article ${callCount}</title>
               <link>https://example.com/article${callCount}</link>
               <description>Test Description</description>
               <pubDate>Mon, 01 Jan 2024 12:00:00 GMT</pubDate>
             </item>
           </channel>
         </rss>
       `;
       return Promise.resolve(new Response(mockXml, { status: 200 }));
     });
     global.fetch = mockFetch;

     const articles = await scrapeAllSources();

     // One failed, others succeeded. Since we have 4 sources, we expect 3 articles.
     // (Assuming getSources returns 4 sources)
     expect(articles.length).toBe(sources.length - 1);
     expect(mockFetch).toHaveBeenCalledTimes(sources.length);
  });
});
