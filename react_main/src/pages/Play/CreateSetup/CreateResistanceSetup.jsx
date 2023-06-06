import React, { useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

import CreateSetup from "./CreateSetup";
import { SiteInfoContext } from "../../../Contexts";
import { useForm } from "../../../components/Form";
import { useErrorAlert } from "../../../components/Alerts";

export default function CreateResistanceSetup() {
  const gameType = "Resistance";
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
      label: "First Team Size",
      ref: "firstTeamSize",
      type: "number",
      value: "2",
      min: "2",
      max: "49",
    },
    {
      label: "Last Team Size",
      ref: "lastTeamSize",
      type: "number",
      value: "4",
      min: "2",
      max: "49",
    },
    {
      label: "Number of Missions",
      ref: "numMissions",
      type: "number",
      value: "5",
      min: "2",
      max: "10",
    },
    {
      label: "Team Formation Attempts",
      ref: "teamFailLimit",
      type: "number",
      value: "5",
      min: "1",
      max: "49",
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
      label: "Resistance Count",
      ref: "count-Resistance",
      type: "number",
      value: "3",
      min: "2",
      max: "49",
      showIf: "closed",
    },
    {
      label: "Spies Count",
      ref: "count-Spies",
      type: "number",
      value: "2",
      min: "1",
      max: "49",
      showIf: "closed",
    },
  ]);
  const formFieldValueMods = {};

  const siteInfo = useContext(SiteInfoContext);

  useEffect(() => {
    document.title = "Create Resistance Setup | UltiMafia";
  }, []);

  function onCreateSetup(roleData, editing, setRedirect) {
    axios
      .post("/setup/create", {
        gameType: gameType,
        roles: roleData.roles,
        closed: roleData.closed,
        name: formFields[0].value,
        startState: "Team Selection",
        firstTeamSize: Number(formFields[1].value),
        lastTeamSize: Number(formFields[2].value),
        numMissions: Number(formFields[3].value),
        teamFailLimit: Number(formFields[4].value),
        whispers: formFields[5].value,
        leakPercentage: Number(formFields[6].value),
        unique: formFields[8].value,
        count: {
          Resistance: Number(formFields[9].value),
          Spies: Number(formFields[10].value),
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
      closedField={formFields[7]}
      formFieldValueMods={formFieldValueMods}
      onCreateSetup={onCreateSetup}
    />
  );
}
