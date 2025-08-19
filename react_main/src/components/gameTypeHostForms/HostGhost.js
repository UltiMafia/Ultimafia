import axios from "axios";

import { getDefaults, persistDefaults } from "./DefaultValues";
import { Lobbies } from "Constants";

export default function HostGhost() {
  const gameType = "Ghost";
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
      label: "Configure Words",
      ref: "configureWords",
      type: "boolean",
      value: defaults.configureWords,
    },
    {
      label: "Word Length",
      ref: "wordLength",
      type: "number",
      value: defaults.wordLength,
      min: 3,
      max: 10,
      showIf: "configureWords",
    },
    {
      label: "Town Word",
      ref: "townWord",
      type: "text",
      showIf: "configureWords",
    },
    {
      label: "Fool Word",
      ref: "foolWord",
      type: "text",
      showIf: "configureWords",
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
      label: "Night Length (minutes)",
      ref: "nightLength",
      type: "number",
      showIf: "configureDuration",
      value: defaults.nightLength,
      min: 0.5,
      max: 1,
      step: 0.5,
    },
    {
      label: "Give Clue Length (minutes)",
      ref: "giveClueLength",
      type: "number",
      showIf: "configureDuration",
      value: defaults.giveClueLength,
      min: 1,
      max: 2,
      step: 0.5,
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
    {
      label: "Guess Word Length (minutes)",
      ref: "guessWordLength",
      type: "number",
      showIf: "configureDuration",
      value: defaults.guessWordLength,
      min: 1,
      max: 3,
      step: 0.5,
    },
  ];

  function onHostGame(setupId, getFormFieldValue) {
    var scheduled = getFormFieldValue("scheduled");

    if (setupId) {
      const hostPromise = axios.post("/api/game/host", {
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
          Night: getFormFieldValue("nightLength"),
          "Give Clue": getFormFieldValue("giveClueLength"),
          Day: getFormFieldValue("dayLength"),
          "Guess Word": getFormFieldValue("guessWordLength"),
        },
        wordOptions: {
          configureWords: getFormFieldValue("configureWords"),
          wordLength: getFormFieldValue("wordLength"),
          townWord: getFormFieldValue("townWord"),
          foolWord: getFormFieldValue("foolWord"),
        },
        anonymousGame: getFormFieldValue("anonymousGame"),
        anonymousDeckId: getFormFieldValue("anonymousDeckId"),
      });

      Object.keys(defaults).forEach(function (key) {
        const submittedValue = getFormFieldValue(key);
        if (submittedValue) {
          defaults[key] = submittedValue;
        }
      });
      persistDefaults(gameType, defaults);
      return hostPromise;
    } else {
      return null;
    }
  }

  return [initialFormFields, onHostGame];
}
