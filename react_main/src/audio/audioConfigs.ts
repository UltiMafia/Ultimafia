import type { AudioEntry } from "./AudioManager";

/**
 * Centralised audio configuration objects for every game type.
 *
 * Each config is an array of entry objects with standardised property names:
 *   { fileName, loop?, volume?, overrides?, channel? }
 *
 * `channel` defaults to "sfx" unless the fileName contains "music" (in which
 * case it defaults to "music").  You can also set it to "important" to bypass
 * volume sliders entirely.
 */

// ---------------------------------------------------------------------------
// Core — loaded for every game
// ---------------------------------------------------------------------------
export const coreAudioConfig: AudioEntry[] = [
  { fileName: "bell" },
  { fileName: "ping" },
  { fileName: "tick" },
  { fileName: "vegPing", channel: "important" },
  { fileName: "urgent", channel: "important" },
];

// ---------------------------------------------------------------------------
// Mafia
// ---------------------------------------------------------------------------
export const mafiaSfxConfig: AudioEntry[] = [
  { fileName: "gunshot" },
  { fileName: "ghostAsk" },
  { fileName: "condemn" },
  { fileName: "explosion", volume: 0.5 },
  { fileName: "snowball", volume: 0.5 },
];

export const mafiaMusicConfig: AudioEntry[] = [
  // Night tracks (looping)
  { fileName: "music/NightCrafter", loop: true },
  { fileName: "music/NightEssential", loop: true },
  { fileName: "music/NightFiddler", loop: true },
  { fileName: "music/NightInvestigator", loop: true },
  { fileName: "music/NightLove", loop: true },
  { fileName: "music/NightMystical", loop: true },
  { fileName: "music/NightMafia", loop: true },
  { fileName: "music/NightCult", loop: true },
  { fileName: "music/NightProtector", loop: true },
  { fileName: "music/NightWestern", loop: true },
  { fileName: "music/NightWinter", loop: true },
  { fileName: "music/NightFool", loop: true },
  { fileName: "music/NightJoker", loop: true },
  { fileName: "music/NightSiren", loop: true },
  { fileName: "music/NightFantasy", loop: true },
  { fileName: "music/NightPolitic", loop: true },
  { fileName: "music/NightClockmaker", loop: true },
  { fileName: "music/NightPyromaniac", loop: true },
  { fileName: "music/NightBird", loop: true },
  { fileName: "music/NightHostile", loop: true },
  { fileName: "music/NightGeneric", loop: true },

  // Win / end-game tracks
  { fileName: "music/Draw" },
  { fileName: "music/WinAlien" },
  { fileName: "music/WinBlob" },
  { fileName: "music/WinCommunist" },
  { fileName: "music/WinDodo" },
  { fileName: "music/WinJoker" },
  { fileName: "music/WinPuppeteer" },
  { fileName: "music/WinPyromaniac" },
  { fileName: "music/WinGreyGoo" },
  { fileName: "music/WinFool" },
  { fileName: "music/WinMafia" },
  { fileName: "music/WinCult" },
  { fileName: "music/WinMatchmaker" },
  { fileName: "music/WinKiller" },
  { fileName: "music/WinVillage" },
  { fileName: "music/WinAngel" },
  { fileName: "music/WinMonk" },
  { fileName: "music/WinSiren" },
  { fileName: "music/WinLover" },
  { fileName: "music/WinAstrologer" },
  { fileName: "music/WinExecutioner" },
  { fileName: "music/WinAutocrat" },
  { fileName: "music/WinGambler" },
  { fileName: "music/WinCreepyGirl" },
  { fileName: "music/WinSidekick" },
  { fileName: "music/WinWarlock" },
  { fileName: "music/WinSurvivor" },
  { fileName: "music/WinHellhound" },
  { fileName: "music/WinMastermind" },
  { fileName: "music/WinClockmaker" },
  { fileName: "music/WinProphet" },
];

export const mafiaAudioConfig: AudioEntry[] = [
  ...mafiaSfxConfig,
  ...mafiaMusicConfig,
];

// ---------------------------------------------------------------------------
// Card games (Cheat, TexasHoldEm, Ratscrew)
// ---------------------------------------------------------------------------
export const cardGameAudioConfig: AudioEntry[] = [
  { fileName: "cardShuffle" },
  { fileName: "gunshot" },
  { fileName: "chips_large1" },
  { fileName: "chips_large2" },
  { fileName: "chips_small1" },
  { fileName: "chips_small2" },
];

// ---------------------------------------------------------------------------
// Liars Dice
// ---------------------------------------------------------------------------
export const liarsDiceAudioConfig: AudioEntry[] = [
  { fileName: "diceRoll" },
  { fileName: "diceRoll2" },
  { fileName: "gunshot" },
];

// ---------------------------------------------------------------------------
// Battlesnakes
// ---------------------------------------------------------------------------
export const battlesnakesAudioConfig: AudioEntry[] = [
  {
    fileName: "music/14_Minigame",
    loop: true,
    overrides: true,
    channel: "music",
  },
];
