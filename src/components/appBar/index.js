// file path: ~/DEVFOLD/ANUE-BACKEND/SRC/APP/COMPONENTS/APPBAR/INDEX.JS

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Box, Typography, Button } from "@mui/material";

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
        // height: "fit-content",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        bgcolor: "#ffc803ff",
      }}
    >
      <Box
        sx={{
          width: "fit-content",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          "&:hover": { bgcolor: "green" },
        }}
      >
        <Link href="/" passHref style={{ textDecoration: "none" }}>
          <Image
            src="data:image/png;base64,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"
            alt="Anue Logo"
            width={100}
            height={100}
            style={{ objectFit: "contain" }}
          />
        </Link>
      </Box>
      {/* <Link href="/processFile" passHref style={{ textDecoration: "none" }}>
        <Button
          sx={{
            color: "#1d3461ff",
            textTransform: "none",
            "&:hover": { bgcolor: "green" },
          }}
        >
          <Typography variant="h6">Process File</Typography>
        </Button>
      </Link> */}
      <Box>
        <Button
          sx={{
            color: "#1d3461ff",
            textTransform: "none",
            "&:hover": { bgcolor: "green" },
          }}
        >
          <Typography variant="h6">Logout</Typography>
        </Button>
      </Box>
    </Box>
  );
}
