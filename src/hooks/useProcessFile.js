import { useState, useEffect, useRef } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../lib/firebase/firebase";

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

    // Process rows sequentially or in parallel?
    // Let's do it concurrently but maybe limit concurrency if needed. For now, all at once.
    const promises = selectedRows.map(async (row) => {
      // Find the URL column. Assuming 'study_url' or similar.
      // Or search for a column that looks like a URL.
      // Based on previous code, user mentioned 'study_url' in handleCellClick.
      // Also FileUpload logic suggests header checking.
      // Let's try to find a key that has 'url' in it or is 'study_url'.
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

        // Update the row with extracted data
        // We need to update the state.
        return {
          id: row.id,
          updates: extractedData,
        };
      } catch (error) {
        console.error(`Error scraping row ${row.id}:`, error);
        return null;
      }
    });

    const results = await Promise.all(promises);

    // Update state with new data
    setRows((prevRows) => {
      return prevRows.map((row) => {
        const update = results.find((r) => r && r.id === row.id);
        if (update) {
          return { ...row, ...update.updates };
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
  };
}
