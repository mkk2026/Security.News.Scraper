import { describe, expect, test, spyOn } from "bun:test";
import { scrapeRSSFeed } from "./web-scraper";

describe("Web Scraper Security", () => {
  test("blocks localhost URLs via safeFetch", async () => {
    const consoleSpy = spyOn(console, 'error').mockImplementation(() => {});

    const source = {
      id: 'test-local',
      name: 'Test Local Source',
      rssUrl: 'http://localhost:3000/feed.xml',
      baseUrl: 'http://localhost:3000'
    };

    const articles = await scrapeRSSFeed(source);

    expect(articles).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error scraping Test Local Source'),
      expect.objectContaining({ message: expect.stringContaining('Security Violation') })
    );

    consoleSpy.mockRestore();
  });
});
