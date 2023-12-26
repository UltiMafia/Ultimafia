import React, { useEffect } from "react";

import { RoleSearch } from "../../components/Roles";
import { PanelGrid } from "../../components/Basic";

import "../../css/learn.css";

export default function LearnCrazyEights(props) {
  const gameType = "Crazy Eights";

  var variations = [
    {
      name: "Crazy Queens",
      text: "Placing a Q skips the next player's turn",
    },
    {
      name: "Crazy Aces",
      text: "Placing a A reverses the order of turns.",
    },
    {
      name: "Crazy Twos",
      text: "Placing a 2 causes the next player(s) to draw 2 cards, unless they place another 2.",
    },
    {
      name: "Final Card Rule",
      text: "Players must announce if they only have a single card left.",
    },
  ];

  useEffect(() => {
    document.title = "Learn Crazy Eights | UltiMafia";
  }, []);

  return (
    <div className="span-panel main">
      <div className="learn">
        <div className="heading">Synopsis</div>
        <div className="paragraphs">
          <div className="paragraph">
            <aside className="aside">
              This implementation of Crazy Eights is mainly based on rulesets provided by wikiHow and Wikipedia.
            </aside>
          </div>
          <div className="paragraph">
            <blockquote>
            <ul>
              <li>The basic gameplay of Crazy Eights involves trying to get rid of your cards by matching either the rank or suit of the face-up card in the discard pile.</li>
              <li>The objective of the game is to be the first one to discard all your cards. Or, if you’re playing multiple rounds, you want to have the fewest points.</li>
            </ul>
            </blockquote>
            <footer>- <cite>wikiHow</cite></footer>
          </div>
        </div>
        <div className="heading">Roles</div>
        <RoleSearch gameType={gameType} />
        <div className="heading">Variations</div>
        <PanelGrid panels={variations} />
      </div>
    </div>
  );
}
