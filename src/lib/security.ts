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
 * - :: (Unspecified)
 * - fc00::/7 (Unique Local)
 * - fe80::/10 (Link-Local)
 * - ::ffff:0:0/96 (IPv4-mapped)
 */
export function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  // Loopback and Unspecified
  if (normalized === '::1' || normalized === '::') return true;

  // IPv4-mapped (::ffff:0:0/96)
  if (normalized.startsWith('::ffff:')) return true;

  // Unique Local (fc00::/7) - fc00... to fdff...
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;

  // Link-Local (fe80::/10) - fe80... to febf...
  if (normalized.startsWith('fe8') || normalized.startsWith('fe9') ||
      normalized.startsWith('fea') || normalized.startsWith('feb')) return true;

  return false;
}

/**
 * Validates a URL to prevent Server-Side Request Forgery (SSRF).
 * Blocks requests to localhost, private IPs, and non-HTTP(S) protocols.
 *
 * Note: This validation is synchronous and does not resolve DNS.
 * It protects against direct IP access and obvious localhost references.
 * For complete protection, use isSafeUrlAsync which performs DNS resolution.
 */
export function isSafeUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);

    // Only allow http and https
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;

    const hostname = url.hostname;

    // Block localhost
    if (hostname === 'localhost') return false;

    // Check if hostname is an IPv6 address
    if (hostname.startsWith('[') && hostname.endsWith(']')) {
      const ip = hostname.slice(1, -1);
      if (isPrivateIPv6(ip)) return false;
    }

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
 * Asynchronously validates a URL to prevent Server-Side Request Forgery (SSRF).
 * Blocks requests to localhost, private IPs, and non-HTTP(S) protocols.
 *
 * Performs DNS resolution to prevent DNS rebinding and verify the actual destination IP.
 */
export async function isSafeUrlAsync(urlStr: string): Promise<boolean> {
  try {
    const url = new URL(urlStr);

    // Only allow http and https
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;

    // Resolve DNS
    const { address, family } = await lookup(url.hostname);

    if (family === 4) {
      return !isPrivateIP(address);
    } else if (family === 6) {
      return !isPrivateIPv6(address);
    }

    return false;
  } catch (error) {
    // DNS lookup failed or invalid URL
    return false;
  }
}

/**
 * A secure wrapper around fetch that prevents SSRF via redirects.
 * Manually handles redirects and validates each target URL against isSafeUrlAsync.
 *
 * @param url The URL to fetch.
 * @param options Fetch options.
 * @returns The fetch response.
 * @throws Error if any URL in the redirect chain is unsafe or if max redirects exceeded.
 */
export async function safeFetch(url: string | URL, options: RequestInit = {}): Promise<Response> {
  const MAX_REDIRECTS = 5;
  let currentUrl = url.toString();
  let currentOptions = { ...options };
  let redirectCount = 0;

  while (redirectCount <= MAX_REDIRECTS) {
    // Validate current URL before fetching
    if (!(await isSafeUrlAsync(currentUrl))) {
      throw new Error(`Security Violation: Unsafe URL blocked: ${currentUrl}`);
    }

    // Perform fetch with manual redirect handling
    const response = await fetch(currentUrl, {
      ...currentOptions,
      redirect: 'manual',
    });

    // Check for redirect status codes
    if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
      redirectCount++;
      const location = response.headers.get('location')!;

      // Resolve relative URLs
      try {
        currentUrl = new URL(location, currentUrl).toString();
      } catch (e) {
         throw new Error(`Invalid redirect location: ${location}`);
      }

      // Handle method changes for redirects
      // 303 See Other: Always becomes GET
      if (response.status === 303) {
        currentOptions.method = 'GET';
        currentOptions.body = undefined;
      }
      // 301 Moved Permanently / 302 Found: Typically become GET if original was POST
      else if ((response.status === 301 || response.status === 302) && currentOptions.method === 'POST') {
        currentOptions.method = 'GET';
        currentOptions.body = undefined;
      }
      // 307/308 preserve method and body

      continue;
    }

    return response;
  }

  throw new Error(`Too many redirects (max ${MAX_REDIRECTS})`);
}
