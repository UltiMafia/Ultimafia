import React, { useContext, useRef } from "react";
import { PopoverContext } from "../../../Contexts";
import { Box, Stack, Typography } from "@mui/material";

export const PlayerCount = (props) => {
  const infoRef = useRef();
  const popover = useContext(PopoverContext);

  const game = props.game;
  const numSlotsTotal = game.setup.total;
  const gameId = props.gameId;
  const status = props.status;
  const numSlotsTaken = Math.min(props.numSlotsTaken || 0, numSlotsTotal);
  const spectatingAllowed = props.spectatingAllowed || false;
  const spectatorCount = props.spectatorCount || 0;

  function onInfoClick(e) {
    e.stopPropagation();
    popover.onClick(
      `/game/${gameId}/info`,
      "game",
      infoRef.current,
      `Game ${gameId}`
    );
  }
  const gameNotFinished = ["Open", "In Progress"].includes(status);
  const numSlotsOpen = numSlotsTotal - numSlotsTaken;

  const gradientColor = "var(--gradient-color)";
  const backgroundColor = "var(--scheme-color)";
  const extraFillColors = `${gradientColor} ,`.repeat(
    Math.max(numSlotsTaken, 0) // Math.max because if we SOMEHOW magically have 8/7 players in the lobby, I'd rather not crash the whole app
  );
  const extraBackgroundColors = `${backgroundColor}, `.repeat(
    Math.max(numSlotsOpen - 1, 0)
  ); // -1 to avoid THE trailing comma
  const extraLastColor = numSlotsOpen > 0 ? backgroundColor : gradientColor; // If the game is filled, make the gradient "full"

  const backgroundImage = gameNotFinished
    ? `linear-gradient(to right, ${gradientColor}, ${extraFillColors}${extraBackgroundColors}${extraLastColor})`
    : "";
  const extraStyles = {
    backgroundImage,
  };

  return (
    <Stack
      className="player-count"
      direction="row"
      spacing={0.5}
      sx={{
        p: 0.5,
        width: "100px",
        alignItems: "center",
        justifyContent: "center",
      }}
      ref={infoRef}
      onMouseOver={onInfoClick}
      style={extraStyles}
    >
      <Typography>
        {numSlotsTaken}/{numSlotsTotal}
      </Typography>
      {gameNotFinished && !spectatingAllowed && (
        <i className="fas fa-eye-slash" />
      )}
      {gameNotFinished && spectatingAllowed && (
        <>
          <i className="fas fa-eye" />
          <Typography>
            {spectatorCount}
          </Typography>
        </>
      )}
    </Stack>
  );
};
