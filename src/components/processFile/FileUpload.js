"use client";

import React, { useRef, useImperativeHandle, forwardRef } from "react";
import { Box } from "@mui/material";
import * as XLSX from "xlsx";
import { generateSmartID } from "../../utils/smartIdGenerator";

const FileUpload = forwardRef(({ onDataParsed }, ref) => {
  const fileInputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
  }));

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 });

      if (jsonData.length > 0) {
        // Assume first row is headers
        const headers = jsonData[0];
        const cols = headers.map((header, index) => ({
          field: header || `col${index}`,
          headerName: header || `Column ${index + 1}`,
          width: 150,
          editable: true,
        }));

        const rowsData = jsonData.slice(1).map((row, rowIndex) => {
          const rowData = { id: String(rowIndex) };
          headers.forEach((header, colIndex) => {
            const field = header || `col${colIndex}`;
            let value = row[colIndex] || "";

            // Normalize boolean fields if they come from Excel as strings
            if (
              (field.startsWith("is_") || field.startsWith("has_")) &&
              typeof value === "string"
            ) {
              if (value.toLowerCase() === "true") {
                value = true;
              } else if (value.toLowerCase() === "false") {
                value = false;
              }
            }

            rowData[field] = value;
          });

          // Generate Smart ID
          // Try to map columns based on headers for better smart ID generation
          // This relies on headers being somewhat descriptive, otherwise defaults apply
          const courseData = {
            id: String(rowIndex),
            location:
              rowData[
                headers.find(
                  (h) =>
                    h &&
                    (h.toLowerCase().includes("location") ||
                      h.toLowerCase().includes("city")),
                )
              ] || "",
            degree:
              rowData[
                headers.find((h) => h && h.toLowerCase().includes("degree"))
              ] || "",
            title:
              rowData[
                headers.find((h) => h && h.toLowerCase().includes("title"))
              ] || "",
          };

          const smartId = generateSmartID(courseData);
          rowData.smartId = smartId;
          rowData.id = smartId; // Use smartId as the main ID
          rowData.originalId = String(rowIndex); // Keep original index based ID

          return rowData;
        });

        // Add Smart ID column
        cols.unshift({
          field: "smartId",
          headerName: "Smart ID",
          width: 150,
        });

        onDataParsed(rowsData, cols);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <Box sx={{ height: "fit-content" }}>
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        ref={fileInputRef}
      />
    </Box>
  );
});

export default FileUpload;
