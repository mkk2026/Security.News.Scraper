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
    let newCvesCount = 0

    // Process each scraped article
    for (const scraped of scrapedArticles) {
      try {
        // Check for duplicates by URL
        const existingArticle = await db.securityArticle.findUnique({
          where: { url: scraped.url },
          include: { cves: true },
        })

        if (existingArticle) {
          console.log(`Article already exists: ${scraped.title}`)
          continue
        }

        // Check for content duplicates (similar articles from different sources)
        const potentialDuplicates = await db.securityArticle.findMany({
          take: 10,
          orderBy: { publishedAt: 'desc' },
        })

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
          },
        })

        console.log(`Created article: ${article.title}`)

        // Create or link CVEs
        for (const cve of analysis.cves) {
          try {
            // Check if CVE already exists
            const existingCve = await db.cve.findUnique({
              where: { cveId: cve.cveId },
            })

            let cveRecord
            if (existingCve) {
              // Link existing CVE to this article
              cveRecord = existingCve
            } else {
              // Create new CVE
              cveRecord = await db.cve.create({
                data: {
                  cveId: cve.cveId,
                  cvssScore: cve.cvssScore,
                  severity: cve.severity,
                },
              })
              newCvesCount++
              console.log(`Created CVE: ${cve.cveId}`)
            }

            // Link CVE to article through the relation
            await db.securityArticle.update({
              where: { id: article.id },
              data: {
                cves: {
                  connect: { id: cveRecord.id },
                },
              },
            })
          } catch (cveError) {
            console.error(`Error processing CVE ${cve.cveId}:`, cveError)
          }
        }

        newArticlesCount++
      } catch (articleError) {
        console.error(`Error processing article ${scraped.title}:`, articleError)
      }
    }

    console.log(`Scraping complete. New articles: ${newArticlesCount}, New CVEs: ${newCvesCount}`)

    // Invalidate stats cache if new data was added
    if (newArticlesCount > 0 || newCvesCount > 0) {
      revalidateTag('dashboard-stats')
    }

    return NextResponse.json({
      success: true,
      message: `Successfully scraped and processed articles`,
      newArticles: newArticlesCount,
      newCves: newCvesCount,
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
