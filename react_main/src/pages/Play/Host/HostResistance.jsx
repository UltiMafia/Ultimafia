import React, { useState, useEffect, useContext } from "react";
import { Redirect } from "react-router-dom";
import axios from "axios";

import Host from "./Host";
import { useForm } from "../../../components/Form";
import { useErrorAlert } from "../../../components/Alerts";
import { SiteInfoContext } from "../../../Contexts";
import { Lobbies, PreferredDeckId } from "../../../Constants";

import "../../../css/host.css";

export default function HostResistance() {
  const gameType = "Resistance";
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

  let defaultLobby = localStorage.getItem("lobby");
  if (
    defaultLobby == "All" ||
    defaultLobby == "Mafia" ||
    defaultLobby == "Competitive"
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
      label: "Lobby",
      ref: "lobby",
      type: "select",
      value: defaultLobby,
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
      label: "Team Selection Length (minutes)",
      ref: "teamSelLength",
      type: "number",
      value: 2,
      min: 1,
      max: 5,
    },
    {
      label: "Team Approval Length (minutes)",
      ref: "teamApprovalLength",
      type: "number",
      value: 0.5,
      min: 0.1,
      max: 2,
      step: 0.1,
    },
    {
      label: "Mission Length (minutes)",
      ref: "missionLength",
      type: "number",
      value: 0.5,
      min: 0.1,
      max: 1,
      step: 0.1,
    },
  ]);

  useEffect(() => {
    document.title = "Host Resistance | UltiMafia";
  }, []);

  function onHostGame() {
    var scheduled = formFields[6].value;

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
            "Team Selection": getFormFieldValue("teamSelLength"),
            "Team Approval": getFormFieldValue("teamApprovalLength"),
            Mission: getFormFieldValue("missionLength"),
          },
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
