import React, { useContext, useState } from "react";

import "css/shiny.css";
import { Link } from "react-router-dom";
import { PlayerCount } from "./PlayerCount";
import { UserContext } from "Contexts";
import { filterProfanity } from "components/Basic";
import Setup from "components/Setup";
import HostGameDialogue from "components/HostGameDialogue";
import {
  Box,
  Button,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";
import { getRowColor, getSetupBackgroundColor } from "./gameRowColors.js";
import StateIcon from "components/StateIcon";

const GameStatus = (props) => {
  const user = useContext(UserContext);
  const showGameState = props.showGameState;

  const canShowGameButton =
    (user.loggedIn || props.game.status === "Finished") &&
    !props.game.broken &&
    !props.game.private;

  let buttonUrl, buttonText, buttonVariant, buttonColor, buttonDisabled;
  if (props.game.status === "Open") {
    buttonUrl = `/game/${props.game.id}`;
    buttonText = "Join";
    buttonColor = "primary";
    buttonVariant = "contained";
    buttonDisabled = false;
  } else if (props.game.status === "In Progress") {
    if (props.game.spectating /* || user.perms.canSpectateAny */) {
      buttonUrl = `/game/${props.game.id}?spectate=true`;
      buttonText = "Spectate";
      buttonColor = "inherit";
      buttonVariant = "contained";
      buttonDisabled = false;
    } else {
      buttonUrl = "/play";
      buttonText = "Ongoing";
      buttonColor = "inherit"; //"rgba(211, 211, 211, 0.15)";
      buttonVariant = "contained";
      buttonDisabled = true;
    }
  } else if (props.game.status === "Finished") {
    buttonUrl = `/game/${props.game.id}`;
    buttonText = "Review";
    buttonColor = "inherit"; //"rgba(211, 211, 211, 0.15)";
    buttonVariant = "outlined";
    buttonDisabled = false;
  }

  const GameButton = (
    <Button
      component={Link}
      to={buttonUrl}
      variant={buttonVariant}
      color={buttonColor}
      disabled={buttonDisabled}
      sx={{
        p: 0.5,
        width: "100%",
        fontWeight: "bold",
      }}
    >
      {buttonText}
    </Button>
  );

  const gameButtonWrapped = (
    <Box sx={{ width: "100px", ml: 0.5 }}>
      {canShowGameButton && GameButton}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
        }}
      >
        {props.game.broken && (
          <i
            className="fas fa-car-crash"
            style={{ fontSize: "24px", cursor: "not-allowed" }}
            title="Broken"
          />
        )}
        {props.game.private && (
          <i
            className="fas fa-lock"
            style={{ fontSize: "24px", cursor: "not-allowed" }}
            title="Private"
          />
        )}
      </div>
    </Box>
  );

  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        ml: 1,
        alignItems: "center",
      }}
    >
      {/* LOBBY ICON GOES HERE */}
      {/* <Box sx={{
        height: "60px",
        width: "60px",
      }}>
      </Box> */}
      {showGameState && (
        <StateIcon
          stateName={props.game.gameState || "Postgame"}
          winnerGroups={props.game.winnersInfo?.groups || []}
        />
      )}
      <Stack
        direction="column"
        spacing={1}
        sx={{
          alignItems: "stretch",
          justifyContent: "center",
          alignSelf: "stretch",
          ml: 1,
          mr: 0.5,
        }}
      >
        <PlayerCount
          game={props.game}
          gameId={props.game.id}
          anonymousGame={props.game.anonymousGame}
          status={props.game.status}
          numSlotsTaken={props.game.players}
          spectatingAllowed={props.game.spectating}
          spectatorCount={props.game.spectatorCount}
        />
        {gameButtonWrapped}
      </Stack>
    </Stack>
  );
};

export const GameRow = (props) => {
  const isPhoneDevice = useIsPhoneDevice();
  const user = useContext(UserContext);
  const [ishostGameDialogueOpen, setIshostGameDialogueOpen] = useState(false);

  const showLobbyName = props.showLobbyName;
  const showGameState = props.showGameState;
  const showGameTypeIcon = props.showGameTypeIcon;
  const showRedoButton = isPhoneDevice
    ? !props.small && props.game.status === "Finished" && user.loggedIn
    : !props.small;
  const lobbyName = props.game.lobbyName;

  if (!props.game.setup) return <></>;

  return (
    <div className="shiny-container" style={{ minWidth: "0px" }}>
      {props.game.competitive && <i className="shiny" />}
      <HostGameDialogue
        open={ishostGameDialogueOpen}
        setOpen={setIshostGameDialogueOpen}
        setup={props.game.setup}
      />
      <Stack
        direction="row"
        spacing={1}
        sx={{
          p: 1,
          width: "100%",
          alignItems: "center",
          background: getRowColor(props.game, false),
        }}
        key={props.game.id}
      >
        <GameStatus
          small={props?.small}
          game={props.game}
          status={props.status}
          showGameTypeIcon={showGameTypeIcon}
          showGameState={showGameState}
        />
        <Stack
          direction="column"
          sx={{
            minWidth: 0,
            flex: "1 1",
          }}
        >
          {showLobbyName && (
            <Stack
              direction="row"
              sx={{
                alignItems: "center",
              }}
            >
              {/* game option indicators go HERE */}
              <Stack
                direction="row"
                spacing={0.5}
                sx={{
                  alignItems: "center",
                }}
              >
                {props.game.ranked && (
                  <Tooltip title="ranked">
                    <i
                      className="fas fa-heart"
                      style={{
                        fontSize: "1rem",
                        color: "rgb(226, 59, 59)",
                      }}
                    />
                  </Tooltip>
                )}
                {props.game.competitive && (
                  <Tooltip title="competitive">
                    <i
                      className="fas fa-heart"
                      style={{
                        fontSize: "1rem",
                        color: "var(--gold-heart-color)",
                      }}
                    />
                  </Tooltip>
                )}
                {props.game.anonymousGame && (
                  <Tooltip title="Anonymous game">
                    <i
                      className="fas fa-theater-masks"
                      style={{
                        fontSize: "1rem",
                      }}
                    />
                  </Tooltip>
                )}
              </Stack>
              <Box
                sx={{
                  ml: 0.5,
                  flexShrink: "1",
                  overflowX: "hidden",
                }}
              >
                <Typography
                  noWrap
                  variant="caption"
                  style={{
                    wordBreak: "break-word",
                  }}
                >
                  {filterProfanity(lobbyName, user.settings)}
                </Typography>
              </Box>
              {showRedoButton && (
                <Box
                  style={{
                    marginLeft: "auto",
                    width: "2rem",
                    textAlign: "center",
                  }}
                >
                  {props.game.status === "Finished" && user.loggedIn && (
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => setIshostGameDialogueOpen(true)}
                    >
                      <i
                        className="rehost fas fa-redo"
                        style={{ fontSize: "1rem" }}
                        title="Rehost"
                      />
                    </IconButton>
                  )}
                </Box>
              )}
            </Stack>
          )}
          <Setup
            setup={props.game.setup}
            key={props.game.setup.id}
            backgroundColor={getSetupBackgroundColor(props.game, true)}
          />
        </Stack>
      </Stack>
    </div>
  );
};
