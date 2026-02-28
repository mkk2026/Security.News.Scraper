import { timingSafeEqual, createHash } from 'crypto';

/**
 * Validates the API request using a Bearer token.
 * Compares the token against the API_SECRET_TOKEN environment variable
 * using a timing-safe comparison of their hashes to prevent length extension and timing attacks.
 */
export function validateApiRequest(req: Request): boolean {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.API_SECRET_TOKEN;

  if (!secret) {
    console.error('Security Warning: API_SECRET_TOKEN is not set in environment variables');
    return false;
  }

  try {
    const tokenHash = createHash('sha256').update(token).digest();
    const secretHash = createHash('sha256').update(secret).digest();

    return timingSafeEqual(tokenHash, secretHash);
  } catch (error) {
    console.error('Error validating API token:', error);
    return false;
  }
}
