import React from "react";
import { IconButton } from "@mui/material";

// TODO: fix - hovering REFRESH BUTTON causes MUI TABS to lose their "shine" (you can see it)
export const RefreshButton = ({ isSpinning }) => {
  return (
    <IconButton
      color="primary"
      sx={{
        cursor: "pointer",
        "&:hover": {
          backgroundColor: "transparent",
        },
      }}
    >
      <i
        className={`fas fa-sync-alt ${isSpinning ? "fa-spin" : ""}`}
        style={{ cursor: "pointer" }}
      ></i>
    </IconButton>
  );
};
