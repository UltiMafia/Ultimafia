import React, { useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

import CreateSetup from "./CreateSetup";
import { SiteInfoContext } from "../../../Contexts";
import { useForm } from "../../../components/Form";
import { useErrorAlert } from "../../../components/Alerts";

export default function CreateOneNightSetup() {
  const gameType = "One Night";
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
      label: "Must Act",
      ref: "mustAct",
      type: "boolean",
    },
    {
      label: "Votes Invisible",
      ref: "votesInvisible",
      type: "boolean",
    },
    {
      label: "Excess Roles",
      ref: "excessRoles",
      type: "number",
      value: "3",
      min: "2",
      max: "10",
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
      label: "Village Count",
      ref: "count-Village",
      type: "number",
      value: "7",
      min: "0",
      max: "50",
      showIf: "closed",
    },
    {
      label: "Werewolves Count",
      ref: "count-Werewolves",
      type: "number",
      value: "0",
      min: "0",
      max: "50",
      showIf: "closed",
    },
    {
      label: "Independent Count",
      ref: "count-Independent",
      type: "number",
      value: "2",
      min: "0",
      max: "50",
      showIf: "closed",
    },
  ]);
  const formFieldValueMods = {
    startState: [(value) => value == "Day"],
  };

  const siteInfo = useContext(SiteInfoContext);

  useEffect(() => {
    document.title = "Create One Night Setup | UltiMafia";
  }, []);

  function onCreateSetup(roleData, editing, setRedirect) {
    axios
      .post("/setup/create", {
        gameType: gameType,
        roles: roleData.roles,
        closed: roleData.closed,
        name: formFields[0].value,
        whispers: formFields[1].value,
        leakPercentage: Number(formFields[2].value),
        mustAct: formFields[3].value,
        votesInvisible: formFields[4].value,
        excessRoles: formFields[5].value,
        unique: formFields[7].value,
        count: {
          Village: Number(formFields[8].value),
          Werewolves: Number(formFields[9].value),
          Independent: Number(formFields[10].value),
        },
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
    <CreateSetup
      gameType={gameType}
      formFields={formFields}
      updateFormFields={updateFormFields}
      resetFormFields={resetFormFields}
      closedField={formFields[6]}
      formFieldValueMods={formFieldValueMods}
      onCreateSetup={onCreateSetup}
    />
  );
}
