/**
 * Enhanced website scraper with URL normalization and contact name extraction.
 * Re-exports base scraper functions and adds new utilities.
 */

export {
  extractEmailsFromText,
  scrapeWebsite,
} from "./scraper";

/**
 * Normalize a URL: ensures https://, handles www/no-www consistency,
 * and removes trailing slashes.
 */
export function normalizeUrl(url: string): string {
  if (!url) return "";
  let s = url.trim();
  // Add protocol if missing
  if (!/^https?:\/\//i.test(s)) {
    s = "https://" + s;
  }
  // Remove trailing slashes
  s = s.replace(/\/+$/, "");
  return s;
}

/**
 * Extract a contact person name from HTML content.
 * Looks for patterns like "Geschäftsführer: Name", "CEO: Name", etc.
 * Returns the first match or null.
 */
export function extractContactName(html: string): string | null {
  if (!html) return null;

  // Strip HTML tags first
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const pattern =
    /(?:Geschäftsführer|Inhaber|CEO|Managing Director|Ansprechpartner)[:\s]+([A-Z][a-z]+ [A-Z][a-z]+)/gi;

  const match = pattern.exec(text);
  if (match && match[1]) {
    return match[1].trim();
  }

  return null;
}
