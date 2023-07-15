import React, { useEffect } from "react";

import { RoleSearch } from "../../components/Roles";

import "../../css/learn.css";

export default function LearnTiramisu(props) {
  const gameType = "Tiramisu";

  useEffect(() => {
    document.title = "Learn Tiramisu| UltiMafia";
  }, []);

  return (
    <div className="span-panel main">
      <div className="learn">
        <div className="heading">Synopsis</div>
        <div className="paragraphs">
          <div className="paragraph">
            Pick nouns that best fit the adjective given! The chef then picks
            their favorite, and the player who gave that noun gets a point!
            The person with the most points at the end of the game is declared the winner!
          </div>
        </div>
        <div className="heading">Roles</div>
        <RoleSearch gameType={gameType} />
      </div>
    </div>
  );
}
