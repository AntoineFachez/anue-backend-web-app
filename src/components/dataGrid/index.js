"use client";

import React, { useRef, useState } from "react";
import { Box, useTheme } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import CustomHeader from "./CustomHeader";
import CustomFooter from "./CustomFooter";

export default function CustomDataGrid({
  rows,
  columns,
  columnVisibilityModel,
  onColumnVisibilityModelChange,
  onColumnResize,
  // Isolate selection props
  rowSelectionModel,
  onRowSelectionModelChange,
  ...props
}) {
  const densityMenuTriggerRef = useRef(null);
  const [densityMenuOpen, setDensityMenuOpen] = useState(false);
  const theme = useTheme();
  const [density, setDensity] = useState("compact");

  if (!rows || rows.length === 0 || !columns || columns.length === 0)
    return null;

  const borderColor = theme.palette.mode === "dark" ? "#555555ff" : "#595959ff";

  return (
    <Box
      sx={{
        flexGrow: 1,
        width: "100%",
        overflow: "hidden",
        pb: "5rem",
      }}
    >
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => String(row.id)}
        pageSizeOptions={[5, 10, 25, 50, 100]}
        initialState={{
          pagination: { paginationModel: { pageSize: 50 } },
        }}
        density={density}
        onDensityChange={(newDensity) => setDensity(newDensity)}
        getRowHeight={() => "auto"}
        // 2. Provide an estimate for the virtual scroller performance
        getEstimatedRowHeight={() => 80}
        checkboxSelection
        disableRowSelectionOnClick
        columnVisibilityModel={columnVisibilityModel}
        onColumnVisibilityModelChange={onColumnVisibilityModelChange}
        onColumnResize={onColumnResize}
        // Explicitly pass selection props with fallback
        // rowSelectionModel={rowSelectionModel || []}
        onRowSelectionModelChange={onRowSelectionModelChange}
        slots={{
          // toolbar: CustomHeader,
          footer: CustomFooter,
        }}
        // slotProps={{
        //   toolbar: {
        //     densityMenuTriggerRef,
        //     densityMenuOpen,
        //     setDensityMenuOpen,
        //     density,
        //     setDensity,
        //   },
        // }}
        sx={{
          bgcolor: theme.palette.background.paper,
          "& .MuiDataGrid-cell": {
            color: "text.primary",
          },
          // "& .MuiDataGrid-cell[data-field='description']": {
          // },
          "& .MuiDataGrid-cell[data-field='description']": {
            alignItems: "flex-start", // Optional: aligns the clamped text to the top
            py: 1, // Add a little padding so the clamped text isn't hitting the borders
            height: "5rem",
            maxHeight: "5rem",
            textOverflow: "ellipsis",
            wordWrap: "break-word",
            whiteSpace: "normal", // <--- THE CRITICAL FIX
            overflow: "auto",
          },
          // 2. The fix: Apply whiteSpace and wordWrap directly to the element doing the clamping
          // "& .MuiDataGrid-cell[data-field='description'] .MuiDataGrid-cellContent":
          //   {
          //     display: "-webkit-box",
          //     WebkitBoxOrient: "vertical",
          //     WebkitLineClamp: 4, // Limits to 4 lines
          //     overflow: "hidden",
          //     lineHeight: "1.2rem",
          //     // maxHeight: "4.8rem",
          //   },
          // Make Checkbox Column Sticky
          // "& .MuiDataGrid-columnHeader--checkbox, & .MuiDataGrid-cell--checkbox":
          //   {
          //     position: "sticky",
          //     left: 0,
          //     zIndex: 1,
          //     backgroundColor: theme.palette.background.paper,
          //   },
          // "& .MuiDataGrid-columnHeader--checkbox": {
          //   zIndex: 2,
          // },
          "& .MuiCheckbox-root": {
            zIndex: 2,
            color: borderColor,
          },
          "& .Mui-checked": {
            zIndex: 2,
            color: "steelblue",
          },
          "--DataGrid-rowBorderColor": borderColor,
        }}
        // showToolbar
        {...props}
      />
    </Box>
  );
}
