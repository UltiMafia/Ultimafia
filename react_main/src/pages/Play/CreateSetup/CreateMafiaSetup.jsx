import React, { useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

import CreateBrowser from "./CreateBrowser";
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
      label: "Closed Roles",
      ref: "closed",
      type: "boolean",
      groupName: "Closed Roles Settings",
    },
    {
      label: "Unique Roles",
      ref: "unique",
      type: "boolean",
      groupName: "Closed Roles Settings",
      showIf: "closed",
    },
    {
      label: "Unique Without Modifier",
      ref: "uniqueWithoutModifier",
      type: "boolean",
      groupName: "Closed Roles Settings",
      showIf: "unique",
    },
    {
      label: "Role Groups",
      ref: "useRoleGroups",
      type: "boolean",
      groupName: "Closed Roles Settings",
      showIf: "closed",
    },
    {
      label: "Village Count",
      ref: "count-Village",
      type: "number",
      groupName: "Closed Roles Settings",
      value: "7",
      min: "0",
      max: "50",
      showIf: ["closed", "!useRoleGroups"],
    },
    {
      label: "Mafia Count",
      ref: "count-Mafia",
      type: "number",
      groupName: "Closed Roles Settings",
      value: "3",
      min: "0",
      max: "50",
      showIf: ["closed", "!useRoleGroups"],
    },
    {
      label: "Cult Count",
      ref: "count-Cult",
      type: "number",
      groupName: "Closed Roles Settings",
      value: "0",
      min: "0",
      max: "50",
      showIf: ["closed", "!useRoleGroups"],
    },
    {
      label: "Independent Count",
      ref: "count-Independent",
      type: "number",
      groupName: "Closed Roles Settings",
      value: "2",
      min: "0",
      max: "50",
      showIf: ["closed", "!useRoleGroups"],
    },
    {
      label: "Prompt Text",
      ref: "gameStartPrompt",
      type: "text",
      textStyle: "large",
    },
    {
      label: "Events Per Night",
      ref: "EventsPerNight",
      type: "number",
      value: "1",
      min: "0",
      max: "5",
    },
    {
      label: "States With No Death",
      ref: "noDeathLimit",
      type: "number",
      groupName: "Stalemate Prevention",
      value: "6",
      min: "2",
      max: "8",
    },
    {
      label: "Force Must Act",
      ref: "ForceMustAct",
      value: true,
      type: "boolean",
      groupName: "Stalemate Prevention",
    },
    {
      label: "Game End Event",
      ref: "GameEndEvent",
      type: "select",
      groupName: "Stalemate Prevention",
      options: [
        {
          label: "Meteor",
          value: "Meteor",
        },
        {
          label: "Volcanic Eruption",
          value: "Volcanic Eruption",
        },
        {
          label: "Black Hole",
          value: "Black Hole",
        },
      ],
    },
  ]);

  const formFieldValueMods = {
    startState: [(value) => value === "Day"],
  };

  const siteInfo = useContext(SiteInfoContext);

  useEffect(() => {
    document.title = "Create Mafia Setup | UltiMafia";
  }, []);

  function onCreateSetup(roleData, editing, setRedirect, gameSettings) {
    axios
      .post("/api/setup/create", {
        gameType: gameType,
        roles: roleData.roles,
        closed: roleData.closed,
        gameSettings: gameSettings,
        name: formFields[0].value,
        startState: "Night",
        unique: formFields[2].value,
        uniqueWithoutModifier: formFields[3].value,
        useRoleGroups: roleData.useRoleGroups,
        roleGroupSizes: roleData.roleGroupSizes,
        count: {
          Village: Number(formFields[5].value),
          Mafia: Number(formFields[6].value),
          Cult: Number(formFields[7].value),
          Independent: Number(formFields[8].value),
        },
        gameStartPrompt: formFields[9].value,
        EventsPerNight: formFields[10].value,
        noDeathLimit: formFields[11].value,
        ForceMustAct: formFields[12].value,
        GameEndEvent: formFields[13].value,
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

  var closed = formFields.find((x) => x.label === "Closed Roles");
  var roleGroups = formFields.find((x) => x.label === "Role Groups");

  return (
    <CreateBrowser
      gameType={gameType}
      formFields={formFields}
      updateFormFields={updateFormFields}
      resetFormFields={resetFormFields}
      closedField={closed}
      useRoleGroupsField={roleGroups}
      formFieldValueMods={formFieldValueMods}
      onCreateSetup={onCreateSetup}
    />
  );
}
