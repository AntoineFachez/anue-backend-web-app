"use client";

import React from "react";
import { Box, useTheme } from "@mui/material";
import { DataGrid, GridPagination } from "@mui/x-data-grid";

function CustomFooter(props) {
  return (
    <Box
      sx={{
        p: 1,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
      }}
    >
      <Box sx={{ pl: 2 }}>
        {/* Custom content can go here, skipping selected row count to avoid crash */}
      </Box>
      <GridPagination />
    </Box>
  );
}

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
  const theme = useTheme();

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
          footer: CustomFooter,
        }}
        sx={{
          bgcolor: theme.palette.background.paper,
          "& .MuiDataGrid-cell": {
            color: "text.primary",
          },
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
        {...props}
      />
    </Box>
  );
}
