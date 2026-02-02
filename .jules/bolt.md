# BOLT'S JOURNAL - CRITICAL LEARNINGS

## 2025-02-18 - [Prisma Relation Counting]
**Learning:** The analytics endpoint was fetching full arrays of related article objects just to calculate their length (`articles.length`). This is inefficient as it transfers unnecessary data from the DB.
**Action:** Use Prisma's `_count` aggregation in `select` or `include` clauses to offload counting to the database.

## 2025-02-18 - [Prisma Over-fetching]
**Learning:** The articles API was fetching the full `content` field for every article in the list view, which is unused and potentially large.
**Action:** Use explicit `select` in Prisma `findMany` queries to return only the fields required by the frontend, especially excluding Large Object (LOB) columns.
