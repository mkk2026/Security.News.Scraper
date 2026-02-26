import { describe, it, expect, mock, beforeEach } from 'bun:test'

// Create a mock function for safeFetch
const mockSafeFetch = mock(() => Promise.resolve(new Response('<rss></rss>')))

// Mock the security module
// This must be called before importing the module that uses it
mock.module('@/lib/security', () => ({
  safeFetch: mockSafeFetch
}))

describe('Web Scraper Security', () => {
  let scrapeRSSFeed: any;

  beforeEach(async () => {
    mockSafeFetch.mockClear()
    mockSafeFetch.mockResolvedValue(new Response('<rss></rss>'))

    // Dynamically import the module to ensure the mock is applied
    // This bypasses static import hoisting
    const scraperModule = await import('./web-scraper')
    scrapeRSSFeed = scraperModule.scrapeRSSFeed
  })

  it('should use safeFetch for RSS feeds', async () => {
    const source = {
      id: 'test-source',
      name: 'Test Source',
      rssUrl: 'https://example.com/feed',
      baseUrl: 'https://example.com'
    }

    await scrapeRSSFeed(source)

    expect(mockSafeFetch).toHaveBeenCalledTimes(1)
    // Verify arguments: url and options
    // The first argument should be the RSS URL
    expect(mockSafeFetch.mock.calls[0][0]).toBe(source.rssUrl)
    // The second argument should contain User-Agent header
    const options = mockSafeFetch.mock.calls[0][1] as any
    expect(options.headers['User-Agent']).toContain('SecurityMonitor')
  })

  it('should handle security errors gracefully', async () => {
    // Simulate a security violation (e.g. blocked unsafe URL)
    mockSafeFetch.mockRejectedValue(new Error('Security Violation: Unsafe URL blocked'))

    const source = {
      id: 'unsafe-source',
      name: 'Unsafe Source',
      rssUrl: 'http://unsafe.com/feed',
      baseUrl: 'http://unsafe.com'
    }

    const result = await scrapeRSSFeed(source)

    // Should catch the error and return empty array
    expect(result).toEqual([])
    expect(mockSafeFetch).toHaveBeenCalledTimes(1)
  })
})
