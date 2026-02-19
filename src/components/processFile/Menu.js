"use client";

import React from "react";
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import DeleteIcon from "@mui/icons-material/Delete";
import { Download } from "@mui/icons-material";

export default function Menu({
  fileUploadRef,
  selectedRows,
  handleScrapeHTMLContent,
  handleClearFile,
  handleDownloadXLSX,
  searchText,
  handleSearchChange,
  handleClearSearch,
}) {
  const handleClearFileWrapper = () => {
    handleClearFile();
    if (fileUploadRef.current) {
      fileUploadRef.current.reset();
    }
  };
  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        gap: 2,
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Tooltip title="Delete File" placement="top">
        <IconButton
          onClick={handleClearFileWrapper}
          variant="contained"
          sx={{ bgcolor: "error.main", color: "#ffffff" }}
          // startIcon={<DeleteIcon />}
        >
          <DeleteIcon />
        </IconButton>
      </Tooltip>
      <Button
        onClick={handleScrapeHTMLContent}
        variant="contained"
        sx={{ bgcolor: selectedRows.length > 0 ? "primary.main" : "grey.800" }}
      >
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
      />{" "}
      <IconButton
        onClick={handleDownloadXLSX}
        variant="contained"
        sx={{ bgcolor: "primary.main", color: "#ffffff" }}
      >
        <Download />
      </IconButton>
    </Box>
  );
}
