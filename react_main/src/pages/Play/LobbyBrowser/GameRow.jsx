import React, { useContext, useState } from "react";
import axios from "axios";
import "../../../css/shiny.css";
import { Link, Redirect } from "react-router-dom";
import { PlayerCount } from "./PlayerCount";
import { UserContext } from "../../../Contexts";
import { useErrorAlert } from "../../../components/Alerts";
import { filterProfanity } from "../../../components/Basic";
import Setup from "../../../components/Setup";
import {
  Box,
  Button,
  IconButton,
  ListItemButton,
  Stack,
  Typography,
} from "@mui/material";
import { useIsPhoneDevice } from "../../../hooks/useIsPhoneDevice";
import { getRowColor, getSetupBackgroundColor } from "./gameRowColors.js";

const GameStatus = (props) => {
  const user = useContext(UserContext);
  const isPhoneDevice = useIsPhoneDevice();

  const canShowGameButton =
    (user.loggedIn || props.status === "Finished") &&
    !props.game.broken &&
    !props.game.private;
  const gameButtonDisabled =
    props?.status === "In Progress" && !props.game.spectating;
  const stackedVertically = props.stackedVertically;

  let buttonUrl, buttonText, buttonVariant, buttonColor;
  if (props.game.status === "Open") {
    buttonUrl = `/game/${props.game.id}`;
    buttonText = "Join";
    buttonColor = "secondary";
    buttonVariant = "contained";
  } else if (props.game.status === "In Progress") {
    if (props.game.spectating || user.perms.canSpectateAny) {
      buttonUrl = `/game/${props.game.id}?spectate=true`; 
      buttonText = "Spectate";
      buttonColor = "info";
      buttonVariant = "contained";
    } else {
      buttonUrl = "/play";
      buttonText = "In Progress";
      buttonColor = "secondary"//"rgba(211, 211, 211, 0.15)";
      buttonVariant = "contained";
    }
  } else if (props.game.status === "Finished") {
    buttonUrl = `/game/${props.game.id}`;
    buttonText = "Review";
    buttonColor = "info"//"rgba(211, 211, 211, 0.15)";
    buttonVariant = "contained";
  }

  const GameButton = (
    <Link to={buttonUrl} disabled={gameButtonDisabled}>
      <Button
        variant={buttonVariant}
        color={buttonColor}
        sx={{
          p: 0.5,
          width: "100%",
          textTransform: "none",
          ...(props?.game?.status === "In Progress"
            ? { cursor: "default" }
            : {}),
          transform: "translate3d(0,0,0)",
          fontWeight: "800",
        }}
      >
        {buttonText}
      </Button>
    </Link>
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
    <Stack direction={stackedVertically ? "column" : "row-reverse"} spacing={1}
      sx={{
        alignItems: stackedVertically ? "stretch" : "center",
        justifyContent: "center",
        alignSelf: stackedVertically ? "stretch" : undefined,
        ml: 1,
        mr: .5,
      }}>
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
  );
};

export const GameRow = (props) => {
  const isPhoneDevice = useIsPhoneDevice();
  const [redirect, setRedirect] = useState(false);
  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();

  const showLobbyName = props.showLobbyName;
  const showGameTypeIcon = props.showGameTypeIcon;
  const showRedoButton = isPhoneDevice
    ? !props.small && props.game.status === "Finished" && user.loggedIn
    : !props.small;
  const stackedVertically = props?.small || isPhoneDevice;
  const setupOnNewRow = isPhoneDevice || props.small;
  const maxRolesCount = props.maxRolesCount || undefined;
  const lobbyName = props.game.lobbyName;

  const onRehostClick = () => {
    var stateLengths = {};

    for (let stateName in props.game.stateLengths)
      stateLengths[stateName] = props.game.stateLengths[stateName] / 60000;

    let lobby = props.lobby;
    let gameType = props.game.type;

    if (lobby === "All") lobby = "Main";
    if (gameType !== "Mafia" && lobby === "Main") {
      lobby = "Games";
    }

    axios
      .post("/game/host", {
        gameType: gameType,
        setup: props.game.setup.id,
        lobby: lobby,
        guests: props.game.guests,
        private: false,
        ranked: props.game.ranked,
        competitive: props.game.competitive,
        spectating: props.game.spectating,
        readyCheck: props.game.readyCheck,
        noVeg: props.game.noVeg,
        anonymousGame: props.game.anonymousGame,
        anonymousDeck: props.game.anonymousDeck,
        stateLengths: stateLengths,
        ...JSON.parse(props.game.gameTypeOptions),
      })
      .then((res) => setRedirect(`/game/${res.data}`))
      .catch(errorAlert);
  };

  const SetupWrapped = (
    <Setup
      setup={props.game.setup}
      maxRolesCount={props.small ? 4 : maxRolesCount}
      fixedWidth
      key={props.game.setup.id}
      backgroundColor={getSetupBackgroundColor(props.game, true)}
    />
  );

  const redoButton = (
    <Box style={{ mx: 1, width: "32px", textAlign: "center" }}>
      {props.game.status === "Finished" && user.loggedIn && (
        <IconButton color="primary" onClick={onRehostClick}>
          <i className="rehost fas fa-redo" title="Rehost" />
        </IconButton>
      )}
    </Box>
  );

  if (redirect) return <Redirect to={redirect} />;
  if (!props.game.setup) return <></>;

  return (
    <div className="shiny-container">
    {props.game.competitive && (<i className="shiny"/>)}
    <Stack
      direction="row"
      sx={{
        p: 0,
        py: 0.75,
        width: "100%",
        background: getRowColor(props.game, false),
        ":hover": {
          background: getRowColor(props.game, true),
        },
      }}
      key={props.game.id}
    >
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          width: "100%",
          zIndex: 1,
        }}
      >
        <GameStatus 
          small={props?.small}
          game={props.game}
          status={props.status}
          showGameTypeIcon={showGameTypeIcon}
          stackedVertically={stackedVertically}
        />
        {showLobbyName && !stackedVertically && (<Typography variant="body2" sx={{
            maxWidth: "280px",
            overflow: "hidden",
            ml: .5
          }}>
            {filterProfanity(lobbyName, user.settings)}
          </Typography>)}
        <Stack direction={stackedVertically ? "column" : "row"} sx={{
          marginLeft: "auto"
        }}>
          <Stack direction="row" sx={{
              alignItems: "center",
              zIndex: 1,
            }}
          >
            {showLobbyName && stackedVertically && (<Box sx={{
              maxWidth: "180px",
              overflow: "hidden",
              ml: .5
            }}>
              <Typography variant="caption">
                {filterProfanity(lobbyName, user.settings)}
              </Typography>
            </Box>)}
            {showRedoButton && isPhoneDevice && (<Box sx={{ marginLeft: "auto" }}>{redoButton}</Box>)}
          </Stack>
          <Box
            sx={{
              display: "flex",
              marginLeft: "auto",
              alignItems: "center",
              //...(!isPhoneDevice ? { whiteSpace: "nowrap" } : {}),
              mr: 0.5,
              zIndex: 1,
            }}
          >
            {!setupOnNewRow && SetupWrapped}
            {showRedoButton && !isPhoneDevice && redoButton}
            <Box sx={{ marginX: "auto" }}>{setupOnNewRow && SetupWrapped}</Box>
          </Box>
        </Stack>
      </Box>
    </Stack>
    </div>
  );
};
