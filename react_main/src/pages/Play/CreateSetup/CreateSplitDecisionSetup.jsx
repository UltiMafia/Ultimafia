import React, { useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

import CreateSetup from "./CreateSetup";
import { SiteInfoContext } from "../../../Contexts";
import { useForm } from "../../../components/Form";
import { useErrorAlert } from "../../../components/Alerts";

export default function CreateSplitDecisionSetup() {
  const gameType = "Split Decision";
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
      label: "Initial Swap Amount",
      ref: "swapAmt",
      type: "number",
      value: "1",
      min: "1",
      max: "24",
    },
    {
      label: "Round Amount",
      ref: "aroundAmt",
      type: "number",
      value: 3,
      min: 2,
      max: 10,
    },
    {
      label: "Whispers",
      ref: "whispers",
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
    {
      label: "Closed Roles",
      ref: "closed",
      type: "boolean",
    },
    {
      label: "Unique Roles",
      ref: "unique",
      type: "boolean",
      showIf: "closed",
    },
    {
      label: "Blue Count",
      ref: "count-Blue",
      type: "number",
      value: "4",
      min: "1",
      max: "50",
      showIf: "closed",
    },
    {
      label: "Red Count",
      ref: "count-Red",
      type: "number",
      value: "4",
      min: "1",
      max: "50",
      showIf: "closed",
    },
    {
      label: "Independent Count",
      ref: "count-Independent",
      type: "number",
      value: "1",
      min: "0",
      max: "50",
      showIf: "closed",
    },
  ]);
  const formFieldValueMods = {};

  const siteInfo = useContext(SiteInfoContext);

  useEffect(() => {
    document.title = "Create Split Decision Setup | UltiMafia";
  }, []);

  function onCreateSetup(roleData, editing, setRedirect) {
    axios
      .post("/setup/create", {
        gameType,
        roles: roleData.roles,
        closed: roleData.closed,
        name: formFields[0].value,
        startState: "Round",
        swapAmt: Number(formFields[1].value),
        roundAmt: Number(formFields[2].value),
        whispers: formFields[3].value,
        leakPercentage: Number(formFields[4].value),
        unique: formFields[6].value,
        count: {
          Red: Number(formFields[7].value),
          Blue: Number(formFields[8].value),
          Independent: Number(formFields[9].value),
        },
        editing,
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
    <CreateSetup
      gameType={gameType}
      formFields={formFields}
      updateFormFields={updateFormFields}
      resetFormFields={resetFormFields}
      closedField={formFields[5]}
      formFieldValueMods={formFieldValueMods}
      onCreateSetup={onCreateSetup}
    />
  );
}
