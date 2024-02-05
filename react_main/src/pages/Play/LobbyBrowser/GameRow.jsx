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
  Typography,
} from "@mui/material";
import { useIsPhoneDevice } from "../../../hooks/useIsPhoneDevice";

export const GameRow = (props) => {
  const isPhoneDevice = useIsPhoneDevice();
  const [redirect, setRedirect] = useState(false);

  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();

  const onRehostClick = () => {
    var stateLengths = {};

    for (let stateName in props.game.stateLengths)
      stateLengths[stateName] = props.game.stateLengths[stateName] / 60000;

    let lobby = props.lobby;
    let gameType = props.game.type;

    if (lobby === "All") lobby = "Mafia";
    if (gameType !== "Mafia" && lobby === "Mafia") {
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
        voiceChat: props.game.voiceChat,
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

  const canShowGameButton =
    (user.loggedIn || props.status === "Finished") &&
    !props.game.broken &&
    !props.game.private;
  const gameButtonDisabled =
    props?.status === "In Progress" && !props.game.spectating;

  let buttonUrl, buttonText, buttonVariant, buttonColor;
  if (props.game.status === "Open") {
    buttonUrl = `/game/${props.game.id}`;
    buttonText = "Join";
    buttonColor = "primary";
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

  const GameTypeIcon = (
    <Box
      sx={{
        textAlign: "center",
        mx: 0.5,
        ...(props.small ? { ml: 0 } : {}),
        width: "28px" /* 20pxheart + 0.5x8x2 margin-x */,
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

  if (redirect) return <Redirect to={redirect} />;
  if (!props.game.setup) return <></>;

  return (
    <ListItemButton
      sx={{
        p: 0,
        display: "flex",

        py: 0.75,
        alignItems: "center",
        ...(!props.odd ? { background: "#191919" } : {}),
      }}
    >
      {GameTypeIcon}
      <div style={{ width: props.small ? "88px" : "96px" }}>
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
      </div>
      <PlayerCount game={props.game} small={props?.small} />
      <Setup
        setup={props.game.setup}
        maxRolesCount={props.small ? 3 : undefined}
        anonymousGame={props.game.anonymousGame}
      />

      {!props.small && (
        <div
          style={{
            display: "flex",
            marginLeft: "auto",
            alignItems: "center",
            ...(!isPhoneDevice ? { whiteSpace: "nowrap" } : {}),
          }}
        >
          <Typography variant="body2">
            {filterProfanity(props.game.setup.name, user.settings)}
          </Typography>

          {/*{props.game.voiceChat && (*/}
          {/*  <i className="voice-chat fas fa-microphone" title="Voice chat game" />*/}
          {/*)}*/}
          <Box style={{ mx: 1, width: "36px", textAlign: "center" }}>
            {props.game.status === "Finished" && user.loggedIn && (
              <IconButton color="primary" onClick={onRehostClick}>
                <i className="rehost fas fa-redo" title="Rehost" />
              </IconButton>
            )}
          </Box>
        </div>
      )}
    </ListItemButton>
  );
};
