// ============================
// Template rendering utility
// ============================

/**
 * Normalize a header or placeholder name to lookup key
 */
export function normalizeKey(k: string) {
  return k
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/-+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

/**
 * Render template by replacing {key} placeholders with values from row map.
 * If a key is missing, uses fallback.
 */
export function renderTemplate(
  template: string,
  row: Record<string, any> = {},
  fallback = ""
): string {
  if (!template) return template;

  return template.replace(/\{([^}]+)\}/g, (_, rawKey: string) => {
    const key = normalizeKey(rawKey);
    const val = row?.[key];
    if (val === undefined || val === null || String(val).trim() === "") {
      return fallback;
    }
    return String(val);
  });
}

export default renderTemplate;
