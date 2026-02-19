import React, { useState, useEffect, useRef } from "react";
import { Box } from "@mui/material";
import ErrorIcon from "@mui/icons-material/Error";
import { httpsCallable } from "firebase/functions";
import { functions } from "../lib/firebase/firebase";
import * as XLSX from "xlsx";

const STORAGE_KEY = "datagrid-column-visibility";

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
    // Logic was moved to FileUpload.js

    setRows(newRows);
    setColumns(finalColumns);
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

    const promises = selectedRows.map(async (row) => {
      const urlKey = Object.keys(row).find(
        (key) => key.toLowerCase().includes("url") && row[key],
      );

      if (!urlKey) {
        console.warn(`No URL found for row ${row.id}`);
        return null;
      }

      const url = row[urlKey];

      try {
        console.log(`Scraping URL for row ${row.id}: ${url}`);
        const result = await fetchContent({ url });
        const extractedData = result.data; // { course, fees, deadline }

        console.log(`Scraped data for row ${row.id}:`, extractedData);

        return {
          id: row.id,
          updates: extractedData,
        };
      } catch (error) {
        console.error(`Error scraping row ${row.id}:`, error);
        return {
          id: row.id,
          updates: {
            error: "Fetch failed",
            details:
              error.message || "Could not retrieve content from the URL.",
          },
        };
      }
    });

    const results = (await Promise.all(promises)).filter((r) => r !== null);

    // Dynamically update columns based on new keys in results
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

      // Sort keys to ensure 'error' and 'details' are processed first if present
      const sortedKeys = Array.from(allNewKeys).sort((a, b) => {
        if (a === "error") return -1;
        if (b === "error") return 1;
        if (a === "details") return -1;
        if (b === "details") return 1;
        return 0;
      });

      sortedKeys.forEach((key) => {
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

          // Insert logic: Error/Details go before smartId, others append
          if (key === "error" || key === "details") {
            const smartIdIndex = newCols.findIndex(
              (c) => c.field === "smartId",
            );
            if (smartIdIndex !== -1) {
              newCols.splice(smartIdIndex, 0, colDef);
            } else {
              newCols.unshift(colDef);
            }
          } else {
            newCols.push(colDef);
          }

          // Add to existingFields to prevent duplicates in this loop if they somehow appear
          existingFields.add(key);
        }
      });

      return newCols;
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
