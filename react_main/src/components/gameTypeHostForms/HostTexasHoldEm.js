import axios from "axios";

import { getDefaults, persistDefaults } from "./DefaultValues";
import { Lobbies } from "Constants";

export default function HostTexasHoldEm() {
  const gameType = "Texas Hold Em";
  const defaults = getDefaults(gameType);

  let defaultLobby = localStorage.getItem("lobby");
  if (
    defaultLobby === "All" ||
    defaultLobby === "Main" ||
    defaultLobby === "Competitive"
  ) {
    defaultLobby = "Games";
  }

  const initialFormFields = [
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
      label: "Max Rounds",
      ref: "MaxRounds",
      type: "number",
      value: defaults.MaxRounds,
      min: 0,
      max: 25,
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
  ];

  function onHostGame(setupId, getFormFieldValue) {
    var scheduled = getFormFieldValue("scheduled");

    if (setupId) {
      const hostPromise = axios
        .post("/api/game/host", {
          gameType: gameType,
          setup: setupId,
          lobby: getFormFieldValue("lobby"),
          lobbyName: getFormFieldValue("lobbyName"),
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
          MaxRounds: getFormFieldValue("MaxRounds"),
          anonymousGame: getFormFieldValue("anonymousGame"),
          anonymousDeckId: getFormFieldValue("anonymousDeckId"),
        });

      defaults.private = getFormFieldValue("private");
      defaults.guests = getFormFieldValue("guests");
      defaults.spectating = getFormFieldValue("spectating");
      defaults.readyCheck = getFormFieldValue("readyCheck");
      defaults.anonymousGame = getFormFieldValue("anonymousGame");
      defaults.anonymousDeckId = getFormFieldValue("anonymousDeckId");
      persistDefaults(gameType, defaults);
      return hostPromise;
    }
    else {
      return null;
    }
  }

  return [initialFormFields, onHostGame];
}
