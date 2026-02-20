"use client";

import React, { useRef, useState } from "react";
import { Box, Typography, LinearProgress } from "@mui/material";
import * as XLSX from "xlsx";

import { useDataStore } from "@/hooks/useDataStore";
import { updateCourseStatus } from "@/services/courseService";

import CustomDataGrid from "../dataGrid";
import FileUpload from "./FileUpload";
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
    saveCurrentData,
  } = useDataStore();

  const fileUploadRef = useRef(null);
  const [scrapingProgress, setScrapingProgress] = useState({
    isScraping: false,
    current: 0,
    total: 0,
  });
  const [isSaving, setIsSaving] = useState(false);

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

    const alreadyScrapedRows = selectedRows.filter(
      (r) => r.scraped_at || r.scrape_status === "COMPLETED",
    );
    const freshRows = selectedRows.filter(
      (r) => !r.scraped_at && r.scrape_status !== "COMPLETED",
    );

    let rowsToScrape = selectedRows;

    if (alreadyScrapedRows.length > 0) {
      const rescrape = window.confirm(
        `${alreadyScrapedRows.length} of the selected records have already been enriched previously.\n\nDo you want to RE-SCRAPE them?\n\n- Click "OK" to re-scrape ALL selected records.\n- Click "Cancel" to SKIP them and only scrape the fresh records.`,
      );
      if (!rescrape) {
        rowsToScrape = freshRows;
        if (rowsToScrape.length === 0) {
          alert("All selected records were skipped. Nothing to scrape.");
          return;
        }
      }
    }

    // Make sure we have saved row states in DB first if they are new
    setIsSaving(true);
    try {
      await saveCurrentData();
    } catch (e) {
      alert("Failed to ensure rows exist in database before scraping.");
      setIsSaving(false);
      return;
    }
    setIsSaving(false);

    try {
      const selectedIds = rowsToScrape.map((r) => r.id);
      await updateCourseStatus(selectedIds, "PENDING_SCRAPE");
      alert(
        `Successfully queued ${selectedIds.length} rows for background scraping! They will update automatically as they finish.`,
      );
      // Clear selection so the user knows action was taken
      handleRowSelectionModelChange([]);
    } catch (e) {
      console.error("Error setting PENDING_SCRAPE status:", e);
      alert("Failed to queue rows for scraping.");
    }
  };

  const handleSaveToDB = async () => {
    if (rows.length === 0) {
      alert("No data to save.");
      return;
    }
    setIsSaving(true);
    try {
      // Could also pass an onProgress here if we want a similar loading bar
      await saveCurrentData();
      alert("Successfully saved data to database!");
    } catch (e) {
      alert("Failed to save data. Please try again.");
    } finally {
      setIsSaving(false);
    }
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
          <Box
            sx={{
              height: "fit-content",
              width: "100%",
              px: 4,
              display: "flex",
              flexFlow: "column nowrap",
              gap: 1,
            }}
          >
            <Typography
              variant="body1"
              sx={{ color: "#ffffff", alignSelf: "center" }}
            >
              Display XLSX Data:{" "}
              {rows.length > 0 ? `${rows.length} rows` : "No data"}
            </Typography>
            {scrapingProgress?.isScraping && (
              <Box sx={{ width: "100%", mt: 1, mb: 1 }}>
                <Typography
                  variant="body2"
                  sx={{ color: "#ffffff", mb: 0.5, textAlign: "center" }}
                >
                  Scraping {scrapingProgress.current} of{" "}
                  {scrapingProgress.total} records...
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={
                    scrapingProgress.total > 0
                      ? (scrapingProgress.current / scrapingProgress.total) *
                        100
                      : 0
                  }
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            )}
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
            handleSaveToDB={handleSaveToDB}
            isSaving={isSaving}
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
