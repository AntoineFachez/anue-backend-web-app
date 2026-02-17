<<<<<<< HEAD
"use client";

import { Box, ThemeProvider, CssBaseline } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import AppBar from "@/components/appBar";
import theme from "../../theme";

export function Providers({ appBarHeight, children }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          className="providers"
          component="div"
          sx={{
            width: "100%",
            height: "100%",

            overflow: "hidden",
            // overflow: "scroll",
          }}
        >
          {" "}
          <AppBar appBarHeight={appBarHeight} />
          {children}
        </Box>
      </ThemeProvider>
    </AppRouterCacheProvider>
=======
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
>>>>>>> 5a21368 (chore: Install dependencies for the `functions` directory.)
  );
}
