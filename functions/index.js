// functions/index.js
require("@google-cloud/trace-agent").start();
require("dotenv").config({ path: "../.env" });
const admin = require("firebase-admin");
const { setGlobalOptions } = require("firebase-functions/v2");
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

try {
  admin.initializeApp();
} catch (e) {
  /* This can be ignored on local emulator reloads */
}
setGlobalOptions({ region: "europe-west1" });

// --- Define Secrets ---
const apiKey = defineSecret("GEMINI_API_KEY");
const firebaseCreds = defineSecret("FIREBASE_CREDS");

// --- Import the Main API ---
const app = require("./app");

// --- Import All Trigger Functions ---
//* Firestore Triggers
//* Scheduled Triggers
//* Callable Triggers (Client-invoked functions)
// const { backfillEmbeddings } = require("./triggers/callableEmbeddingsGen");
// const { secureDataExtractor } = require("./auth/secureAi");
const { fetchContent } = require("./triggers/callableScraper");
const { asyncScrapeContent } = require("./triggers/asyncScraper");

// const { getYouTubeTranscript } = require("./triggers/callableTransscript");

//* Auth Triggers
//! not in firebase SDK /v2 yet
// const { handleUserCreate } = require("./triggers/callableAuth");

// --- Export All Functions ---
//* app.js export

exports.api = onRequest(
  { memory: "1GiB", secrets: [apiKey, firebaseCreds] },
  app,
);
//* individual background and callable triggers
exports.fetchContent = fetchContent;
exports.asyncScrapeContent = asyncScrapeContent;

//! not in firebase SDK /v2 yet
