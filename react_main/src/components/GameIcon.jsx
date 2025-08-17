import React from "react";

export const gamesIcons = {
  Mafia: require("images/game_icons/Mafia.png"),
  Resistance: require("images/game_icons/Resistance.png"),
  Ghost: require("images/game_icons/Ghost.png"),
  Jotto: require("images/game_icons/Jotto.png"),
  Acrotopia: require("images/game_icons/Acrotopia.png"),
  "Secret Dictator": require("images/game_icons/SecretDictator.png"),
  "Wacky Words": require("images/game_icons/WackyWords.png"),
  "Liars Dice": require("images/game_icons/LiarsDice.png"),
  "Texas Hold Em": require("images/game_icons/CardGames.png"),
  Cheat: require("images/game_icons/CardGames.png"),
  Battlesnakes: require("images/game_icons/Battlesnakes.png"),
  "Connect Four": require("images/game_icons/ConnectFour.png"),

};

export default function GameIcon(props) {
  const gameType = props.gameType;
  const size = props.size;

  return (
    <img src={gamesIcons[gameType]} alt={gameType} width={size} height={size} />
  );
}
