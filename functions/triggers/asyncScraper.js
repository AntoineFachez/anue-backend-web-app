// functions/triggers/asyncScraper.js
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const { fetchUrlContent } = require("../services/scraperService");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = defineSecret("GEMINI_API_KEY");

exports.asyncScrapeContent = onDocumentUpdated(
  {
    document: "courses/{courseId}",
    secrets: [apiKey],
    maxInstances: 5, // Limit concurrency to prevent hitting Gemini rate limits easily
    timeoutSeconds: 120, // Give it time to fetch and process
    memory: "512MiB",
  },
  async (event) => {
    const newValue = event.data.after.data();
    const previousValue = event.data.before.data();

    // Only trigger if status just changed to PENDING_SCRAPE
    if (
      newValue.scrape_status !== "PENDING_SCRAPE" ||
      previousValue.scrape_status === "PENDING_SCRAPE"
    ) {
      return null;
    }

    // Get the dynamically named URL field (handles the fact that the excel column name might vary slightly)
    const urlKey = Object.keys(newValue).find(
      (key) => key.toLowerCase().includes("url") && newValue[key],
    );

    const url = urlKey ? newValue[urlKey] : null;

    if (!url) {
      return event.data.after.ref.update({
        scrape_status: "ERROR",
        error: "No URL found",
        details: "Could not find a valid URL to scrape for this record.",
      });
    }

    try {
      // 1. Mark as SCRAPING
      await event.data.after.ref.update({ scrape_status: "SCRAPING" });

      // 2. Fetch Raw Content
      let rawHtml = "";
      try {
        const fetchedContent = await fetchUrlContent({ logger: console, url });
        if (fetchedContent) {
          rawHtml = fetchedContent;
        }
      } catch (error) {
        console.warn(
          `Fetch failed for ${url}. Forwarding to Gemini for fallback search.`,
        );
      }

      // 3. Setup Gemini
      const genAI = new GoogleGenerativeAI(apiKey.value());
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        tools: [{ googleSearch: {} }],
        generationConfig: {
          temperature: 0.1,
        },
      });

      // 4. Prompt
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

        "title": "Name des Studiengangs an der spezifischen Hochschule (String)",
        "subtitle": "Spezifikation des Studienthemas, z.B. Logistik, Management, Wirtschaftswissenschaften, Bioingenieurwesen (String)",
        "university_name": "Name der Hochschule (String)",
        "location": "Stadt/Standort, z.B. München, Deutschland (String)",
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
          "is_fulltime": "ist das ein Vollzeitstudium? (boolean)",
          "is_parttime": "ist das ein Teilzeitstudium? (boolean)",
          "is_dual": "ist das ein Duales Studium? (boolean)",
          "is_fern": "ist das ein Fernstudium? (boolean)"
        },
        "languages": {
          "is_german": "ist das ein deutschsprachiges Studium? (boolean)",
          "is_english": "ist das ein englischsprachiges Studium? (boolean)",
          "is_french": "ist das ein französischsprachiges Studium? (boolean)",
          "is_spanish": "ist das ein spanischsprachiges Studium? (boolean)"

        },
        "description": "Kurze Zusammenfassung des Studiengangs (max 300 Zeichen)"
      }

      Webseiten-Text:
      ${rawHtml ? rawHtml.substring(0, 150000) : "LEER - DIE SEITE KONNTE NICHT GELADEN WERDEN."} 
    `;

      // 5. Generate and Parse
      const result = await model.generateContent(prompt);
      let responseText = result.response.text();

      responseText = responseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const data = JSON.parse(responseText);

      // 6. Map to DB Schema
      const updates = {
        scrape_status: "COMPLETED",
        error: null,
        details: null,
        scraped_at: new Date().toISOString(),
        original_url: url,
        updated_url: data.updated_url || null,
        university_name: data.university_name || "Unknown University",
        title: data.title || "Unknown Title",
        subtitle: data.subtitle || null,
        location: data.location || "Unknown Location",
        description: data.description || "",
        degree: data.degree || "",
        degree_specification: data.degree_specification || "",
        study_length_semester: data.study_length_semester || 0,
        credits_ects: data.credits_ects || null,
        is_fulltime: data.study_types?.is_fulltime || false,
        is_parttime: data.study_types?.is_parttime || false,
        is_dual: data.study_types?.is_dual || false,
        is_fern: data.study_types?.is_fern || false,
        study_language_deutsch: data.languages?.is_german || false,
        study_language_englisch: data.languages?.is_english || false,
        study_language_franzoesisch: data.languages?.is_french || false,
        study_language_spanisch: data.languages?.is_spanish || false,
        has_study_abroad: data.program_features?.has_study_abroad || false,
        has_mandatory_internship:
          data.program_features?.has_internship || false,
        zulassungsmodus: data.zulassungsmodus || "Unknown",
        required_english_skills: data.requirements?.english_proof || null,
        study_tuition_semester_eur: data.study_tuition_semester_eur || 0,
        fees_application_eur: data.fees?.application_fee || 0,
        fees_enrollment_eur: data.fees?.enrollment_fee || 0,
        start_date_winter: data.start_dates?.winter || null,
        deadline_winter_date: data.deadlines?.winter?.exact_date || null,
        deadline_winter_text: data.deadlines?.winter?.display_text || null,
        deadline_winter_sort: data.deadlines?.winter?.sort_date || null,
        start_date_summer: data.start_dates?.summer || null,
        deadline_summer_date: data.deadlines?.summer?.exact_date || null,
        deadline_summer_text: data.deadlines?.summer?.display_text || null,
        deadline_summer_sort: data.deadlines?.summer?.sort_date || null,
      };

      // 7. Save back to Firestore
      return event.data.after.ref.update(updates);
    } catch (error) {
      console.error("Async Scraper AI Processing Error:", error);
      return event.data.after.ref.update({
        scrape_status: "ERROR",
        error: "Extraction failed",
        details:
          error.message || "Something went wrong during Gemini processing.",
      });
    }
  },
);
