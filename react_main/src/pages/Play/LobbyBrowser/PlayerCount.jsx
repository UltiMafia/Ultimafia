import React, { useRef, useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import UiIcon from "components/ui/UiIcon";
import { usePopover, InfoPopover } from "components/Popover";

import "css/join.css";
import { Time } from "components/Basic";
import {
  lobbyCountFromInfo,
  displayedLobbyCount,
  lobbyBarValue,
} from "shared/lobbyCount";

export const PlayerCount = (props) => {
  const game = props.game;
  const numSlotsTotal = game.setup.total;
  const gameId = props.gameId;
  const status = props.status;
  // Live count from the info popover, tied to the list count it replaced so
  // the next list refresh takes over again.
  const [liveCount, setLiveCount] = useState(null);
  const numSlotsTaken = Math.min(
    displayedLobbyCount(props.numSlotsTaken || 0, liveCount),
    numSlotsTotal
  );
  const spectatingAllowed = props.spectatingAllowed || false;
  const spectatorCount = props.spectatorCount || 0;
  const showSeats = props.showSeats !== false;

  const gameNotFinished = ["Open", "In Progress"].includes(status);

  const infoRef = useRef();
  const popoverProps = usePopover({
    path: `/api/game/${gameId}/info`,
    type: "game",
    boundingEl: infoRef.current,
    onData: (info) => {
      // Saved-game info has no status, so its player list is not a live count.
      if (status !== "Open") return;
      const count = lobbyCountFromInfo(info);
      if (count !== null)
        setLiveCount({ count, listCount: props.numSlotsTaken || 0 });
    },
  });
  const { popoverOpen, handleClick } = popoverProps;

  return (
    <>
      <InfoPopover {...popoverProps} title={`Game ${gameId}`} />
      <Box
        component="button"
        type="button"
        ref={infoRef}
        className={`player-count${showSeats ? "" : " spectator-count"}`}
        aria-label={gameNotFinished ? `${showSeats ? `${numSlotsTaken} of ${numSlotsTotal} seats filled, ` : ""}${spectatingAllowed ? `${spectatorCount} spectators` : "spectating disabled"}. View game details` : "View finished game details"}
        aria-expanded={popoverOpen}
        aria-owns={popoverOpen ? "mouse-over-popover" : undefined}
        aria-haspopup="true"
        onClick={handleClick}
      >
        <progress
          aria-hidden="true"
          value={lobbyBarValue(status, numSlotsTaken)}
          max={numSlotsTotal}
        />
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
          {!gameNotFinished && (
            <Typography>
              <Time
                abbreviate
                minSec
                millisec={Date.now() - game.endTime}
                suffix={" ago"}
              />
            </Typography>
          )}
          {gameNotFinished && showSeats && (
            <Typography>
              {numSlotsTaken}/{numSlotsTotal}
            </Typography>
          )}
          {gameNotFinished && !spectatingAllowed && (
            <UiIcon name="eyeOff" size={16} />
          )}
          {gameNotFinished && spectatingAllowed && (
            <>
              <UiIcon name="eye" size={16} />
              <Typography>{spectatorCount}</Typography>
            </>
          )}
          <Typography component="span" className="player-count-details">Details</Typography>
        </Stack>
      </Box>
    </>
  );
};
