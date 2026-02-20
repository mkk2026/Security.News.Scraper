import { describe, it, expect, spyOn, beforeAll, afterAll } from 'bun:test'
import { scrapeRSSFeed } from './web-scraper'
import * as security from '../security'

describe('scrapeRSSFeed', () => {
  // Spy on safeFetch
  const safeFetchSpy = spyOn(security, 'safeFetch')

  // Mock global fetch to avoid actual network requests during test
  const originalFetch = global.fetch

  beforeAll(() => {
    global.fetch = async () => new Response('<rss><channel><item><title>Test Article</title><link>https://example.com/1</link><description>Summary</description></item></channel></rss>')
  })

  afterAll(() => {
    global.fetch = originalFetch
  })

  it('should use safeFetch to prevent SSRF', async () => {
    // Mock safeFetch to return a dummy response
    safeFetchSpy.mockResolvedValue(new Response('<rss><channel><item><title>Test Article</title><link>https://example.com/1</link><description>Summary</description></item></channel></rss>'))

    const source = {
      id: 'test',
      name: 'Test',
      rssUrl: 'https://example.com/feed',
      baseUrl: 'https://example.com'
    }

    await scrapeRSSFeed(source)

    expect(safeFetchSpy).toHaveBeenCalled()
  })
})
