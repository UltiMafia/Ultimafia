import React, { useEffect } from "react";

import { RoleSearch } from "../../components/Roles";

import "../../css/learn.css";

export default function LearnWackyWords(props) {
  const gameType = "Wacky Words";

  useEffect(() => {
    document.title = "Learn Wacky Words | UltiMafia";
  }, []);

  return (
    <div className="span-panel main">
      <div className="learn">
        <div className="heading">Synopsis</div>
        <div className="paragraphs">
          <div className="paragraph">
            All players are given a prompt and tasked to answer it! All players
            then vote for their favorites, with the winners of each round
            getting points. The person with the most points at the end of the
            game is declared the winner!
          </div>
        </div>
        <div className="heading">Roles</div>
        <RoleSearch gameType={gameType} />
      </div>
    </div>
  );
}
