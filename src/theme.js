// file path: ~/DEVFOLD/ANUE-BACKEND/SRC/THEME.JS

"use client";

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light", // Default to light mode, can be toggled
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
    background: {
      default: "#f5f5f5",
      paper: "#333433",
    },
    text: { primary: "#ffffff" },
  },
  typography: {
    fontFamily: "var(--font-geist-sans), sans-serif",
    h1: {
      fontFamily: '"Ubuntu", var(--font-ubuntu), sans-serif',
      fontWeight: 700,
      // textTransform: "uppercase",
      letterSpacing: "0.05em", // Slight spacing to match the logo feel
    },
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
        },
      },
    },
  },
});

export default theme;
