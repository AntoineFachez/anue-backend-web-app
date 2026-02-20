"use client";

import React, { useRef } from "react";
import { Box, Typography } from "@mui/material";
import FileUpload from "./FileUpload";
import CustomDataGrid from "../dataGrid";
import { useDataStore } from "@/hooks/useDataStore";
import { scrapeRows } from "@/services/scraperService";
import * as XLSX from "xlsx";
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
    handleRowSelectionModelChange,
    handleSearchChange,
    handleClearFile,
    handleClearSearch,
    applyScrapedUpdates,
  } = useDataStore();

  const fileUploadRef = useRef(null);

  const handleCellClick = (params) => {
    if (params.colDef.headerName === "study_url" && params.value) {
      window.open(params.value, "_blank");
    }
  };

  const handleScrapeHTMLContent = async () => {
    if (selectedRows.length === 0) {
      alert("Please select at least one row to scrape.");
      return;
    }
    const results = await scrapeRows(selectedRows);
    applyScrapedUpdates(results);
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
