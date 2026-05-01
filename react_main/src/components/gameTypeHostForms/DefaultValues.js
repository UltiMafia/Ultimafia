import { PreferredDeckId } from "Constants";

function getStorageKey(gameType) {
  return `${gameType.toLowerCase()} persisted options`;
}

// increment a number here to force people's hosting preferences to be reset one time only for that game type
const HOST_OPTIONS_VERSIONS = {
  Mafia: 4,
  Acrotopia: 2,
  Jotto: 2,
  "Liars Dice": 2,
  Battlesnakes: 2,
  "Texas Hold Em": 3,
  Resistance: 2,
  "Secret Dictator": 2,
  "Wacky Words": 2,
  "Draw It": 2,
  Cheat: 2,
  Ratscrew: 2,
  "Connect Four": 2,
  "Spot It": 1,
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

const existingLobby = localStorage.getItem("lobby");
const defaultLobby =
  !existingLobby || existingLobby === "All" ? "Main" : existingLobby;

// These options are common to all
const isDev = import.meta.env.REACT_APP_ENVIRONMENT === "development";

const commonHostOptions = {
  private: false,
  guests: false,
  spectating: true,
  readyCheck: !isDev,
  configureDuration: false,
  anonymousGame: false,
  anonymousDeckId: PreferredDeckId,
  lobby: defaultLobby,
  lobbyName: "",
};

var defaultOptions = {
  Mafia: existingHostOptions["Mafia"] || {
    ...commonHostOptions,
    ranked: false,
    competitive: false,
    advancedHosting: false,
    noVeg: false,
    pregameWaitLength: 1,
    extendLength: 3,
    dayLength: 10,
    nightLength: 2,
  },
  Acrotopia: existingHostOptions["Acrotopia"] || {
    ...commonHostOptions,
    lobby: "Games",
    roundAmt: 5,
    acronymSize: 5,
    enablePunctuation: true,
    standardiseCapitalisation: true,
    turnOnCaps: true,
  },
  Jotto: existingHostOptions["Jotto"] || {
    ...commonHostOptions,
    wordLength: 5,
    duplicateLetters: false,
    competitiveMode: false,
    forbiddenMode: false,
    winOnAnagrams: true,
    numAnagramsRequired: 3,
    selectWordLength: 1,
    guessWordLength: 1,
  },
  "Liars Dice": existingHostOptions["Liars Dice"] || {
    ...commonHostOptions,
    lobby: "Games",
    startingDice: 5,
    wildOnes: true,
    spotOn: true,
    guessDiceLength: 2,
  },
  "Texas Hold Em": existingHostOptions["Texas Hold Em"] || {
    ...commonHostOptions,
    startingChips: 150,
    minimumBet: 2,
    MaxRounds: 0,
    placeBetsLength: 2,
    showdownLength: 5,
  },
  Cheat: existingHostOptions["Cheat"] || {
    ...commonHostOptions,
    MaxRounds: 0,
    placeBetsLength: 2,
    showdownLength: 2,
    playCardsLength: 2,
    callLieLength: 2,
  },
  Ratscrew: existingHostOptions["Ratscrew"] || {
    ...commonHostOptions,
    MaxRounds: 0,
    playCardsLength: 2,
    sumToTen: false,
    marriageRule: false,
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
    isRankedChoice: false,
    votesToPoints: false,
  },
  "Draw It": existingHostOptions["Draw It"] || {
    ...commonHostOptions,
    lobby: "Games",
    roundAmt: 3,
    wordDeckId: "default",
    drawLength: 60,
  },
  Battlesnakes: existingHostOptions["Battlesnakes"] || {
    ...commonHostOptions,
    boardSize: 20,
    deadSnakeObstacles: true,
    ifWallsAreTransparent: true,
    dayLength: 60,
    nightLength: 0.5,
  },
  "Dice Wars": existingHostOptions["Dice Wars"] ||
    existingHostOptions["DiceWars"] || {
      ...commonHostOptions,
      mapSize: 30,
      maxDice: 8,
      playLength: 30,
    },
  "Connect Four": existingHostOptions["Connect Four"] || {
    ...commonHostOptions,
    boardX: 6,
    boardY: 7,
    turnLength: 1,
  },
  "Spot It": existingHostOptions["Spot It"] || {
    ...commonHostOptions,
    roundLength: 55,
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

export function sortInitialFormFields(initialFormFields) {
  const order = {
    lobby: 0,
    lobbyName: 1,
    private: 2,
    guests: 3,
    spectating: 4,
    readyCheck: 5,
    scheduled: 6,
    startDate: 7,
    configureDuration: Number.MAX_VALUE - 100,
    dayLength: Number.MAX_VALUE - 99,
    nightLength: Number.MAX_VALUE - 98,
    pregameWaitLength: Number.MAX_VALUE - 97,
    extendLength: Number.MAX_VALUE - 96,
  };

  initialFormFields.sort(function (a, b) {
    const aOrder = order[a.ref] !== undefined ? order[a.ref] : Number.MAX_VALUE - 500;
    const bOrder = order[b.ref] !== undefined ? order[b.ref] : Number.MAX_VALUE - 500;
    return aOrder - bOrder;
  });
}
