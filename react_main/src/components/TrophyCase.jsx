import React from "react";
import { Box, Stack, Tooltip, Typography } from "@mui/material";
import { capitalize } from "utils";

// Trophy icons - extendible: add new trophy types here
export const TROPHY_ICONS = {
  gold: require(`images/trophies/gold-trophy.png`),
  silver: require(`images/trophies/silver-trophy.png`),
  bronze: require(`images/trophies/bronze-trophy.png`),
};

export const getTrophyIcon = (trophyType) => {
  return TROPHY_ICONS[trophyType] || TROPHY_ICONS.silver;
};

export default function TrophyCase({
  trophies = [],
  panelStyle = {},
  headingStyle = {},
  showHeading = true,
  className = "box-panel trophy-case",
  wrapInPanel = true,
}) {
  if (!trophies || trophies.length === 0) {
    return null;
  }

  const content = (
    <>
      {showHeading && (
        <Typography variant="h3" style={headingStyle}>
          Trophy Case
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
          {trophies.map((trophy) => {
            const createdAt = trophy.createdAt
              ? new Date(trophy.createdAt)
              : null;
            const formattedDate = createdAt
              ? createdAt.toLocaleDateString()
              : "Date unknown";
            const trophyType = trophy.type || "silver";
            const trophyIcon = getTrophyIcon(trophyType);

            return (
              <Tooltip
                arrow
                placement="top"
                title={
                  <Stack spacing={0.5}>
                    <Typography variant="subtitle2">{trophy.name}</Typography>
                    <Typography variant="caption">
                      Type: {capitalize(trophyType)}
                    </Typography>
                    {trophy.owner && (
                      <Typography variant="caption">
                        Owner: {trophy.owner.name}
                      </Typography>
                    )}
                    <Typography variant="caption">
                      Awarded {formattedDate}
                    </Typography>
                  </Stack>
                }
                key={trophy.id}
              >
                <Box className="trophy-item">
                  <img
                    src={trophyIcon}
                    alt={`${trophy.name} ${trophyType} trophy`}
                    className="trophy-icon"
                  />
                </Box>
              </Tooltip>
            );
          })}
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

