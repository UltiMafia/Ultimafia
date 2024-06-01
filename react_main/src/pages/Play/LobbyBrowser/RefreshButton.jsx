import React from "react";
import "./RefreshButton.css";
import { IconButton } from "@mui/material";

// TODO: fix - hovering REFRESH BUTTON causes MUI TABS to lose their "shine" (you can see it)
export const RefreshButton = ({ isSpinning }) => {
  return (
    <IconButton
      color="primary"
      sx={{
        "&:hover": {
          backgroundColor: "transparent",
        },
      }}
    >
      <i
        className={`refreshButton fas fa-sync-alt ${
          isSpinning ? "fa-spin" : ""
        }`}
      ></i>
    </IconButton>
  );
};
