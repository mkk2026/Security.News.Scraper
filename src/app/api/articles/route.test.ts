import { describe, expect, test, mock } from "bun:test";

// Mock dependencies

// Mock @/lib/db
mock.module("@/lib/db", () => {
  return {
    db: {
      securityArticle: {
        findMany: mock(async () => [
          {
            id: "1",
            url: "http://example.com/1",
            title: "Article 1",
            summary: "Summary 1",
            source: "source1",
            sourceName: "Source 1",
            publishedAt: new Date(),
            scrapedAt: new Date(),
            severityScore: 10,
            severityLevel: "CRITICAL",
            cves: [
              {
                id: "cve1",
                cveId: "CVE-2023-1234",
                cvssScore: 9.8,
                severity: "CRITICAL",
                affectedSoftware: "Software X",
              },
            ],
          },
        ]),
        count: mock(async () => 100),
      },
      cve: {
        count: mock(async () => 50),
      },
    },
  };
});

// Mock next/cache
mock.module("next/cache", () => {
  return {
    unstable_cache: (fn: any) => fn,
  };
});

// Mock next/server
// We need to mock NextResponse.json to return a Response object that has a .json() method
mock.module("next/server", () => {
  return {
    NextRequest: Request,
    NextResponse: {
      json: (body: any, init: any) =>
        new Response(JSON.stringify(body), {
          ...init,
          headers: { 'content-type': 'application/json' }
        }),
    },
  };
});

describe("GET /api/articles", () => {
  test("returns articles, stats, and pagination", async () => {
    // Import the module under test AFTER mocking
    const { GET } = await import("./route");

    // Create a mock NextRequest object
    const req = {
      nextUrl: {
        searchParams: new URLSearchParams("limit=10&offset=0"),
      },
      url: "http://localhost/api/articles?limit=10&offset=0",
    } as any;

    // Call the GET handler
    const res = await GET(req);

    // Verify response status
    expect(res.status).toBe(200);

    // Verify response body
    const data = await res.json();

    expect(data).toHaveProperty("articles");
    expect(data.articles).toHaveLength(1);
    expect(data.articles[0].id).toBe("1");

    expect(data).toHaveProperty("stats");
    expect(data.stats).toHaveProperty("totalArticles");
    // Since mock.module overrides the module, the count mock returns 100
    expect(data.stats.totalArticles).toBe(100);

    expect(data).toHaveProperty("pagination");
    expect(data.pagination.total).toBe(100);
  });
});
