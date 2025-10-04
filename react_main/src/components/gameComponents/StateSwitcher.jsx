import React from "react";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import StateIcon from "../StateIcon";

const stateIconMap = {
  pregame: "pregame",
  dawn: "day",
  day: "day",
  dusk: "night",
  night: "night",
  postgame: "bakerflagwin",
};

export default function StateSwitcher(props) {
  const { history, stateViewing, updateStateViewing, onStateNavigation } =
    props;
  const currentState = history.states[stateViewing];
  const stateName = currentState ? currentState.name : "";

  const normalizedName = stateName.toLowerCase().replace(/[0-9]/g, "").trim();
  const mappedIconType = stateIconMap[normalizedName] || "nowin";

  const numberMatch = stateName.match(/\d+/);
  const number = numberMatch ? parseInt(numberMatch[0]) : null;

  const leftArrowVisible = stateViewing !== -1;
  const rightArrowVisible =
    stateViewing < history.currentState ||
    (history.currentState === -2 && stateViewing !== history.currentState);

  const handleClick = (direction) => {
    updateStateViewing({ type: direction });
    onStateNavigation();
  };

  return (
    <Box
      className="state-nav"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.5,
        px: 0.5,
        py: 0.25,
        borderRadius: 1,
        bgcolor: "rgba(255, 255, 255, 0.05)",
      }}
    >
      <IconButton
        size="small"
        sx={{
          color: leftArrowVisible ? "inherit" : "transparent",
          lineHeight: 1,
        }}
        onClick={() => handleClick("backward")}
      >
        ‹
      </IconButton>

      <Tooltip title={stateName || "Unknown"}>
        <Box
          onClick={() => handleClick("current")}
          sx={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <StateIcon stateType={mappedIconType} size={32} number={number} />
        </Box>
      </Tooltip>

      <IconButton
        size="small"
        sx={{
          color: rightArrowVisible ? "inherit" : "transparent",
          lineHeight: 1,
        }}
        onClick={() => handleClick("forward")}
      >
        ›
      </IconButton>
    </Box>
  );
}
