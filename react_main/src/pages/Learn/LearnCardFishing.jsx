import React, { useEffect } from "react";

import { RoleSearch } from "../../components/Roles";

import "../../css/learn.css";

export default function LearnCardFishing(props) {
  const gameType = "Card Fishing";

  useEffect(() => {
    document.title = "Learn Card Fishing | UltiMafia";
  }, []);

  return (
    <div className="span-panel main">
      <div className="learn">
        <div className="heading">Synopsis</div>
        <div className="paragraphs">
          <div className="paragraph">
            <ol>
              <li>Number of starting decks is dependant on amount of players (1 deck for 3 players and less, otherwise 2 decks for 4 to 6, 3 decks for 5 to 8, so on and so on)</li>
              <li>Players start out with a predetermined amount of cards (probably 8 at this point).</li>
              <li>All other cards are placed into a pile.</li>
              <li>Players may either swap their cards with one in the pile or if they find a card that is the same colour, they may instead use a card in their hand to fish it.</li>
              <li>They collect points by adding up the scores assigned to each card.</li>
              <li>Winner is the person with most points when the pile is depleted.</li>
            </ol>
          </div>
        </div>
        <div className="heading">Scoring</div>
        <div className="paragraphs">
          <div className="paragraph">
            <ol>
              <li>
                Players are assigned scores based on the value and suit of their card.
                Hearts/Spades are worth double the value of Diamonds/Clubs.
              </li>
            </ol>
          </div>
        </div>
        <div className="heading">Roles</div>
        <RoleSearch gameType={gameType} />
      </div>
    </div>
  );
}