import React from "react";
import { Box } from "@mui/material";
import { GridPagination } from "@mui/x-data-grid";

export default function CustomFooter(props) {
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
