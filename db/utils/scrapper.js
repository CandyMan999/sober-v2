// === UI + SCRAPER (Stop button only, manual type) ===
(function () {
  // ---------- UI SETUP ----------
  function ensureScraperUI() {
    let panel = document.getElementById("scraper-panel");
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

      const header = document.createElement("div");
      header.style.display = "flex";
      header.style.alignItems = "center";
      header.style.justifyContent = "space-between";
      header.style.padding = "4px 6px";
      header.style.borderBottom = "1px solid #333";
      header.style.background = "#111";

      const title = document.createElement("span");
      title.textContent = "Venue Scraper";
      title.style.color = "#fff";
      title.style.fontSize = "11px";

      const stopBtn = document.createElement("button");
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

      const logBox = document.createElement("pre");
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

    // log to UI + console
    function log(message) {
      const logBox = document.getElementById("scraper-logs");
      const ts = new Date().toISOString().split("T")[1].split(".")[0];
      const line = `[${ts}] ${message}\n`;
      if (logBox) {
        logBox.textContent += line;
        logBox.scrollTop = logBox.scrollHeight;
      }
      console.log("[SCRAPER]", message);
    }

    function onStop(cb) {
      const btn = document.getElementById("scraper-stop-btn");
      if (!btn) return;
      btn.onclick = cb;
    }

    return { log, onStop };
  }

  const ui = ensureScraperUI();

  // ---------- SCRAPER ----------
  let intervalObj; // same global-ish interval
  const runScraper = async () => {
    const collection = document.getElementsByClassName("Nv2PK THOPZb CpccDe");
    let oldList = [];

    const removeDuplicates = async (data) => {
      let newData = [];
      const notBar = [
        "nail",
        "beauty",
        "salon",
        "blow",
        "lash",
        "tanning",
        "tan",
        "nails",
      ];
      for (let i = 0; i < data.length; i++) {
        let notBarFound = false;
        const name = data[i].name.split(" ");
        await name.map(async (word) => {
          await notBar.map((j) => {
            if (j === word.toLowerCase()) {
              notBarFound = true;
            }
          });
        });

        if (notBarFound) {
          continue;
        }
        if (
          await newData.every(
            (obj) => obj.lat !== data[i].lat && obj.long !== data[i].long
          )
        ) {
          newData = [...newData, data[i]];
        }
      }

      return newData;
    };

    let list = [];
    let finished = false;

    // STOP via button ONLY
    ui.onStop(async () => {
      if (finished) return;
      ui.log("Stop button clicked; stopping scraper");
      finished = true;
      clearInterval(intervalObj);

      const data = await removeDuplicates(list);
      ui.log(`Final count: ${data.length}`);
      console.log("FINAL DATA:", data);
      console.log("FINAL JSON:", JSON.stringify(data));
    });

    const scrollDown = async () => {
      if (finished) {
        ui.log("finished");
        clearInterval(intervalObj);
        return;
      }

      ui.log("scrapping");

      const data = await removeDuplicates(list);

      if (data.length > oldList.length) {
        ui.log(`New unique venues: ${data.length}`);
        console.log(data);
        oldList = data;
      }

      for (let i = 0; i < collection.length; i++) {
        const cardEl = collection[i];
        const html = cardEl.innerHTML;
        const parts = html.split("href=");
        if (parts.length < 2) continue;

        const url = parts[1];
        if (!url || !url.length) continue;

        // name
        const name = await url
          .split("/place")[1]
          .split("/")[1]
          .replace(/[^\s,a-zA-Z']+/gi, " ");

        // lat/long
        const location = await url.split("!3d")[1].split("!");
        const lat = await Number(location[0]);
        const long = await Number(location[1].split("4d")[1]);

        // NOTE: Set type manually later (e.g. "Bar" or "Liquor")
        const type = "Liquor"; // <-- change this manually in your data if needed

        list.push({
          type,
          name,
          lat,
          long,
        });
      }
    };

    ui.log('Scraper started. Scroll the list; click "Stop Scraper" to finish.');
    intervalObj = setInterval(scrollDown, 1000);
  };

  runScraper();

  // (optional helper from your original code, left intact)
  window.findScroller = function findScroller(element) {
    element.onscroll = function () {
      console.log(element);
    };

    return Array.from(element.children).forEach((el) => findScroller(el));
  };
})();
