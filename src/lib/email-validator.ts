// ============================
// Email validation utilities
// ============================

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Validate a single email address
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Parse manual email input (comma or newline separated)
 * Returns only valid, trimmed, lowercase, unique emails
 */
export function parseManualEmails(input: string): string[] {
  if (!input || !input.trim()) return [];

  const raw = input
    .split(/[,\n\r;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);

  const valid = raw.filter(isValidEmail);
  return Array.from(new Set(valid));
}

/**
 * Merge two email lists and deduplicate
 */
export function mergeEmails(list1: string[], list2: string[]): string[] {
  const combined = [...list1, ...list2].map((e) => e.trim().toLowerCase());
  return Array.from(new Set(combined)).filter(isValidEmail);
}

/**
 * Get invalid emails from a list for error reporting
 */
export function getInvalidEmails(input: string): string[] {
  if (!input || !input.trim()) return [];

  return input
    .split(/[,\n\r;]+/)
    .map((e) => e.trim())
    .filter((e) => e.length > 0 && !isValidEmail(e));
}
