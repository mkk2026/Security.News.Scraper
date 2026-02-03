## 2026-02-02 - Phantom Security Controls
**Vulnerability:** Critical API endpoints (`/api/scrape`) were completely unauthenticated despite documentation/memory claiming they were secured with Bearer tokens.
**Learning:** Documentation and "known" system state can drift or be hallucinated. Explicit code verification is the only source of truth.
**Prevention:** Always verify security controls by reading the implementation, not just relying on descriptions or adjacent files.

## 2026-02-03 - Timing Attack in API Authentication
**Vulnerability:** `src/app/api/notifications/route.ts` used insecure string comparison (`!==`) for token validation, allowing for potential timing attacks. It also duplicated logic instead of using the centralized `validateApiRequest`.
**Learning:** Ad-hoc security checks often miss subtleties like timing attacks. Duplicated code drifts and becomes insecure.
**Prevention:** Enforce usage of centralized, tested security primitives (like `validateApiRequest`) instead of rewriting checks in every handler.
