## 2026-02-02 - Phantom Security Controls
**Vulnerability:** Critical API endpoints (`/api/scrape`) were completely unauthenticated despite documentation/memory claiming they were secured with Bearer tokens.
**Learning:** Documentation and "known" system state can drift or be hallucinated. Explicit code verification is the only source of truth.
**Prevention:** Always verify security controls by reading the implementation, not just relying on descriptions or adjacent files.
