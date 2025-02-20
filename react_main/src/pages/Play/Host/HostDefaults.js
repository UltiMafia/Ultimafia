import { Lobbies, PreferredDeckId } from "../../../Constants";

const otherHostOptions = JSON.parse(
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

// Delete pre-existing incompatible settings
var existingMafiaHostOptions = JSON.parse(localStorage.getItem("mafiaHostOptions") || null);
if (existingMafiaHostOptions && existingMafiaHostOptions.stateLengths === undefined) {
    localStorage.removeItem("mafiaHostOptions");
    existingMafiaHostOptions = null;
}

var defaultOptions = {
    "Mafia": existingMafiaHostOptions || {
        ...otherHostOptions,
        ranked: false,
        competitive: false,
        broadcastClosedRoles: false,
        noVeg: false,
        pregameWaitLength: 1,
        extendLength: 3,
        stateLengths: {
            Day: 10,
            Night: 2,
        },
    },
    "Acrotopia": {
        ...otherHostOptions,
        roundAmt: 5,
        acronymSize: 5,
        enablePunctuation: true,
        standardiseCapitalisation: true,
        turnOnCaps: true,
    },
    "Ghost": {
        ...otherHostOptions,
        configureWords: false,
        wordLength: 5,
        guessWordLength: 2,
        giveClueLength: 2,
        stateLengths: {
            Day: 5,
            Night: .5,
        },
    },
    "Jotto": {
        ...otherHostOptions,
        wordLength: 5,
        duplicateLetters: false,
        competitiveMode: false,
        winOnAnagrams: true,
        numAnagramsRequired: 3,
        selectWordLength: 1,
        guessWordLength: 1,
    },
    "Liars Dice": {
        ...otherHostOptions,
        startingDice: 5,
        wildOnes: true,
        spotOn: false,
        guessDiceLength: 2,
    },
    "Resistance": {
        ...otherHostOptions,
        teamSelLength: 2,
        teamApprovalLength: 0.5,
        missionLength: 0.5,
    },
    "Secret Dictator": {
        ...otherHostOptions,
        nominationLength: 1,
        electionLength: 2,
        legislativeSessionLength: 2,
        executiveActionLength: 1,
        specialNominationLength: 1,
    },
    "Wacky Words": {
        ...otherHostOptions,
        roundAmt: 5,
        acronymSize: 5,
        enablePunctuation: true,
        standardiseCapitalisation: true,
        turnOnCaps: true,
        stateLengths: {
            Day: 5,
            Night: 2,
        },
    },
};

export default function getDefaults(gameType) {
    const defaults = defaultOptions[gameType];
    if(defaults) {
        return defaults;
    }
    else {
        console.error(`Could not find default options for: ${gameType}. Please report this error.`)
        return null;
    }
}