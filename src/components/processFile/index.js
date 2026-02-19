"use client";

import React, { useRef } from "react";
import { Box, Typography } from "@mui/material";
import FileUpload from "./FileUpload";
import CustomDataGrid from "../dataGrid";
import { useProcessFile } from "@/hooks/useProcessFile";
import Menu from "./Menu";

export default function Index() {
  const {
    rows,
    columns,
    columnVisibilityModel,
    isLoaded,
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

  if (!isLoaded) {
    return null; // Or a loading spinner
  }

  return (
    <Box
      className="processFile"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
      }}
    >
      {rows.length === 0 ? (
        <Box
          sx={{
            width: "100%",
            maxWidth: "30rem",
            height: "100%",
            maxHeight: "30rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "3px dashed #ffffff",
            borderRadius: "2rem",
          }}
        >
          <FileUpload ref={fileUploadRef} onDataParsed={handleDataParsed} />
        </Box>
      ) : (
        <Box
          className="processFileContent"
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexFlow: "column nowrap",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <Box sx={{ height: "fit-content" }}>
            <Typography variant="body1" sx={{ color: "#ffffff" }}>
              Display XLSX Data:{" "}
              {rows.length > 0 ? `${rows.length} rows` : "No data"}
            </Typography>
          </Box>
          <Menu
            fileUploadRef={fileUploadRef}
            selectedRows={selectedRows}
            handleScrapeHTMLContent={handleScrapeHTMLContent}
            handleClearFile={handleClearFile}
            handleDownloadXLSX={handleDownloadXLSX}
            searchText={searchText}
            handleSearchChange={handleSearchChange}
            handleClearSearch={handleClearSearch}
          />
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
      )}
    </Box>
  );
}
