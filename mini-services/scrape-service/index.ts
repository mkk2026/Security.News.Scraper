import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['query', 'error'],
})

const SCRAPE_INTERVAL = 3600000 // 1 hour in milliseconds
const SCRAPE_API_URL = 'http://localhost:3008/api/scrape'
const SCRAPE_CONFIG_SOURCE_ID = 'scheduled-scraper'

interface ScrapeStats {
  totalRuns: number
  successfulRuns: number
  failedRuns: number
  lastRunAt: Date | null
  lastRunStatus: string
  lastRunArticles: number
  lastRunCves: number
}

class ScrapeScheduler {
  private stats: ScrapeStats = {
    totalRuns: 0,
    successfulRuns: 0,
    failedRuns: 0,
    lastRunAt: null,
    lastRunStatus: 'idle',
    lastRunArticles: 0,
    lastRunCves: 0,
  }

  private timer: NodeJS.Timeout | null = null
  private isRunning = false

  constructor() {
    this.initialize()
  }

  private async initialize() {
    console.log('🔍 Initializing Security News Scraper Service...')

    // Initialize scrape config in database
    await this.initializeScrapeConfig()

    // Start the scraping loop
    this.start()

    // Graceful shutdown
    process.on('SIGTERM', () => this.shutdown('SIGTERM'))
    process.on('SIGINT', () => this.shutdown('SIGINT'))
  }

  private async initializeScrapeConfig() {
    try {
      const existingConfig = await prisma.scrapeConfig.findUnique({
        where: { source: SCRAPE_CONFIG_SOURCE_ID },
      })

      if (!existingConfig) {
        await prisma.scrapeConfig.create({
          data: {
            source: SCRAPE_CONFIG_SOURCE_ID,
            enabled: true,
            scrapeFrequency: SCRAPE_INTERVAL / 1000, // Convert to seconds
          },
        })
        console.log('✅ Scrape config initialized')
      }
    } catch (error) {
      console.error('Error initializing scrape config:', error)
    }
  }

  private async triggerScrape(): Promise<void> {
    if (this.isRunning) {
      console.log('⏳ Scrape already in progress, skipping...')
      return
    }

    this.isRunning = true
    this.stats.totalRuns++
    this.stats.lastRunStatus = 'running'
    console.log(`🚀 Starting scrape run #${this.stats.totalRuns}`)

    try {
      const secretToken = process.env.API_SECRET_TOKEN
      const response = await fetch(SCRAPE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(secretToken ? { 'Authorization': `Bearer ${secretToken}` } : {}),
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      this.stats.successfulRuns++
      this.stats.lastRunStatus = 'success'
      this.stats.lastRunAt = new Date()
      this.stats.lastRunArticles = result.newArticles || 0
      this.stats.lastRunCves = result.newCves || 0

      console.log(`✅ Scrape completed: ${result.newArticles} new articles, ${result.newCves} new CVEs`)

      // Update last scraped timestamp in database
      await this.updateLastScrapedAt()
    } catch (error) {
      this.stats.failedRuns++
      this.stats.lastRunStatus = 'failed'
      this.stats.lastRunAt = new Date()

      console.error('❌ Scrape failed:', error)
    } finally {
      this.isRunning = false
      this.printStats()
    }
  }

  private async updateLastScrapedAt() {
    try {
      await prisma.scrapeConfig.update({
        where: { source: SCRAPE_CONFIG_SOURCE_ID },
        data: { lastScrapedAt: new Date() },
      })
    } catch (error) {
      console.error('Error updating last scraped timestamp:', error)
    }
  }

  private start() {
    console.log(`⏰ Scheduler started - interval: ${SCRAPE_INTERVAL / 1000 / 60} minutes`)

    // Run immediately on startup
    setTimeout(() => this.triggerScrape(), 5000)

    // Set up recurring interval
    this.timer = setInterval(() => {
      this.triggerScrape()
    }, SCRAPE_INTERVAL)
  }

  private shutdown(signal: string) {
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`)

    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }

    this.printStats()
    prisma.$disconnect()
    process.exit(0)
  }

  private printStats() {
    console.log('\n📊 Scraper Statistics:')
    console.log(`   Total Runs: ${this.stats.totalRuns}`)
    console.log(`   Successful: ${this.stats.successfulRuns}`)
    console.log(`   Failed: ${this.stats.failedRuns}`)
    console.log(`   Status: ${this.stats.lastRunStatus}`)
    console.log(`   Last Run: ${this.stats.lastRunAt || 'Never'}`)
    if (this.stats.lastRunAt) {
      console.log(`   Last Run Result: ${this.stats.lastRunArticles} articles, ${this.stats.lastRunCves} CVEs`)
    }
  }

  public getStats(): ScrapeStats {
    return { ...this.stats }
  }
}

// Start the scheduler
const scheduler = new ScrapeScheduler()

// Expose stats for monitoring (optional - could create a health endpoint)
export { scheduler }
