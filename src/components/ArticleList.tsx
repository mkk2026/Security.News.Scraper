'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Search, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArticleCard, SecurityArticle } from '@/components/ArticleCard'
import { ArticleListSkeleton } from '@/components/ArticleListSkeleton'

interface ArticleListProps {
  articles: SecurityArticle[]
  isLoading: boolean
  showSkeleton: boolean
  hasFilters: boolean
  onClearFilters: () => void
  onScrape: () => void
}

export function ArticleList({
  articles,
  isLoading,
  showSkeleton,
  hasFilters,
  onClearFilters,
  onScrape
}: ArticleListProps) {
  return (
    <ScrollArea className="h-[600px] pr-4">
      {showSkeleton ? (
        <ArticleListSkeleton />
      ) : articles.length === 0 ? (
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
                  <Button variant="outline" size="sm" onClick={onClearFilters}>
                    Clear Filters
                  </Button>
                )}
                <Button variant="default" size="sm" onClick={onScrape} disabled={isLoading}>
                  {isLoading ? <RefreshCw className="mr-2 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-2 h-3 w-3" />}
                  Scrape Now
                </Button>
              </div>
            </div>
          </Alert>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-4">
            {articles.map((article, index) => (
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
  )
}
