import React from "react";
import { Box, Typography } from "@mui/material";

export default function layout({ children }) {
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        marginTop: "3rem",
        overflow: "hidden",
        backgroundColor: "black",
      }}
    >
      {children}
    </Box>
  );
}
