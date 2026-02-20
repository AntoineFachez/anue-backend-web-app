import { httpsCallable } from "firebase/functions";
import { functions } from "../lib/firebase/firebase";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const scrapeRows = async (selectedRows, onProgress) => {
  if (!selectedRows || selectedRows.length === 0) {
    return [];
  }

  const fetchContent = httpsCallable(functions, "fetchContent");
  const results = [];

  const CHUNK_SIZE = 5; // Max 3 requests at a time
  const DELAY_BETWEEN_CHUNKS = 4000; // 4 seconds delay between chunks (approx 15 RPM for Gemini Free Tier)

  const totalRows = selectedRows.length;
  let processedCount = 0;

  for (let i = 0; i < totalRows; i += CHUNK_SIZE) {
    const chunk = selectedRows.slice(i, i + CHUNK_SIZE);

    const chunkPromises = chunk.map(async (row) => {
      const urlKey = Object.keys(row).find(
        (key) => key.toLowerCase().includes("url") && row[key],
      );

      let rowResult;

      if (!urlKey) {
        console.warn(`No URL found for row ${row.id}`);
        rowResult = {
          id: row.id,
          updates: {
            error: "No URL found",
            details: "Could not find a valid URL to scrape for this record.",
          },
        };
      } else {
        const url = row[urlKey];

        try {
          console.log(`Scraping URL for row ${row.id}: ${url}`);
          const result = await fetchContent({ url });
          const extractedData = result.data;

          console.log(`Scraped data for row ${row.id}:`, extractedData);

          rowResult = {
            id: row.id,
            updates: extractedData,
          };
        } catch (error) {
          console.error(`Error scraping row ${row.id}:`, error);
          rowResult = {
            id: row.id,
            updates: {
              error: "Fetch failed",
              details:
                error.message || "Could not retrieve content from the URL.",
            },
          };
        }
      }

      processedCount++;
      if (onProgress) {
        onProgress(processedCount, totalRows, row);
      }

      return rowResult;
    });

    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);

    if (i + CHUNK_SIZE < totalRows) {
      console.log(`Waiting for ${DELAY_BETWEEN_CHUNKS}ms before next chunk...`);
      await delay(DELAY_BETWEEN_CHUNKS);
    }
  }

  if (onProgress) {
    onProgress(totalRows, totalRows, null);
  }

  return results;
};
