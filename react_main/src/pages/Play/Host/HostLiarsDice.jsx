import React, { useState, useEffect, useContext } from "react";
import { Redirect } from "react-router-dom";
import axios from "axios";

import HostBrowser from "./HostBrowser";
import { getDefaults, persistDefaults } from "./HostDefaults";
import { useForm } from "../../../components/Form";
import { useErrorAlert } from "../../../components/Alerts";
import { SiteInfoContext } from "../../../Contexts";
import { Lobbies } from "../../../Constants";

import "css/host.css";

export default function HostLiarsDice() {
  const gameType = "Liars Dice";
  const [selSetup, setSelSetup] = useState({});
  const [redirect, setRedirect] = useState(false);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();

  const defaults = getDefaults(gameType);

  let defaultLobby = localStorage.getItem("lobby");
  if (
    defaultLobby === "All" ||
    defaultLobby === "Main" ||
    defaultLobby === "Competitive"
  ) {
    defaultLobby = "Games";
  }
  const [formFields, updateFormFields] = useForm([
    {
      label: "Setup",
      ref: "setup",
      type: "text",
      disabled: true,
    },
    {
      label: "Wild Ones",
      ref: "wildOnes",
      type: "boolean",
      value: defaults.wildOnes,
    },
    {
      label: "Spot On",
      ref: "spotOn",
      type: "boolean",
      value: defaults.spotOn,
    },
    {
      label: "Starting Dice",
      ref: "startingDice",
      type: "number",
      value: defaults.startingDice,
      min: 1,
      max: 20,
    },
    {
      label: "Lobby",
      ref: "lobby",
      type: "select",
      value: defaultLobby,
      options: Lobbies.map((lobby) => ({ label: lobby, value: lobby })),
    },
    {
      label: "Lobby Name",
      ref: "lobbyName",
      type: "text",
      value: defaults.lobbyName,
    },
    {
      label: "Private",
      ref: "private",
      type: "boolean",
      value: defaults.private,
    },
    {
      label: "Anonymous Game",
      ref: "anonymousGame",
      type: "boolean",
      value: defaults.anonymousGame,
    },
    {
      label: "Deck ID",
      ref: "anonymousDeckId",
      type: "text",
      value: defaults.anonymousDeckId,
      showIf: "anonymousGame",
    },
    {
      label: "Allow Guests",
      ref: "guests",
      type: "boolean",
      value: defaults.guests,
    },
    {
      label: "Spectating",
      ref: "spectating",
      type: "boolean",
      value: defaults.spectating,
    },
    {
      label: "Scheduled",
      ref: "scheduled",
      type: "boolean",
    },
    {
      label: "Ready Check",
      ref: "readyCheck",
      type: "boolean",
      value: defaults.readyCheck,
    },
    {
      label: "Start Date",
      ref: "startDate",
      type: "datetime-local",
      showIf: "scheduled",
      value: Date.now() + 6 * 60 * 1000,
      min: Date.now() + 6 * 60 * 1000,
      max: Date.now() + 4 * 7 * 24 * 60 * 60 * 1000,
    },
    {
      label: "Configure Duration",
      ref: "configureDuration",
      type: "boolean",
      value: defaults.configureDuration,
    },
    {
      label: "Guess Dice Length (minutes)",
      ref: "guessDiceLength",
      type: "number",
      showIf: "configureDuration",
      value: defaults.guessDiceLength,
      min: 0.5,
      max: 5,
      step: 0.5,
    },
  ]);

  useEffect(() => {
    document.title = "Host Liars Dice | UltiMafia";
  }, []);

  function onHostGame() {
    var scheduled = getFormFieldValue("scheduled");

    if (selSetup.id) {
      axios
        .post("/api/game/host", {
          gameType: gameType,
          setup: selSetup.id,
          lobby: getFormFieldValue("lobby"),
          lobbyName: getFormFieldValue("lobbyName"),
          private: getFormFieldValue("private"),
          guests: getFormFieldValue("guests"),
          spectating: getFormFieldValue("spectating"),
          scheduled:
            scheduled && new Date(getFormFieldValue("startDate")).getTime(),
          readyCheck: getFormFieldValue("readyCheck"),
          stateLengths: {
            "Guess Dice": getFormFieldValue("guessDiceLength"),
          },
          wildOnes: getFormFieldValue("wildOnes"),
          spotOn: getFormFieldValue("spotOn"),
          startingDice: getFormFieldValue("startingDice"),
          anonymousGame: getFormFieldValue("anonymousGame"),
          anonymousDeckId: getFormFieldValue("anonymousDeckId"),
        })
        .then((res) => {
          if (scheduled) {
            siteInfo.showAlert(`Game scheduled.`, "success");
            setRedirect("/");
          } else setRedirect(`/game/${res.data}`);
        })
        .catch(errorAlert);

      Object.keys(defaults).forEach(function (key) {
        const submittedValue = getFormFieldValue(key);
        if (submittedValue) {
          defaults[key] = submittedValue;
        }
      });
      persistDefaults(gameType, defaults);
    } else errorAlert("You must choose a setup");
  }

  function getFormFieldValue(ref) {
    for (let field of formFields) if (field.ref === ref) return field.value;
  }

  if (redirect) return <Redirect to={redirect} />;

  return (
    <HostBrowser
      gameType={gameType}
      selSetup={selSetup}
      setSelSetup={setSelSetup}
      formFields={formFields}
      updateFormFields={updateFormFields}
      onHostGame={onHostGame}
    />
  );
}
