import React from "react";
import { Box, Typography } from "@mui/material";

export const casePanelItemBoxSx = {
  padding: 1,
  width: 48,
  height: 48,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 1,
  backgroundColor: "rgba(255, 255, 255, 0.08)",
  boxSizing: "border-box",
};

export default function CasePanel({
  title,
  panelStyle = {},
  headingStyle = {},
  showHeading = true,
  className = "box-panel",
  wrapInPanel = true,
  emptyMessage = null,
  children,
}) {
  const validChildren = React.Children.toArray(children).filter((c) => c != null);
  const hasItems = validChildren.length > 0;

  const content = (
    <>
      {showHeading && title && (
        <Typography variant="h3" style={headingStyle}>
          {title}
        </Typography>
      )}
      <div className="content">
        {hasItems ? (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            {validChildren.map((child, index) => (
              <Box key={child?.key ?? index} sx={casePanelItemBoxSx}>
                {child}
              </Box>
            ))}
          </Box>
        ) : (
          emptyMessage
        )}
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
