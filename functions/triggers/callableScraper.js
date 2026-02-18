// functions/triggers/callableScraper.js
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { fetchUrlContent } = require("../services/scraperService");
// NEU: Importiere das SDK
const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = defineSecret("GEMINI_API_KEY");

exports.fetchContent = onCall({ secrets: [apiKey] }, async (request) => {
  const { url } = request.data;

  // 1. Hole Raw Content (Das hast du schon)
  const rawHtml = await fetchUrlContent({ logger: console, url });

  // 2. (Optional aber empfohlen) Cleaning
  // const cleanText = removeTags(rawHtml);

  // 3. Gemini Setup (Das fehlt dir)
  const genAI = new GoogleGenerativeAI(apiKey.value());
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    // WICHTIG: Erzwinge JSON Output
    generationConfig: { responseMimeType: "application/json" },
  });

  // 4. Der Prompt (Das fehlt dir)
  const prompt = `
      Analysiere den folgenden Webseiten-Text einer Universität.
      Extrahiere den Studiengang, die Kosten pro Semester und die Einschreibefrist.
      Antworte strikt im JSON Format: 
      { "course": string, "fees": number, "deadline": string }
      
      Webseiten-Text:
      ${rawHtml.substring(0, 20000)} // Achtung: Länge begrenzen!
    `;

  // 5. Generate (Das fehlt dir)
  const result = await model.generateContent(prompt);
  const jsonResponse = result.response.text();

  return JSON.parse(jsonResponse);
});
