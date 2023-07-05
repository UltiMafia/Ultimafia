import React, { useState, useEffect, useContext } from "react";
import { Redirect } from "react-router-dom";
import axios from "axios";

import Host from "./Host";
import { useForm } from "../../../components/Form";
import { useErrorAlert } from "../../../components/Alerts";
import { SiteInfoContext } from "../../../Contexts";
import { Lobbies, PreferredDeckId } from "../../../Constants";

import "../../../css/host.css";

export default function HostJotto() {
  const gameType = "Jotto";
  const [selSetup, setSelSetup] = useState({});
  const [redirect, setRedirect] = useState(false);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();

  const defaults = JSON.parse(
    localStorage.getItem("otherHostOptions") || null
  ) || {
    private: false,
    guests: false,
    spectating: false,
    scheduled: false,
    readyCheck: false,
    anonymousGame: false,
    anonymousDeckId: PreferredDeckId,
  };

  const [formFields, updateFormFields] = useForm([
    {
      label: "Setup",
      ref: "setup",
      type: "text",
      disabled: true,
    },
    {
      label: "Word Length",
      ref: "wordLength",
      type: "number",
      value: 5,
      min: 4,
      max: 7,
    },
    {
      label: "Lobby",
      ref: "lobby",
      type: "select",
      value: "Games",
      options: Lobbies.map((lobby) => ({ label: lobby, value: lobby })),
    },
    {
      label: "Private",
      ref: "private",
      type: "boolean",
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
    },
    {
      label: "Spectating",
      ref: "spectating",
      type: "boolean",
    },
    // {
    //     label: "Voice Chat",
    //     ref: "voiceChat",
    //     type: "boolean"
    // },
    {
      label: "Scheduled",
      ref: "scheduled",
      type: "boolean",
    },
    {
      label: "Ready Check",
      ref: "readyCheck",
      type: "boolean",
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
    },
    {
      label: "Select Word Length (minutes)",
      ref: "selectWordLength",
      type: "number",
      showIf: "configureDuration",
      value: 1,
      min: 0.5,
      max: 5,
      step: 0.5,
    },
    {
      label: "Guess Word Length (minutes)",
      ref: "guessWordLength",
      type: "number",
      showIf: "configureDuration",
      value: 1,
      min: 0.5,
      max: 5,
      step: 0.5,
    },
  ]);

  useEffect(() => {
    document.title = "Host Jotto | UltiMafia";
  }, []);

  function onHostGame() {
    var scheduled = getFormFieldValue("scheduled");

    if (selSetup.id) {
      axios
        .post("/game/host", {
          gameType: gameType,
          setup: selSetup.id,
          lobby: getFormFieldValue("lobby"),
          private: getFormFieldValue("private"),
          guests: getFormFieldValue("guests"),
          spectating: getFormFieldValue("spectating"),
          // voiceChat: getFormFieldValue("voiceChat"),
          scheduled:
            scheduled && new Date(getFormFieldValue("startDate")).getTime(),
          readyCheck: getFormFieldValue("readyCheck"),
          stateLengths: {
            "Select Word": getFormFieldValue("selectWordLength"),
            "Guess Word": getFormFieldValue("guessWordLength"),
          },
          wordLength: getFormFieldValue("wordLength"),
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

      defaults.anonymousGame = getFormFieldValue("anonymousGame");
      defaults.anonymousDeckId = getFormFieldValue("anonymousDeckId");
      localStorage.setItem("otherHostOptions", JSON.stringify(defaults));
    } else errorAlert("You must choose a setup");
  }

  function getFormFieldValue(ref) {
    for (let field of formFields) if (field.ref == ref) return field.value;
  }

  if (redirect) return <Redirect to={redirect} />;

  return (
    <Host
      gameType={gameType}
      selSetup={selSetup}
      setSelSetup={setSelSetup}
      formFields={formFields}
      updateFormFields={updateFormFields}
      onHostGame={onHostGame}
    />
  );
}
