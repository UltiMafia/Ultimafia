import React, { useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

import CreateBrowser from "./CreateBrowser";
import { SiteInfoContext } from "../../../Contexts";
import { useForm } from "../../../components/Form";
import { useErrorAlert } from "../../../components/Alerts";

const BATTLESHIP_PLAYER_TOTAL = 2;
const BATTLESHIP_FIXED_ROLES = [{ "Admiral:": BATTLESHIP_PLAYER_TOTAL }];

export default function CreateBattleshipSetup() {
  const gameType = "Battleship";
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const errorAlert = useErrorAlert();
  const [formFields, updateFormFields, resetFormFields] = useForm([
    {
      label: "Setup Name",
      ref: "name",
      type: "text",
    },
    {
      label: "Whispers",
      ref: "whispers",
      value: false,
      type: "boolean",
    },
    {
      label: "Whisper Leak Percentage",
      ref: "leakPercentage",
      type: "number",
      value: "5",
      min: "0",
      max: "100",
      showIf: "whispers",
    },
  ]);
  const formFieldValueMods = {};

  const siteInfo = useContext(SiteInfoContext);

  useEffect(() => {
    document.title = "Create Battleship Setup | UltiMafia";
  }, []);

  function onCreateSetup(_roleData, editing, setRedirect, gameSettings) {
    axios
      .post("/api/setup/create", {
        gameType: gameType,
        roles: BATTLESHIP_FIXED_ROLES,
        gameSettings: gameSettings,
        name: formFields[0].value,
        startState: "Place Ships",
        whispers: formFields[1].value,
        leakPercentage: Number(formFields[2].value),
        noReveal: true,
        editing: editing,
        id: params.get("edit"),
      })
      .then((res) => {
        siteInfo.showAlert(
          `${editing ? "Edited" : "Created"} setup '${formFields[0].value}'`,
          "success"
        );
        setRedirect(res.data);
      })
      .catch(errorAlert);
  }

  return (
    <CreateBrowser
      gameType={gameType}
      formFields={formFields}
      updateFormFields={updateFormFields}
      resetFormFields={resetFormFields}
      closedField={{ value: false }}
      formFieldValueMods={formFieldValueMods}
      onCreateSetup={onCreateSetup}
      fixedRoles={BATTLESHIP_FIXED_ROLES}
      fixedPlayerTotal={BATTLESHIP_PLAYER_TOTAL}
    />
  );
}
