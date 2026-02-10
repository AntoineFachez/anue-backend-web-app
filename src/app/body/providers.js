// file path: ~/DEVFOLD/ANUE-BACKEND/SRC/BODY/PROVIDERS.JS

"use client";

import { Box, useMediaQuery, useTheme } from "@mui/material";

import AuthenticatedLayout from "./Body";

export function Providers({ children, meData }) {
  return (
    <Box
      className="providers"
      component="div" // Use div instead of body here
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        overflow: "hidden",
        bgcolor: "transparent",
        color: "text.primary",
        fontFamily: "sans-serif",
        backgroundColor: "page.background",
      }}
    >
      <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </Box>
  );
}
