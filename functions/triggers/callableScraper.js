// functions/triggers/callableScraper.js
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { fetchUrlContent } = require("../services/scraperService");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = defineSecret("GEMINI_API_KEY");

exports.fetchContent = onCall({ secrets: [apiKey] }, async (request) => {
  const { url } = request.data;

  // 1. Hole Raw Content (Fehler werden jetzt weich abgefangen)
  let rawHtml = "";
  try {
    const fetchedContent = await fetchUrlContent({ logger: console, url });
    if (fetchedContent) {
      rawHtml = fetchedContent;
    }
  } catch (error) {
    console.warn(
      `Fetch fehlgeschlagen für ${url}. Übergebe an Gemini für Fallback-Suche.`,
    );
    // rawHtml bleibt "", wir werfen keinen Fehler!
  }

  try {
    // 2. Gemini Setup
    const genAI = new GoogleGenerativeAI(apiKey.value());
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      tools: [{ googleSearch: {} }],
      generationConfig: {
        temperature: 0.1,
      },
    });

    // 3. Der angepasste Prompt mit 404-Fallback-Logik
    const prompt = `
      Du bist ein Daten-Extraktions-Assistent für eine Universitäts-Datenbank.
      
      ZIEL-URL (GELIEFERT): ${url}

      ANWEISUNG ZUR FEHLERBEHEBUNG (404 / TOLL-LINK):
      Wenn der unten stehende "Webseiten-Text" LEER ist (z.B. wegen eines 404 Fehlers), 
      leite aus der ZIEL-URL den Namen der Hochschule und des Studiengangs ab. 
      NUTZE DEINE SUCHFUNKTION (Google Search), um die aktuelle und gültige Webseite dieses Studiengangs zu finden.
      Extrahiere die Daten dann aus deinen Suchergebnissen und trage den neu gefundenen Link in das Feld "updated_url" ein.

      WICHTIG ZUR DATENANREICHERUNG:
      Wenn im Text Informationen FEHLEN oder veraltet sind, NUTZE DEINE SUCHFUNKTION, um aktuelle Daten zu finden.
      Rate nicht. Wenn etwas absolut nicht auffindbar ist, setze es auf null oder false.

      WICHTIG: Antworte AUSSCHLIESSLICH mit rohem JSON. 
      Keine Markdown-Formatierung (kein \`\`\`json), kein begleitender Text.

      WICHTIGE REGEL FÜR FRISTEN (deadlines):
      Fristen auf Uni-Seiten sind oft ungenau (z.B. "März", "Frühjahr", "wird noch bekannt gegeben").
      Befülle das 'deadlines' Objekt nach folgendem Prinzip:
      - 'exact_date': Im Format YYYY-MM-DD. Setze es auf null, wenn kein exakter Tag genannt wird.
      - 'display_text': Der genaue Wortlaut der Website (z.B. "Ende März", "Frühjahr 2026").
      - 'sort_date': Wenn kein exaktes Datum existiert, schätze ein logisches Enddatum im Format YYYY-MM-DD (z.B. bei "März" -> "2026-03-31", bei "Frühjahr" -> "2026-04-30").

      Erwartetes JSON Format:
      {
        "updated_url": "Falls ein neuer Link gesucht werden musste, hier eintragen. Sonst null. (String)",
        "title": "Name des Studiengangs (String)",
        "subtitle": "Spezifikation des Studienthemas (String)",
        "university_name": "Name der Hochschule (String)",
        "location": "Stadt/Standort (String)",
        "degree": "Abschlussart (z.B. Bachelor, Master)",
        "degree_specification": "Genauer Titel (z.B. Bachelor of Science, B.A.)",
        "study_length_semester": "Regelstudienzeit in Semestern (Number)",
        "zulassungsmodus": "z.B. 'Ohne_NC', 'NC', 'Eignungstest' (String)", 
        "credits_ects": "Anzahl ECTS Punkte (Number, meist 180, 210, 90 oder 120)",
        "fees": {
          "study_tuition_semester_eur": "Studiengebühren pro Semester in Euro (Number)",
          "application_fee": "Einmalige Bewerbungsgebühr in Euro (Number)",
          "enrollment_fee": "Einmalige Einschreibgebühr/Deposit in Euro (Number)"
        },
        "program_features": {
          "has_study_abroad": "hat das Studium Auslandssemester? (boolean)",
          "has_internship": "hat das Studium Praktika? (boolean)"
        },
        "requirements": {
           "english_proof": "Geforderter Sprachnachweis (String, z.B. 'TOEFL 90', 'C1', oder null)"
        },
        "deadlines": {
          "winter": {
            "exact_date": "YYYY-MM-DD oder null",
            "display_text": "Text wie auf der Webseite",
            "sort_date": "YYYY-MM-DD (geschätzt, falls kein Datum vorhanden)"
          },
          "summer": {
            "exact_date": "YYYY-MM-DD oder null",
            "display_text": "Text wie auf der Webseite",
            "sort_date": "YYYY-MM-DD (geschätzt, falls kein Datum vorhanden)"
          }
        },
        "start_dates": {
          "winter": "Tatsächlicher Studienbeginn im Wintersemester (String, z.B. '01. Oktober', 'Anfang September' oder null)",
          "summer": "Tatsächlicher Studienbeginn im Sommersemester (String, z.B. '15. März', 'Frühjahr' oder null)"
        },
        "study_types": {
          "is_fulltime": ist das ein Vollzeitstudium? (boolean),
          "is_parttime": ist das ein Teilzeitstudium? (boolean),
          "is_dual": ist das ein Duales Studium? (boolean),
          "is_fern": ist das ein Fernstudium? (boolean)
        },
        "languages": {
          "is_german": ist das ein deutschsprachiges Studium? (boolean),
          "is_english": ist das ein englischsprachiges Studium? (boolean),
          "is_french": ist das ein französischsprachiges Studium? (boolean),
          "is_spanish": ist das ein spanischsprachiges Studium? (boolean)
        },
        "description": "Kurze Zusammenfassung des Studiengangs (max 300 Zeichen)"
      }

      Webseiten-Text:
      ${rawHtml ? rawHtml.substring(0, 25000) : "LEER - DIE SEITE KONNTE NICHT GELADEN WERDEN."} 
    `;

    // 4. Generate
    const result = await model.generateContent(prompt);
    let responseText = result.response.text();

    // CLEANING
    responseText = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const data = JSON.parse(responseText);

    // 5. Mapping zurück

    return {
      original_url: url,
      updated_url: data.updated_url || null,

      // BASIS DATEN
      title: data.title,
      university_name: data.university_name,
      location: data.location,

      // STUDIEN-STRUKTUR (WICHTIG FÜR VERGLEICHBARKEIT)
      degree: data.degree,
      degree_specification: data.degree_specification, // z.B. "M.Sc."
      credits_ects: data.credits_ects || null, // NEU: z.B. 120
      study_length_semester: data.study_length_semester,

      // QUALITÄTS-MERKMALE
      has_study_abroad: data.program_features?.has_study_abroad || false, // NEU
      has_mandatory_internship: data.program_features?.has_internship || false, // NEU

      // FINANZEN (DETAILLIERTER)
      study_tuition_semester_eur: data.study_tuition_semester_eur,
      fees_application_eur: data.fees?.application_fee || 0, // NEU: Einmalig (z.B. 50€)
      fees_enrollment_eur: data.fees?.enrollment_fee || 0, // NEU: Einmalig (z.B. 1000€ Deposit)

      // ZULASSUNG & FRISTEN
      zulassungsmodus: data.zulassungsmodus,
      required_english_skills: data.requirements?.english_proof || null, // NEU: z.B. "TOEFL 90"

      deadline_winter_date: data.deadlines?.winter?.exact_date || null,
      deadline_winter_text: data.deadlines?.winter?.display_text || null,
      deadline_winter_sort: data.deadlines?.winter?.sort_date || null,

      deadline_summer_date: data.deadlines?.summer?.exact_date || null,
      deadline_summer_text: data.deadlines?.summer?.display_text || null,
      deadline_summer_sort: data.deadlines?.summer?.sort_date || null,

      // NEU: Die tatsächlichen Starttermine
      start_date_winter: data.start_dates?.winter || null,
      start_date_summer: data.start_dates?.summer || null,

      // FLAGS
      is_fulltime: data.study_types?.is_fulltime || false,
      is_parttime: data.study_types?.is_parttime || false,
      is_dual: data.study_types?.is_dual || false,
      is_fern: data.study_types?.is_fern || false,

      // SPRACHEN
      study_language_deutsch: data.languages?.is_german || false,
      study_language_englisch: data.languages?.is_english || false,
      study_language_franzoesisch: data.languages?.is_french || false,
      study_language_spanisch: data.languages?.is_spanish || false,

      description: data.description,
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
