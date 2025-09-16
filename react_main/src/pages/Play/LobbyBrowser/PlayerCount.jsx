import React, { useContext, useRef } from "react";
import { Box, Popover, Stack, Typography } from "@mui/material";
import { usePopover } from "components/Popover";

export const PlayerCount = (props) => {

  const game = props.game;
  const numSlotsTotal = game.setup.total;
  const gameId = props.gameId;
  const status = props.status;
  const numSlotsTaken = Math.min(props.numSlotsTaken || 0, numSlotsTotal);
  const spectatingAllowed = props.spectatingAllowed || false;
  const spectatorCount = props.spectatorCount || 0;

  const gameNotFinished = ["Open", "In Progress"].includes(status);

  const infoRef = useRef();
  const { 
    InfoPopover,
    popoverOpen,
    handleClick,
  } = usePopover({
    path: `/api/game/${gameId}/info`,
    type: "game",
    boundingEl: infoRef.current,
    title: `Game ${gameId}`,
});

  return (<>
    <InfoPopover/>
    <Box className="player-count"
      aria-owns={popoverOpen ? "mouse-over-popover" : undefined}
      aria-haspopup="true"
      onClick={handleClick}
    >
      <progress value={numSlotsTaken} max={numSlotsTotal} />
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
            <Typography>{spectatorCount}</Typography>
          </>
        )}
      </Stack>
    </Box>
  </>);
};
