"use client";

import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, Button } from "@mui/material";
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
    console.log("handleRowSelectionModelChange - arg1:", foo);
    console.log("handleRowSelectionModelChange - arg2:", bar);

    let selection = [];

    // Check if it's the standard array
    if (Array.isArray(foo)) {
      selection = foo;
    }
    // Check if it's the object structure { ids: Set } we saw in logs
    else if (foo && foo.ids && foo.ids instanceof Set) {
      selection = Array.from(foo.ids);
    }
    // Check if maybe the second argument is the array? (unlikely)
    else if (Array.isArray(bar)) {
      selection = bar;
    }

    setRowSelectionModel(selection);

    // Ensure both selection IDs and row IDs are compared as strings
    const selected = rows.filter((row) =>
      selection.some((id) => String(id) === String(row.id)),
    );

    console.log("selected (after filter):", selected);
    setSelectedRows(selected);
  };

  const handleScrapeHTMLContent = () => {
    console.log("Selected rows:", selectedRows);
  };

  if (!isLoaded) {
    return null; // Or a loading spinner
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
      <Button onClick={handleScrapeHTMLContent} variant="contained">
        Scrape HTML Content ({selectedRows.length})
      </Button>
      <CustomDataGrid
        rows={rows}
        columns={columns}
        columnVisibilityModel={columnVisibilityModel}
        onColumnVisibilityModelChange={handleColumnVisibilityChange}
        onColumnResize={handleColumnResize}
        onCellClick={handleCellClick}
        rowSelectionModel={rowSelectionModel}
        onRowSelectionModelChange={handleRowSelectionModelChange}
      />
    </Box>
  );
}
