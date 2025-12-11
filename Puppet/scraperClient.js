// runMap.js
// For ONE city: cycle through 3 categories, inject scraperClient,
// wait for Stop Scraper, then save a file per category.

const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const { CITIES } = require("./citiesList");
const runScraperClient = require("./scraperClient");

// Which city by index (from your giant CITIES array)
const ACTIVE_CITY_INDEX = 0; // 0 = New York, 8 = Dallas, etc.

// 3 categories + type + slug for filenames
const SEARCH_CATEGORIES = [
  { label: "Dive Bars", type: "Bar", slug: "dive-bars" },
  { label: "Liquor Store", type: "Liquor", slug: "liquor-store" },
  { label: "Night Club", type: "Liquor", slug: "night-club" },
];

const ZOOM_LEVEL = 13.02;

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

function slugifyCity(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// a tiny dedupe pass on Node side as an extra safety net
function dedupeVenues(venues) {
  const map = new Map();
  for (const v of venues || []) {
    if (typeof v.lat !== "number" || typeof v.long !== "number") continue;
    const key = `${v.type}|${v.name}|${v.lat.toFixed(6)},${v.long.toFixed(6)}`;
    if (!map.has(key)) map.set(key, v);
  }
  return Array.from(map.values());
}

(async () => {
  try {
    const city = CITIES[ACTIVE_CITY_INDEX];
    if (!city) {
      throw new Error(
        `No city at index ${ACTIVE_CITY_INDEX}. Check your citiesList.js.`
      );
    }

    const { city: cityName, latitude, longitude } = city;
    const citySlug = slugifyCity(cityName);

    console.log(`🏙  Active city: ${cityName} (${latitude}, ${longitude})`);

    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1400, height: 900 },
    });

    const page = await browser.newPage();

    for (const category of SEARCH_CATEGORIES) {
      const { label, type: categoryType, slug } = category;

      // e.g. "Dive Bars" -> "%22Dive+Bars%22"
      const encodedQuery = encodeURIComponent(`"${label}"`).replace(
        /%20/g,
        "+"
      );

      const url = `https://www.google.com/maps/search/${encodedQuery}/@${latitude},${longitude},${ZOOM_LEVEL}z`;

      console.log(
        `\n🔎 Starting category "${label}" (type=${categoryType}) for ${cityName}`
      );
      console.log("   URL:", url);

      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });

      console.log("⏳ Waiting for Maps UI + some results to load...");
      await sleep(6000);

      try {
        await page.waitForSelector(".Nv2PK.THOPZb.CpccDe", { timeout: 10000 });
        console.log("✅ Detected at least one result card.");
      } catch (e) {
        console.log("⚠️ No cards detected yet; scraper will still run.");
      }

      // reset flags from any previous category
      await page.evaluate(() => {
        window.__SCRAPER_DONE__ = false;
        window.__SCRAPER_RESULTS__ = null;
      });

      console.log("🧪 Injecting scraperClient for this category...");
      await page.evaluate(runScraperClient, categoryType);

      console.log(
        "✅ Scraper injected. It will auto-scroll + pan in a spiral.\n" +
          '👉 When you are satisfied, click "Stop Scraper" in the panel.\n'
      );

      // Poll for completion when you hit Stop
      let done = false;
      let collected = [];
      while (!done) {
        const status = await page.evaluate(() => ({
          done: !!window.__SCRAPER_DONE__,
          data: window.__SCRAPER_RESULTS__,
        }));

        if (status.done && Array.isArray(status.data)) {
          done = true;
          collected = status.data;
          break;
        }

        console.log(
          "  ⏳ Waiting for scraper to finish (click Stop Scraper when ready)..."
        );
        await sleep(5000);
      }

      const deduped = dedupeVenues(collected);
      const fileName = `venues-${citySlug}-${slug}.json`;
      const filePath = path.join(__dirname, fileName);

      fs.writeFileSync(filePath, JSON.stringify(deduped, null, 2));
      console.log(
        `💾 Saved ${deduped.length} venues for ${cityName} / ${label} → ${filePath}`
      );
    }

    console.log("\n🎉 All categories done for this city.");
    // You can close the browser or leave it open to inspect:
    // await browser.close();
  } catch (err) {
    console.error("❌ Error in runMap.js:", err);
    process.exit(1);
  }
})();
