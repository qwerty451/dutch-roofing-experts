/**
 * Validates that a string is a safe image URL or a local upload path.
 * Rejects data: URIs, javascript: URIs, and other dangerous schemes.
 */
export function isSafeUrl(value: string): boolean {
  if (!value) return true; // empty = no image, that's fine
  // Allow local upload paths served from /uploads/
  if (value.startsWith("/uploads/")) return true;
  // Allow absolute http/https URLs
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Strips any HTML/script tags from a string.
 */
export function sanitizeText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, "") // strip tags
    .slice(0, 2000);          // hard length cap
}
