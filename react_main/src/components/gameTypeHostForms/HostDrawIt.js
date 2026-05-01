import axios from "axios";

import { getDefaults, persistDefaults, sortInitialFormFields } from "./DefaultValues";
import { Lobbies } from "Constants";

export default function HostDrawIt() {
  const gameType = "Draw It";
  const defaults = getDefaults(gameType);

  const initialFormFields = [
    {
      label: "Number of Rounds",
      ref: "roundAmt",
      type: "number",
      value: defaults.roundAmt,
      min: 1,
      max: 10,
    },
    {
      label: "Word Deck",
      ref: "wordDeckId",
      type: "wordDeckPicker",
      value: defaults.wordDeckId,
      placeholder: "Word deck id",
    },
    {
      label: "Draw Time (seconds)",
      ref: "drawLength",
      type: "select",
      value: defaults.drawLength,
      options: [
        { label: "30s", value: 30 },
        { label: "60s (default)", value: 60 },
        { label: "90s", value: 90 },
        { label: "120s", value: 120 },
        { label: "150s", value: 150 },
        { label: "180s", value: 180 },
        { label: "240s", value: 240 },
      ],
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
  ];

  sortInitialFormFields(initialFormFields);

  function onHostGame(setupId, getFormFieldValue) {
    var scheduled = getFormFieldValue("scheduled");

    if (setupId) {
      const drawSeconds = Number(getFormFieldValue("drawLength")) || 60;
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
          // Pick / Reveal are fixed lengths defined server-side.
          Draw: drawSeconds / 60, // engine state lengths are in minutes
        },
        roundAmt: Number(getFormFieldValue("roundAmt")) || 3,
        wordDeckId: getFormFieldValue("wordDeckId"),
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
