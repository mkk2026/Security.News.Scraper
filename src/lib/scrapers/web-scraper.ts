export interface ScrapedArticle {
  url: string
  title: string
  summary?: string
  content?: string
  source: string
  sourceName: string
  publishedAt: Date
}

export interface SecuritySource {
  id: string
  name: string
  rssUrl?: string
  baseUrl: string
}

// Security news sources
const SOURCES: SecuritySource[] = [
  {
    id: 'krebs',
    name: 'Krebs on Security',
    rssUrl: 'https://krebsonsecurity.com/feed/',
    baseUrl: 'https://krebsonsecurity.com',
  },
  {
    id: 'hacker-news',
    name: 'The Hacker News',
    rssUrl: 'https://thehackernews.com/feeds/posts/default',
    baseUrl: 'https://thehackernews.com',
  },
  {
    id: 'bleeping-computer',
    name: 'Bleeping Computer',
    rssUrl: 'https://www.bleepingcomputer.com/feed/',
    baseUrl: 'https://www.bleepingcomputer.com',
  },
  {
    id: 'security-week',
    name: 'Security Week',
    rssUrl: 'https://www.securityweek.com/feed',
    baseUrl: 'https://www.securityweek.com',
  },
]

/**
 * Fetch and parse RSS feed from a security source
 */
export async function scrapeRSSFeed(source: SecuritySource): Promise<ScrapedArticle[]> {
  if (!source.rssUrl) {
    console.log(`No RSS URL configured for ${source.name}`)
    return []
  }

  try {
    console.log(`Scraping RSS feed from ${source.name}...`)

    // Use the web-reader skill to fetch RSS content
    const response = await fetch(source.rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SecurityMonitor/1.0; +https://securitymonitor.example.com)',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const xmlContent = await response.text()
    const articles = parseRSSXML(xmlContent, source)

    console.log(`Found ${articles.length} articles from ${source.name}`)
    return articles
  } catch (error) {
    console.error(`Error scraping ${source.name}:`, error)
    return []
  }
}

/**
 * Parse RSS XML content and extract articles
 */
function parseRSSXML(xml: string, source: SecuritySource): ScrapedArticle[] {
  const articles: ScrapedArticle[] = []

  try {
    // Simple XML parsing - extract items using regex patterns
    const itemsRegex = /<item[^>]*>[\s\S]*?<\/item>/gi
    const items = xml.match(itemsRegex) || []

    for (const item of items) {
      // Extract title
      const titleMatch = item.match(/<title[^>]*>(.*?)<\/title>/is)
      const title = titleMatch ? cleanHTML(stripCDATA(titleMatch[1].trim())) : ''

      // Extract link
      const linkMatch = item.match(/<link[^>]*>(.*?)<\/link>/is)
      const link = linkMatch ? stripCDATA(linkMatch[1].trim()) : ''

      // Extract description/summary
      const descMatch = item.match(/<description[^>]*>(.*?)<\/description>/is)
      const description = descMatch ? stripCDATA(descMatch[1].trim()) : ''

      // Extract pubDate
      const pubDateMatch = item.match(/<pubDate[^>]*>(.*?)<\/pubDate>/is)
      const pubDate = pubDateMatch ? new Date(pubDateMatch[1].trim()) : new Date()

      // Extract content (if available in content:encoded)
      const contentMatch = item.match(/<content:encoded[^>]*>(.*?)<\/content:encoded>/is)
      const content = contentMatch ? stripCDATA(contentMatch[1].trim()) : undefined

      // Clean up HTML from description
      const summary = cleanHTML(description)

      if (title && link) {
        articles.push({
          url: link,
          title,
          summary: summary.substring(0, 500),
          content: cleanHTML(content || summary),
          source: source.id,
          sourceName: source.name,
          publishedAt: pubDate,
        })
      }
    }
  } catch (error) {
    console.error('Error parsing RSS XML:', error)
  }

  return articles
}

/**
 * Remove CDATA wrapper from XML content
 */
function stripCDATA(content: string): string {
  return content.replace(/^<!\[CDATA\[|\]\]>$/g, '')
}

/**
 * Remove HTML tags and clean up text
 */
function cleanHTML(html: string): string {
  if (!html) return ''

  // Remove HTML tags
  let text = html.replace(/<[^>]*>/g, ' ')

  // Decode HTML entities efficiently
  const replacements: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' '
  }

  text = text.replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, match => replacements[match])

  // Normalize whitespace
  return text.replace(/\s+/g, ' ').trim()
}

/**
 * Scrape all configured security sources
 */
export async function scrapeAllSources(): Promise<ScrapedArticle[]> {
  console.log('Starting to scrape all security sources...')

  // Fetch all sources in parallel.
  // Note: scrapeRSSFeed handles its own errors and returns [] on failure,
  // so Promise.all will not reject if a single source fails.
  const results = await Promise.all(SOURCES.map(source => scrapeRSSFeed(source)))
  const allArticles = results.flat()

  console.log(`Total articles scraped: ${allArticles.length}`)
  return allArticles
}

/**
 * Get list of available sources
 */
export function getSources(): SecuritySource[] {
  return SOURCES
}

/**
 * Get a specific source by ID
 */
export function getSourceById(id: string): SecuritySource | undefined {
  return SOURCES.find(s => s.id === id)
}
