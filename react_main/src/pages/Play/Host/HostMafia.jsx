import React, { useState, useEffect } from "react";
import { Redirect } from "react-router-dom";
import axios from "axios";

import HostBrowser from "./HostBrowser";
import { getDefaults, persistDefaults } from "./HostDefaults";
import { useForm } from "../../../components/Form";
import { useErrorAlert } from "../../../components/Alerts";
import { Lobbies } from "../../../Constants";

import "css/host.css";

export default function HostMafia() {
  const gameType = "Mafia";
  const [selSetup, setSelSetup] = useState({});
  const [redirect, setRedirect] = useState(false);

  const defaults = getDefaults(gameType);

  const errorAlert = useErrorAlert();
  const [formFields, updateFormFields] = useForm([
    {
      label: "Setup",
      ref: "setup",
      type: "text",
      disabled: true,
    },
    {
      label: "Lobby",
      ref: "lobby",
      type: "select",
      value: localStorage.getItem("lobby") || "Main",
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
      showIf: ["!ranked", "!competitive"],
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
      showIf: ["!ranked", "!competitive"],
    },
    {
      label: "Ranked",
      ref: "ranked",
      type: "boolean",
      value: defaults.ranked,
      showIf: ["!private", "!guests", "!competitive"],
    },
    {
      label: "Competitive",
      ref: "competitive",
      type: "boolean",
      value: defaults.competitive,
      showIf: ["!private", "!guests", "!ranked"],
    },
    {
      label: "Spectating",
      ref: "spectating",
      type: "boolean",
      value: defaults.spectating,
    },
    {
      label: "Broadcast Closed Roles",
      ref: "broadcastClosedRoles",
      type: "boolean",
      value: defaults.broadcastClosedRoles,
    },
    // {
    //     label: "Scheduled",
    //     ref: "scheduled",
    //     value: defaults.scheduled,
    //     type: "boolean"
    // },
    // {
    //     label: "Start Date",
    //     ref: "startDate",
    //     type: "datetime-local",
    //     showIf: "scheduled",
    //     value: Date.now() + (6 * 60 * 1000),
    //     min: Date.now() + (6 * 60 * 1000),
    //     max: Date.now() + (4 * 7 * 24 * 60 * 60 * 1000)
    // },
    {
      label: "Ready Check",
      ref: "readyCheck",
      value: defaults.readyCheck,
      type: "boolean",
    },
    {
      label: "No Vegging",
      ref: "noVeg",
      value: defaults.noVeg,
      type: "boolean",
    },
    {
      label: "Configure Duration",
      ref: "configureDuration",
      type: "boolean",
      value: defaults.configureDuration,
    },
    {
      label: "Day Length (minutes)",
      ref: "dayLength",
      type: "number",
      showIf: "configureDuration",
      value: defaults.dayLength,
      min: 1,
      max: 30,
    },
    {
      label: "Night Length (minutes)",
      ref: "nightLength",
      type: "number",
      showIf: "configureDuration",
      value: defaults.nightLength,
      min: 1,
      max: 10,
    },
    {
      label: "Pregame Wait (hours)",
      ref: "pregameWaitLength",
      type: "number",
      showIf: "configureDuration",
      value: defaults.pregameWaitLength || 1,
      min: 1,
      max: 6,
    },
    {
      label: "Extension Length (minutes)",
      ref: "extendLength",
      type: "number",
      showIf: "configureDuration",
      value: defaults.extendLength,
      min: 0,
      max: 5,
    },
  ]);

  useEffect(() => {
    document.title = "Host Mafia | UltiMafia";
  }, []);

  function onHostGame() {
    // var scheduled = getFormFieldValue("scheduled");
    var lobby = getFormFieldValue("lobby");

    if (lobby === "All") lobby = "Main";

    if (selSetup.id) {
      axios
        .post("/game/host", {
          gameType,
          lobby,
          setup: selSetup.id,
          lobbyName: getFormFieldValue("lobbyName"),
          private: getFormFieldValue("private"),
          guests: getFormFieldValue("guests"),
          ranked: getFormFieldValue("ranked"),
          competitive: getFormFieldValue("competitive"),
          spectating: getFormFieldValue("spectating"),
          // scheduled: scheduled && (new Date(getFormFieldValue("startDate"))).getTime(),
          readyCheck: getFormFieldValue("readyCheck"),
          noVeg: getFormFieldValue("noVeg"),
          stateLengths: {
            Day: getFormFieldValue("dayLength"),
            Night: getFormFieldValue("nightLength"),
          },
          pregameWaitLength: getFormFieldValue("pregameWaitLength"),
          extendLength: getFormFieldValue("extendLength"),
          anonymousGame: getFormFieldValue("anonymousGame"),
          anonymousDeckId: getFormFieldValue("anonymousDeckId"),
          broadcastClosedRoles: getFormFieldValue("broadcastClosedRoles"),
        })
        .then((res) => {
          // if (scheduled) {
          //     siteInfo.showAlert(`Game scheduled.`, "success");
          //     setRedirect("/");
          // }
          // else
          setRedirect(`/game/${res.data}`);
        })
        .catch(errorAlert);

      defaults.private = getFormFieldValue("private");
      defaults.guests = getFormFieldValue("guests");
      defaults.ranked = getFormFieldValue("ranked");
      defaults.competitive = getFormFieldValue("competitive");
      defaults.spectating = getFormFieldValue("spectating");
      defaults.readyCheck = getFormFieldValue("readyCheck");
      defaults.noVeg = getFormFieldValue("noVeg");
      defaults.dayLength = getFormFieldValue("dayLength");
      defaults.nightLength = getFormFieldValue("nightLength");
      defaults.pregameWaitLength = getFormFieldValue("pregameWaitLength");
      defaults.extendLength = getFormFieldValue("extendLength");
      defaults.anonymousGame = getFormFieldValue("anonymousGame");
      defaults.anonymousDeckId = getFormFieldValue("anonymousDeckId");
      defaults.broadcastClosedRoles = getFormFieldValue("broadcastClosedRoles");
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
