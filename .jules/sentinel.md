## 2026-02-02 - Phantom Security Controls
**Vulnerability:** Critical API endpoints (`/api/scrape`) were completely unauthenticated despite documentation/memory claiming they were secured with Bearer tokens.
**Learning:** Documentation and "known" system state can drift or be hallucinated. Explicit code verification is the only source of truth.
**Prevention:** Always verify security controls by reading the implementation, not just relying on descriptions or adjacent files.

## 2026-02-03 - Timing Attack in API Authentication
**Vulnerability:** `src/app/api/notifications/route.ts` used insecure string comparison (`!==`) for token validation, allowing for potential timing attacks. It also duplicated logic instead of using the centralized `validateApiRequest`.
**Learning:** Ad-hoc security checks often miss subtleties like timing attacks. Duplicated code drifts and becomes insecure.
**Prevention:** Enforce usage of centralized, tested security primitives (like `validateApiRequest`) instead of rewriting checks in every handler.

## 2026-02-04 - Stored XSS via Scraper
**Vulnerability:** Scraper logic in `src/lib/scrapers/web-scraper.ts` was stripping CDATA but not sanitizing HTML from article titles, which were then blindly rendered with `dangerouslySetInnerHTML` in the frontend.
**Learning:** `stripCDATA` does not sanitize HTML. Scraped content is fundamentally untrusted and must be sanitized before storage or display, especially when using dangerous sinks like `innerHTML`.
**Prevention:** Always sanitize user/scraped input before persistence. Use dedicated sanitization libraries (like `DOMPurify` or custom escape functions) before passing data to dangerous sinks.

## 2026-02-05 - SSRF in Webhook Notifications
**Vulnerability:** The notification system allowed arbitrary webhook URLs, enabling SSRF attacks against local/private network resources (e.g., AWS metadata, internal APIs).
**Learning:** `URL` class in Bun/Node automatically normalizes IP formats (e.g., `127.1` -> `127.0.0.1`), simplifying validation logic. Synchronous validation is partial (no DNS) but critical for defense-in-depth.
**Prevention:** Validate all user-supplied URLs against a deny-list of private IPs and localhost before performing requests.

## 2026-02-06 - IPv6 Loopback Bypass in SSRF Protection
**Vulnerability:** Synchronous `isSafeUrl` and IPv4-only `isPrivateIP` checks failed to block `localhost` when it resolves to `::1` (IPv6 loopback) in Bun/Node environments.
**Learning:** `dns.lookup` prefers IPv6 by default in many environments. Blocking only IPv4 private ranges is insufficient.
**Prevention:** Implement `isPrivateIPv6` and use `dns.lookup` to resolve and validate both IPv4 and IPv6 addresses before allowing outbound requests.
