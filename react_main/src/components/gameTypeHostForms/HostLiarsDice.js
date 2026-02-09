import axios from "axios";

import { getDefaults, persistDefaults, sortInitialFormFields } from "./DefaultValues";
import { Lobbies } from "Constants";

export default function HostLiarsDice() {
  const gameType = "Liars Dice";
  const defaults = getDefaults(gameType);

  const initialFormFields = [
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
      label: "Guess Dice Length (minutes)",
      ref: "guessDiceLength",
      type: "number",
      showIf: "configureDuration",
      value: defaults.guessDiceLength,
      min: 0.5,
      max: 5,
      step: 0.5,
    },
  ];

  sortInitialFormFields(initialFormFields);

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
          "Guess Dice": getFormFieldValue("guessDiceLength"),
        },
        wildOnes: getFormFieldValue("wildOnes"),
        spotOn: getFormFieldValue("spotOn"),
        startingDice: getFormFieldValue("startingDice"),
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
