
import { scrapeAllSources } from './src/lib/scrapers/web-scraper';

// Mock the global fetch to simulate network delay
// We need to cast to any to overwrite the global fetch easily in this script context if needed,
// but bun supports it directly.
const originalFetch = global.fetch;

// @ts-ignore
global.fetch = async (input, init) => {
  // Simulate 500ms network latency
  await new Promise(resolve => setTimeout(resolve, 500));

  // Return a minimal valid RSS to avoid parsing errors clogging the logs
  return new Response(`
    <rss version="2.0">
      <channel>
        <title>Mock Feed</title>
        <item>
          <title>Mock Article</title>
          <link>http://example.com/article</link>
          <description>Summary</description>
        </item>
      </channel>
    </rss>
  `, { status: 200 });
};

console.log("Starting benchmark (sequential)...");
const start = performance.now();
await scrapeAllSources();
const end = performance.now();
console.log(`Total time: ${(end - start).toFixed(2)}ms`);

// Restore fetch (good practice, though script ends here)
global.fetch = originalFetch;
