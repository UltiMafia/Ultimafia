import React from "react";
import "../css/playingCard.css";

export function PlayingCard(props) {
  const playingCardDeck = props.cardDeck;
  const playingCardOriginal = props.card;
  const playingCardAttributes = playingCardOriginal.split("•");
  const playingCardValue = playingCardAttributes[0];
  const playingCardSuit = playingCardAttributes[1];

  const cardName = `${playingCardValue}${playingCardSuit}`;
  const cardFile = `/images/cards/${playingCardDeck}/${cardName}.svg`;

  return (
    <img
      className="playing-card"
      alt={cardName}
      src={cardFile}
    />
  );
}
