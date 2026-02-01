## 2026-02-01 - Missing Authentication on Sensitive Endpoints
**Vulnerability:** Critical administrative endpoints (`/api/scrape`, `/api/notifications`) were completely unauthenticated despite documentation claiming otherwise.
**Learning:** Documentation and memory can be misleading. Always verify security controls in the actual code.
**Prevention:** Implement a `validateApiRequest` helper and apply it to all sensitive routes. Ideally, use middleware for broad protection, but individual route checks work for specific needs.
