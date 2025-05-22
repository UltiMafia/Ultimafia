import React, { useContext, useState } from "react";
import axios from "axios";
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
  const showGameTypeIcon = props.showGameTypeIcon;

  let buttonUrl, buttonText, buttonVariant, buttonColor;
  if (props.game.status === "Open") {
    buttonUrl = `/game/${props.game.id}`;
    buttonText = "Join";
    buttonColor = "secondary";
    buttonVariant = "contained";
  } else if (props.game.status === "In Progress") {
    if (props.game.spectating || user.perms.canSpectateAny) {
      buttonUrl = `/game/${props.game.id}`;
      buttonText = "Spectate";
      buttonColor = "info";
      buttonVariant = "outlined";
    } else {
      buttonUrl = "/play";
      buttonText = "In Progress";
      buttonColor = "secondary";
      buttonVariant = "outlined";
    }
  } else if (props.game.status === "Finished") {
    buttonUrl = `/game/${props.game.id}`;
    buttonText = "Review";
    buttonColor = "primary";
    buttonVariant = "outlined";
  }

  const GameTypeIcon = (
    <Box
      sx={{
        textAlign: "center",
        minWidth: "20px",
      }}
    >
      {props.game.ranked && (
        <i
          className="fas fa-heart"
          title="Ranked game"
          style={{ color: "#e23b3b" }}
        />
      )}
      {props.game.competitive && (
        <i
          className="fas fa-heart"
          title="Competitive game"
          style={{ color: "#edb334" }}
        />
      )}
    </Box>
  );

  const GameButton = (
    <Link to={buttonUrl} disabled={gameButtonDisabled}>
      <Button
        variant={buttonVariant}
        color={buttonColor}
        sx={{
          p: 0.5,
          textTransform: "none",
          width: "100%",
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
    <Box sx={{ minWidth: isPhoneDevice || props.small ? "88px" : "100px", ml: 0.5 }}>
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
            style={{ fontSize: "24px" }}
            title="Broken"
          />
        )}
        {props.game.private && (
          <i
            className="fas fa-lock"
            style={{ fontSize: "24px" }}
            title="Private"
          />
        )}
      </div>
    </Box>
  );

  return (
    <>
      <Stack direction="column" spacing={0.5} sx={{
        ml: isPhoneDevice || props?.small ? 0.5 : 1,
      }}>
        {showGameTypeIcon && GameTypeIcon}
        {props.game.anonymousGame && (<i className="fas fa-theater-masks" title="Anonymous game" />)}
      </Stack>
      <Stack direction={stackedVertically ? "column" : "row"} spacing={1}
        sx={{
          alignItems: "center",
          justifyContent: "space-around",
          height: stackedVertically ? "100%" : undefined,
          ml: "8px",
          mr: "8px",
        }}>
        <PlayerCount game={props.game} small={props?.small} />
        {gameButtonWrapped}
      </Stack>
    </>
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
  const lobbyName = "";

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
      maxRolesCount={props.small ? 3 : maxRolesCount}
      fixedWidth
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

  const getRowColor = (odd, hover) => {
    let color = { r: 0, g: 0, b: 0 };
    if (hover) {
      color = { r: 7, g: 7, b: 7 };
    }
    if (odd) {
      if (hover) {
        return "var(--game-row-odd-h)";
      }
      return "var(--game-row-odd)";
    } else {
      if (hover) {
        return "var(--game-row-h)";
      }
      return "var(--game-row)";
    }
  };

  return (
    <ListItemButton
      sx={{
        p: 0,
        py: 0.75,

        display: "flex",
        flexDirection: "column",
        background: getRowColor(props.odd),
        ":hover": {
          background: getRowColor(props.odd, true),
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          width: "100%",
        }}
      >
        <GameStatus 
          small={props?.small}
          game={props.game}
          status={props.status}
          showGameTypeIcon={showGameTypeIcon}
          stackedVertically={stackedVertically}
        />
        {showLobbyName && !stackedVertically && (<Typography variant="body2">
          {filterProfanity(lobbyName, user.settings)}
        </Typography>)}
        <Stack direction={stackedVertically ? "column" : "row"} sx={{
          marginLeft: "auto"
        }}>
          <Stack direction="row" sx={{
              alignItems: "center",
            }}
          >
            {showLobbyName && stackedVertically && (<Typography variant="body2">
              {filterProfanity(lobbyName, user.settings)}
            </Typography>)}
            {showRedoButton && isPhoneDevice && (<Box sx={{ marginLeft: "auto" }}>{redoButton}</Box>)}
          </Stack>
          <Box
            sx={{
              display: "flex",
              marginLeft: "auto",
              alignItems: "center",
              //...(!isPhoneDevice ? { whiteSpace: "nowrap" } : {}),
              mr: 0.5,
            }}
          >
            {!setupOnNewRow && SetupWrapped}
            {showRedoButton && !isPhoneDevice && redoButton}
            <Box sx={{ marginX: "auto" }}>{setupOnNewRow && SetupWrapped}</Box>
          </Box>
        </Stack>
      </Box>
    </ListItemButton>
  );
};
