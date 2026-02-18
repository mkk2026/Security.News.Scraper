'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  Shield,
  Zap,
  TrendingUp,
  Globe,
  Activity,
  Lock,
  Target,
  Clock,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { highlightCves, hasCves } from '@/lib/text-utils'

export interface Cve {
  id: string
  cveId: string
  description?: string
  cvssScore?: number
  severity?: string
  affectedSoftware?: string
}

export interface SecurityArticle {
  id: string
  url: string
  title: string
  summary?: string
  content?: string
  source: string
  sourceName: string
  publishedAt: string
  scrapedAt: string
  severityScore?: number
  severityLevel?: string
  cves: Cve[]
}

const SEVERITY_CONFIG = {
  CRITICAL: {
    gradient: 'from-red-500 to-red-600',
    bg: 'bg-red-500/10',
    border: 'border-red-200/50',
    text: 'text-red-600',
    icon: AlertCircle,
  },
  HIGH: {
    gradient: 'from-orange-500 to-amber-500',
    bg: 'bg-orange-500/10',
    border: 'border-orange-200/50',
    text: 'text-orange-600',
    icon: Zap,
  },
  MEDIUM: {
    gradient: 'from-yellow-500 to-amber-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-200/50',
    text: 'text-yellow-600',
    icon: TrendingUp,
  },
  LOW: {
    gradient: 'from-green-500 to-emerald-500',
    bg: 'bg-green-500/10',
    border: 'border-green-200/50',
    text: 'text-green-600',
    icon: Shield,
  },
}

function Computer(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="12" x="3" y="3" rx="2" />
      <path d="M21 18h-4l-1 4h-8l-1-4H3" />
    </svg>
  )
}

const SOURCE_CONFIG = {
  'krebs': {
    icon: Lock,
    gradient: 'from-purple-500/20 to-purple-600/20',
    border: 'border-purple-200/50',
    text: 'text-purple-700',
  },
  'hacker-news': {
    icon: Globe,
    gradient: 'from-blue-500/20 to-blue-600/20',
    border: 'border-blue-200/50',
    text: 'text-blue-700',
  },
  'bleeping-computer': {
    icon: Computer,
    gradient: 'from-green-500/20 to-green-600/20',
    border: 'border-green-200/50',
    text: 'text-green-700',
  },
  'security-week': {
    icon: Activity,
    gradient: 'from-orange-500/20 to-orange-600/20',
    border: 'border-orange-200/50',
    text: 'text-orange-700',
  },
}

interface ArticleCardProps {
  article: SecurityArticle
}

const ArticleCard = React.memo(({ article }: ArticleCardProps) => {
  const severityConfig = article.severityLevel ? SEVERITY_CONFIG[article.severityLevel as keyof typeof SEVERITY_CONFIG] : SEVERITY_CONFIG.LOW
  const sourceConfig = SOURCE_CONFIG[article.source as keyof typeof SOURCE_CONFIG] || SOURCE_CONFIG['hacker-news']
  const SeverityIcon = severityConfig.icon
  const SourceIcon = sourceConfig.icon

  return (
    <Card
      className={`
        relative overflow-hidden
        bg-gradient-to-br ${article.severityLevel === 'CRITICAL' ? 'from-red-50/80 to-orange-50/80 dark:from-red-950/30 dark:to-orange-950/30' : 'from-white to-slate-50/80 dark:from-slate-900/80 dark:to-slate-800/50'}
        border ${severityConfig.border} hover:border-primary/50
        hover:shadow-xl hover:shadow-primary/5
        transition-all duration-300
        group
      `}
    >
      {article.severityLevel === 'CRITICAL' && (
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-500 to-red-600" />
      )}

      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge
                variant="outline"
                className={`
                  bg-gradient-to-r ${sourceConfig.gradient}
                  ${sourceConfig.border} ${sourceConfig.text}
                  border px-3 py-1 gap-1.5 font-medium
                `}
              >
                <SourceIcon className="h-3 w-3" />
                {article.sourceName}
              </Badge>

              {article.severityLevel && (
                <Badge
                  className={`
                    bg-gradient-to-r ${severityConfig.gradient}
                    text-white px-3 py-1 gap-1.5 font-medium shadow-md
                  `}
                >
                  <SeverityIcon className="h-3 w-3" />
                  {article.severityLevel}
                </Badge>
              )}

              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help border-b border-dotted border-slate-400/50">
                      {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {new Date(article.publishedAt).toLocaleDateString()} at{' '}
                    {new Date(article.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </TooltipContent>
                </Tooltip>
              </span>
            </div>

            <CardTitle className="text-lg sm:text-xl leading-snug">
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors flex items-start gap-2 group/link focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm outline-none"
              >
                {hasCves(article.title) ? (
                  <span
                    className="line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: highlightCves(article.title) }}
                  />
                ) : (
                  <span className="line-clamp-2">{article.title}</span>
                )}
                <ExternalLink className="h-4 w-4 text-slate-400 group-hover/link:text-primary flex-shrink-0 mt-1 transition-colors" aria-hidden="true" />
                <span className="sr-only">(opens in new tab)</span>
              </a>
            </CardTitle>
          </div>

          {article.severityScore && (
            <div className={`
              flex-shrink-0 bg-gradient-to-br ${severityConfig.bg}
              border ${severityConfig.border}
              rounded-lg p-3 text-center min-w-[70px]
            `}>
              <div className={`text-2xl font-bold ${severityConfig.text}`}>
                {article.severityScore.toFixed(1)}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Score
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {article.summary && (
          hasCves(article.summary) ? (
            <p
              className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: highlightCves(article.summary) }}
            />
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {article.summary}
            </p>
          )
        )}

        {article.cves.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {article.cves.map((cve) => (
              <motion.a
                key={cve.id}
                href={`https://cve.mitre.org/cgi-bin/cvename.cgi?name=${cve.cveId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group/cve focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md outline-none"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Badge
                  variant="outline"
                  className={`
                    bg-slate-50 dark:bg-slate-800/50
                    border-slate-200 dark:border-slate-700
                    text-slate-700 dark:text-slate-300
                    px-3 py-1.5 gap-2 hover:border-primary hover:text-primary
                    transition-all cursor-pointer
                  `}
                >
                  {cve.cveId}
                  {cve.cvssScore && (
                    <span className="bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-600 px-1.5 py-0.5 rounded text-xs font-semibold">
                      CVSS: {cve.cvssScore}
                    </span>
                  )}
                </Badge>
                <span className="sr-only">(opens in new tab)</span>
              </motion.a>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/50">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors group/link focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md outline-none"
          >
            Read Full Article
            <span className="sr-only">(opens in new tab)</span>
            <ChevronRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
          </a>
          {article.cves.length > 0 && (
            <span className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-1">
              <Target className="h-3 w-3" />
              {article.cves.length} CVE{article.cves.length > 1 ? 's' : ''} detected
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
})

ArticleCard.displayName = 'ArticleCard'

export { ArticleCard }
