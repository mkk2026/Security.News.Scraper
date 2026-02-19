import { expect, test, mock, afterEach } from "bun:test";
import { scrapeRSSFeed } from "./web-scraper";
import { safeFetch } from "@/lib/security";

const mockSource = {
  id: 'test-source',
  name: 'Test Source',
  rssUrl: 'https://example.com/feed',
  baseUrl: 'https://example.com',
};

// Mock safeFetch
mock.module("@/lib/security", () => ({
  safeFetch: mock(() => Promise.resolve(new Response("<item><title>Test Article</title><link>https://example.com/article</link></item>"))),
  isSafeUrlAsync: mock(() => Promise.resolve(true))
}));

test("scrapeRSSFeed should use safeFetch", async () => {
  // Execute
  await scrapeRSSFeed(mockSource);

  // Verify
  // We need to access the mocked safeFetch
  const { safeFetch: mockedSafeFetch } = await import("@/lib/security");
  expect(mockedSafeFetch).toHaveBeenCalled();
  expect(mockedSafeFetch).toHaveBeenCalledWith(mockSource.rssUrl, expect.objectContaining({
    headers: expect.objectContaining({
      'User-Agent': expect.stringContaining('SecurityMonitor')
    })
  }));
});
