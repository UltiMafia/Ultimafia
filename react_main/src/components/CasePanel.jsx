import React from "react";
import { Box } from "@mui/material";
import UiCard from "./ui/UiCard";
import { UiText as Typography } from "components/ui";

export const casePanelItemBoxSx = {
  padding: 1,
  width: 32,
  height: 32,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 1,
  backgroundColor: "rgba(255, 255, 255, 0.08)",
  boxSizing: "border-box",
};

export default function CasePanel({
  title,
  headingStyle = {},
  showHeading = true,
  className = "",
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
    // This component is the card; callers may name a layout variant, but cannot
    // reintroduce the legacy box-panel/ui-card class pair.
    const variantClass = String(className)
      .split(/\s+/)
      .filter((token) => token && token !== "box-panel" && token !== "ui-card")
      .concat("profile-tinted")
      .join(" ");
    return <UiCard className={variantClass}>{content}</UiCard>;
  }

  return content;
}
