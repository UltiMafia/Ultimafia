import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";

import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";

import {
  Box,
  Button,
  Stack,
} from "@mui/material";
import { UserContext } from "Contexts";
import { useErrorAlert } from "components/Alerts";
import Form from "components/Form";
import { useForm } from "components/Form";
import Setup from "components/Setup";
import RankedCompetitiveWarningModal, {
  acknowledgeModeWarning,
  getPendingModeWarnings,
} from "components/RankedCompetitiveWarningModal";

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
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";
import { getSetupBackgroundColor } from "pages/Play/LobbyBrowser/gameRowColors";

export default function HostGameDialogue({ open, setOpen, setup, preSelectedDeck, defaultLobby }) {
  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();
  const isPhoneDevice = useIsPhoneDevice();
  const navigate = useNavigate();
  const [warningMode, setWarningMode] = useState(null);
  const [pendingWarnings, setPendingWarnings] = useState([]);

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

  function hostGameNow() {
    onHostGame(setup.id, getFormFieldValue)
      .then((res) => {
        navigate(`/game/${res.data}`);
      })
      .catch(errorAlert);
  }

  function beginHostFlow() {
    if (!supportsGameType) {
      errorAlert("This setup cannot be hosted right now. Please refresh and try again.");
      return;
    }

    const warnings = getPendingModeWarnings(user, {
      ranked: getFormFieldValue("ranked"),
      competitive: getFormFieldValue("competitive"),
    });

    if (warnings.length > 0) {
      setPendingWarnings(warnings);
      setWarningMode(warnings[0]);
      return;
    }

    hostGameNow();
  }

  async function handleWarningAcknowledge() {
    try {
      await acknowledgeModeWarning(user, warningMode);
      const remaining = pendingWarnings.slice(1);
      setPendingWarnings(remaining);
      if (remaining.length > 0) {
        setWarningMode(remaining[0]);
      } else {
        setWarningMode(null);
        hostGameNow();
      }
    } catch (e) {
      errorAlert(e);
    }
  }

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

  return (
    <>
      <RankedCompetitiveWarningModal
        mode={warningMode}
        show={Boolean(warningMode)}
        onAcknowledge={handleWarningAcknowledge}
        onCancel={() => {
          setWarningMode(null);
          setPendingWarnings([]);
        }}
      />
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
                onClick={beginHostFlow}
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
            <Form compact fields={formFields} onChange={updateFormFields} />
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}
