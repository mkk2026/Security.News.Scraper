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
  TrendingUp,
  Radar,
  Globe,
  BarChart3,
  Target,
  AlertCircle,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { ArticleCard, SecurityArticle } from '@/components/ArticleCard'

const AnalyticsDashboard = dynamic(() => import('@/components/AnalyticsDashboard'), {
  ssr: false,
  loading: () => <AnalyticsSkeleton />
})

interface Stats {
  totalArticles: number
  totalCves: number
  criticalCount: number
  highCount: number
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

  const clearFilters = () => {
    setSearchQuery('')
    setSeverityFilter('all')
    setSourceFilter('all')
    setActiveTab('all')
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
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none" />
                      <Input
                        aria-label="Search articles, CVEs, or software"
                        placeholder="Search articles, CVEs, or software..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 pr-12 h-12 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-full p-1"
                          aria-label="Clear search"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      )}
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
                        {displayedArticles.map((article, index) => (
                          <motion.div
                            key={article.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            layout
                          >
                            <ArticleCard article={article} />
                          </motion.div>
                        ))}
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
