const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;',
};
const ESCAPE_REGEX = /[&<>"']/g;

/**
 * Escapes HTML characters in a string to their corresponding HTML entities.
 * Optimized to use a single regex replacement pass.
 */
export function escapeHtml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe.replace(ESCAPE_REGEX, (match) => ESCAPE_MAP[match]);
}
