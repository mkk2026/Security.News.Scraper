'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Shield,
  AlertTriangle,
  Zap,
  Newspaper,
  RefreshCw,
  Search,
  Filter,
  Clock,
  ExternalLink,
  TrendingUp,
  Lock,
  Radar,
  Activity,
  ChevronRight,
  Globe,
  BarChart3,
  Target,
  AlertCircle,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from '@/hooks/use-toast'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { AnalyticsSkeleton } from '@/components/AnalyticsSkeleton'
import { ArticleListSkeleton } from '@/components/ArticleListSkeleton'

const AnalyticsDashboard = dynamic(() => import('@/components/AnalyticsDashboard'), {
  ssr: false,
  loading: () => <AnalyticsSkeleton />
})

interface Cve {
  id: string
  cveId: string
  description?: string
  cvssScore?: number
  severity?: string
  affectedSoftware?: string
}

interface SecurityArticle {
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

interface Stats {
  totalArticles: number
  totalCves: number
  criticalCount: number
  highCount: number
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

function Computer(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="12" x="3" y="3" rx="2" />
      <path d="M21 18h-4l-1 4h-8l-1-4H3" />
    </svg>
  )
}

export default function SecurityDashboard() {
  const [articles, setArticles] = useState<SecurityArticle[]>([])
  const [stats, setStats] = useState<Stats>({ totalArticles: 0, totalCves: 0, criticalCount: 0, highCount: 0 })
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')

  const fetchArticles = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/articles')
      if (!response.ok) throw new Error('Failed to fetch articles')
      const data = await response.json()
      setArticles(data.articles || [])
      setStats(data.stats || { totalArticles: 0, totalCves: 0, criticalCount: 0, highCount: 0 })
      setLastUpdated(new Date().toISOString())
    } catch (error) {
      console.error('Error fetching articles:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch security articles',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const triggerScrape = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/scrape', { method: 'POST' })
      if (!response.ok) throw new Error('Scraping failed')
      const data = await response.json()
      toast({
        title: '✅ Scraping Complete',
        description: `Found ${data.newArticles} new articles with ${data.newCves} new CVEs`,
      })
      await fetchArticles()
    } catch (error) {
      console.error('Error scraping:', error)
      toast({
        title: '❌ Scraping Error',
        description: 'Failed to scrape security news',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArticles()
  }, [])

  const baseFilteredArticles = useMemo(() => {
    let filtered = articles

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(query) ||
        article.summary?.toLowerCase().includes(query) ||
        article.cves.some(cve => cve.cveId.toLowerCase().includes(query)) ||
        article.cves.some(cve => cve.affectedSoftware?.toLowerCase().includes(query))
      )
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter(article => article.severityLevel === severityFilter)
    }

    if (sourceFilter !== 'all') {
      filtered = filtered.filter(article => article.source === sourceFilter)
    }

    return filtered
  }, [articles, searchQuery, severityFilter, sourceFilter])

  const escapeHtml = (unsafe: string) => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  const highlightCves = (text: string) => {
    const escaped = escapeHtml(text);
    const cveRegex = /CVE-\d{4}-\d{4,}/gi
    return escaped.replace(cveRegex, (match) => `<span class="bg-gradient-to-r from-amber-200 to-orange-200 text-slate-900 font-bold px-1.5 py-0.5 rounded text-xs border border-amber-300/50">${match}</span>`)
  }

  const displayedArticles = useMemo(() => {
    let result = baseFilteredArticles

    if (activeTab === 'critical') {
      result = result.filter(article => article.severityLevel === 'CRITICAL' || article.cves.some(cve => cve.severity === 'CRITICAL'))
    }

    if (activeTab === 'recent') {
      // Create a shallow copy before sorting to avoid mutating the original array
      result = [...result].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()).slice(0, 10)
    }

    return result
  }, [baseFilteredArticles, activeTab])

  const hasFilters = searchQuery || severityFilter !== 'all' || sourceFilter !== 'all' || activeTab !== 'all'
  const hasActiveFilters = searchQuery || severityFilter !== 'all' || sourceFilter !== 'all'

  const clearFilters = () => {
    setSearchQuery('')
    setSeverityFilter('all')
    setSourceFilter('all')
    setActiveTab('all')
  }

  const resetFilters = () => {
    setSearchQuery('')
    setSeverityFilter('all')
    setSourceFilter('all')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-orange-500/5 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      <div className="relative flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-slate-950/70 border-b border-slate-200/50 dark:border-slate-800/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-20">
              <div className="flex items-center gap-4">
                <motion.div
                  className="relative bg-gradient-to-br from-primary to-primary/80 p-2.5 rounded-xl shadow-lg shadow-primary/25"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Shield className="h-6 w-6 text-white" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                </motion.div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
                    Threat Monitor
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Real-time security intelligence</p>
                </div>
              </div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={triggerScrape}
                  disabled={loading}
                  aria-label={loading ? "Scraping in progress" : "Scrape security news"}
                  className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25 gap-2"
                  size="lg"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Scrape Now</span>
                </Button>
              </motion.div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main id="main-content" className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Card className="relative overflow-hidden bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/50 border-slate-200/50 dark:border-slate-800/50 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      Total Articles
                    </CardTitle>
                    <div className="bg-blue-500/10 p-2.5 rounded-lg">
                      <Newspaper className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalArticles}</div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Security news articles</p>
                    </div>
                    <div className="bg-blue-500/10 text-blue-600 text-xs px-2 py-1 rounded-full font-medium">
                      <TrendingUp className="h-3 w-3 inline mr-1" />
                      Live
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="delay-100"
            >
              <Card className="relative overflow-hidden bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/50 border-slate-200/50 dark:border-slate-800/50 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      Total CVEs
                    </CardTitle>
                    <div className="bg-purple-500/10 p-2.5 rounded-lg">
                      <Shield className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalCves}</div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Vulnerabilities tracked</p>
                    </div>
                    <div className="bg-purple-500/10 text-purple-600 text-xs px-2 py-1 rounded-full font-medium">
                      <Radar className="h-3 w-3 inline mr-1" />
                      Active
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="delay-200"
            >
              <Card className="relative overflow-hidden bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-red-200/50 dark:border-red-800/50 shadow-lg shadow-red-500/10">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-bl-full" />
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-red-700 dark:text-red-400">
                      Critical
                    </CardTitle>
                    <div className="bg-red-500/20 p-2.5 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-3xl font-bold text-red-600">{stats.criticalCount}</div>
                      <p className="text-xs text-red-500/70 mt-1">Urgent action required</p>
                    </div>
                    <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium animate-pulse">
                      <AlertCircle className="h-3 w-3 inline mr-1" />
                      Alert
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="delay-300"
            >
              <Card className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200/50 dark:border-orange-800/50 shadow-lg shadow-orange-500/10">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-bl-full" />
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                      High Risk
                    </CardTitle>
                    <div className="bg-orange-500/20 p-2.5 rounded-lg">
                      <Zap className="h-5 w-5 text-orange-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-3xl font-bold text-orange-600">{stats.highCount}</div>
                      <p className="text-xs text-orange-500/70 mt-1">Elevated severity</p>
                    </div>
                    <div className="bg-orange-500/20 text-orange-600 text-xs px-2 py-1 rounded-full font-medium">
                      <Target className="h-3 w-3 inline mr-1" />
                      Monitor
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/50 dark:border-slate-800/50 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                      <Input
                        aria-label="Search articles, CVEs, or software"
                        placeholder="Search articles, CVEs, or software..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 h-12 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Select value={severityFilter} onValueChange={setSeverityFilter}>
                      <SelectTrigger aria-label="Filter by severity" className="w-[160px] h-12 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                        <Filter className="h-4 w-4 mr-2 text-slate-400" />
                        <SelectValue placeholder="Severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Severity</SelectItem>
                        <SelectItem value="CRITICAL">Critical</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={sourceFilter} onValueChange={setSourceFilter}>
                      <SelectTrigger aria-label="Filter by source" className="w-[180px] h-12 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                        <Globe className="h-4 w-4 mr-2 text-slate-400" />
                        <SelectValue placeholder="Source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sources</SelectItem>
                        <SelectItem value="krebs">Krebs on Security</SelectItem>
                        <SelectItem value="hacker-news">The Hacker News</SelectItem>
                        <SelectItem value="bleeping-computer">Bleeping Computer</SelectItem>
                        <SelectItem value="security-week">Security Week</SelectItem>
                      </SelectContent>
                    </Select>

                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        onClick={resetFilters}
                        className="h-12 px-3 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                        aria-label="Clear active filters"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 text-sm">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    Showing <span className="text-primary font-bold">{baseFilteredArticles.length}</span> of {articles.length} articles
                  </span>
                  {lastUpdated && (
                    <span className="flex items-center gap-2 text-slate-500 dark:text-slate-500">
                      <Clock className="h-4 w-4" />
                      Updated {new Date(lastUpdated).toLocaleString()}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Articles List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 h-14 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-xl">
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-lg rounded-lg transition-all"
                >
                  All Articles
                </TabsTrigger>
                <TabsTrigger
                  value="recent"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-lg rounded-lg transition-all"
                >
                  Recent
                </TabsTrigger>
                <TabsTrigger
                  value="critical"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-lg rounded-lg transition-all"
                >
                  Critical Only
                </TabsTrigger>
                <TabsTrigger
                  value="analytics"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-lg rounded-lg transition-all"
                >
                  Analytics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="analytics" className="mt-6">
                <AnalyticsDashboard />
              </TabsContent>

              <TabsContent value={activeTab} className="mt-6">
                <ScrollArea className="h-[600px] pr-4">
                  {loading && baseFilteredArticles.length === 0 ? (
                    <ArticleListSkeleton />
                  ) : displayedArticles.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Alert className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
                        <Search className="h-4 w-4" />
                        <div className="col-start-2">
                          <AlertDescription className="text-slate-600 dark:text-slate-400 mb-4">
                            {hasFilters
                              ? "No articles match your current filters. Try adjusting them or clear all filters."
                              : "No articles found. Click \"Scrape Now\" to fetch the latest security news."
                            }
                          </AlertDescription>
                          <div className="flex flex-wrap gap-2">
                            {hasFilters && (
                              <Button variant="outline" size="sm" onClick={clearFilters}>
                                Clear Filters
                              </Button>
                            )}
                            <Button variant="default" size="sm" onClick={triggerScrape} disabled={loading}>
                              {loading ? <RefreshCw className="mr-2 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-2 h-3 w-3" />}
                              Scrape Now
                            </Button>
                          </div>
                        </div>
                      </Alert>
                    </motion.div>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      <div className="space-y-4">
                        {displayedArticles.map((article, index) => {
                          const severityConfig = article.severityLevel ? SEVERITY_CONFIG[article.severityLevel as keyof typeof SEVERITY_CONFIG] : SEVERITY_CONFIG.LOW
                          const sourceConfig = SOURCE_CONFIG[article.source as keyof typeof SOURCE_CONFIG] || SOURCE_CONFIG['hacker-news']
                          const SeverityIcon = severityConfig.icon
                          const SourceIcon = sourceConfig.icon

                          return (
                            <motion.div
                              key={article.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                              layout
                            >
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
                                          {new Date(article.publishedAt).toLocaleDateString()} at{' '}
                                          {new Date(article.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>

                                      <CardTitle className="text-lg sm:text-xl leading-snug">
                                        <a
                                          href={article.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="hover:text-primary transition-colors flex items-start gap-2 group/link focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm outline-none"
                                        >
                                          <span
                                            className="line-clamp-2"
                                            dangerouslySetInnerHTML={{ __html: highlightCves(article.title) }}
                                          />
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
                                    <p
                                      className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed"
                                      dangerouslySetInnerHTML={{ __html: highlightCves(article.summary) }}
                                    />
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
                            </motion.div>
                          )
                        })}
                      </div>
                    </AnimatePresence>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm mt-auto">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-500">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>Threat Monitor - Automated Security Intelligence</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  System Active
                </span>
                <span>Powered by Next.js & Prisma</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
