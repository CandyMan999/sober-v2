// runMap.js
const puppeteer = require("puppeteer");
const runScraperClient = require("./scraperClient.js");

// small sleep helper
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 },
  });

  const page = await browser.newPage();

  console.log("🌐 Opening Google Maps search...");
  await page.goto("https://www.google.com/maps/search/dive+bars", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  console.log("⏳ Waiting for UI to load...");
  await sleep(6000);

  // Optional wait for results card container
  try {
    await page.waitForSelector(".Nv2PK.THOPZb.CpccDe", { timeout: 10000 });
    console.log("✅ Found result cards.");
  } catch {
    console.log("⚠️ No result cards yet. You may need to scroll manually.");
  }

  console.log("🧪 Injecting scraper...");
  await page.evaluate(runScraperClient);

  console.log("✅ Scraper injected.");
  console.log("👉 Look for the 'Venue Scraper' UI panel in the bottom-right.");
  console.log("👉 Scroll the list on the left to load more results.");
  console.log("👉 Click 'Stop Scraper' when done.");
})();
