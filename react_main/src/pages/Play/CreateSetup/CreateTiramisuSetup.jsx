import React, { useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

import CreateSetup from "./CreateSetup";
import { SiteInfoContext } from "../../../Contexts";
import { useForm } from "../../../components/Form";
import { useErrorAlert } from "../../../components/Alerts";

export default function CreateTiramisuSetup() {
  const gameType = "Tiramisu";
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
      label: "Chef Number",
      ref: "chefNumber",
      type: "number",
      value: "1",
      min: "1",
      max: "50",
    },
    {
      label: "Anonymous Chef",
      ref: "anonChef",
      type: "boolean",
    },
    {
      label: "Random Chef Order",
      ref: "randChefOrder",
      type: "boolean",
    },
  ]);
  const formFieldValueMods = {};

  const siteInfo = useContext(SiteInfoContext);

  useEffect(() => {
    document.title = "Create Tiramisu Setup | UltiMafia";
  }, []);

  function onCreateSetup(roleData, editing, setRedirect) {
    axios
      .post("/setup/create", {
        gameType: gameType,
        roles: roleData.roles,
        name: formFields[0].value,
        chefNumber: Number(formFields[1].value),
        anonChef: formFields[2].value,
        randChefOrder: formFields[3].value,
        startState: "Night",
        whispers: false,
        noReveal: true,
        leakPercentage: 100,
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
      closedField={{ value: false }}
      formFieldValueMods={formFieldValueMods}
      onCreateSetup={onCreateSetup}
    />
  );
}
