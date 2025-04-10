import React, { useState, useEffect, useContext } from "react";
import { Redirect } from "react-router-dom";
import axios from "axios";

import HostBrowser from "./HostBrowser";
import getDefaults from "./HostDefaults";
import { useForm } from "../../../components/Form";
import { useErrorAlert } from "../../../components/Alerts";
import { SiteInfoContext } from "../../../Contexts";
import { Lobbies } from "../../../Constants";

import "../../../css/host.css";

export default function HostCardGames() {
  const gameType = "Card Games";
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
      label: "Minimum Bet",
      ref: "minimumBet",
      type: "number",
      value: defaults.minimumBet,
      min: 2,
      max: 20,
    },
    {
      label: "Starting Chips",
      ref: "startingChips",
      type: "number",
      value: defaults.startingChips,
      min: 5,
      max: 500,
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
      label: "Place Bets (minutes)",
      ref: "placeBetsLength",
      type: "number",
      showIf: "configureDuration",
      value: defaults.placeBetsLength,
      min: 0.5,
      max: 5,
      step: 0.5,
    },
    {
      label: "Showdown (minutes)",
      ref: "showdownLength",
      type: "number",
      showIf: "configureDuration",
      value: defaults.showdownLength,
      min: 0.5,
      max: 3,
      step: 0.5,
    },
  ]);

  useEffect(() => {
    document.title = "Host Card Games | UltiMafia";
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
          scheduled:
            scheduled && new Date(getFormFieldValue("startDate")).getTime(),
          readyCheck: getFormFieldValue("readyCheck"),
          stateLengths: {
            "Place Bets": getFormFieldValue("placeBetsLength"),
            Showdown: getFormFieldValue("showdownLength"),
          },
          startingChips: getFormFieldValue("startingChips"),
          minimumBet: getFormFieldValue("minimumBet"),
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
