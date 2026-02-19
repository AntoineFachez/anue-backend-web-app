// functions/triggers/callableScraper.js
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { fetchUrlContent } = require("../services/scraperService");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = defineSecret("GEMINI_API_KEY");

exports.fetchContent = onCall({ secrets: [apiKey] }, async (request) => {
  const { url } = request.data;

  // 1. Hole Raw Content
  let rawHtml;
  try {
    rawHtml = await fetchUrlContent({ logger: console, url });
    if (!rawHtml) {
      // Fallback, falls fetchUrlContent null zurückgibt (z.B. 404)
      throw new Error("Kein Inhalt gefunden (404 oder leer).");
    }
  } catch (error) {
    console.error("Fetch Fehler:", error);
    return { error: "Fetch failed", details: error.message };
  }

  try {
    // 2. Gemini Setup
    const genAI = new GoogleGenerativeAI(apiKey.value());
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",

      tools: [
        {
          googleSearch: {},
        },
      ],
      generationConfig: {
        // responseMimeType: "application/json",
        temperature: 0.1, // Niedrige Temperatur für fakten-basierte Daten
      },
    });

    // 3. Der Prompt basierend auf deiner CSV-Struktur
    const prompt = `
      Du bist ein Daten-Extraktions-Assistent für eine Universitäts-Datenbank.
      Analysiere den folgenden Text einer Studiengangs-Webseite.
      
      Ziel: Extrahiere Daten passend zu diesem JSON-Schema. 

      WICHTIG ZUR DATENANREICHERUNG:
      Wenn wichtige Informationen (wie aktuelle Fristen oder Gebühren) im Text FEHLEN oder veraltet wirken, 
      NUTZE DEINE SUCHFUNKTION (Google Search), um die aktuellen Daten für diesen Studiengang/Uni zu finden.
      
      Fülle das JSON so vollständig wie möglich aus.

      Wenn eine Information nicht zu finden ist, setze sie auf null (bei Zahlen/Strings) oder false (bei Booleans).
      Rate nicht.

WICHTIG: Antworte AUSSCHLIESSLICH mit rohem JSON. 
      Keine Markdown-Formatierung (kein \`\`\`json), kein begleitender Text.

      Erwartetes JSON Format:
      {
        "title": "Name des Studiengangs (String)",
        "university_name": "Name der Hochschule (String)",
        "location": "Stadt/Standort (String)",
        "degree": "Abschlussart (z.B. Bachelor, Master)",
        "degree_specification": "Genauer Titel (z.B. Bachelor of Science, B.A.)",
        "study_length_semester": "Regelstudienzeit in Semestern (Number)",
        "study_tuition_semester_eur": "Studiengebühren pro Semester in Euro (Number, 0 falls staatlich/kostenlos)",
        "zulassungsmodus": "z.B. 'Ohne_NC', 'NC', 'Eignungstest' (String)",
        "deadlines": {
          "winter": "Frist für Wintersemester (String, z.B. '15.07.' oder 'Jederzeit')",
          "summer": "Frist für Sommersemester (String, z.B. '15.01.' oder null)"
        },
        "study_types": {
          "is_fulltime": boolean,
          "is_parttime": boolean,
          "is_dual": boolean,
          "is_fern": boolean (Fernstudium)
        },
        "languages": {
          "is_german": boolean,
          "is_english": boolean,
          "is_french": boolean,
          "is_spanish": boolean
        },
        "description": "Kurze Zusammenfassung des Studiengangs (max 300 Zeichen)"
      }

      Webseiten-Text:
      ${rawHtml.substring(0, 25000)} 
    `;

    // 4. Generate
    const result = await model.generateContent(prompt);
    let responseText = result.response.text();

    // CLEANING: Entferne Markdown-Code-Blöcke, falls Gemini sie trotzdem sendet
    responseText = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const data = JSON.parse(responseText);

    // 5. Mapping zurück auf deine flache CSV-Struktur (Optional, falls Frontend das braucht)
    // Hier wandeln wir das verschachtelte JSON in dein flaches Format um
    return {
      title: data.title,
      university_name: data.university_name,
      location: data.location,
      degree: data.degree,
      degree_specification: data.degree_specification,
      study_length_semester: data.study_length_semester,
      study_tuition_semester_eur: data.study_tuition_semester_eur,
      zulassungsmodus: data.zulassungsmodus,
      deadline_winter: data.deadlines?.winter || null,
      deadline_summer: data.deadlines?.summer || null,
      // Booleans flachklopfen
      is_fulltime: data.study_types?.is_fulltime || false,
      is_parttime: data.study_types?.is_parttime || false,
      is_dual: data.study_types?.is_dual || false,
      is_fern: data.study_types?.is_fern || false,
      // Sprachen flachklopfen
      study_language_deutsch: data.languages?.is_german || false,
      study_language_englisch: data.languages?.is_english || false,
      study_language_franzoesisch: data.languages?.is_french || false,
      study_language_spanisch: data.languages?.is_spanish || false,
      description: data.description,
      // Metadaten
      scraped_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error("AI Processing Error:", error);
    return {
      error: error.message,
      title: "Error extracting data",
    };
  }
});
