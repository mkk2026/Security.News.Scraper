/**
 * Security utilities for the application.
 */

/**
 * Checks if an IP address is private or reserved.
 * Blocks:
 * - 10.0.0.0/8 (Private)
 * - 172.16.0.0/12 (Private)
 * - 192.168.0.0/16 (Private)
 * - 127.0.0.0/8 (Loopback)
 * - 169.254.0.0/16 (Link-local)
 * - 0.0.0.0/8 (Current network)
 */
export function isPrivateIP(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return false;

  // 10.0.0.0/8
  if (parts[0] === 10) return true;

  // 172.16.0.0/12
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

  // 192.168.0.0/16
  if (parts[0] === 192 && parts[1] === 168) return true;

  // 127.0.0.0/8
  if (parts[0] === 127) return true;

  // 169.254.0.0/16
  if (parts[0] === 169 && parts[1] === 254) return true;

  // 0.0.0.0/8
  if (parts[0] === 0) return true;

  return false;
}

/**
 * Validates a URL to prevent Server-Side Request Forgery (SSRF).
 * Blocks requests to localhost, private IPs, and non-HTTP(S) protocols.
 *
 * Note: This validation is synchronous and does not resolve DNS.
 * It protects against direct IP access and obvious localhost references.
 * For complete protection, DNS resolution should be performed and the resolved IP checked.
 */
export function isSafeUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);

    // Only allow http and https
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;

    const hostname = url.hostname;

    // Block localhost
    if (hostname === 'localhost') return false;
    if (hostname === '[::1]') return false; // IPv6 loopback

    // Check if hostname is an IPv4 address
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(hostname)) {
      if (isPrivateIP(hostname)) return false;
    }

    return true;
  } catch {
    return false;
  }
}
