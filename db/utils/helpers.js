function removeDuplicates(data) {
  var newData = [];
  var seen = {};

  // Words indicating beauty/nail salons that are NOT bars
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

  // Your FULL blockNames list preserved exactly
  var blockNames = [
    "quiktrip",
    "qt",
    "7 eleven",
    "seven eleven",
    "eleven",
    "circle k",
    "amoco",
    "murphy usa",
    "murphy express",
    "conoco",
    "valero",
    "bp",
    "sunoco",
    "mobil",
    "exxon",
    "chevron",
    "love's",
    "loves",
    "marathon",
    "shell",
    "pilot",
    "flying j",
    "speedway",
    "thorntons",
    "kum & go",
    "kum and go",
    "get n go",
    "get go",
    "stop n go",
    "on the run",
    "maverik",

    "cvs",
    "walgreens",
    "rite aid",
    "riteaid",

    "target",
    "walmart",
    "wal-mart",
    "costco",
    "sam's club",
    "sams club",

    "hy vee",
    "hy-vee",
    "kroger",
    "dillons",
    "publix",
    "meijer",
    "albertsons",
    "safeway",
    "vons",
    "ralphs",
    "food lion",
    "giant",
    "giant eagle",
    "smith's",
    "fry's",
    "harris teeter",
    "king soopers",
    "food city",
    "piggly wiggly",
    "bashas",
    "shaws",
    "price chopper",
    "stop & shop",
    "food4less",
    "food 4 less",
    "sprouts",
    "trader joe",
    "trader joe's",
    "whole foods",
    "wholefoods",
    "aldi",
    "save a lot",
    "save-a-lot",
    "supervalu",
    "winco",
    "fresh thyme",
    "fresh market",

    "carrefour",
    "tesco",
    "sainsbury",
    "waitrose",
    "asda",
    "lidl",
    "coop",
    "co-op",
    "metro",
    "woolworths",
    "coles",
    "countdown",
    "auchan",
    "billa",
    "penny",
    "rewe",
    "migros",
    "jumbo",
    "pingo doce",
    "mercadona",
    "supermercado",
    "supermarket",
    "hypermarket",
    "maxima",
    "spar",
    "dmart",
    "reliance fresh",
    "big bazaar",

    "dollar general",
    "dollar tree",
    "family dollar",
    "big lots",
    "five below",

    "grocery",
    "market",
    "mart",
    "supermarket",
    "hypermarket",
    "station",
    "stop",
    "express",
    "xpress",
    "corner store",
    "in n out",
  ];

  // Strong category blockers (only used if gmapsCategory exists)
  var blockCategories = [
    "grocery",
    "supermarket",
    "convenience",
    "gas station",
    "department store",
    "pharmacy",
    "drugstore",
    "drug store",
    "warehouse",
    "big-box",
    "supercenter",
    "coffee shop",
    "cafe",
    "restaurant",
    "hotel",
    "motel",
    "inn",
    "lodging",
    "fast food",
  ];

  function isBarLike(name, cat) {
    var n = (name || "").toLowerCase();
    var c = (cat || "").toLowerCase();

    // LIQUOR / BAR WORDS OVERRIDE ALL BLOCKS
    const overrideRegex =
      /(bar|pub|saloon|tavern|lounge|speakeasy|taproom|cocktail|liquor|wine|spirit|spirits|brewery|distillery|bottle ?shop|wine ?bar)/i;

    if (overrideRegex.test(n)) return true; // name contains override
    if (overrideRegex.test(c)) return true; // category contains override

    // Liquor stores
    if (n.includes("liquor") || c.includes("liquor")) return true;

    // Wine bars
    if (c.includes("wine bar")) return true;

    return false;
  }

  for (var i = 0; i < data.length; i++) {
    var item = data[i];
    if (!item) continue;

    var lat = item.lat;
    var lng = item.long;
    if (typeof lat !== "number" || typeof lng !== "number") continue;

    // Deduplication by coordinates
    var key = lat.toFixed(6) + "," + lng.toFixed(6);
    if (seen[key]) continue;
    seen[key] = true;

    var nameLower = (item.name || "").toLowerCase();
    var catLower = (item.gmapsCategory || "").toLowerCase();
    var hasCategory = Object.prototype.hasOwnProperty.call(
      item,
      "gmapsCategory"
    );

    // If clearly a bar / liquor venue → keep it no matter what
    if (isBarLike(item.name, item.gmapsCategory)) {
      newData.push(item);
      continue;
    }

    // SALONS / NAILS / BEAUTY FILTER
    for (var nb of notBar) {
      if (nameLower.includes(nb)) {
        // skip
        continue;
      }
    }

    var shouldBlock = false;

    // CATEGORY LOGIC (only when gmapsCategory exists)
    if (hasCategory && catLower.length > 0) {
      for (var cat of blockCategories) {
        if (catLower.includes(cat)) {
          shouldBlock = true;
          break;
        }
      }
    }

    // NAME LOGIC (always used)
    if (!shouldBlock) {
      for (var b of blockNames) {
        if (nameLower.includes(b)) {
          shouldBlock = true;
          break;
        }
      }
    }

    if (!shouldBlock) newData.push(item);
  }

  return newData;
}
