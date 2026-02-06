import dns from 'dns/promises';
import { isSafeUrl, isPrivateIP } from '@/lib/security';

/**
 * Validates a URL to prevent Server-Side Request Forgery (SSRF) with DNS resolution.
 * Extends isSafeUrl by resolving the hostname to an IP and checking if it's private.
 *
 * This prevents SSRF attacks where a public hostname (e.g., localtest.me)
 * resolves to a private IP (e.g., 127.0.0.1).
 */
export async function isSafeUrlWithDns(urlStr: string): Promise<boolean> {
  // First perform synchronous checks (format, obvious bad hosts)
  if (!isSafeUrl(urlStr)) {
    return false;
  }

  try {
    const url = new URL(urlStr);

    // Resolve hostname to IPv4 address
    // We force IPv4 because isPrivateIP currently only handles IPv4
    const { address } = await dns.lookup(url.hostname, { family: 4 });

    // Check if resolved IP is private
    if (isPrivateIP(address)) {
      return false;
    }

    return true;
  } catch (error) {
    // If DNS resolution fails, treat as unsafe for security (fail closed)
    return false;
  }
}
