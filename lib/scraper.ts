export function normalizeWebsiteUrl(url: string): string {
  if (!url) return "";
  let s = url.trim();
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  s = s.replace(/\/+$/, "");
  return s;
}

export function extractEmailsFromText(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const found = text.match(emailRegex) || [];
  const badPrefixes = ["noreply", "no-reply", "donotreply", "example", "test@"];
  return [
    ...new Set(
      found
        .map((e) => e.toLowerCase())
        .filter((e) => !badPrefixes.some((b) => e.includes(b)))
    ),
  ];
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function scrapeWebsite(
  website: string
): Promise<{ emails: string[]; error?: string }> {
  const base = normalizeWebsiteUrl(website);
  if (!base) return { emails: [], error: "no url" };

  const paths = [
    "",
    "/impressum",
    "/kontakt",
    "/contact",
    "/about",
    "/ueber-uns",
  ];
  let combinedText = "";

  for (const path of paths) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const resp = await fetch(base + path, {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; OkunOS/1.0)" },
      });
      clearTimeout(timeout);

      if (resp.ok) {
        const text = await resp.text();
        if (text.length > 200) {
          combinedText += "\n" + stripHtml(text).slice(0, 80000);
        }
      }
    } catch {
      // continue
    }
  }

  const emails = extractEmailsFromText(combinedText);
  return { emails };
}
