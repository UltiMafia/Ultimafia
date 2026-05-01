import React, { useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

import CreateBrowser from "./CreateBrowser";
import { SiteInfoContext } from "../../../Contexts";
import { useForm } from "../../../components/Form";
import { useErrorAlert } from "../../../components/Alerts";

export default function CreateDrawItSetup() {
  const gameType = "Draw It";
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
      label: "Word Deck",
      ref: "wordDeckId",
      type: "text",
      value: "default",
      placeholder: "Word deck id",
    },
    {
      label: "Number of Rounds",
      ref: "roundAmt",
      type: "number",
      value: 3,
      min: 1,
      max: 10,
    },
  ]);
  const formFieldValueMods = {};

  const siteInfo = useContext(SiteInfoContext);

  useEffect(() => {
    document.title = "Create Draw It Setup | UltiMafia";
  }, []);

  function onCreateSetup(roleData, editing, setRedirect, gameSettings) {
    const setupName = formFields[0].value;
    const wordDeckId = formFields[1].value;
    const roundAmt = formFields[2].value;

    const mergedGameSettings = {
      ...(gameSettings || {}),
      wordDeckId: wordDeckId || undefined,
      roundAmt: Number(roundAmt) || 3,
    };

    axios
      .post("/api/setup/create", {
        gameType: gameType,
        roles: roleData.roles,
        gameSettings: mergedGameSettings,
        name: setupName,
        startState: "Pick",
        whispers: false,
        noReveal: true,
        leakPercentage: 100,
        editing: editing,
        id: params.get("edit"),
        wordDeckId: wordDeckId || undefined,
        roundAmt: Number(roundAmt) || 3,
      })
      .then((res) => {
        siteInfo.showAlert(
          `${editing ? "Edited" : "Created"} setup '${setupName}'`,
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
    />
  );
}
