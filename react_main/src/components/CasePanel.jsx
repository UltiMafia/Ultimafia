import React from "react";
import { Box, Typography } from "@mui/material";

/**
 * Shared panel UI for icon-grid layouts (e.g. Rap Sheet, Trophy Case).
 * Use this when you need a box-panel with an optional heading and a flex-wrapped grid of items.
 */
export default function CasePanel({
  title,
  panelStyle = {},
  headingStyle = {},
  showHeading = true,
  className = "box-panel",
  wrapInPanel = true,
  children,
}) {
  const content = (
    <>
      {showHeading && title && (
        <Typography variant="h3" style={headingStyle}>
          {title}
        </Typography>
      )}
      <div className="content">
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          {children}
        </Box>
      </div>
    </>
  );

  if (wrapInPanel) {
    return (
      <div className={className} style={panelStyle}>
        {content}
      </div>
    );
  }

  return content;
}
