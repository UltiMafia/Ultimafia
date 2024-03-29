import React from "react";
import { Alert } from "@mui/material";

export const BadTextContrast = ({ colorType, color }) => {
  if (!color) {
    return null;
  }

  return (
    <Alert
      severity="warning"
      variant="filled"
      sx={{
        display: "flex",
        width: "80%",
        margin: "0 auto",
        mb: 2,
        px: 1,
        py: 0,
      }}
    >
      Your <span style={{ textDecoration: "underline" }}>{colorType}</span>{" "}
      color {color} is too difficult to read in-game. Please change it in your
      profile's settings.
    </Alert>
  );
};
