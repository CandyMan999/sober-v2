const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const { Picture } = require("../models");

require("dotenv").config();

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID; // e.g. 367247...
const CF_API_TOKEN = process.env.CF_API_TOKEN; // API Token with Images:Edit
// You should set this to your imagedelivery base, e.g.:
// CF_IMAGES_BASE_URL=https://imagedelivery.net/o9IMJdMAwk7ijgmm9FnmYg
const CF_IMAGES_BASE_URL = process.env.CF_IMAGES_BASE_URL;

// ---- Local image imports ----
// 7 days (you already had these)
// const days7Sober1 = path.join(__dirname, "..", "assets/7daysSober/7days1.png");
const days7Sober2 = path.join(__dirname, "..", "assets/7daysSober/7days2.jpg");
const days7Sober3 = path.join(__dirname, "..", "assets/7daysSober/7days3.jpg");
const days7Sober4 = path.join(__dirname, "..", "assets/7daysSober/7days4.jpg");
const days7Sober5 = path.join(__dirname, "..", "assets/7daysSober/7days5.jpg");
const days7Sober6 = path.join(__dirname, "..", "assets/7daysSober/7days6.jpg");
const days7Sober7 = path.join(__dirname, "..", "assets/7daysSober/7days7.jpg");

// 10 days — you said you have 8 pics in this folder
const days10Sober1 = path.join(
  __dirname,
  "..",
  "assets/10daysSober/10days1.png"
);
const days10Sober2 = path.join(
  __dirname,
  "..",
  "assets/10daysSober/10days2.png"
);
const days10Sober3 = path.join(
  __dirname,
  "..",
  "assets/10daysSober/10days3.png"
);
const days10Sober4 = path.join(
  __dirname,
  "..",
  "assets/10daysSober/10days4.png"
);
const days10Sober5 = path.join(
  __dirname,
  "..",
  "assets/10daysSober/10days5.png"
);
const days10Sober6 = path.join(
  __dirname,
  "..",
  "assets/10daysSober/10days6.png"
);
const days10Sober7 = path.join(
  __dirname,
  "..",
  "assets/10daysSober/10days7.png"
);
const days10Sober8 = path.join(
  __dirname,
  "..",
  "assets/10daysSober/10days8.png"
);

// 14 days — 4 pics
const days14Sober1 = path.join(
  __dirname,
  "..",
  "assets/14daysSober/14days1.png"
);
const days14Sober2 = path.join(
  __dirname,
  "..",
  "assets/14daysSober/14days2.png"
);
const days14Sober3 = path.join(
  __dirname,
  "..",
  "assets/14daysSober/14days3.png"
);
const days14Sober4 = path.join(
  __dirname,
  "..",
  "assets/14daysSober/14days4.png"
);

// 365 days — 1 pic: 356daysSober/1year1.png (assuming that’s the exact path)
const days365Sober1 = path.join(
  __dirname,
  "..",
  "assets/365daysSober/1year1.png"
);

// ---------------- Cloudflare helpers ----------------

const directUpload = async () => {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
    throw new Error(
      "Cloudflare credentials missing (CF_ACCOUNT_ID / CF_API_TOKEN)"
    );
  }

  const resp = await axios.post(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v2/direct_upload`,
    null,
    {
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
      },
    }
  );

  const data = resp?.data;
  const ok = data && data.success === true;
  const result = ok ? data.result : null;
  const uploadURL = result?.uploadURL;
  const id = result?.id;

  if (!ok || !uploadURL || !id) {
    throw new Error("Cloudflare direct upload failed: " + JSON.stringify(data));
  }

  return { uploadURL, id };
};

const uploadLocalImageToCloudflare = async (localPath) => {
  const { uploadURL, id } = await directUpload();

  const form = new FormData();
  form.append("file", fs.createReadStream(localPath));

  await axios.post(uploadURL, form, {
    headers: form.getHeaders(),
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  if (!CF_IMAGES_BASE_URL) {
    throw new Error(
      "CF_IMAGES_BASE_URL is not set. Set it to your imagedelivery base, e.g. https://imagedelivery.net/o9IMJdMAwk7ijgmm9FnmYg"
    );
  }

  // Standard Cloudflare Images delivery URL pattern:
  const url = `${CF_IMAGES_BASE_URL}/${id}/public`;

  return { id, url };
};

// ---------------- Seeding logic ----------------

const addMilestoneImages = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("DB connected");

    // Each entry: local file + milestone enum value
    const seedData = [
      // 7 days
      //   { file: days7Sober1, milestone: "day7" },
      //   { file: days7Sober2, milestone: "day7" },
      //   { file: days7Sober3, milestone: "day7" },
      //   { file: days7Sober4, milestone: "day7" },
      //   { file: days7Sober5, milestone: "day7" },
      //   { file: days7Sober6, milestone: "day7" },
      //   { file: days7Sober7, milestone: "day7" },
      // 10 days (8 total)
      //   { file: days10Sober1, milestone: "day10" },
      //   { file: days10Sober2, milestone: "day10" },
      //   { file: days10Sober3, milestone: "day10" },
      //   { file: days10Sober4, milestone: "day10" },
      //   { file: days10Sober5, milestone: "day10" },
      //   { file: days10Sober6, milestone: "day10" },
      //   { file: days10Sober7, milestone: "day10" },
      //   { file: days10Sober8, milestone: "day10" },
      //   // 14 days (4)
      //   { file: days14Sober1, milestone: "day14" },
      //   { file: days14Sober2, milestone: "day14" },
      //   { file: days14Sober3, milestone: "day14" },
      //   { file: days14Sober4, milestone: "day14" },
      //   // 365 days (1)
      //   { file: days365Sober1, milestone: "day365" },
    ];

    for (let i = 0; i < seedData.length; i++) {
      const { file, milestone } = seedData[i];
      try {
        console.log(`Uploading ${file} for milestone ${milestone}...`);
        const { id: publicId, url } = await uploadLocalImageToCloudflare(file);

        const picture = await Picture.create({
          url,
          publicId,
          user: null, // generic milestone art, not tied to a user
          milestone,
          provider: "Cloudflare",
        });

        console.log(
          `✅ [${i + 1}/${seedData.length}] Seeded ${milestone} image`,
          picture.id,
          url
        );
      } catch (err) {
        console.error(`❌ Failed seeding ${file}:`, err.message || err);
      }
    }

    console.log("🎉 Done seeding milestone images.");
    process.exit(0);
  } catch (err) {
    console.error("Fatal error seeding milestone images:", err);
    process.exit(1);
  }
};

addMilestoneImages();
