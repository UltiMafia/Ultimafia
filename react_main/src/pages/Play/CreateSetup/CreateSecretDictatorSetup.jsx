import React, { useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

import CreateBrowser from "./CreateBrowser";
import { SiteInfoContext } from "../../../Contexts";
import { useForm } from "../../../components/Form";
import { useErrorAlert } from "../../../components/Alerts";

export default function CreateSecretDictatorSetup() {
  const gameType = "Secret Dictator";
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const errorAlert = useErrorAlert();
  const [formFields, updateFormFields, resetFormFields] = useForm([
    {
      label: "Setup Name",
      ref: "name",
      type: "text",
    },
  ]);
  const formFieldValueMods = {};

  const siteInfo = useContext(SiteInfoContext);

  useEffect(() => {
    document.title = "Create Secret Dictator Setup | UltiMafia";
  }, []);

  function onCreateSetup(roleData, editing, setRedirect) {
    axios
      .post("/setup/create", {
        gameType: gameType,
        roles: roleData.roles,
        name: formFields[0].value,
        startState: "Nomination",
        whispers: false,
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
