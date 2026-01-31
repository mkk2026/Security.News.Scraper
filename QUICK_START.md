# Quick Start Guide - Security News Monitor

Get your security news monitoring dashboard up and running in 5 minutes.

## Prerequisites
- Bun installed on your system
- Basic command line knowledge

## Setup Steps

### 1. Initialize the Database (One-Time)
```bash
cd /home/z/my-project
bun run db:push
```

### 2. Start the Main Application
The development server is already running on port 3000!

If not, start it with:
```bash
bun run dev
```

### 3. Access the Dashboard
Open your browser and visit: http://localhost:3000

You'll see the Security News Monitor dashboard with:
- Statistics cards showing total articles, CVEs, and critical vulnerabilities
- Search and filter options
- Tabbed views for articles

### 4. Scrape Security News
Click the **"Scrape Now"** button in the top right of the dashboard to fetch the latest security news from:
- Krebs on Security
- The Hacker News
- Bleeping Computer
- Security Week

The scraper will:
- Fetch RSS feeds from all sources
- Extract articles with titles, summaries, and publication dates
- Identify CVE identifiers in the content
- Calculate severity scores based on keywords
- Store everything in the database

### 5. View Results
After scraping, the dashboard will automatically update to show:
- New articles with CVEs highlighted
- Severity levels (CRITICAL, HIGH, MEDIUM, LOW)
- Source attribution
- Links to original articles

## Optional: Enable Scheduled Scraping

To automatically scrape at regular intervals, start the background service:

```bash
cd /home/z/my-project/mini-services/scrape-service
bun install
bun run dev
```

This service will:
- Scrape every hour (configurable)
- Automatically detect and skip duplicates
- Track statistics
- Run in the background

## Optional: Set Up Notifications

Configure alerts for critical vulnerabilities using the API:

```bash
# Create a webhook notification (e.g., Slack)
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "type": "webhook",
    "enabled": true,
    "config": {
      "url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
    },
    "minCvssScore": 7.0,
    "severityLevel": "HIGH"
  }'
```

## Testing the System

### Test Scraping
```bash
# Trigger manual scrape
curl -X POST http://localhost:3000/api/scrape

# Expected response:
{
  "success": true,
  "newArticles": 15,
  "newCves": 32,
  "totalProcessed": 20
}
```

### Test Article Fetching
```bash
# Get all articles
curl http://localhost:3000/api/articles

# Filter by severity
curl http://localhost:3000/api/articles?severity=CRITICAL

# Search for specific CVE
curl http://localhost:3000/api/articles?search=CVE-2024-1234
```

### View Notifications
```bash
# Get notification configs
curl http://localhost:3000/api/notifications
```

## Troubleshooting

### "No articles found"
- Click "Scrape Now" to fetch articles
- Wait 5-10 seconds for scraping to complete
- Refresh the page

### "Failed to scrape"
- Check internet connectivity
- Verify the dev server is running
- Check logs: `tail -50 /home/z/my-project/dev.log`

### Dashboard not loading
- Ensure dev server is running on port 3000
- Check browser console for errors
- Try clearing browser cache

## Next Steps

1. **Customize Sources**: Add your favorite security news sources in `src/lib/scrapers/web-scraper.ts`
2. **Adjust Severity**: Modify severity keywords in `src/lib/scrapers/cve-extractor.ts`
3. **Set Alerts**: Configure notifications for critical vulnerabilities affecting your stack
4. **Schedule Scraping**: Adjust the scrape interval in `mini-services/scrape-service/index.ts`
5. **Explore Data**: Use the dashboard filters to analyze trends and find relevant threats

## Example Workflow

1. **Morning Check**: Open dashboard, review new critical articles from overnight
2. **Search**: Use search to find vulnerabilities in specific software (e.g., "Chrome")
3. **Filter**: Apply severity filter to see only HIGH and CRITICAL issues
4. **Research**: Click article links to read full details
5. **Monitor**: Set up notifications for specific CVEs or software you care about

## Quick Reference

| Command | Purpose |
|---------|---------|
| `bun run dev` | Start Next.js dev server |
| `bun run lint` | Check code quality |
| `bun run db:push` | Push schema changes to database |
| `bun run db:generate` | Generate Prisma client |

| Endpoint | Purpose |
|----------|---------|
| `/` | Dashboard UI |
| `/api/articles` | Fetch articles (GET) |
| `/api/scrape` | Trigger scrape (POST) |
| `/api/notifications` | Manage alerts (GET/POST) |

## Tips for Best Results

- **Scrape regularly**: Click "Scrape Now" daily or enable scheduled scraping
- **Use filters**: Narrow down to critical vulnerabilities first
- **Search wisely**: Use CVE IDs, software names, or severity terms
- **Set up alerts**: Configure notifications for high-priority vulnerabilities
- **Review sources**: Check all sources for comprehensive coverage

## Understanding Severity Levels

- **CRITICAL** (9.0+): Urgent action required, often involves remote code execution
- **HIGH** (7.0-8.9): Important vulnerabilities, should be addressed soon
- **MEDIUM** (4.0-6.9): Moderate risk, plan to fix
- **LOW** (0.1-3.9): Minor issues, fix when convenient

Severity is calculated based on:
- CVSS scores (when available in articles)
- Keyword analysis (critical, zero-day, exploit, etc.)
- Number of CVEs mentioned
- Affected software criticality

## Need More Help?

See the full documentation in `SECURITY_MONITOR_README.md` for detailed information on:
- Advanced configuration
- API documentation
- Database schema
- Customization options
- Troubleshooting guide

Enjoy monitoring security threats! 🛡️
