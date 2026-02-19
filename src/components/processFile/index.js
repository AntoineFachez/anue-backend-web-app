"use client";

import React, { useRef } from "react";
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
import { useProcessFile } from "../../hooks/useProcessFile";

export default function Index() {
  const {
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
  } = useProcessFile();

  const fileUploadRef = useRef(null);

  const handleClearFileWrapper = () => {
    handleClearFile();
    if (fileUploadRef.current) {
      fileUploadRef.current.reset();
    }
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
      <FileUpload ref={fileUploadRef} onDataParsed={handleDataParsed} />

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
        <Button onClick={handleClearFileWrapper} variant="contained">
          Delete File
        </Button>
        <Button
          onClick={handleDownloadXLSX}
          variant="contained"
          color="secondary"
        >
          Download XLSX
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
