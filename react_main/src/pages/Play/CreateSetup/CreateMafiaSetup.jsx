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
    {
      label: "Last Wills",
      ref: "lastWill",
      value: false,
      type: "boolean",
    },
    {
      label: "Must Act",
      ref: "mustAct",
      type: "boolean",
    },
    {
      label: "Must Condemn",
      ref: "mustCondemn",
      type: "boolean",
    },
    {
      label: "No Reveal",
      ref: "noReveal",
      type: "boolean",
    },
    {
      label: "Alignment-Only Reveal",
      ref: "alignmentReveal",
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
    {
      label: "Prompt Text",
      ref: "gameStartPrompt",
      type: "text",
    },
    {
      label: "Banished Count",
      ref: "banished",
      type: "number",
      value: "0",
      min: "0",
      max: "50",
      showIf: ["closed"],
    },
    {
      label: "Talking Dead",
      ref: "talkingDead",
      value: false,
      type: "boolean",
    },
    {
      label: "Voting Dead",
      ref: "votingDead",
      value: false,
      type: "boolean",
    },
    {
      label: "Maority Voting",
      ref: "majorityVoting",
      value: false,
      type: "boolean",
    },
    {
      label: "Hidden Conversions",
      ref: "hiddenConverts",
      value: false,
      type: "boolean",
    },
    {
      label: "Role Sharing",
      ref: "RoleShare",
      value: false,
      type: "boolean",
    },
    {
      label: "Alignment Sharing",
      ref: "AlignmentShare",
      value: false,
      type: "boolean",
    },
    {
      label: "Private Role Revealing",
      ref: "PrivateShare",
      value: false,
      type: "boolean",
    },
    {
      label: "Public Role Revealing",
      ref: "PublicShare",
      value: false,
      type: "boolean",
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
      value: "6",
      min: "2",
      max: "8",
    },
    {
      label: "Force Must Act",
      ref: "ForceMustAct",
      value: true,
      type: "boolean",
    },
    {
      label: "Game End Event",
      ref: "GameEndEvent",
      type: "select",
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
        mustCondemn: formFields[7].value,
        noReveal: formFields[8].value,
        alignmentReveal: formFields[9].value,
        votesInvisible: formFields[10].value,
        unique: formFields[12].value,
        uniqueWithoutModifier: formFields[13].value,
        useRoleGroups: roleData.useRoleGroups,
        roleGroupSizes: roleData.roleGroupSizes,
        count: {
          Village: Number(formFields[15].value),
          Mafia: Number(formFields[16].value),
          Cult: Number(formFields[17].value),
          Independent: Number(formFields[18].value),
        },
        gameStartPrompt: formFields[19].value,
        banished: Number(formFields[20].value),
        talkingDead: formFields[21].value,
        votingDead: formFields[22].value,
        majorityVoting: formFields[23].value,
        hiddenConverts: formFields[24].value,
        RoleShare: formFields[25].value,
        AlignmentShare: formFields[26].value,
        PrivateShare: formFields[27].value,
        PublicShare: formFields[28].value,
        EventsPerNight: formFields[29].value,
        noDeathLimit: formFields[30].value,
        ForceMustAct: formFields[31].value,
        GameEndEvent: formFields[32].value,
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
