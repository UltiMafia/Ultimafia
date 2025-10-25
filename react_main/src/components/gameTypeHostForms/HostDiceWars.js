import axios from "axios";

import { getDefaults, persistDefaults } from "./DefaultValues";
import { Lobbies } from "Constants";

export default function HostDiceWars() {
  const gameType = "DiceWars";
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
      label: "Map Size (Number of Territories)",
      ref: "mapSize",
      type: "number",
      min: 15,
      max: 60,
      value: defaults.mapSize,
    },
    {
      label: "Max Dice Per Territory",
      ref: "maxDice",
      type: "select",
      value: defaults.maxDice,
      options: [
        { label: "4", value: 4 },
        { label: "8 (Standard)", value: 8 },
        { label: "16", value: 16 },
      ],
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
      min: Date.now(),
    },
    {
      label: "Play Length (minutes)",
      ref: "playLength",
      type: "number",
      min: 5,
      max: 60,
      value: defaults.playLength,
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
          Play: getFormFieldValue("playLength"),
        },
        mapSize: getFormFieldValue("mapSize"),
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

