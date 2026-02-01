import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Optimized: Removed unused thirtyDaysAgo calculation

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
      // Optimized: Use _count aggregation instead of fetching all article IDs
      db.cve.findMany({
        select: {
          cveId: true,
          cvssScore: true,
          severity: true,
          _count: {
            select: { articles: true }
          }
        },
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
          articleCount: c._count.articles,
          cvssScore: c.cvssScore,
          severity: c.severity
        }))
      }
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch analytics' }, { status: 500 })
  }
}