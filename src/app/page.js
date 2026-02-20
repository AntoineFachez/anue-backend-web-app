import { Box, Typography, Button } from "@mui/material";

import styles from "./page.module.css";
import Link from "next/link";

export default function Home() {
  const title = "anue backend";
  return (
    <Box className={styles.page}>
      <Typography
        variant="h1"
        sx={{
          color: "white",
          fontSize: { xs: "3rem", sm: "4rem", md: "5rem", lg: "6rem" },
          textWrap: "balance",
          wordBreak: "break-word",
          overflowWrap: "break-word",
        }}
      >
        {title}
      </Typography>
      <Link href="/processFile" passHref style={{ textDecoration: "none" }}>
        <Button
          variant="outlined"
          sx={{
            // bgcolor: "#1d3461ff",
            color: "#fff",
            textTransform: "none",
            transition: "all 0.8s ease-in-out",
            letterSpacing: "0.1rem",

            "&:hover": {
              bgcolor: "#0f1f3fff",
              color: "#fff",
              transition: "all 0.3s ease-in-out",
              letterSpacing: "0.2rem",
            },
          }}
        >
          <Typography variant="h6">Load your Excel</Typography>
        </Button>
      </Link>
    </Box>
  );
}
