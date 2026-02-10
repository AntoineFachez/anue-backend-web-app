import { Box, Typography } from "@mui/material";

import styles from "./page.module.css";

export default function Home() {
  return (
    <Box className={styles.page}>
      <Typography variant="h1" sx={{ color: "white" }}>
        Project Anue
      </Typography>
    </Box>
  );
}
