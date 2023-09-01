import React, { useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

import CreateSetup from "./CreateSetup";
import { SiteInfoContext } from "../../../Contexts";
import { useForm } from "../../../components/Form";
import { useErrorAlert } from "../../../components/Alerts";

export default function CreateAshbrookSetup() {
  const gameType = "Ashbrook";
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
    /*{
      label: "Whispers",
      ref: "whispers",
      type: "boolean",
    },*/
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
      label: "Unique Roles",
      ref: "unique",
      type: "boolean",
      showIf: "closed",
      value: "true",
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
      label: "Villager Count",
      ref: "count-Villager",
      type: "number",
      value: "3",
      min: "1",
      max: "19",
      showIf: ["!useRoleGroups"],
    },
    {
      label: "Outcast Count",
      ref: "count-Outcast",
      type: "number",
      value: "1",
      min: "0",
      max: "18",
      showIf: ["!useRoleGroups"],
    },
    {
      label: "Follower Count",
      ref: "count-Follower",
      type: "number",
      value: "1",
      min: "0",
      max: "18",
      showIf: ["!useRoleGroups"],
    },
    {
      label: "Leader Count",
      ref: "count-Leader",
      type: "number",
      value: "1",
      min: "1",
      max: "1",
      showIf: ["!useRoleGroups"],
    },
  ]);

  const formFieldValueMods = {
    startState: [(value) => value == "Day"],
  };

  const siteInfo = useContext(SiteInfoContext);

    useEffect(() => {
      document.title = "Create Ashbrook Setup | UltiMafia";
    }, []);

    function onCreateSetup(roleData, editing, setRedirect) {
      axios
        .post("/setup/create", {
          gameType: gameType,
          roles: roleData.roles,
          closed: true,
          name: formFields[0].value,
          startState: formFields[1].value ? "Day" : "Night",
          dawn: formFields[2].value,
          whispers: true,
          leakPercentage: 0,
          mustAct: formFields[3].value,
          noReveal: true,
          votesInvisible: formFields[4].value,
          unique: formFields[5].value,
          uniqueWithoutModifier: formFields[6].value,
          useRoleGroups: roleData.useRoleGroups,
          roleGroupSizes: roleData.roleGroupSizes,
          count: {
            Villager: Number(formFields[8].value),
            Outcast: Number(formFields[9].value),
            Follower: Number(formFields[10].value),
            Leader: Number(formFields[11].value),
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
        closedField={{value : true}}
        useRoleGroupsField={formFields[7]}
        formFieldValueMods={formFieldValueMods}
        onCreateSetup={onCreateSetup}
      />
    );
  }
