import { timingSafeEqual } from 'crypto';

/**
 * Validates the API request using a Bearer token.
 * Compares the token against the API_SECRET_TOKEN environment variable
 * using a timing-safe comparison.
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
    const tokenBuffer = Buffer.from(token);
    const secretBuffer = Buffer.from(secret);

    if (tokenBuffer.length !== secretBuffer.length) {
      return false;
    }

    return timingSafeEqual(tokenBuffer, secretBuffer);
  } catch (error) {
    console.error('Error validating API token:', error);
    return false;
  }
}
