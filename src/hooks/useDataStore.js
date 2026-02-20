import React, { useState, useEffect, useRef, useMemo } from "react";
import { Box, Chip } from "@mui/material";

import { Check, Close, Error } from "@mui/icons-material";

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
  "scrape_status",
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

import {
  loadCoursesFromDB,
  saveCoursesToDB,
  listenToCoursesDB,
} from "@/services/courseService";
import { CircularProgress } from "@mui/material";

// ... [Skipping unchanged imports and COLUMN_ORDER setup to reach hook definition]

export function useDataStore() {
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [rowSelectionModel, setRowSelectionModel] = useState([]);
  const [searchText, setSearchText] = useState("");
  const timeoutRef = useRef(null);

  useEffect(() => {
    let unsubscribe = null;

    const initStore = () => {
      let savedVisibility = {};

      // 1. Recover column visibility
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState);
          savedVisibility = parsedState.visibility || {};
          setColumnVisibilityModel(savedVisibility);
        } catch (e) {
          console.error("Failed to parse datagrid state from local storage", e);
        }
      }

      // 2. Set up real-time listener
      unsubscribe = listenToCoursesDB((dbCourses) => {
        if (dbCourses && dbCourses.length > 0) {
          // Keep selection and scroll intact by updating rows via state updater,
          // but if it's the first load, we might need to parse columns.
          setRows((prevRows) => {
            // Only rebuild columns if we didn't have any before
            if (prevRows.length === 0) {
              const firstRow = dbCourses[0];
              const dynamicColumns = Object.keys(firstRow).map((key) => ({
                field: key,
                headerName: key.charAt(0).toUpperCase() + key.slice(1),
                width: 150,
              }));
              // We need a way to set columns without creating a stale closure over handleDataParsed here.
              // We'll call a helper function instead.
              setTimeout(() => setupInitialColumns(dynamicColumns), 0);
            }
            return dbCourses;
          });
        } else {
          setRows([]);
        }
        setIsLoaded(true);
      });
    };

    initStore();
    return () => {
      if (unsubscribe) unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setupInitialColumns = (initialDynamicColumns) => {
    handleDataParsed([], initialDynamicColumns); // empty rows because onSnapshot handles rows
  };

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
      if (col.field === "scrape_status") {
        return {
          ...col,
          width: 150,
          renderCell: (params) => {
            const status = params.value;
            if (status === "PENDING_SCRAPE" || status === "SCRAPING") {
              return (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    height: "100%",
                  }}
                >
                  <CircularProgress size={16} />
                  <Typography variant="body2">
                    {status === "SCRAPING" ? "Scraping..." : "Pending"}
                  </Typography>
                </Box>
              );
            }
            if (status === "COMPLETED") {
              return (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    height: "100%",
                    color: "success.main",
                  }}
                >
                  <Check fontSize="small" />
                  <Typography variant="body2">Done</Typography>
                </Box>
              );
            }
            if (status === "ERROR") {
              return (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    height: "100%",
                    color: "error.main",
                  }}
                >
                  <Error fontSize="small" />
                  <Typography variant="body2">Error</Typography>
                </Box>
              );
            }
            return (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Not Scraped
              </Typography>
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

    if (newRows && newRows.length > 0) {
      setRows((prev) => {
        // Only set rows if they are passed in explicitly (e.g. from Excel upload)
        return newRows;
      });
    }
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
                    <Error fontSize="small" />
                    {params.value}
                  </Box>
                ) : null,
            };
          } else if (key === "details") {
            colDef.width = 300;
          } else if (key.startsWith("is_") || key.startsWith("has_")) {
            colDef.type = "boolean";
            colDef.width = 100;

            // Überschreibe das Standard-MUI-Rendering
            colDef.renderCell = (params) => {
              if (params.value === true) {
                return <Check sx={{ color: "green" }} />; // Hier stylen!
              } else if (params.value === false) {
                return <Close sx={{ color: "red" }} />; // Hier stylen!
              }
              return null; // Wenn leer (null/undefined)
            };
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

  const saveCurrentData = async (onProgress) => {
    try {
      if (rows.length > 0) {
        await saveCoursesToDB(rows, onProgress);
      }
    } catch (e) {
      console.error("Failed to save to DB:", e);
      throw e;
    }
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
    saveCurrentData,
  };
}
