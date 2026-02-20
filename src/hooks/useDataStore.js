import React, { useState, useEffect, useRef, useMemo } from "react";
import { Box, Chip } from "@mui/material";
import ErrorIcon from "@mui/icons-material/Error";

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

export function useDataStore() {
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [rowSelectionModel, setRowSelectionModel] = useState([]);
  const [searchText, setSearchText] = useState("");
  const timeoutRef = useRef(null);

  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        setColumnVisibilityModel(parsedState.visibility || {});
      } catch (e) {
        console.error("Failed to parse datagrid state from local storage", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Compute selected rows based on the model and rows
  const selectedRows = useMemo(() => {
    const selectionSet = new Set(rowSelectionModel.map(String));
    return rows.filter((row) => selectionSet.has(String(row.id)));
  }, [rowSelectionModel, rows]);

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

    finalColumns = finalColumns.map((col) => {
      if (col.field === "tags") {
        return {
          ...col,
          width: 250,
          renderCell: (params) => {
            if (!Array.isArray(params.value)) return params.value;

            return (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, py: 1 }}>
                {params.value.map((tag, index) => (
                  <Chip key={index} label={tag} size="small" />
                ))}
              </Box>
            );
          },
        };
      }
      return col;
    });

    const sortedFinalColumns = finalColumns.sort((a, b) => {
      if (a.field === "error") return -1;
      if (b.field === "error") return 1;
      if (a.field === "details") return -1;
      if (b.field === "details") return 1;

      const indexA = COLUMN_ORDER.indexOf(a.field);
      const indexB = COLUMN_ORDER.indexOf(b.field);

      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;

      return 0;
    });

    setRows(newRows);
    setColumns(sortedFinalColumns);
  };

  const handleRowSelectionModelChange = (foo, bar) => {
    let selection = [];

    if (Array.isArray(foo)) {
      selection = foo;
    } else if (foo && foo.ids && foo.ids instanceof Set) {
      if (foo.type === "exclude") {
        const excludedSet = foo.ids;
        selection = rows
          .map((r) => String(r.id))
          .filter((id) => !excludedSet.has(id) && !excludedSet.has(Number(id)));
      } else {
        selection = Array.from(foo.ids);
      }
    } else if (Array.isArray(bar)) {
      selection = bar;
    }

    setRowSelectionModel(selection);
  };

  const handleSearchChange = (event) => {
    setSearchText(event.target.value);
  };

  const handleClearFile = () => {
    setRows([]);
    setColumns([]);
    setRowSelectionModel([]);
    setSearchText("");
  };

  const handleClearSearch = () => {
    setSearchText("");
  };

  // Applies new scraped data to existing grid State
  const applyScrapedUpdates = (results) => {
    setColumns((prevCols) => {
      const newCols = [...prevCols];
      const existingFields = new Set(newCols.map((c) => c.field));

      const allNewKeys = new Set();
      results.forEach((r) => {
        if (r.updates) {
          Object.keys(r.updates).forEach((key) => allNewKeys.add(key));
        }
      });

      allNewKeys.forEach((key) => {
        if (!existingFields.has(key)) {
          let colDef = {
            field: key,
            headerName: key.charAt(0).toUpperCase() + key.slice(1),
            width: 150,
          };

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
          } else if (key === "tags") {
            colDef.width = 250;
            colDef.renderCell = (params) => {
              if (!Array.isArray(params.value)) return params.value;
              return (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, py: 1 }}>
                  {params.value.map((tag, index) => (
                    <Chip key={index} label={tag} size="small" />
                  ))}
                </Box>
              );
            };
          }

          newCols.push(colDef);
          existingFields.add(key);
        }
      });

      const sortedCols = newCols.sort((a, b) => {
        if (a.field === "error") return -1;
        if (b.field === "error") return 1;
        if (a.field === "details") return -1;
        if (b.field === "details") return 1;

        const indexA = COLUMN_ORDER.indexOf(a.field);
        const indexB = COLUMN_ORDER.indexOf(b.field);

        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;

        return 0;
      });

      return sortedCols;
    });

    setRows((prevRows) => {
      return prevRows.map((row) => {
        const update = results.find((r) => r.id === row.id);
        if (update) {
          const merged = { ...row, ...update.updates };

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
    handleRowSelectionModelChange,
    handleSearchChange,
    handleClearFile,
    handleClearSearch,
    applyScrapedUpdates,
  };
}
