import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const severity = searchParams.get('severity')
    const source = searchParams.get('source')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

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
    const articles = await db.securityArticle.findMany({
      where,
      include: {
        cves: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: limit,
      skip: offset,
    })

    // Get statistics
    const [totalArticles, totalCves, criticalCount, highCount] = await Promise.all([
      db.securityArticle.count(),
      db.cve.count(),
      db.securityArticle.count({ where: { severityLevel: 'CRITICAL' } }),
      db.securityArticle.count({ where: { severityLevel: 'HIGH' } }),
    ])

    const stats = {
      totalArticles,
      totalCves,
      criticalCount,
      highCount,
    }

    return NextResponse.json({
      articles,
      stats,
      pagination: {
        limit,
        offset,
        total: await db.securityArticle.count({ where }),
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
