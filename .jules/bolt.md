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

## 2025-02-21 - [Regex Recompilation]
**Learning:** A regex used for highlighting keywords was defined inside a render loop. This caused the regex to be recompiled for every item in the list on every render, adding unnecessary overhead.
**Action:** Move regex definitions and helper functions outside of components or to utility files to ensure they are compiled once and reused.

## 2025-02-22 - [Optimized Text Rendering]
**Learning:** Using `dangerouslySetInnerHTML` with complex regex replacement for highlighting (e.g., `highlightCves`) is expensive (approx. 7ms/call vs 0.3ms/check).
**Action:** Implement a fast pre-check (e.g., `hasCves` using `regex.test()`) to conditionally bypass expensive rendering paths when the data doesn't require it.

## 2026-02-19 - [Parallel Scraping]
**Learning:** The RSS scraper was fetching feeds sequentially in a loop, unnecessarily increasing the total scraping time by the sum of all feed latencies.
**Action:** Use `Promise.all` to fetch sources in parallel. Ensure individual promises catch their own errors so one failure doesn't abort the entire batch.
