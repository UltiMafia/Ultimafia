import React, { useContext, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

import CreateBrowser from "./CreateBrowser";
import { SiteInfoContext } from "../../../Contexts";
import { useForm } from "../../../components/Form";
import { useErrorAlert } from "../../../components/Alerts";

export default function CreateConnectFourSetup() {
  const gameType = "Connect Four";
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const errorAlert = useErrorAlert();
  const isMountedRef = useRef(true);
  const [formFields, updateFormFields, resetFormFields] = useForm([
    {
      label: "Setup Name",
      ref: "name",
      type: "text",
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
  ]);
  const formFieldValueMods = {};

  const siteInfo = useContext(SiteInfoContext);

  useEffect(() => {
    document.title = "Create Connect Four Setup | UltiMafia";
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  function onCreateSetup(roleData, editing, setRedirect, gameSettings) {
    axios
      .post("/api/setup/create", {
        gameType: gameType,
        roles: roleData.roles,
        gameSettings: gameSettings,
        name: formFields[0].value,
        startState: "Turn",
        whispers: formFields[1].value,
        leakPercentage: Number(formFields[2].value),
        noReveal: true,
        editing: editing,
        id: params.get("edit"),
      })
      .then((res) => {
        if (isMountedRef.current) {
          siteInfo.showAlert(
            `${editing ? "Edited" : "Created"} setup '${formFields[0].value}'`,
            "success"
          );
          setRedirect(res.data);
        }
      })
      .catch((err) => {
        if (isMountedRef.current) {
          errorAlert(err);
        }
      });
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
