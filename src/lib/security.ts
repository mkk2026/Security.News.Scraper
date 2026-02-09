import { lookup } from 'node:dns/promises';

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
 * Checks if an IPv6 address is private or reserved.
 * Blocks:
 * - ::1 (Loopback)
 * - fc00::/7 (Unique Local)
 * - fe80::/10 (Link-Local)
 * - ::ffff:0:0/96 (IPv4-mapped) - extracts and checks IPv4
 */
export function isPrivateIPv6(ip: string): boolean {
  // Normalize IP
  ip = ip.toLowerCase();

  // Unspecified
  if (ip === '::') return true;

  // Loopback
  if (ip === '::1') return true;

  // Link-local (fe80::/10) - checks for fe8, fe9, fea, feb
  if (ip.startsWith('fe8') || ip.startsWith('fe9') || ip.startsWith('fea') || ip.startsWith('feb')) {
     // Additional check to ensure it's the start of the address
     // But IPv6 string representation can be complex.
     // Assuming standard representation where it starts with the hextet.
     return true;
  }

  // Unique Local (fc00::/7) - fc or fd
  if (ip.startsWith('fc') || ip.startsWith('fd')) return true;

  // IPv4-mapped (::ffff:0:0/96) e.g., ::ffff:192.168.1.1
  if (ip.includes('::ffff:')) {
    const parts = ip.split(':');
    const lastPart = parts[parts.length - 1];
    // If the last part looks like IPv4, check it
    if (lastPart.includes('.')) {
      return isPrivateIP(lastPart);
    }
  }

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
 * Asynchronously validates a URL to prevent SSRF with DNS resolution.
 * First performs synchronous checks, then resolves hostname and checks against private IPs.
 *
 * @param urlStr The URL to validate
 * @returns Promise<boolean> true if safe, false if unsafe or resolution fails
 */
export async function isSafeUrlAsync(urlStr: string): Promise<boolean> {
  // 1. Basic synchronous check
  if (!isSafeUrl(urlStr)) {
    return false;
  }

  try {
    const url = new URL(urlStr);
    const hostname = url.hostname;

    // 2. Resolve DNS
    // lookup returns the first address found
    const { address, family } = await lookup(hostname);

    // 3. Check resolved IP
    if (family === 4) {
      if (isPrivateIP(address)) {
        return false;
      }
    } else if (family === 6) {
      if (isPrivateIPv6(address)) {
        return false;
      }
    }

    return true;
  } catch (error) {
    // If DNS resolution fails, or any other error, treat as unsafe
    // This assumes fail-closed behavior for security
    return false;
  }
}
