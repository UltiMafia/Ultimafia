import React from "react";
import { Grid, Stack } from "@mui/material";

/** Shared two-column profile-style layout for detail pages. */
export default function TwoPanelLayout({ left, right }) {
  return (
    <Grid
      container
      rowSpacing={1}
      columnSpacing={1}
      className="profile"
      sx={{ mt: 0 }}
    >
      <Grid item xs={12} md={8}>
        <Stack direction="column" spacing={1}>
          {left}
        </Stack>
      </Grid>
      <Grid item xs={12} md={4}>
        <Stack direction="column" spacing={1}>
          {right}
        </Stack>
      </Grid>
    </Grid>
  );
}

