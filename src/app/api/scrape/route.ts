import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { db } from '@/lib/db'
import { scrapeAllSources } from '@/lib/scrapers/web-scraper'
import { analyzeArticleContent, generateContentHash, isDuplicateArticle } from '@/lib/scrapers/cve-extractor'
import { validateApiRequest } from '@/lib/auth'

export async function POST(request: NextRequest) {
  if (!validateApiRequest(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    console.log('Starting scrape request...')

    // Scrape articles from all sources
    const scrapedArticles = await scrapeAllSources()

    if (scrapedArticles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No articles found',
        newArticles: 0,
        newCves: 0,
      })
    }

    console.log(`Processing ${scrapedArticles.length} scraped articles...`)

    let newArticlesCount = 0

    // Optimization: Batch check for existing URLs to avoid N queries
    const urls = scrapedArticles.map(a => a.url)
    const existingArticles = await db.securityArticle.findMany({
      where: { url: { in: urls } },
      select: { url: true }
    })
    const existingUrls = new Set(existingArticles.map(a => a.url))

    // Optimization: Fetch recent articles once for duplicate checking
    // Instead of querying inside the loop (N queries), we fetch once.
    const recentArticles = await db.securityArticle.findMany({
      take: 50,
      orderBy: { publishedAt: 'desc' },
      select: { title: true, summary: true }
    })

    // Create a mutable array to track articles for duplicate detection
    // including ones we add in this batch
    const potentialDuplicates = recentArticles.map(a => ({
      title: a.title,
      summary: a.summary
    }))

    // Process each scraped article
    for (const scraped of scrapedArticles) {
      try {
        // Check for duplicates by URL (in-memory check)
        if (existingUrls.has(scraped.url)) {
          console.log(`Article already exists: ${scraped.title}`)
          continue
        }

        // Check for content duplicates (in-memory check)
        const isDuplicate = potentialDuplicates.some(existing =>
          isDuplicateArticle(
            existing.title,
            existing.summary ?? undefined,
            scraped.title,
            scraped.summary
          )
        )

        if (isDuplicate) {
          console.log(`Duplicate article detected: ${scraped.title}`)
          continue
        }

        // Analyze article content for CVEs and severity
        const analysis = analyzeArticleContent(scraped.title, scraped.summary, scraped.content)

        // Generate content hash
        const contentHash = generateContentHash(`${scraped.title} ${scraped.summary || ''}`)

        // Create article
        // Optimization: Use connectOrCreate to handle CVEs in the same query
        // This avoids N * (1 query per CVE) + N updates
        const article = await db.securityArticle.create({
          data: {
            url: scraped.url,
            title: scraped.title,
            summary: scraped.summary,
            content: scraped.content,
            source: scraped.source,
            sourceName: scraped.sourceName,
            publishedAt: scraped.publishedAt,
            severityScore: analysis.severityScore,
            severityLevel: analysis.severityLevel,
            contentHash,
            cves: {
              connectOrCreate: analysis.cves.map(cve => ({
                where: { cveId: cve.cveId },
                create: {
                  cveId: cve.cveId,
                  cvssScore: cve.cvssScore,
                  severity: cve.severity,
                }
              }))
            }
          },
        })

        console.log(`Created article: ${article.title}`)

        // Update potentialDuplicates for subsequent iterations in this batch
        potentialDuplicates.push({
          title: scraped.title,
          summary: scraped.summary
        })

        newArticlesCount++
      } catch (articleError) {
        console.error(`Error processing article ${scraped.title}:`, articleError)
      }
    }

    console.log(`Scraping complete. New articles: ${newArticlesCount}`)

    // Invalidate stats cache if new data was added
    if (newArticlesCount > 0) {
      revalidateTag('dashboard-stats')
    }

    return NextResponse.json({
      success: true,
      message: `Successfully scraped and processed articles`,
      newArticles: newArticlesCount,
      // Note: newCves count is no longer exact due to connectOrCreate optimization
      // We could count analysis.cves length but that includes existing ones.
      // Omitted for performance.
      totalProcessed: scrapedArticles.length,
    })
  } catch (error) {
    console.error('Error in scrape API:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to scrape articles',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
