// runMap.js
// For each city: cycle through categories, inject in-page scraper,
// auto-pan up to ~100 miles, handle edge cases so we don't freeze,
// then save a file per category.

const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const { CITIES } = require("./citiesList");

// Categories + type + slug for filenames
const SEARCH_CATEGORIES = [
  { label: "Dive Bars", type: "Bar", slug: "dive-bars" },
  { label: "Liquor Store", type: "Liquor", slug: "liquor-store" },
  { label: "Night Club", type: "Liquor", slug: "night-club" },
];

const ZOOM_LEVEL = 13.02;
const MAX_RADIUS_MILES = 100; // ~100 miles of panning per city/category

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

function slugifyCity(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// extra dedupe pass on Node side
function dedupeVenues(venues) {
  const map = new Map();
  for (const v of venues || []) {
    if (typeof v.lat !== "number" || typeof v.long !== "number") continue;
    const key = `${v.type}|${v.name}|${v.lat.toFixed(6)},${v.long.toFixed(6)}`;
    if (!map.has(key)) map.set(key, v);
  }
  return Array.from(map.values());
}

// This function runs INSIDE the page (browser) via page.evaluate
function inPageScraper(options) {
  (function () {
    options = options || {};
    var categoryType = options.categoryType || "Liquor";
    var centerLat =
      typeof options.centerLat === "number" ? options.centerLat : 0;
    var zoomLevel =
      typeof options.zoomLevel === "number" ? options.zoomLevel : 13;
    var maxRadiusMiles =
      typeof options.maxRadiusMiles === "number" ? options.maxRadiusMiles : 100;
    var maxRadiusMeters = maxRadiusMiles * 1609.34;

    function metersPerPixel(lat, zoom) {
      var EARTH_CIRC = 40075016.686; // meters
      return (
        (Math.cos((lat * Math.PI) / 180) * EARTH_CIRC) /
        (256 * Math.pow(2, zoom))
      );
    }

    var metersPerPx = metersPerPixel(centerLat, zoomLevel);
    var cumulativeMeters = 0;

    // ---------- UI SETUP ----------
    function ensureScraperUI() {
      var panel = document.getElementById("scraper-panel");
      if (!panel) {
        panel = document.createElement("div");
        panel.id = "scraper-panel";
        panel.style.position = "fixed";
        panel.style.bottom = "10px";
        panel.style.right = "10px";
        panel.style.zIndex = "999999";
        panel.style.width = "320px";
        panel.style.maxHeight = "260px";
        panel.style.background = "rgba(0,0,0,0.85)";
        panel.style.color = "#0f0";
        panel.style.fontFamily = "monospace";
        panel.style.fontSize = "11px";
        panel.style.borderRadius = "6px";
        panel.style.boxShadow = "0 0 8px rgba(0,0,0,0.6)";
        panel.style.display = "flex";
        panel.style.flexDirection = "column";
        panel.style.overflow = "hidden";
        panel.style.border = "1px solid #333";

        var header = document.createElement("div");
        header.style.display = "flex";
        header.style.alignItems = "center";
        header.style.justifyContent = "space-between";
        header.style.padding = "4px 6px";
        header.style.borderBottom = "1px solid #333";
        header.style.background = "#111";

        var title = document.createElement("span");
        title.textContent = "Venue Scraper";
        title.style.color = "#fff";
        title.style.fontSize = "11px";

        var stopBtn = document.createElement("button");
        stopBtn.id = "scraper-stop-btn";
        stopBtn.textContent = "Stop Scraper";
        stopBtn.style.fontSize = "11px";
        stopBtn.style.padding = "2px 6px";
        stopBtn.style.cursor = "pointer";
        stopBtn.style.border = "1px solid #a00";
        stopBtn.style.borderRadius = "4px";
        stopBtn.style.background = "#800";
        stopBtn.style.color = "#fff";

        header.appendChild(title);
        header.appendChild(stopBtn);

        var logBox = document.createElement("pre");
        logBox.id = "scraper-logs";
        logBox.style.margin = "0";
        logBox.style.padding = "4px 6px";
        logBox.style.whiteSpace = "pre-wrap";
        logBox.style.overflowY = "auto";
        logBox.style.flex = "1";

        panel.appendChild(header);
        panel.appendChild(logBox);
        document.body.appendChild(panel);
      }

      function log(message) {
        var logBox = document.getElementById("scraper-logs");
        var ts = new Date().toISOString().split("T")[1].split(".")[0];
        var line = "[" + ts + "] " + message + "\n";
        if (logBox) {
          logBox.textContent += line;
          logBox.scrollTop = logBox.scrollHeight;
        }
        console.log("[SCRAPER]", message);
      }

      function onStop(cb) {
        var btn = document.getElementById("scraper-stop-btn");
        if (!btn) return;
        btn.onclick = cb;
      }

      return { log: log, onStop: onStop };
    }

    // expose flags so Puppeteer can read them
    window.__SCRAPER_DONE__ = false;
    window.__SCRAPER_RESULTS__ = [];
    window.__SCRAPER_PANNED_METERS__ = 0;

    var ui = ensureScraperUI();

    // ---------- HELPERS ----------

    function ensureUpdateOnPanEnabled() {
      var btn = document.querySelector(
        'button[jsaction*="pane.queryOnPan.toggle"]'
      );
      if (!btn) {
        ui.log('Could not find "Update results when map moves" button.');
        return;
      }

      var checked = btn.getAttribute("aria-checked");
      if (checked !== "true") {
        btn.click();
        ui.log('Enabled "Update results when map moves".');
      }
    }

    function reachedEndOfList() {
      var endEls = document.querySelectorAll(".m6QErb.XiKgde.tLjsW.eKbjU");
      for (var i = 0; i < endEls.length; i++) {
        var el = endEls[i];
        if (
          el.textContent &&
          el.textContent.indexOf("You've reached the end of the list.") !== -1
        ) {
          return true;
        }
      }
      return false;
    }

    function noResultsFound() {
      var el = document.querySelector(".qR292b.Hk4XGb.fontBodyMedium");
      if (!el || !el.textContent) return false;
      return (
        el.textContent.indexOf("No results found") !== -1 ||
        el.textContent.indexOf(
          "To see more results, try panning or zooming the map."
        ) !== -1
      );
    }

    function findScrollContainer() {
      var cards = document.getElementsByClassName("Nv2PK THOPZb CpccDe");
      if (!cards.length) return null;

      var el = cards[0].parentElement;
      while (el && el !== document.body) {
        var style = window.getComputedStyle(el);
        var overflowY = style.overflowY || style.overflow;
        var canScroll =
          el.scrollHeight > el.clientHeight &&
          (overflowY === "auto" || overflowY === "scroll");
        if (canScroll) return el;
        el = el.parentElement;
      }

      return null;
    }

    // ---------- MAIN SCRAPER LOOP ----------

    var intervalId;
    var panCooldown = false;

    function runScraper() {
      var list = [];
      var oldList = [];
      var finished = false;
      var scrollContainer = null;

      // edge-case tracking
      var stagnationTicks = 0;
      var maxStagnationTicks = 5; // if no new venues for 5 ticks, force a pan
      var totalTicks = 0;
      var maxTotalTicks = 1800 / 2; // 900 ticks at 2s = 30 min failsafe

      function removeDuplicates(data) {
        var newData = [];
        var notBar = [
          "nail",
          "beauty",
          "salon",
          "blow",
          "lash",
          "tanning",
          "tan",
          "nails",
        ];

        for (var i = 0; i < data.length; i++) {
          var notBarFound = false;
          var nameParts = (data[i].name || "").split(" ");

          for (var j = 0; j < nameParts.length; j++) {
            var word = nameParts[j].toLowerCase();
            for (var k = 0; k < notBar.length; k++) {
              if (notBar[k] === word) {
                notBarFound = true;
                break;
              }
            }
            if (notBarFound) break;
          }

          if (notBarFound) continue;

          var isDuplicate = false;
          for (var m = 0; m < newData.length; m++) {
            var obj = newData[m];
            if (obj.lat === data[i].lat && obj.long === data[i].long) {
              isDuplicate = true;
              break;
            }
          }

          if (!isDuplicate) {
            newData.push(data[i]);
          }
        }

        return newData;
      }

      function finalizeAndStop(reason) {
        if (finished) return;
        finished = true;
        clearInterval(intervalId);

        var data = removeDuplicates(list);

        window.__SCRAPER_RESULTS__ = data;
        window.__SCRAPER_DONE__ = true;

        ui.log(
          "Final count: " + data.length + (reason ? " (" + reason + ")" : "")
        );
        console.log("FINAL DATA:", data);
        console.log("FINAL JSON:", JSON.stringify(data));
      }

      scrollContainer = findScrollContainer();
      if (scrollContainer) {
        ui.log("Found scrollable results container. Auto-scroll enabled.");
      } else {
        ui.log(
          "Could not find scrollable container. Please scroll manually; scraping will still run."
        );
      }

      ui.onStop(function () {
        finalizeAndStop("manual stop");
      });

      function panMapSlightly() {
        if (panCooldown) {
          ui.log("Pan skipped (cooldown active).");
          return;
        }

        var target =
          document.querySelector('canvas[aria-label*="Map"]') ||
          document.querySelector("canvas[aria-label]") ||
          document.querySelector('div[role="application"] canvas') ||
          document.querySelector("#scene div canvas") ||
          document.querySelector('div[role="application"]') ||
          document.querySelector("#scene") ||
          document.querySelector("canvas");

        if (!target) {
          ui.log("Could not find map surface to pan.");
          return;
        }

        var rect = target.getBoundingClientRect();
        var startX = rect.left + rect.width * 0.5;
        var startY = rect.top + rect.height * 0.5;

        var dx =
          (Math.random() > 0.5 ? 1 : -1) * Math.max(40, rect.width * 0.1);
        var dy =
          (Math.random() > 0.5 ? 1 : -1) * Math.max(40, rect.height * 0.1);

        var endX = startX + dx;
        var endY = startY + dy;

        var steps = 5;
        var pointerSupported = "PointerEvent" in window;

        function dispatch(type, x, y) {
          var base = {
            bubbles: true,
            cancelable: true,
            clientX: x,
            clientY: y,
            buttons: 1,
          };

          if (pointerSupported && type.indexOf("pointer") === 0) {
            target.dispatchEvent(
              new PointerEvent(type, {
                pointerId: 1,
                pointerType: "mouse",
                bubbles: base.bubbles,
                cancelable: base.cancelable,
                clientX: base.clientX,
                clientY: base.clientY,
                buttons: base.buttons,
              })
            );
          } else {
            target.dispatchEvent(new MouseEvent(type, base));
          }
        }

        dispatch("pointerdown", startX, startY);
        dispatch("mousedown", startX, startY);

        for (var i = 1; i <= steps; i++) {
          var t = i / steps;
          var x = startX + (endX - startX) * t;
          var y = startY + (endY - startY) * t;
          dispatch("pointermove", x, y);
          dispatch("mousemove", x, y);
        }

        dispatch("pointerup", endX, endY);
        dispatch("mouseup", endX, endY);

        var pixelDist = Math.sqrt(dx * dx + dy * dy);
        cumulativeMeters += pixelDist * metersPerPx;
        window.__SCRAPER_PANNED_METERS__ = cumulativeMeters;

        ui.log(
          "Panned map slightly. Approx total distance: " +
            (cumulativeMeters / 1609.34).toFixed(1) +
            " mi"
        );

        panCooldown = true;
        setTimeout(function () {
          panCooldown = false;
        }, 1500);
      }

      function tick() {
        if (finished) {
          ui.log("finished");
          clearInterval(intervalId);
          return;
        }

        totalTicks++;
        if (totalTicks > maxTotalTicks) {
          ui.log("Max ticks reached. Failsafe auto-stop.");
          finalizeAndStop("max ticks failsafe");
          return;
        }

        // Auto stop when we think we've covered about maxRadiusMiles
        if (cumulativeMeters >= maxRadiusMeters) {
          ui.log(
            "Reached approx " +
              maxRadiusMiles +
              " miles of panning. Auto-stopping."
          );
          finalizeAndStop("auto-stop max radius");
          return;
        }

        ensureUpdateOnPanEnabled();

        var atBottom = false;
        if (scrollContainer) {
          var bottomThreshold = 5;
          atBottom =
            scrollContainer.scrollTop + scrollContainer.clientHeight >=
            scrollContainer.scrollHeight - bottomThreshold;
        }

        // Edge case: list is visually at bottom but Google didn't show "end of list"
        if (reachedEndOfList() || noResultsFound() || atBottom) {
          ui.log(
            "Reached end / bottom / no results. Panning map to new area..."
          );
          if (scrollContainer) {
            scrollContainer.scrollTop = 0;
          }
          panMapSlightly();
          return;
        }

        ui.log("scraping tick...");

        if (scrollContainer) {
          scrollContainer.scrollBy({ top: 500, behavior: "smooth" });
        }

        var collection = document.getElementsByClassName("Nv2PK THOPZb CpccDe");

        for (var i = 0; i < collection.length; i++) {
          var cardEl = collection[i];
          var html = cardEl.innerHTML;
          var parts = html.split("href=");
          if (parts.length < 2) continue;

          var url = parts[1];
          if (!url || !url.length) continue;

          var name = "";
          try {
            name = url
              .split("/place")[1]
              .split("/")[1]
              .replace(/[^\s,a-zA-Z']+/gi, " ");
          } catch (e) {
            continue;
          }

          var lat, longVal;
          try {
            var location = url.split("!3d")[1].split("!");
            lat = Number(location[0]);
            longVal = Number(location[1].split("4d")[1]);
          } catch (e) {
            continue;
          }

          list.push({
            type: categoryType,
            name: name,
            lat: lat,
            long: longVal,
          });
        }

        var deduped = removeDuplicates(list);

        // Keep a live snapshot so Node can bail out if needed
        window.__SCRAPER_RESULTS__ = deduped;

        if (deduped.length > oldList.length) {
          stagnationTicks = 0;
          ui.log("New unique venues: " + deduped.length);
          console.log("CURRENT DATA:", deduped);
          oldList = deduped;
        } else {
          stagnationTicks++;
          ui.log(
            "No new venues this tick. Stagnation count: " + stagnationTicks
          );
          if (stagnationTicks >= maxStagnationTicks) {
            ui.log(
              "No new venues for a while. Forcing map pan to avoid freeze."
            );
            if (scrollContainer) {
              scrollContainer.scrollTop = 0;
            }
            stagnationTicks = 0;
            panMapSlightly();
          }
        }
      }

      ui.log(
        "Scraper started. Auto-scroll + map pan enabled; will auto-stop around " +
          maxRadiusMiles +
          " miles, on manual stop, or failsafe limits."
      );
      intervalId = setInterval(tick, 2000);
    }

    runScraper();
  })();
}

// -------------- Node / Puppeteer driver --------------

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1400, height: 900 },
    });

    const page = await browser.newPage();

    // Loop through ALL cities
    for (let cityIndex = 0; cityIndex < CITIES.length; cityIndex++) {
      const city = CITIES[cityIndex];
      if (!city) continue;

      const { city: cityName, latitude, longitude } = city;
      const citySlug = slugifyCity(cityName);

      console.log(
        `\n🏙  City ${cityIndex + 1}/${
          CITIES.length
        }: ${cityName} (${latitude}, ${longitude})`
      );

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
          await page.waitForSelector(".Nv2PK.THOPZb.CpccDe", {
            timeout: 10000,
          });
          console.log("✅ Detected at least one result card.");
        } catch (e) {
          console.log("⚠️ No cards detected yet; scraper will still run.");
        }

        // reset flags
        await page.evaluate(() => {
          window.__SCRAPER_DONE__ = false;
          window.__SCRAPER_RESULTS__ = [];
          window.__SCRAPER_PANNED_METERS__ = 0;
        });

        console.log("🧪 Injecting in-page scraper for this category...");
        await page.evaluate(inPageScraper, {
          categoryType,
          centerLat: latitude,
          zoomLevel: ZOOM_LEVEL,
          maxRadiusMiles: MAX_RADIUS_MILES,
        });

        console.log(
          "✅ Scraper injected.\n" +
            "👉 It will auto-scroll & pan.\n" +
            `👉 It will auto-stop around ~${MAX_RADIUS_MILES} miles, manual stop, or failsafe.\n`
        );

        let done = false;
        let collected = [];
        let waitIterations = 0;
        const MAX_WAIT_ITERATIONS = 240; // 240 * 5s = 20 min fail-safe

        while (!done && waitIterations < MAX_WAIT_ITERATIONS) {
          const status = await page.evaluate(() => ({
            done: !!window.__SCRAPER_DONE__,
            data: window.__SCRAPER_RESULTS__ || [],
            pannedMeters: window.__SCRAPER_PANNED_METERS__ || 0,
          }));

          if (status.done && Array.isArray(status.data)) {
            done = true;
            collected = status.data;
            console.log(
              `✅ Scraper finished. Approx panned distance: ${(
                status.pannedMeters / 1609.34
              ).toFixed(1)} mi`
            );
            break;
          }

          console.log(
            "  ⏳ Waiting for scraper to finish (auto, manual, or edge-case failsafe)..."
          );
          waitIterations++;
          await sleep(5000);
        }

        if (!done) {
          console.log(
            "⚠️ Scraper did not signal completion in time. Using last snapshot as fallback."
          );
          const status = await page.evaluate(() => ({
            data: window.__SCRAPER_RESULTS__ || [],
            pannedMeters: window.__SCRAPER_PANNED_METERS__ || 0,
          }));
          collected = status.data;
          console.log(
            `⚠️ Fallback snapshot. Approx panned distance: ${(
              status.pannedMeters / 1609.34
            ).toFixed(1)} mi`
          );
        }

        const deduped = dedupeVenues(collected);
        const fileName = `venues-${citySlug}-${slug}.json`;
        const filePath = path.join(__dirname, fileName);

        fs.writeFileSync(filePath, JSON.stringify(deduped, null, 2));
        console.log(
          `💾 Saved ${deduped.length} venues for ${cityName} / ${label} → ${filePath}`
        );
      }

      console.log(`\n🎉 All categories done for city: ${cityName}.`);
    }

    console.log("\n🏁 All cities completed.");
    // await browser.close(); // uncomment if you want it to close automatically
  } catch (err) {
    console.error("❌ Error in runMap.js:", err);
    process.exit(1);
  }
})();
