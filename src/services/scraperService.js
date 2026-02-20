import { httpsCallable } from "firebase/functions";
import { functions } from "../lib/firebase/firebase";

export const scrapeRows = async (selectedRows, onProgress) => {
  if (!selectedRows || selectedRows.length === 0) {
    return [];
  }

  const fetchContent = httpsCallable(functions, "fetchContent");
  const results = [];

  for (const [index, row] of selectedRows.entries()) {
    if (onProgress) {
      onProgress(index, selectedRows.length, row);
    }

    if (index > 0) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    const urlKey = Object.keys(row).find(
      (key) => key.toLowerCase().includes("url") && row[key],
    );

    if (!urlKey) {
      console.warn(`No URL found for row ${row.id}`);
      results.push({
        id: row.id,
        updates: {
          error: "No URL found",
          details: "Could not find a valid URL to scrape for this record.",
        },
      });
      continue;
    }

    const url = row[urlKey];

    try {
      console.log(`Scraping URL for row ${row.id}: ${url}`);
      const result = await fetchContent({ url });
      const extractedData = result.data;

      console.log(`Scraped data for row ${row.id}:`, extractedData);

      results.push({
        id: row.id,
        updates: extractedData,
      });
    } catch (error) {
      console.error(`Error scraping row ${row.id}:`, error);
      results.push({
        id: row.id,
        updates: {
          error: "Fetch failed",
          details: error.message || "Could not retrieve content from the URL.",
        },
      });
    }
  }

  if (onProgress) {
    onProgress(selectedRows.length, selectedRows.length, null);
  }

  return results;
};
