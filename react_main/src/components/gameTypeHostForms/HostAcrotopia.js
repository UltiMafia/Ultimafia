import axios from "axios";

import { getDefaults, persistDefaults } from "./DefaultValues";
import { Lobbies } from "Constants";

export default function HostAcrotopia() {
  const gameType = "Acrotopia";
  const defaults = getDefaults(gameType);

  const initialFormFields = [
    {
      label: "Round Amount",
      ref: "roundAmt",
      type: "number",
      value: defaults.roundAmt,
      min: 3,
      max: 10,
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
      value: 2,
      min: 1,
      max: 5,
      step: 1,
    },
    {
      label: "Day Length (minutes)",
      ref: "dayLength",
      type: "number",
      showIf: "configureDuration",
      value: 5,
      min: 2,
      max: 5,
      step: 1,
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
            Night: getFormFieldValue("nightLength"),
            Day: getFormFieldValue("dayLength"),
          },
          roundAmt: getFormFieldValue("roundAmt"),
          acronymSize: getFormFieldValue("acronymSize"),
          enablePunctuation: getFormFieldValue("enablePunctuation"),
          standardiseCapitalisation: getFormFieldValue(
            "standardiseCapitalisation"
          ),
          turnOnCaps: getFormFieldValue("turnOnCaps"),
          anonymousGame: getFormFieldValue("anonymousGame"),
          anonymousDeckId: getFormFieldValue("anonymousDeckId"),
        });

      defaults.private = getFormFieldValue("private");
      defaults.guests = getFormFieldValue("guests");
      defaults.spectating = getFormFieldValue("spectating");
      defaults.readyCheck = getFormFieldValue("readyCheck");
      defaults.anonymousGame = getFormFieldValue("anonymousGame");
      defaults.anonymousDeckId = getFormFieldValue("anonymousDeckId");
      defaults.roundAmt = getFormFieldValue("roundAmt");
      defaults.acronymSize = getFormFieldValue("acronymSize");
      defaults.enablePunctuation = getFormFieldValue("enablePunctuation");
      defaults.standardiseCapitalisation = getFormFieldValue(
        "standardiseCapitalisation"
      );
      defaults.turnOnCaps = getFormFieldValue("turnOnCaps");
      persistDefaults(gameType, defaults);
      return hostPromise;
    }
    else {
      return null;
    }
  }

  return [initialFormFields, onHostGame];
}
