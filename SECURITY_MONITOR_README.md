# Security News Monitor

An automated web scraper for collecting cybersecurity news and vulnerability information from reputable sources. Built with Next.js 15, Prisma, and shadcn/ui.

## Features

### Core Functionality
- **Multi-Source Scraping**: Automatically scrapes security news from:
  - Krebs on Security
  - The Hacker News
  - Bleeping Computer
  - Security Week

- **CVE Extraction**: Automatically identifies and extracts CVE identifiers from articles
- **Severity Scoring**: Calculates severity scores based on keywords and CVSS scores
- **Duplicate Detection**: Prevents duplicate articles using content hashing and similarity matching

### Database Storage
- SQLite database with Prisma ORM
- Stores articles, CVEs, scrape configurations, and notification settings
- Efficient querying with indexed fields

### Dashboard Interface
- Real-time statistics (total articles, CVEs, critical vulnerabilities)
- Advanced search and filtering
- Tabbed views (All, Recent, Critical)
- CVE highlighting in article content
- Responsive design with mobile support

### Scheduled Scraping
- Background service that runs on a configurable schedule (default: 1 hour)
- Automatic duplicate detection
- Persistent state tracking

### Notification System
- Email notifications (configurable)
- Webhook notifications (Slack, Microsoft Teams, etc.)
- Customizable alert criteria:
  - Minimum CVSS score
  - Severity level (LOW, MEDIUM, HIGH, CRITICAL)
  - Keyword matching
  - Specific CVE IDs

## Installation

### Prerequisites
- Bun (JavaScript runtime)
- Node.js 18+ (for dependencies)

### Setup

1. **Install dependencies**:
   ```bash
   bun install
   ```

2. **Set up the database**:
   ```bash
   bun run db:push
   ```

3. **Start the development server**:
   ```bash
   bun run dev
   ```

4. **Start the scheduled scraping service** (optional, for background automation):
   ```bash
   cd mini-services/scrape-service
   bun install
   bun run dev
   ```

## API Endpoints

### `GET /api/articles`
Fetch security articles with optional filters.

**Query Parameters**:
- `severity` - Filter by severity level (CRITICAL, HIGH, MEDIUM, LOW)
- `source` - Filter by source (krebs, hacker-news, bleeping-computer, security-week)
- `search` - Search in title, summary, or CVE IDs
- `limit` - Number of results to return (default: 100)
- `offset` - Pagination offset (default: 0)

**Response**:
```json
{
  "articles": [
    {
      "id": "...",
      "url": "https://...",
      "title": "Article Title",
      "summary": "Article summary...",
      "source": "krebs",
      "sourceName": "Krebs on Security",
      "publishedAt": "2024-01-15T10:00:00Z",
      "severityScore": 8.5,
      "severityLevel": "HIGH",
      "cves": [
        {
          "cveId": "CVE-2024-1234",
          "cvssScore": 8.5,
          "severity": "HIGH"
        }
      ]
    }
  ],
  "stats": {
    "totalArticles": 150,
    "totalCves": 320,
    "criticalCount": 25,
    "highCount": 45
  }
}
```

### `POST /api/scrape`
Manually trigger a scraping operation.

**Response**:
```json
{
  "success": true,
  "message": "Successfully scraped and processed articles",
  "newArticles": 15,
  "newCves": 32,
  "totalProcessed": 20
}
```

### `GET /api/notifications`
Get all notification configurations.

**Response**:
```json
{
  "success": true,
  "notifications": [
    {
      "type": "webhook",
      "enabled": true,
      "config": {
        "url": "https://hooks.slack.com/services/..."
      },
      "minCvssScore": 7.0,
      "severityLevel": "HIGH"
    }
  ]
}
```

### `POST /api/notifications`
Create a new notification configuration.

**Request Body**:
```json
{
  "type": "webhook",
  "enabled": true,
  "config": {
    "url": "https://hooks.slack.com/services/...",
    "headers": {
      "Authorization": "Bearer token"
    }
  },
  "minCvssScore": 7.0,
  "severityLevel": "HIGH",
  "keywords": ["critical", "zero-day"],
  "cveIds": ["CVE-2024-1234"]
}
```

## Web Scraping

### RSS Feed Approach
The scraper uses RSS feeds from security news sources, which is:
- More reliable than HTML scraping
- Less likely to break when website layouts change
- Typically allowed by robots.txt

### Sources and Their RSS Feeds
- **Krebs on Security**: https://krebsonsecurity.com/feed/
- **The Hacker News**: https://thehackernews.com/feeds/posts/default
- **Bleeping Computer**: https://www.bleepingcomputer.com/feed/
- **Security Week**: https://www.securityweek.com/feed

### CVE Extraction
- Uses regex pattern: `CVE-YYYY-NNNNN`
- Extracts CVSS scores when available in article text
- Identifies affected software names
- Calculates severity scores based on keywords and CVSS

### Duplicate Detection
- Content hashing to detect exact duplicates
- Jaccard similarity for near-duplicate detection
- URL-based deduplication
- Configurable similarity threshold

## Database Schema

### SecurityArticle
- Stores scraped security news articles
- Links to CVEs via many-to-many relationship
- Tracks scrape timestamps and severity scores

### Cve
- Stores CVE identifiers and metadata
- Links to articles mentioning the CVE
- Tracks CVSS scores and severity levels

### ScrapeConfig
- Configuration for each news source
- Tracks last scrape time and frequency
- Enables/disables specific sources

### Notification
- Notification configuration (email, webhook)
- Alert criteria (CVSS threshold, severity, keywords)
- Tracks last notification time

## Scheduled Scraping Service

The `mini-services/scrape-service` runs as an independent background service:

**Features**:
- Runs on configurable interval (default: 1 hour)
- Automatic retry on failure
- Statistics tracking
- Graceful shutdown handling

**Configuration**:
Edit `SCRAPE_INTERVAL` in `index.ts` (in milliseconds):
```typescript
const SCRAPE_INTERVAL = 3600000 // 1 hour
```

## Notification System

### Email Notifications
Configure email notifications by creating a notification config:
```json
{
  "type": "email",
  "enabled": true,
  "config": {
    "to": "security@company.com",
    "subject": "Security Alert"
  },
  "minCvssScore": 7.0,
  "severityLevel": "HIGH"
}
```

### Webhook Notifications
Send alerts to Slack, Microsoft Teams, Discord, or custom endpoints:
```json
{
  "type": "webhook",
  "enabled": true,
  "config": {
    "url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
  },
  "minCvssScore": 7.0,
  "severityLevel": "HIGH"
}
```

### Webhook Payload
```json
{
  "alert": {
    "type": "vulnerability",
    "severity": "HIGH",
    "article": {
      "id": "...",
      "title": "Critical Vulnerability in XYZ",
      "url": "https://...",
      "source": "hacker-news",
      "publishedAt": "2024-01-15T10:00:00Z"
    },
    "cves": [
      {
        "cveId": "CVE-2024-1234",
        "cvssScore": 8.5,
        "severity": "HIGH"
      }
    ]
  },
  "timestamp": "2024-01-15T10:05:00Z"
}
```

## Customization

### Adding New Sources
Add a new source in `src/lib/scrapers/web-scraper.ts`:
```typescript
const SOURCES: SecuritySource[] = [
  // Existing sources...
  {
    id: 'new-source',
    name: 'New Security Source',
    rssUrl: 'https://example.com/feed/',
    baseUrl: 'https://example.com',
  },
]
```

### Adjusting Severity Scoring
Modify severity keywords in `src/lib/scrapers/cve-extractor.ts`:
```typescript
const criticalKeywords = [
  'critical', 'remote code execution', 'rce',
  // Add more keywords...
]
```

### Changing Scrape Frequency
Edit the interval in `mini-services/scrape-service/index.ts`:
```typescript
const SCRAPE_INTERVAL = 7200000 // 2 hours
```

## Web Scraping Ethics

### Important Considerations
1. **Check robots.txt**: Always verify that scraping is allowed
2. **Rate Limiting**: Don't overwhelm servers with requests
3. **Terms of Service**: Respect website terms of service
4. **Attribution**: Always credit sources
5. **RSS Feeds**: Prefer RSS feeds over HTML scraping when available

### This Project's Approach
- Uses RSS feeds (preferred method)
- Includes User-Agent header
- Respects recommended scraping intervals
- Does not scrape behind login screens
- Properly attributes sources

## Troubleshooting

### Scraping Fails
- Check internet connectivity
- Verify RSS feed URLs are accessible
- Check server logs for specific errors

### No Articles Found
- Ensure sources have published articles recently
- Verify database schema is up to date: `bun run db:push`

### Notifications Not Sending
- Check notification configuration is enabled
- Verify webhook URLs or email settings
- Check server logs for errors

### Duplicate Articles
- Adjust similarity threshold in `isDuplicateArticle()`
- Current threshold: 0.8 (80% similarity)

## Project Structure

```
/home/z/my-project/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── articles/
│   │   │   ├── scrape/
│   │   │   └── notifications/
│   │   ├── layout.tsx
│   │   ├── page.tsx (Dashboard)
│   │   └── globals.css
│   ├── components/ui/ (shadcn/ui components)
│   ├── hooks/
│   ├── lib/
│   │   ├── db.ts
│   │   ├── scrapers/
│   │   │   ├── web-scraper.ts
│   │   │   └── cve-extractor.ts
│   │   └── notifications/
│   │       └── notification-service.ts
│   └── utils.ts
├── mini-services/
│   └── scrape-service/
│       ├── index.ts
│       ├── package.json
│       └── lib/
│           └── db.ts
├── prisma/
│   └── schema.prisma
├── package.json
└── tsconfig.json
```

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5
- **Database**: SQLite with Prisma ORM
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Runtime**: Bun

## License

This project is for educational purposes. Please ensure compliance with website terms of service and applicable laws when using web scraping tools.

## Contributing

Contributions are welcome! Areas for enhancement:
- Additional security news sources
- More sophisticated CVE analysis
- Email notification implementation
- Historical data visualization
- Threat intelligence dashboards
- Machine learning for relevance scoring

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review server logs in `/home/z/my-project/dev.log`
3. Check scrape service logs in console output

## Key Concepts Demonstrated

- Web scraping with RSS feeds
- HTML parsing and XML processing
- Regular expressions for pattern matching (CVE extraction)
- Database design with Prisma ORM
- Scheduled task automation
- Content hashing for duplicate detection
- Jaccard similarity for text comparison
- RESTful API design
- Real-time dashboard with React hooks
- Notification systems (webhooks, email)
- SEO and accessibility best practices
