// Manifest prose to inline HTML: everything is escaped, and `backtick` spans
// become <code>. Used with set:html, so nothing in a manifest can inject markup.
const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"]/g, (c) => ESC[c] ?? c);
}

export function inlineHtml(text: string): string {
  return text
    .replace(/\s*\n\s*/g, ' ')
    .split(/(`[^`]+`)/g)
    .map((part) => (/^`[^`]+`$/.test(part) ? `<code>${escapeHtml(part.slice(1, -1))}</code>` : escapeHtml(part)))
    .join('');
}
