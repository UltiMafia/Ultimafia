import React, { Suspense } from "react";
import { lazyWithRetry } from "../../lib/lazyWithRetry";
import { UiPending } from "../../components/ui";

const imports = {
  Jotto: () => import("./JottoGame"),
  Acrotopia: () => import("./AcrotopiaGame"),
  "Secret Dictator": () => import("./SecretDictatorGame"),
  "Wacky Words": () => import("./WackyWordsGame"),
  "Draw It": () => import("./DrawItGame"),
  "Liars Dice": () => import("./LiarsDiceGame"),
  "Texas Hold Em": () => import("./TexasHoldEmGame"),
  Cheat: () => import("./CheatGame"),
  Ratscrew: () => import("./RatscrewGame"),
  Battlesnakes: () => import("./BattlesnakesGame"),
  "Dice Wars": () => import("./DiceWarsGame"),
  "Connect Four": () => import("./ConnectFourGame"),
  "Spot It": () => import("./SpotItGame"),
  Battleship: () => import("./BattleshipGame"),
  Chess: () => import("./ChessGame"),
};
const pending = new Map();
const normalize = type => type === "DiceWars" ? "Dice Wars" : type;
export function preloadGameView(type) {
  type = normalize(type);
  if (!imports[type]) return Promise.resolve();
  if (!pending.has(type)) pending.set(type, imports[type]().catch(error => { pending.delete(type); throw error; }));
  return pending.get(type);
}
const views = Object.fromEntries(Object.keys(imports).map(type => [type, lazyWithRetry(() => preloadGameView(type))]));

export default function GameView({ type }) {
  const View = views[normalize(type)];
  return View ? <Suspense fallback={<UiPending label="Opening game…" />}><View /></Suspense> : null;
}
