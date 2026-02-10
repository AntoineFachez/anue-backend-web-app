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
        pageSizeOptions={[5, 10, 25]}
        initialState={{
          pagination: { paginationModel: { pageSize: 10 } },
        }}
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
        }}
        {...props}
      />
    </Box>
  );
}
