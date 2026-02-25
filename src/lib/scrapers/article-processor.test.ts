import { expect, test, describe, beforeEach, mock } from "bun:test";

// Mock DB
mock.module("@/lib/db", () => ({
  db: {
    securityArticle: {
      findMany: mock(),
      create: mock(),
      update: mock(),
    },
    cve: {
      findUnique: mock(),
      create: mock(),
    },
  },
}));

// Mock CVE Extractor
// Note: path resolution for mock.module can be tricky.
// Usually relative to the test file works if file is local.
// But sometimes absolute path is better.
// Let's try relative first as previous one used it.
mock.module("./cve-extractor", () => ({
  analyzeArticleContent: mock(() => ({
    severityScore: 5,
    severityLevel: "MEDIUM",
    cves: [],
  })),
  generateContentHash: mock(() => "hash"),
  isDuplicateArticle: mock(() => false),
}));

// Import after mocking
const { processScrapedArticles } = await import("./article-processor");
const { db } = await import("@/lib/db");
// We import cveExtractor to control mocks
// Since we mocked it, we need to access the mock implementations if we want to change them
// But `import * as cveExtractor` will give us the mocked module.
const cveExtractor = await import("./cve-extractor");

describe("processScrapedArticles", () => {
  beforeEach(() => {
    // Reset mocks
    (db.securityArticle.findMany as any).mockClear();
    (db.securityArticle.create as any).mockClear();
    // Reset cveExtractor mocks if needed
    // But since we defined them in factory, they are persistent?
    // We can just clear them.
    (cveExtractor.isDuplicateArticle as any).mockClear();
  });

  test("should skip existing URLs", async () => {
    const scraped = [
      { url: "http://test.com/1", title: "Test 1", source: "test", sourceName: "Test", publishedAt: new Date() } as any,
    ];

    // Mock findMany to return the URL
    (db.securityArticle.findMany as any).mockResolvedValueOnce([{ url: "http://test.com/1" }]);

    // Mock recent articles
    (db.securityArticle.findMany as any).mockResolvedValueOnce([]);

    const result = await processScrapedArticles(scraped);

    expect(result.newArticlesCount).toBe(0);
    expect(db.securityArticle.create).not.toHaveBeenCalled();
  });

  test("should process new articles", async () => {
    const scraped = [
      { url: "http://test.com/new", title: "New 1", source: "test", sourceName: "Test", publishedAt: new Date() } as any,
    ];

    // Mock findMany (URLs) -> empty
    (db.securityArticle.findMany as any).mockResolvedValueOnce([]);

    // Mock findMany (Recent) -> empty
    (db.securityArticle.findMany as any).mockResolvedValueOnce([]);

    // Mock create
    (db.securityArticle.create as any).mockResolvedValue({ id: "1", title: "New 1", summary: "Summary" });

    const result = await processScrapedArticles(scraped);

    expect(result.newArticlesCount).toBe(1);
    expect(db.securityArticle.create).toHaveBeenCalled();
  });

  test("should detect duplicates in batch", async () => {
    const scraped = [
      { url: "http://test.com/1", title: "Test 1", summary: "Sum 1", source: "test", sourceName: "Test", publishedAt: new Date() } as any,
      { url: "http://test.com/2", title: "Test 1", summary: "Sum 1", source: "test", sourceName: "Test", publishedAt: new Date() } as any, // Duplicate content
    ];

    // Mock findMany (URLs) -> empty
    (db.securityArticle.findMany as any).mockResolvedValueOnce([]);

    // Mock findMany (Recent) -> empty
    (db.securityArticle.findMany as any).mockResolvedValueOnce([]);

    // Mock isDuplicateArticle to return true when titles match
    (cveExtractor.isDuplicateArticle as any).mockImplementation((t1: string, s1: any, t2: string, s2: any) => {
        return t1 === t2;
    });

    // Mock create
    (db.securityArticle.create as any).mockResolvedValue({ id: "1", title: "Test 1", summary: "Sum 1" });

    const result = await processScrapedArticles(scraped);

    expect(result.newArticlesCount).toBe(1); // Only 1 created
    expect(db.securityArticle.create).toHaveBeenCalledTimes(1);
  });
});
