// functions/scraper/scraper.js

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const { fetchUrlContent } = require("../services/scraperService");

/**
 * Callable Cloud Function to fetch content from a given URL.
 * Expects the client to send: { "url": "https://example.com" }
 */
exports.fetchContent = onCall(
  {
    memory: "512MiB",
    timeoutSeconds: 30,
  },
  async (request) => {
    // The client's payload is in `request.data`.
    const { url } = request.data;
    logger.info("fetchContent callable function invoked.", { url });

    // The service now handles all validation and fetching.
    try {
      const content = await fetchUrlContent({ logger, url });
      // On success, return the data directly.
      return { content };
    } catch (error) {
      // If the service throws an error, catch it and convert it
      // into a structured HttpsError for the client.
      logger.error(`fetchContent failed for url "${url}":`, error.message);

      // Determine the error code based on the error message if needed
      if (
        error.message.includes("must be provided") ||
        error.message.includes("must start with")
      ) {
        throw new HttpsError("invalid-argument", error.message);
      }

      throw new HttpsError("unavailable", error.message);
    }
  },
);
