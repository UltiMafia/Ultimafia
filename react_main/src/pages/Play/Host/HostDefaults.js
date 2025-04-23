import { PreferredDeckId } from "../../../Constants";

function getStorageKey(gameType) {
  return `${gameType.toLowerCase()} persisted options`;
}

// increment a number here to force people's hosting preferences to be reset one time only for that game type
const HOST_OPTIONS_VERSIONS = {
  Mafia: 1,
  Acrotopia: 1,
  Ghost: 1,
  Jotto: 1,
  "Liars Dice": 1,
  "Card Games": 1,
  Resistance: 1,
  "Secret Dictator": 1,
  "Wacky Words": 1,
};

// Associate all of the existing saved options per game type into a map
var existingHostOptions = {};
Object.keys(HOST_OPTIONS_VERSIONS).forEach(function (gameType) {
  const storageKey = getStorageKey(gameType);
  const _existingHostOptions = JSON.parse(
    localStorage.getItem(storageKey) || null
  );

  // If the version doesn't match, delete the item from storage and null it out in the map
  if (
    _existingHostOptions &&
    _existingHostOptions.hostOptionsVersion !== HOST_OPTIONS_VERSIONS[gameType]
  ) {
    localStorage.removeItem(storageKey);
    existingHostOptions[gameType] = null;
  } else {
    existingHostOptions[gameType] = _existingHostOptions;
  }
});

// These options are common to all
const commonHostOptions = {
  private: false,
  guests: false,
  spectating: true,
  readyCheck: false,
  configureDuration: false,
  anonymousGame: false,
  anonymousDeckId: PreferredDeckId,
};

var defaultOptions = {
  Mafia: existingHostOptions["Mafia"] || {
    ...commonHostOptions,
    ranked: false,
    competitive: false,
    broadcastClosedRoles: false,
    noVeg: false,
    pregameWaitLength: 1,
    extendLength: 3,
    dayLength: 10,
    nightLength: 2,
  },
  Acrotopia: existingHostOptions["Acrotopia"] || {
    ...commonHostOptions,
    roundAmt: 5,
    acronymSize: 5,
    enablePunctuation: true,
    standardiseCapitalisation: true,
    turnOnCaps: true,
  },
  Ghost: existingHostOptions["Ghost"] || {
    ...commonHostOptions,
    configureWords: false,
    wordLength: 5,
    guessWordLength: 2,
    giveClueLength: 2,
    dayLength: 5,
    nightLength: 0.5,
  },
  Jotto: existingHostOptions["Jotto"] || {
    ...commonHostOptions,
    wordLength: 5,
    duplicateLetters: false,
    competitiveMode: false,
    winOnAnagrams: true,
    numAnagramsRequired: 3,
    selectWordLength: 1,
    guessWordLength: 1,
  },
  "Liars Dice": existingHostOptions["Liars Dice"] || {
    ...commonHostOptions,
    startingDice: 5,
    wildOnes: true,
    spotOn: false,
    guessDiceLength: 2,
  },
  "Card Games": existingHostOptions["Card Games"] || {
    ...commonHostOptions,
    startingChips: 6,
    minimumBet: 2,
    placeBetsLength: 2,
    showdownLength: 2,
  },
  Resistance: existingHostOptions["Resistance"] || {
    ...commonHostOptions,
    teamSelLength: 2,
    teamApprovalLength: 0.5,
    missionLength: 0.5,
  },
  "Secret Dictator": existingHostOptions["Secret Dictator"] || {
    ...commonHostOptions,
    nominationLength: 1,
    electionLength: 2,
    legislativeSessionLength: 2,
    executiveActionLength: 1,
    specialNominationLength: 1,
  },
  "Wacky Words": existingHostOptions["Wacky Words"] || {
    ...commonHostOptions,
    roundAmt: 5,
    acronymSize: 5,
    enablePunctuation: true,
    standardiseCapitalisation: true,
    turnOnCaps: true,
    dayLength: 5,
    nightLength: 2,
  },
};

export function getDefaults(gameType) {
  const defaults = defaultOptions[gameType];
  if (defaults) {
    return defaults;
  } else {
    console.error(
      `Could not find default options for: ${gameType}. Please report this error.`
    );
    return null;
  }
}

export function persistDefaults(gameType, defaults) {
  const storageKey = getStorageKey(gameType);
  defaults.hostOptionsVersion = HOST_OPTIONS_VERSIONS[gameType];
  localStorage.setItem(storageKey, JSON.stringify(defaults));
}
