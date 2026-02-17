"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import FileUpload from "./FileUpload";
import CustomDataGrid from "../dataGrid";

const STORAGE_KEY = "datagrid-column-visibility";

export default function Index() {
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

  const handleScrapeHTMLContent = () => {
    // console.log("Selected rows:", selectedRows);
  };

  const handleSearchChange = (event) => {
    setSearchText(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchText("");
  };

  if (!isLoaded) {
    return null; // Or a loading spinner //
  }

  return (
    <Box
      sx={{
        height: "100%",
        paddingBottom: "3rem",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <FileUpload onDataParsed={handleDataParsed} />

      <Box sx={{ height: "fit-content" }}>
        <Typography variant="body1" sx={{ color: "#ffffff" }}>
          Display XLSX Data:{" "}
          {rows.length > 0 ? `${rows.length} rows` : "No data"}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <Button onClick={handleScrapeHTMLContent} variant="contained">
          Scrape HTML Content ({selectedRows.length})
        </Button>
        <TextField
          variant="outlined"
          placeholder="Global Search..."
          value={searchText}
          onChange={handleSearchChange}
          size="small"
          InputProps={{
            endAdornment: searchText ? (
              <InputAdornment position="end">
                <IconButton onClick={handleClearSearch} edge="end">
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
          sx={{ backgroundColor: "background.paper", borderRadius: 1 }}
        />
      </Box>
      <CustomDataGrid
        rows={rows}
        columns={columns}
        columnVisibilityModel={columnVisibilityModel}
        onColumnVisibilityModelChange={handleColumnVisibilityChange}
        onColumnResize={handleColumnResize}
        onCellClick={handleCellClick}
        onRowSelectionModelChange={handleRowSelectionModelChange}
        filterModel={{
          items: [],
          quickFilterValues: searchText
            ? searchText.split(" ").filter((word) => word !== "")
            : [],
        }}
      />
    </Box>
  );
}
