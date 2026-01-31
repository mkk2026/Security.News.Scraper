import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [severityStats, sourceStats, topCves] = await Promise.all([
      db.securityArticle.groupBy({
        by: ['severityLevel'],
        _count: { id: true },
        where: { severityLevel: { not: null } }
      }),
      db.securityArticle.groupBy({
        by: ['source'],
        _count: { id: true }
      }),
      db.cve.findMany({
        include: { articles: { select: { id: true } } },
        orderBy: { articles: { _count: 'desc' } },
        take: 10
      })
    ])

    return NextResponse.json({
      success: true,
      data: {
        severityDistribution: severityStats.map(s => ({
          severity: s.severityLevel || 'UNKNOWN',
          count: s._count.id
        })),
        sourceDistribution: sourceStats.map(s => ({
          source: s.source,
          count: s._count.id
        })),
        topCves: topCves.map(c => ({
          cveId: c.cveId,
          articleCount: c.articles.length,
          cvssScore: c.cvssScore,
          severity: c.severity
        }))
      }
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch analytics' }, { status: 500 })
  }
}