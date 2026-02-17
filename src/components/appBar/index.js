// file path: ~/DEVFOLD/ANUE-BACKEND/SRC/APP/COMPONENTS/APPBAR/INDEX.JS

import React from "react";
import { Box, Typography } from "@mui/material";

export default function AppBar({ appBarHeight }) {
  return (
    <Box
      sx={{
        zIndex: 1000,
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: appBarHeight,
        bgcolor: "white",
      }}
    ></Box>
  );
}
