import React, { useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

import CreateSetup from "./CreateSetup";
import { SiteInfoContext } from "../../../Contexts";
import { useForm } from "../../../components/Form";
import { useErrorAlert } from "../../../components/Alerts";

export default function CreateMafiaSetup() {
  const gameType = "Mafia";
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
      label: "Day Start",
      ref: "startState",
      type: "boolean",
    },
    {
      label: "Dawn",
      ref: "dawn",
      type: "boolean",
    },
    {
      label: "Whispers",
      ref: "whispers",
      value: true,
      type: "boolean",
    },
    {
      label: "Whisper Leak Percentage",
      ref: "leakPercentage",
      type: "number",
      value: "10",
      min: "0",
      max: "100",
      showIf: "whispers",
    },
    {
      label: "Last Wills",
      ref: "lastWill",
      value: true,
      type: "boolean",
    },
    {
      label: "Must Act",
      ref: "mustAct",
      type: "boolean",
    },
    {
      label: "No Reveal",
      ref: "noReveal",
      type: "boolean",
    },
    {
      label: "Votes Invisible",
      ref: "votesInvisible",
      type: "boolean",
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
      label: "Unique Without Modifier",
      ref: "uniqueWithoutModifier",
      type: "boolean",
      showIf: "unique",
    },
    {
      label: "Role Groups",
      ref: "useRoleGroups",
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
      showIf: ["closed", "!useRoleGroups"],
    },
    {
      label: "Mafia Count",
      ref: "count-Mafia",
      type: "number",
      value: "3",
      min: "0",
      max: "50",
      showIf: ["closed", "!useRoleGroups"],
    },
    {
      label: "Cult Count",
      ref: "count-Cult",
      type: "number",
      value: "0",
      min: "0",
      max: "50",
      showIf: ["closed", "!useRoleGroups"],
    },
    {
      label: "Independent Count",
      ref: "count-Independent",
      type: "number",
      value: "2",
      min: "0",
      max: "50",
      showIf: ["closed", "!useRoleGroups"],
    },
  ]);

  const formFieldValueMods = {
    startState: [(value) => value == "Day"],
  };

  const siteInfo = useContext(SiteInfoContext);

  useEffect(() => {
    document.title = "Create Mafia Setup | UltiMafia";
  }, []);

  function onCreateSetup(roleData, editing, setRedirect) {
    axios
      .post("/setup/create", {
        gameType: gameType,
        roles: roleData.roles,
        closed: roleData.closed,
        name: formFields[0].value,
        startState: formFields[1].value ? "Day" : "Night",
        dawn: formFields[2].value,
        whispers: formFields[3].value,
        leakPercentage: Number(formFields[4].value),
        lastWill: formFields[5].value,
        mustAct: formFields[6].value,
        noReveal: formFields[7].value,
        votesInvisible: formFields[8].value,
        unique: formFields[10].value,
        uniqueWithoutModifier: formFields[11].value,
        useRoleGroups: roleData.useRoleGroups,
        roleGroupSizes: roleData.roleGroupSizes,
        count: {
          Village: Number(formFields[13].value),
          Mafia: Number(formFields[14].value),
          Cult: Number(formFields[15].value),
          Independent: Number(formFields[16].value),
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
      closedField={formFields[9]}
      useRoleGroupsField={formFields[12]}
      formFieldValueMods={formFieldValueMods}
      onCreateSetup={onCreateSetup}
    />
  );
}
