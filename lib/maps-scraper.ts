import { chromium } from "playwright";

export interface MapsScrapeResult {
  name: string;
  website?: string;
  phone?: string;
  address?: string;
  mapsUrl?: string;
}

export async function scrapeGoogleMaps(
  keyword: string,
  location: string,
  maxResults: number
): Promise<MapsScrapeResult[]> {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (err) {
    throw new Error(
      `Playwright konnte nicht gestartet werden. Bitte stelle sicher, dass Chromium installiert ist. Details: ${err}`
    );
  }

  try {
    const page = await browser.newPage();

    const searchQuery = `${keyword} ${location}`;
    const url = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;

    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    const results: MapsScrapeResult[] = [];

    // Scroll to load results
    for (let i = 0; i < Math.min(maxResults, 20); i++) {
      await page.keyboard.press("End");
      await page.waitForTimeout(1000);
    }

    // Extract listing items
    const listings = await page.locator('[role="feed"] > div').all();

    for (const listing of listings.slice(0, maxResults)) {
      try {
        const name =
          (await listing
            .locator("a[aria-label]")
            .first()
            .getAttribute("aria-label")
            .catch(() => null)) ||
          (await listing
            .locator(".fontHeadlineSmall")
            .first()
            .textContent()
            .catch(() => null));

        if (!name) continue;

        // Click to get details
        await listing.click();
        await page.waitForTimeout(1500);

        const website =
          (await page
            .locator('a[data-item-id="authority"]')
            .getAttribute("href")
            .catch(() => null)) ||
          (await page
            .locator('button[data-item-id="authority"]')
            .textContent()
            .catch(() => null));

        const phone =
          (await page
            .locator('button[data-item-id^="phone"]')
            .textContent()
            .catch(() => null)) ||
          (await page
            .locator('[data-tooltip="Telefonnummer kopieren"]')
            .textContent()
            .catch(() => null));

        const address = await page
          .locator('button[data-item-id="address"]')
          .textContent()
          .catch(() => null);

        const mapsUrl = page.url();

        results.push({
          name: name.trim(),
          website: website?.trim() || undefined,
          phone: phone?.trim() || undefined,
          address: address?.trim() || undefined,
          mapsUrl,
        });
      } catch {
        continue;
      }
    }

    return results;
  } finally {
    await browser.close();
  }
}
