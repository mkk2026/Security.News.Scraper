import dns from 'node:dns';

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
 * - IPv6 Loopback, Unique Local, Link-Local
 */
export function isPrivateIP(ip: string): boolean {
  // Check for IPv6
  if (ip.includes(':')) {
    return isPrivateIPv6(ip);
  }

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
 * - :: (Unspecified)
 * - IPv4-mapped addresses (::ffff:127.0.0.1)
 */
export function isPrivateIPv6(ip: string): boolean {
  const lowerIP = ip.toLowerCase();

  // Loopback & Unspecified
  if (lowerIP === '::1' || lowerIP === '0:0:0:0:0:0:0:1') return true;
  if (lowerIP === '::' || lowerIP === '0:0:0:0:0:0:0:0') return true;

  // Unique Local (fc00::/7) -> fc.., fd..
  if (lowerIP.startsWith('fc') || lowerIP.startsWith('fd')) return true;

  // Link Local (fe80::/10) -> fe8, fe9, fea, feb
  if (lowerIP.startsWith('fe8') || lowerIP.startsWith('fe9') ||
      lowerIP.startsWith('fea') || lowerIP.startsWith('feb')) return true;

  // IPv4-mapped (::ffff:x.x.x.x)
  if (lowerIP.startsWith('::ffff:')) {
    // Extract potential IPv4 part if present at end
    const parts = lowerIP.split(':');
    const lastPart = parts[parts.length - 1];
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

    // Check if hostname is an IPv6 address
    // URL.hostname usually includes brackets for IPv6 literals.
    if (hostname.startsWith('[') && hostname.endsWith(']')) {
       const ipv6 = hostname.slice(1, -1);
       if (isPrivateIPv6(ipv6)) return false;
    } else if (hostname.includes(':') && !hostname.includes('[')) {
        // Raw IPv6 without brackets (unlikely in URL object but possible in some contexts)
        if (isPrivateIPv6(hostname)) return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Validates a URL asynchronously by resolving DNS to prevent SSRF.
 * This is the preferred validation method as it protects against DNS rebinding (partially)
 * and domains resolving to private IPs.
 */
export async function isSafeUrlAsync(urlStr: string): Promise<boolean> {
  // First do the sync check for obvious issues
  if (!isSafeUrl(urlStr)) return false;

  try {
    const url = new URL(urlStr);
    const hostname = url.hostname;

    // Resolve DNS
    // dns.promises.lookup uses system resolver (getaddrinfo)
    const { address } = await dns.promises.lookup(hostname);

    if (!address) return false;

    if (isPrivateIP(address)) {
        return false;
    }

    return true;
  } catch (error) {
    // If DNS resolution fails, treat as unsafe/invalid
    return false;
  }
}
