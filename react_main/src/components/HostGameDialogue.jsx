import React, { useEffect, useRef, useState, useContext } from "react";
import { useViewNavigate as useNavigate } from "hooks/useViewActivity";
import { LatestRequest } from "../lib/latestRequest.js";

import { UiAction, UiDialog } from "./ui";

import {
  Alert,
  Stack,
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

export default function HostGameDialogue({ open, setOpen, setup, preSelectedDeck, preSelectedWordDeck, defaultLobby }) {
  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();
  const [hostError, setHostError] = useState("");
  const [hosting, setHosting] = useState(false);
  const hostRequest = useRef(new LatestRequest());
  useEffect(() => () => hostRequest.current.invalidate(), []);

  useEffect(() => {
    setHostError("");
    hostRequest.current.invalidate();
  }, [open]);

  function hostErrorText(error) {
    const message = error?.response?.data || error?.message || error;
    return typeof message === "string" && message.length <= 200
      ? message
      : "Could not host game. Please try again.";
  }
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
      if (preSelectedWordDeck) {
        for (let field of newFormFields) if (field.ref === "wordDeckId") field.value = preSelectedWordDeck;
      }
      if (defaultLobby) {
        for (let field of newFormFields) {
          if (field.ref === "lobby") field.value = defaultLobby;
        }
      }
      updateFormFields({ type: "setFields", fields: newFormFields });
    },
    [setup.gameType, preSelectedDeck, preSelectedWordDeck, defaultLobby]
  );

  function getFormFieldValue(ref) {
    for (let field of formFields) if (field.ref === ref) return field.value;
  }

  const onHostGameWrapper = () => {
    if (hosting) return;
    setHostError("");
    if (!supportsGameType) {
      setHostError("This setup cannot be hosted right now. Please refresh and try again.");
      return;
    }
    // Cancelling makes this attempt's result ineligible for the dialog and the
    // page, though the server may still create the game.
    const request = hostRequest.current.begin();
    setHosting(true);
    onHostGame(setup.id, getFormFieldValue)
      .then((res) => {
        const current = request.isCurrent();
        // Close before navigating: the dialog renders in a portal, so it stays
        // visible over the game even while the lobby it lives in is frozen.
        if (current) setOpen(false);
        user.refreshGameMembership();
        if (current) navigate(`/game/${res.data}`);
      })
      .catch((error) => {
        const text = hostErrorText(error);
        // A site alert would cover the Cancel and Host buttons on phones, so it
        // is only for an attempt the dialog can no longer show.
        if (request.isCurrent()) setHostError(text);
        else errorAlert(text);
      })
      .finally(() => setHosting(false));
  };

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

  if (user.perms && !user.perms.playRanked && isRanked) {
    alertText = `You are unable to play ranked games. Please contact an admin if this is in error.`;
  } else if (user.perms && !user.perms.playCompetitive && isCompetitive) {
    alertText = `You are unable to play competitive games. Please contact an admin if this is in error.`;
  }

  return (
    <>
      <UiDialog open={open} onClose={() => setOpen(false)} title="Host a game" maxWidth="sm"
        actions={<><UiAction onClick={() => setOpen(false)}>Cancel</UiAction><UiAction variant="primary" busy={hosting} onClick={onHostGameWrapper}>Host</UiAction></>}>
          <div className="host-dialog-content">
            <div className="host-dialog-setup"><Setup setup={setup} summary /></div>
            {hostError && <Alert severity="error">{hostError}</Alert>}
            {alertText && <Alert severity="warning">{alertText}</Alert>}
            <Form fields={formFields.map(field => ({ ...field, groupName: field.groupName || (
              ["lobby", "lobbyName", "ranked", "competitive"].includes(field.ref) ? "Game and lobby" :
              ["configureDuration", "dayLength", "nightLength", "pregameWaitLength", "extendLength"].includes(field.ref) ? "Timing" : "Access and options"
            ) }))} onChange={updateFormFields} cardGroups />
          </div>
      </UiDialog>
    </>
  );
}
