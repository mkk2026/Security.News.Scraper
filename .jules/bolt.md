# BOLT'S JOURNAL - CRITICAL LEARNINGS

## 2025-02-18 - [Prisma Relation Counting]
**Learning:** The analytics endpoint was fetching full arrays of related article objects just to calculate their length (`articles.length`). This is inefficient as it transfers unnecessary data from the DB.
**Action:** Use Prisma's `_count` aggregation in `select` or `include` clauses to offload counting to the database.

## 2025-02-18 - [Prisma Over-fetching]
**Learning:** The articles API was fetching the full `content` field for every article in the list view, which is unused and potentially large.
**Action:** Use explicit `select` in Prisma `findMany` queries to return only the fields required by the frontend, especially excluding Large Object (LOB) columns.

## 2025-02-19 - [React Derived State]
**Learning:** The dashboard component was using `useEffect` to update a `filteredArticles` state whenever filters changed. This caused a "render -> effect -> set state -> render" waterfall, doubling the work on every keystroke.
**Action:** Use `useMemo` to calculate derived state (filtered lists) during the initial render pass, avoiding the extra render cycle and simplifying the data flow.

## 2025-02-19 - [Array State Mutation]
**Learning:** The sorting function `articles.sort()` sorts in place. When called on a state array (even if aliased), it mutated the underlying state directly, bypassing React's update lifecycle and potentially causing inconsistent UI behavior.
**Action:** Always create a shallow copy before sorting state arrays: `[...articles].sort(...)`.

## 2025-02-21 - [Batch Data Ingestion]
**Learning:** The scraping service was performing `findUnique` and `findMany` queries inside a loop for every scraped article to check for existence and duplicates. This created an N+1 query problem, scaling linearly with the number of articles.
**Action:** Batch fetch existing records (using `where: { url: { in: [...] } }`) and a single window of recent articles *before* the loop. Perform existence and duplicate checks in-memory against these collections.
