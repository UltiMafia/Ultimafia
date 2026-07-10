import React, { useEffect, useState, useContext } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";

import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { UserContext } from "Contexts";
import { useErrorAlert } from "components/Alerts";
import Form from "components/Form";
import { useForm } from "components/Form";
import Setup from "components/Setup";

import HostMafia from "./gameTypeHostForms/HostMafia";
import HostJotto from "./gameTypeHostForms/HostJotto";
import HostAcrotopia from "./gameTypeHostForms/HostAcrotopia";
import HostSecretDictator from "./gameTypeHostForms/HostSecretDictator";
import HostWackyWords from "./gameTypeHostForms/HostWackyWords";
import HostDrawIt from "./gameTypeHostForms/HostDrawIt";
import HostLiarsDice from "./gameTypeHostForms/HostLiarsDice";
import HostTexasHoldEm from "./gameTypeHostForms/HostTexasHoldEm";
import HostCheat from "./gameTypeHostForms/HostCheat";
import HostRatscrew from "./gameTypeHostForms/HostRatscrew";
import HostBattlesnakes from "./gameTypeHostForms/HostBattlesnakes";
import HostDiceWars from "./gameTypeHostForms/HostDiceWars";
import HostConnectFour from "./gameTypeHostForms/HostConnectFour";
import HostSpotIt from "./gameTypeHostForms/HostSpotIt";
import HostBattleship from "./gameTypeHostForms/HostBattleship";
import HostChess from "./gameTypeHostForms/HostChess";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";
import { getSetupBackgroundColor } from "pages/Play/LobbyBrowser/gameRowColors";

export default function HostGameDialogue({ open, setOpen, setup, preSelectedDeck, defaultLobby }) {
  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();
  const isPhoneDevice = useIsPhoneDevice();
  const navigate = useNavigate();

  function getNormalizedGameType(gameType) {
    return String(gameType || "").trim();
  }

  const [initialFormFields, onHostGame, supportsGameType] = GameTypeHostForm(
    getNormalizedGameType(setup.gameType)
  );

  function GameTypeHostForm(gameType) {
    switch (gameType) {
      case "Mafia":
        return [...HostMafia(), true];
      case "Jotto":
        return [...HostJotto(), true];
      case "Acrotopia":
        return [...HostAcrotopia(), true];
      case "Secret Dictator":
        return [...HostSecretDictator(), true];
      case "Wacky Words":
        return [...HostWackyWords(), true];
      case "Draw It":
        return [...HostDrawIt(), true];
      case "Liars Dice":
        return [...HostLiarsDice(), true];
      case "Texas Hold Em":
        return [...HostTexasHoldEm(), true];
      case "Cheat":
        return [...HostCheat(), true];
      case "Ratscrew":
        return [...HostRatscrew(), true];
      case "Battlesnakes":
        return [...HostBattlesnakes(), true];
      case "Dice Wars":
        return [...HostDiceWars(), true];
      case "Connect Four":
        return [...HostConnectFour(), true];
      case "Spot It":
        return [...HostSpotIt(), true];
      case "Battleship":
        return [...HostBattleship(), true];
      case "Chess":
        return [...HostChess(), true];
    }

    console.error(`Failed to get form fields for game type: ${setup.gameType}`);
    return [[], () => Promise.reject(new Error("Unsupported game type for hosting.")), false];
  }

  const [formFields, updateFormFields] = useForm(initialFormFields);

  useEffect(
    function () {
      const [newFormFields] = GameTypeHostForm(getNormalizedGameType(setup.gameType));
      if (preSelectedDeck) {
        for (let field of newFormFields) {
          if (field.ref === "anonymousGame") field.value = true;
          if (field.ref === "anonymousDeckId") field.value = preSelectedDeck;
        }
      }
      if (defaultLobby) {
        for (let field of newFormFields) {
          if (field.ref === "lobby") field.value = defaultLobby;
        }
      }
      updateFormFields({ type: "setFields", fields: newFormFields });
    },
    [setup.gameType, preSelectedDeck, defaultLobby]
  );

  function getFormFieldValue(ref) {
    for (let field of formFields) if (field.ref === ref) return field.value;
  }

  const onHostGameWrapper = () => {
    if (!supportsGameType) {
      errorAlert("This setup cannot be hosted right now. Please refresh and try again.");
      return;
    }
    onHostGame(setup.id, getFormFieldValue)
      .then((res) => {
        navigate(`/game/${res.data}`);
      })
      .catch(errorAlert);
  };

  const lobby = getFormFieldValue("lobby");
  const isRanked = getFormFieldValue("ranked");
  const isCompetitive = getFormFieldValue("competitive");

  useEffect(() => {
    if (isCompetitive) {
      updateFormFields({
        ref: "lobby",
        prop: "value",
        value: "Competitive",
      });
    }
  }, [isCompetitive]);

  var alertText = "";

  if (!user.canPlayRanked && isRanked) {
    // TODO use npm link so that the frontend can access constants.js and stop hardcoding this
    alertText = `You must play 5 games before playing ranked.`;
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        scroll="body"
        fullScreen={isPhoneDevice}
      >
        <DialogContent
          sx={{
            px: 2,
          }}
        >
          <Stack direction="column" spacing={1}>
            <Stack direction="row">
              <Button
                variant="outlined"
                onClick={() => setOpen(false)}
                sx={{
                  flex: "1",
                }}
              >
                Cancel
              </Button>
              <div style={{ flex: "1" }} />
              <Button
                onClick={onHostGameWrapper}
                sx={{
                  flex: "1",
                }}
              >
                Host
              </Button>
            </Stack>
            <Setup
              setup={setup}
              backgroundColor={getSetupBackgroundColor(
                {
                  lobby: lobby,
                  competitive: isCompetitive,
                  ranked: isRanked,
                },
                true
              )}
            />
            {alertText && <Alert severity="warning">{alertText}</Alert>}
            <Form compact fields={formFields} onChange={updateFormFields} />
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}
