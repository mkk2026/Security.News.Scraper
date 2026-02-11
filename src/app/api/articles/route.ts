import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { db } from '@/lib/db'
import { validatePagination } from '@/lib/pagination'

// Cache dashboard statistics to reduce DB load
// Revalidates every 60 seconds or when manually invalidated
const getStats = unstable_cache(
  async () => {
    const [totalArticles, totalCves, criticalCount, highCount] = await Promise.all([
      db.securityArticle.count(),
      db.cve.count(),
      db.securityArticle.count({ where: { severityLevel: 'CRITICAL' } }),
      db.securityArticle.count({ where: { severityLevel: 'HIGH' } }),
    ])

    return {
      totalArticles,
      totalCves,
      criticalCount,
      highCount,
    }
  },
  ['dashboard-stats'],
  {
    revalidate: 60,
    tags: ['dashboard-stats'],
  }
)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const severity = searchParams.get('severity')
    const source = searchParams.get('source')
    const search = searchParams.get('search')
    const { limit, offset } = validatePagination(
      searchParams.get('limit'),
      searchParams.get('offset')
    )

    // Build where clause
    const where: any = {}

    if (severity && severity !== 'all') {
      where.severityLevel = severity
    }

    if (source && source !== 'all') {
      where.source = source
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
        { cves: { some: { cveId: { contains: search, mode: 'insensitive' } } } },
      ]
    }

    // Fetch articles with related CVEs
    // Optimized: Select only necessary fields to reduce payload size
    const articlesPromise = db.securityArticle.findMany({
      where,
      select: {
        id: true,
        url: true,
        title: true,
        summary: true,
        source: true,
        sourceName: true,
        publishedAt: true,
        scrapedAt: true,
        severityScore: true,
        severityLevel: true,
        cves: {
          select: {
            id: true,
            cveId: true,
            cvssScore: true,
            severity: true,
            affectedSoftware: true,
          },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: limit,
      skip: offset,
    })

    // Get statistics (cached)
    const statsPromise = getStats()

    // Get total count for pagination
    const totalPromise = db.securityArticle.count({ where })

    // Execute queries in parallel to reduce latency
    const [articles, stats, total] = await Promise.all([
      articlesPromise,
      statsPromise,
      totalPromise,
    ])

    return NextResponse.json({
      articles,
      stats,
      pagination: {
        limit,
        offset,
        total,
      },
    })
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    )
  }
}
