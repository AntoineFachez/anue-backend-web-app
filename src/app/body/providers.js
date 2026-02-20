"use client";

import { Box, ThemeProvider, CssBaseline } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import AppBar from "@/components/appBar";

import theme from "@/theme";

export function Providers({ children }) {
  const appBarHeight = "3rem";
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppBar appBarHeight={appBarHeight} />
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignContent: "center",
            justifyContent: "center",
            marginTop: appBarHeight,
          }}
        >
          {children}
        </Box>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
