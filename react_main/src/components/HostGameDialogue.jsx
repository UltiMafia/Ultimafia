import React, { useEffect, useState, useContext } from "react";
import { Redirect } from "react-router-dom";

import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';

import axios from "axios";
import { Box, Button, Divider, IconButton, Paper, Stack, TextField, Typography } from "@mui/material";
import { UserContext } from "Contexts";
import { useErrorAlert } from "components/Alerts";
import Form from "components/Form";
import { useForm } from "components/Form";
import Setup from "components/Setup";

import HostMafia from "./gameTypeHostForms/HostMafia";
import HostResistance from "./gameTypeHostForms/HostResistance";
import HostGhost from "./gameTypeHostForms/HostGhost";
import HostJotto from "./gameTypeHostForms/HostJotto";
import HostAcrotopia from "./gameTypeHostForms/HostAcrotopia";
import HostSecretDictator from "./gameTypeHostForms/HostSecretDictator";
import HostWackyWords from "./gameTypeHostForms/HostWackyWords";
import HostLiarsDice from "./gameTypeHostForms/HostLiarsDice";
import HostTexasHoldEm from "./gameTypeHostForms/HostTexasHoldEm";
import HostCheat from "./gameTypeHostForms/HostCheat";
import HostBattlesnakes from "./gameTypeHostForms/HostBattlesnakes";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";
import { getSetupBackgroundColor } from "pages/Play/LobbyBrowser/gameRowColors";

export default function HostGameDialogue({open, setOpen, setup}) {
  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();
  const isPhoneDevice = useIsPhoneDevice();
  
  const [redirect, setRedirect] = useState(null);

  const gameType = setup.gameType;

  function GameTypeHostForm() {
    switch (gameType) {
      case "Mafia": return HostMafia();
      case "Resistance": return HostResistance();
      case "Ghost": return HostGhost();
      case "Jotto": return HostJotto();
      case "Acrotopia": return HostAcrotopia();
      case "Secret Dictator": return HostSecretDictator();
      case "Wacky Words": return HostWackyWords();
      case "Liars Dice": return HostLiarsDice();
      case "Texas Hold Em": return HostTexasHoldEm();
      case "Cheat": return HostCheat();
      case "Battlesnakes": return HostBattlesnakes();
    }
    
    return [null, null];
  }

  const [initialFormFields, onHostGame] = GameTypeHostForm();

  const [formFields, updateFormFields, resetFields] = useForm(initialFormFields);

  useEffect(function() {
    console.log(`zzz0 ${gameType}`, formFields);
    resetFields();
    console.log(`zzz1 ${gameType}`, formFields);
  }, [gameType]);

  function getFormFieldValue(ref) {
    for (let field of formFields) if (field.ref === ref) return field.value;
  }

  const onHostGameWrapper = () => {
    onHostGame(setup.id, getFormFieldValue)
      .then((res) => {
        setRedirect(`/game/${res.data}`);
      })
      .catch(errorAlert);
  }

  if (redirect) return <Redirect to={redirect} />;

  return (
    <>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogContent  sx={{ 
            px: 1,
            paddingBottom: 0,
        }}>
          <Stack direction="column" spacing={1}>
            <Stack direction="row">
              <Button className="glow-slightly" onClick={onHostGameWrapper}>
                Host Game
              </Button>
              <Button onClick={() => setOpen(false)} sx={{
                marginLeft: "auto"
              }}>
                Cancel
              </Button>
            </Stack>
            <Setup
              setup={setup}
              maxRolesCount={6}
              fixedWidth
              backgroundColor={getSetupBackgroundColor({
                lobby: getFormFieldValue("lobby"),
                competitive: getFormFieldValue("competitive"),
                ranked: getFormFieldValue("ranked"),
              }, true)}
            />
            <Form
              fields={formFields}
              onChange={updateFormFields}
            />
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}