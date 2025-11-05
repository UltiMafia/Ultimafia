import React, { useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

import CreateBrowser from "./CreateBrowser";
import { SiteInfoContext } from "../../../Contexts";
import { useForm } from "../../../components/Form";
import { useErrorAlert } from "../../../components/Alerts";

export default function CreateDiceWarsSetup() {
  const gameType = "Dice Wars";
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
      label: "Map Size (Territories)",
      ref: "mapSize",
      type: "number",
      value: "30",
      min: "22",
      max: "43",
    },
    {
      label: "Max Dice Per Territory",
      ref: "maxDice",
      type: "select",
      value: "8",
      options: [
        { label: "4 Dice", value: "4" },
        { label: "8 Dice", value: "8" },
        { label: "16 Dice", value: "16" },
      ],
    },
  ]);
  const formFieldValueMods = {};

  const siteInfo = useContext(SiteInfoContext);

  useEffect(() => {
    document.title = "Create Dice Wars Setup | UltiMafia";
  }, []);

  function onCreateSetup(roleData, editing, setNavigate, gameSettings) {
    axios
      .post("/api/setup/create", {
        gameType: gameType,
        roles: roleData.roles,
        gameSettings: gameSettings,
        name: formFields[0].value,
        startState: "Play",
        whispers: false,
        leakPercentage: 100,
        mapSize: Number(formFields[1].value),
        maxDice: Number(formFields[2].value),
        editing: editing,
        id: params.get("edit"),
      })
      .then((res) => {
        siteInfo.showAlert(
          `${editing ? "Edited" : "Created"} setup '${formFields[0].value}'`,
          "success"
        );
        setNavigate(res.data);
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
    />
  );
}
