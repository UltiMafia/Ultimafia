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
      `/api/game/${gameId}/info`,
      "game",
      infoRef.current,
      `Game ${gameId}`
    );
  }
  const gameNotFinished = ["Open", "In Progress"].includes(status);

  return (
    <Box
      className="player-count"
      onMouseOver={onInfoClick}
      ref={infoRef}
    >
      <progress value={numSlotsTaken} max={numSlotsTotal}/>
      <Stack
        direction="row"
        spacing={0.5}
        sx={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          p: 0.5,
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
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
    </Box>
  );
};
