import { promises as dnsPromises } from 'node:dns';

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

/**
 * Async version of isSafeUrl that resolves DNS to check for private IPs.
 * This provides better protection against SSRF via DNS rebinding or custom domains.
 */
export async function isSafeUrlAsync(urlStr: string): Promise<boolean> {
  // First verify basic URL structure and obvious localhost/IPs synchronously
  if (!isSafeUrl(urlStr)) {
    return false;
  }

  try {
    const url = new URL(urlStr);
    const hostname = url.hostname;

    // Resolve DNS to check for private IPs behind domains
    // We request all addresses to ensure we don't miss any round-robin IPs that might be internal
    try {
      const addresses = await dnsPromises.lookup(hostname, { all: true });

      for (const record of addresses) {
        if (record.family === 4) {
          if (isPrivateIP(record.address)) {
            return false;
          }
        } else if (record.family === 6) {
          const addr = record.address.toLowerCase();

          // Loopback
          if (addr === '::1' || addr === '0:0:0:0:0:0:0:1') {
             return false;
          }

          // Unique Local Addresses (fc00::/7) -> fc or fd
          if (addr.startsWith('fc') || addr.startsWith('fd')) {
            return false;
          }

          // Link-Local Addresses (fe80::/10) -> fe8, fe9, fea, feb
          if (addr.startsWith('fe8') || addr.startsWith('fe9') || addr.startsWith('fea') || addr.startsWith('feb')) {
            return false;
          }

          // IPv4-mapped IPv6 addresses (::ffff:192.168.0.1)
          if (addr.startsWith('::ffff:') || addr.startsWith('0:0:0:0:0:ffff:')) {
            const parts = addr.split(':');
            const ipv4 = parts[parts.length - 1];
            if (isPrivateIP(ipv4)) {
              return false;
            }
          }
        }
      }
    } catch (error) {
      // If DNS resolution fails, the host is unreachable anyway, so it's "safe" in terms of SSRF
      // but practically unusable. We return false to be safe (fail closed).
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
