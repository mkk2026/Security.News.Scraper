import { db } from '@/lib/db'
import { ScrapedArticle } from './web-scraper'
import { analyzeArticleContent, generateContentHash, isDuplicateArticle } from './cve-extractor'

export async function processScrapedArticles(scrapedArticles: ScrapedArticle[]) {
  if (scrapedArticles.length === 0) {
    return { newArticlesCount: 0, newCvesCount: 0 }
  }

  // Batch 1: Get existing URLs
  const urls = scrapedArticles.map((a) => a.url)
  const existingArticles = await db.securityArticle.findMany({
    where: { url: { in: urls } },
    select: { url: true },
  })
  const existingUrls = new Set(existingArticles.map((a) => a.url))

  // Batch 2: Get recent articles for duplicate checking
  // We fetch a window of recent articles to compare against to detect content duplicates
  const recentArticles = await db.securityArticle.findMany({
    take: 100,
    orderBy: { publishedAt: 'desc' },
    select: { title: true, summary: true },
  })

  // We'll maintain a mutable list of recent articles to check against
  // so we catch duplicates within the current batch
  const recentArticlesList = [...recentArticles]

  let newArticlesCount = 0
  let newCvesCount = 0

  for (const scraped of scrapedArticles) {
    // 1. URL Check
    if (existingUrls.has(scraped.url)) {
      continue
    }

    // 2. Content Duplicate Check
    const isDuplicate = recentArticlesList.some((existing) =>
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

    // Process Valid Article
    try {
      const analysis = analyzeArticleContent(
        scraped.title,
        scraped.summary,
        scraped.content
      )
      const contentHash = generateContentHash(
        `${scraped.title} ${scraped.summary || ''}`
      )

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
      newArticlesCount++

      // Add to recent list for subsequent checks in this batch
      recentArticlesList.unshift({
        title: article.title,
        summary: article.summary,
      })

      // Process CVEs
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
    } catch (articleError) {
      console.error(`Error processing article ${scraped.title}:`, articleError)
    }
  }

  return { newArticlesCount, newCvesCount }
}
