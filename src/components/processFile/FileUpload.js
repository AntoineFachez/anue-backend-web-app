"use client";

import React from "react";
import { Box } from "@mui/material";
import * as XLSX from "xlsx";

export default function FileUpload({ onDataParsed }) {
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
          field: `col${index}`,
          headerName: header || `Column ${index + 1}`,
          width: 150,
          editable: true,
        }));

        const rowsData = jsonData.slice(1).map((row, rowIndex) => {
          const rowData = { id: String(rowIndex) };
          headers.forEach((_, colIndex) => {
            rowData[`col${colIndex}`] = row[colIndex] || "";
          });
          return rowData;
        });

        onDataParsed(rowsData, cols);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <Box sx={{ height: "fit-content" }}>
      <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
    </Box>
  );
}
