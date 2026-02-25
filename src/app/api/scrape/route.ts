import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { scrapeAllSources } from '@/lib/scrapers/web-scraper'
import { processScrapedArticles } from '@/lib/scrapers/article-processor'
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

    // Process articles in batch (optimized)
    const { newArticlesCount, newCvesCount } = await processScrapedArticles(scrapedArticles)

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
