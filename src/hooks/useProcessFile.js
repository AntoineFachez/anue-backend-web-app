import React, { useState, useEffect, useRef } from "react";
import { Box } from "@mui/material";
import ErrorIcon from "@mui/icons-material/Error";
import { httpsCallable } from "firebase/functions";
import { functions } from "../lib/firebase/firebase";
import * as XLSX from "xlsx";

const STORAGE_KEY = "datagrid-column-visibility";

const COLUMN_ORDER = [
  // 1. Identifikation & System
  "id",
  "course_id",
  "smartId",
  "originalId",
  // 2. Basisdaten Hochschule & Studiengang
  "university_name",
  "title",
  "subtitle",
  "location",
  "description",
  // 3. Abschluss & Studienstruktur
  "degree",
  "degree_specification",
  "study_length_semester",
  "credits_ects",
  // 4. Studienform (Flags)
  "is_fulltime",
  "is_parttime",
  "is_dual",
  "is_fern",
  "is_employment_adjunct",
  // 5. Sprachen (Flags)
  "study_language_deutsch",
  "study_language_englisch",
  "study_language_franzoesisch",
  "study_language_spanisch",
  // 6. Qualität & Spezifika
  "has_study_abroad",
  "has_mandatory_internship",
  // 7. Zulassung & Voraussetzungen
  "zulassungsmodus",
  "required_english_skills",
  // 8. Kosten & Finanzen
  "study_tuition_semester_eur",
  "fees_application_eur",
  "fees_enrollment_eur",
  // 9. Termine: Wintersemester
  "start_date_winter",
  "deadline_winter_date",
  "deadline_winter_text",
  "deadline_winter_sort",
  // 10. Termine: Sommersemester
  "start_date_summer",
  "deadline_summer_date",
  "deadline_summer_text",
  "deadline_summer_sort",
  // 11. Scraping-Metadaten & URLs
  "study_url",
  "original_url",
  "updated_url",
  "scraped_at",
  // 12. App-Steuerung & Sonstiges
  "is_active",
  "Comments",
  // 13. Veraltete / Rohe Felder (Empfehlung: Später löschen)
  "study_semester",
  "start_winter",
  "deadline_winter",
  "start_summer",
  "deadline_summer",
];

export function useProcessFile() {
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [rowSelectionModel, setRowSelectionModel] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [searchText, setSearchText] = useState("");
  const timeoutRef = useRef(null);

  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        setColumnVisibilityModel(parsedState.visibility || {});
        // Widths are applied when columns are generated
      } catch (e) {
        console.error("Failed to parse datagrid state from local storage", e);
      }
    }
    setIsLoaded(true);
  }, []);

  const saveState = (visibility, cols) => {
    const widths = cols.reduce((acc, col) => {
      acc[col.field] = col.width;
      return acc;
    }, {});

    const state = {
      visibility,
      widths,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  const handleColumnVisibilityChange = (newModel) => {
    setColumnVisibilityModel(newModel);
    saveState(newModel, columns);
  };

  const handleColumnResize = (params) => {
    const newColumns = columns.map((col) => {
      if (col.field === params.colDef.field) {
        return { ...col, width: params.width };
      }
      return col;
    });
    setColumns(newColumns);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      saveState(columnVisibilityModel, newColumns);
    }, 500);
  };

  const handleDataParsed = (newRows, newColumns) => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    let finalColumns = newColumns;

    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        const savedWidths = parsedState.widths || {};

        finalColumns = newColumns.map((col) => ({
          ...col,
          width: savedWidths[col.field] || col.width,
        }));
      } catch (e) {
        console.error("Failed to apply saved widths", e);
      }
    }

    // Ensure 'smartId' column exists if not present
    // It should be coming from FileUpload now, but we can keep a check or just Trust FileUpload
    // Sort columns based on COLUMN_ORDER
    const sortedFinalColumns = finalColumns.sort((a, b) => {
      // Special handling for error/details
      if (a.field === "error") return -1;
      if (b.field === "error") return 1;
      if (a.field === "details") return -1;
      if (b.field === "details") return 1;

      const indexA = COLUMN_ORDER.indexOf(a.field);
      const indexB = COLUMN_ORDER.indexOf(b.field);

      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      if (indexA !== -1) return -1; // a is in list, b is not -> a comes first
      if (indexB !== -1) return 1; // b is in list, a is not -> b comes first

      return 0; // maintain relative order for unknown columns
    });

    setRows(newRows);
    setColumns(sortedFinalColumns);
  };

  const handleCellClick = (params) => {
    if (params.colDef.headerName === "study_url" && params.value) {
      window.open(params.value, "_blank");
    }
  };

  const handleRowSelectionModelChange = (foo, bar) => {
    let selection = [];

    // Check if it's the standard array
    if (Array.isArray(foo)) {
      selection = foo;
    }
    // Check if it's the object structure { ids: Set }
    else if (foo && foo.ids && foo.ids instanceof Set) {
      if (foo.type === "exclude") {
        // "Exclude" mode: Select all rows MINUS the excluded ones
        // If ids is empty, it means Select ALL.
        const excludedSet = foo.ids;
        selection = rows
          .map((r) => String(r.id))
          .filter((id) => !excludedSet.has(id) && !excludedSet.has(Number(id)));
      } else {
        // "Include" mode (default): Only these IDs are selected
        selection = Array.from(foo.ids);
      }
    }
    // Fallback/Safety check
    else if (Array.isArray(bar)) {
      selection = bar;
    }

    // Convert to Set for faster lookup and ensuring uniqueness
    const selectionSet = new Set(selection.map(String));

    // Update local state for controlled component
    setRowSelectionModel(selection);

    // Filter rows that are in the selection
    const selected = rows.filter((row) => selectionSet.has(String(row.id)));

    setSelectedRows(selected);
  };

  const handleScrapeHTMLContent = async () => {
    if (selectedRows.length === 0) {
      alert("Please select at least one row to scrape.");
      return;
    }

    const fetchContent = httpsCallable(functions, "fetchContent");

    const results = [];
    for (const [index, row] of selectedRows.entries()) {
      // Add delay between requests to prevent IP blocking
      if (index > 0) {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      const urlKey = Object.keys(row).find(
        (key) => key.toLowerCase().includes("url") && row[key],
      );

      if (!urlKey) {
        console.warn(`No URL found for row ${row.id}`);
        continue;
      }

      const url = row[urlKey];

      try {
        console.log(`Scraping URL for row ${row.id}: ${url}`);
        const result = await fetchContent({ url });
        const extractedData = result.data; // { course, fees, deadline }

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
            details:
              error.message || "Could not retrieve content from the URL.",
          },
        });
      }
    }

    // Dynamically update columns based on new keys in results AND sort everything
    setColumns((prevCols) => {
      const newCols = [...prevCols];
      const existingFields = new Set(newCols.map((c) => c.field));

      // Collect all potential new keys from results
      const allNewKeys = new Set();
      results.forEach((r) => {
        if (r.updates) {
          Object.keys(r.updates).forEach((key) => allNewKeys.add(key));
        }
      });

      // Add new columns if they don't exist
      allNewKeys.forEach((key) => {
        if (!existingFields.has(key)) {
          let colDef = {
            field: key,
            headerName: key.charAt(0).toUpperCase() + key.slice(1),
            width: 150,
          };

          // Apply specific formatting
          if (key === "error") {
            colDef = {
              field: "error",
              headerName: "Error",
              width: 150,
              renderCell: (params) =>
                params.value ? (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      color: "error.main",
                    }}
                  >
                    <ErrorIcon fontSize="small" />
                    {params.value}
                  </Box>
                ) : null,
            };
          } else if (key === "details") {
            colDef.width = 300;
          } else if (key.startsWith("is_") || key.startsWith("has_")) {
            colDef.type = "boolean";
            colDef.width = 100;
          } else if (key.includes("description")) {
            colDef.width = 400;
          } else if (key.includes("deadline")) {
            colDef.width = 200;
          }

          newCols.push(colDef);
          existingFields.add(key);
        }
      });

      // Sort ALL columns based on COLUMN_ORDER
      // Items not in COLUMN_ORDER go to the end
      // 'error' and 'details' are special cases -> always put them first for visibility if present
      const sortedCols = newCols.sort((a, b) => {
        // Special handling for error/details
        if (a.field === "error") return -1;
        if (b.field === "error") return 1;
        if (a.field === "details") return -1;
        if (b.field === "details") return 1;

        const indexA = COLUMN_ORDER.indexOf(a.field);
        const indexB = COLUMN_ORDER.indexOf(b.field);

        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
        if (indexA !== -1) return -1; // a is in list, b is not -> a comes first
        if (indexB !== -1) return 1; // b is in list, a is not -> b comes first

        return 0; // maintain relative order for unknown columns
      });

      return sortedCols;
    });

    // Update state with new data
    setRows((prevRows) => {
      return prevRows.map((row) => {
        const update = results.find((r) => r.id === row.id);
        if (update) {
          const merged = { ...row, ...update.updates };

          // If there's an error, prioritize position: error, details, smartId, ...rest
          if (update.updates.error) {
            const { error, details, smartId, ...rest } = merged;
            const ordered = { error, details };
            if (smartId !== undefined) {
              ordered.smartId = smartId;
            }
            return { ...ordered, ...rest };
          }
          return merged;
        }
        return row;
      });
    });
  };

  const handleSearchChange = (event) => {
    setSearchText(event.target.value);
  };
  const handleClearFile = (event) => {
    setRows([]);
    setColumns([]);
    setRowSelectionModel([]);
    setSelectedRows([]);
    setSearchText("");
  };

  const handleClearSearch = () => {
    setSearchText("");
  };

  const handleDownloadXLSX = () => {
    console.log("handleDownloadXLSX clicked");

    if (rows.length === 0) {
      alert("No data to download.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Scraped Data");
    XLSX.writeFile(workbook, "scraped_data.xlsx");
  };

  return {
    rows,
    columns,
    columnVisibilityModel,
    isLoaded,
    rowSelectionModel,
    selectedRows,
    searchText,
    handleColumnVisibilityChange,
    handleColumnResize,
    handleDataParsed,
    handleCellClick,
    handleRowSelectionModelChange,
    handleScrapeHTMLContent,
    handleSearchChange,
    handleClearFile,
    handleClearSearch,
    handleDownloadXLSX,
  };
}
