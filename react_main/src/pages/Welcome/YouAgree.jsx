import React from "react";
import { Typography } from "@mui/material";
import { Link } from "react-router-dom";

export const YouAgree = ({ action }) => {
  const sx = {
    fontSize: "11px",
    opacity: "0.5",
    cursor: "default",
    userSelect: "none",
  };

  return (
    <div>
      <Typography color="text.secondary" sx={sx} style={{ display: "inline" }}>
        By {action}, you agree to our&nbsp;
        <Typography
          color="text.primary"
          sx={sx}
          style={{ display: "inline", cursor: "pointer" }}
        >
          <Link to="/legal/tos">Terms & Conditions</Link>
        </Typography>
        &nbsp;and&nbsp;
        <Typography
          color="text.primary"
          sx={sx}
          style={{ display: "inline", cursor: "pointer" }}
        >
          <Link to="/legal/privacy">Privacy Policy</Link>.
        </Typography>
      </Typography>
    </div>
  );
};
