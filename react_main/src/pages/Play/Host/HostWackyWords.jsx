import React, { useState, useEffect, useContext } from "react";
import { Redirect } from "react-router-dom";
import axios from "axios";

import HostBrowser from "./HostBrowser";
import { getDefaults, persistDefaults } from "./HostDefaults";
import { useForm } from "../../../components/Form";
import { useErrorAlert } from "../../../components/Alerts";
import { SiteInfoContext } from "../../../Contexts";
import { Lobbies, PreferredDeckId } from "../../../Constants";

import "css/host.css";

export default function HostWackyWords() {
  const gameType = "Wacky Words";
  const [selSetup, setSelSetup] = useState({});
  const [redirect, setRedirect] = useState(false);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();

  const defaults = getDefaults(gameType);

  const [formFields, updateFormFields] = useForm([
    {
      label: "Setup",
      ref: "setup",
      type: "text",
      disabled: true,
    },
    {
      label: "Round Amount",
      ref: "roundAmt",
      type: "number",
      value: defaults.roundAmt,
      min: 3,
      max: 15,
    },
    {
      label: "Acronym Size",
      ref: "acronymSize",
      type: "number",
      value: defaults.acronymSize,
      min: 3,
      max: 7,
    },
    {
      label: "Enable Punctuation",
      ref: "enablePunctuation",
      type: "boolean",
      value: defaults.enablePunctuation,
    },
    {
      label: "Standardise Capitalisation",
      ref: "standardiseCapitalisation",
      type: "boolean",
      value: defaults.standardiseCapitalisation,
    },
    {
      label: "Turn On Caps",
      ref: "turnOnCaps",
      type: "boolean",
      value: defaults.turnOnCaps,
      showIf: "standardiseCapitalisation",
    },
    {
      label: "Ranked Choice Voting",
      ref: "isRankedChoice",
      type: "boolean",
      value: defaults.isRankedChoice,
    },
    {
      label: "Votes into Points",
      ref: "votesToPoints",
      type: "boolean",
      value: defaults.votesToPoints,
    },
    {
      label: "Lobby",
      ref: "lobby",
      type: "select",
      value: "Games",
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
      label: "Night Length (minutes)",
      ref: "nightLength",
      type: "number",
      showIf: "configureDuration",
      value: defaults.nightLength,
      min: 1,
      max: 5,
      step: 1,
    },
    {
      label: "Day Length (minutes)",
      ref: "dayLength",
      type: "number",
      showIf: "configureDuration",
      value: defaults.dayLength,
      min: 2,
      max: 5,
      step: 1,
    },
  ]);

  useEffect(() => {
    document.title = "Host Wacky Words | UltiMafia";
  }, []);

  function onHostGame() {
    var scheduled = getFormFieldValue("scheduled");

    if (selSetup.id) {
      axios
        .post("/game/host", {
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
            Night: getFormFieldValue("nightLength"),
            Day: getFormFieldValue("dayLength"),
          },
          roundAmt: getFormFieldValue("roundAmt"),
          acronymSize: getFormFieldValue("acronymSize"),
          enablePunctuation: getFormFieldValue("enablePunctuation"),
          standardiseCapitalisation: getFormFieldValue(
            "standardiseCapitalisation"
          ),
          isRankedChoice: getFormFieldValue(
            "isRankedChoice"
          ),
          votesToPoints: getFormFieldValue(
            "votesToPoints"
          ),
          turnOnCaps: getFormFieldValue("turnOnCaps"),
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
