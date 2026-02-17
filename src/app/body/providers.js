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
  );
}
