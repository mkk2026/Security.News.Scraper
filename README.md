# Security News Scraper

![Demo](https://raw.githubusercontent.com/mkk2026/Security.News.Scraper/master/rtx.gif)

An automated cybersecurity intelligence platform that monitors, aggregates, and analyzes security threats from multiple trusted sources in real-time.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

## Features

- **Multi-Source Intelligence**: Scrapes from Krebs on Security, The Hacker News, Bleeping Computer, and Security Week
- **CVE Detection**: Automatically extracts and tracks CVE identifiers with CVSS scoring
- **Severity Analysis**: Threat classification (CRITICAL, HIGH, MEDIUM, LOW)
- **Smart Alerts**: Configurable notifications via webhooks (Slack, Teams, Discord)
- **Duplicate Prevention**: Content deduplication using hashing and similarity matching
- **Modern Dashboard**: Responsive UI with real-time statistics and advanced filtering
- **Background Processing**: Scheduled scraping service for continuous monitoring
- **Analytics Dashboard**: Visual insights with charts and trend analysis

## Quick Start

### Prerequisites
- [Bun](https://bun.sh/) runtime
- Node.js 18+

### Installation

```bash
git clone https://github.com/mkk2026/Security.News.Scraper.git
cd Security.News.Scraper

bun install

echo 'DATABASE_URL="file:./db/custom.db"' > .env

bunx prisma db push
bunx prisma generate

bun run dev
```

Access the dashboard at http://localhost:3008

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | Next.js 15 + TypeScript | Server-side rendering, type safety |
| **UI Framework** | Tailwind CSS + shadcn/ui | Modern, accessible components |
| **Database** | SQLite + Prisma ORM | Lightweight, type-safe data layer |
| **Charts** | Recharts | Data visualization |
| **Runtime** | Bun | Fast JavaScript runtime |

## Project Structure

```
src/
├── app/
│   ├── api/                 # API endpoints
│   │   ├── articles/        # Article management
│   │   ├── scrape/          # Scraping triggers
│   │   ├── analytics/       # Dashboard analytics
│   │   └── notifications/   # Alert configuration
│   ├── page.tsx            # Main dashboard
│   └── layout.tsx          # App layout
├── components/
│   ├── ui/                 # shadcn/ui components
│   └── AnalyticsDashboard.tsx # Analytics component
├── lib/
│   ├── scrapers/           # Web scraping logic
│   │   ├── web-scraper.ts  # RSS feed processing
│   │   └── cve-extractor.ts # CVE analysis
│   ├── notifications/      # Alert system
│   └── db.ts              # Database client
└── mini-services/
    └── scrape-service/     # Background scraping service
```

## API Endpoints

### Articles
```http
GET /api/articles?severity=CRITICAL&source=krebs&search=CVE-2024
```

### Manual Scraping
```http
POST /api/scrape
```

### Analytics Data
```http
GET /api/analytics
```

### Notifications
```http
POST /api/notifications
```

## Configuration

### Adding News Sources

Edit `src/lib/scrapers/web-scraper.ts`:

```typescript
const SOURCES: SecuritySource[] = [
  {
    id: 'new-source',
    name: 'New Security Source',
    rssUrl: 'https://example.com/feed/',
    baseUrl: 'https://example.com',
  },
]
```

### Webhook Notifications

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

## Background Service

Enable continuous monitoring:

```bash
cd mini-services/scrape-service
bun install
bun run dev
```

## Dashboard Features

- **Statistics Cards**: Total articles, CVE tracking, critical alerts, risk levels
- **Advanced Filtering**: Search, severity filter, source filter
- **Article Views**: All articles, recent, critical only, analytics
- **Analytics Dashboard**: Severity distribution, source statistics, top CVEs

## Deployment

### Production Build
```bash
bun run build
bun start
```

### Docker
```dockerfile
FROM oven/bun:1 as base
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build
EXPOSE 3000
CMD ["bun", "start"]
```

## Security & Ethics

- Uses RSS feeds (preferred method)
- Respects robots.txt
- Rate limiting implemented
- Proper attribution
- No authentication bypass

## Contributing

Areas for enhancement:
- New security news sources
- Machine learning integration
- Historical trend analysis
- SIEM platform connectors
- Mobile application

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- Security Sources: Krebs on Security, The Hacker News, Bleeping Computer, Security Week
- UI Components: shadcn/ui and Radix UI
- Framework: Next.js and Vercel
- Database: Prisma ORM