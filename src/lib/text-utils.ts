// Constants
const CVE_REGEX = /CVE-\d{4}-\d{4,}/gi;

/**
 * Escapes potentially unsafe HTML characters.
 * @param text The text to escape.
 * @returns The escaped text.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
