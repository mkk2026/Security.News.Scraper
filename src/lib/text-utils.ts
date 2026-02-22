// Constants
const CVE_REGEX = /CVE-\d{4}-\d{4,}/gi;
const CVE_CHECK_REGEX = /cve-/i;

// HTML Entity Map for faster escaping
const ENTITY_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;',
};

const ESCAPE_REGEX = /[&<>"']/g;

/**
 * Checks if text contains potential CVE identifiers.
 * This is a fast pre-check to avoid expensive highlighting operations.
 *
 * @param text The text to check.
 * @returns True if the text might contain a CVE ID.
 */
export function hasCves(text: string): boolean {
  return CVE_CHECK_REGEX.test(text);
}

/**
 * Escapes potentially unsafe HTML characters.
 * Optimized to use a single regex pass instead of chained replacements.
 * @param text The text to escape.
 * @returns The escaped text.
 */
export function escapeHtml(text: string): string {
  if (!text) return text;
  return text.replace(ESCAPE_REGEX, (char) => ENTITY_MAP[char]);
}

/**
 * Highlights CVE IDs in text with a specific style.
 * Uses a shared regex instance to avoid recreation on every call.
 *
 * @param text The text containing CVE IDs.
 * @returns HTML string with highlighted CVEs.
 */
export function highlightCves(text: string): string {
  const escaped = escapeHtml(text);
  return escaped.replace(CVE_REGEX, (match) =>
    `<span class="bg-gradient-to-r from-amber-200 to-orange-200 text-slate-900 font-bold px-1.5 py-0.5 rounded text-xs border border-amber-300/50">${match}</span>`
  );
}
