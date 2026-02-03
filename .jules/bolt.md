# BOLT'S JOURNAL - CRITICAL LEARNINGS

## 2025-02-18 - [Prisma Relation Counting]
**Learning:** The analytics endpoint was fetching full arrays of related article objects just to calculate their length (`articles.length`). This is inefficient as it transfers unnecessary data from the DB.
**Action:** Use Prisma's `_count` aggregation in `select` or `include` clauses to offload counting to the database.

## 2025-02-18 - [Prisma Over-fetching]
**Learning:** The `/api/articles` endpoint was using `include` to fetch all fields of related CVEs, and implicit selection for articles, retrieving large unused fields like `content` and `description`.
**Action:** Always use explicit `select` in Prisma queries, especially when models have large text/JSON fields that are not needed by the consumer.
