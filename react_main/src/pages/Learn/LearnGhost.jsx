import React, { useEffect } from "react";

import { RoleSearch } from "../../components/Roles";

import "../../css/learn.css";

export default function LearnGhost(props) {
  const gameType = "Ghost";

  useEffect(() => {
    document.title = "Learn Ghost | UltiMafia";
  }, []);

  return (
    <div className="span-panel main">
      <div className="learn">
        <div className="heading">Synopsis</div>
        <div className="paragraphs">
          <div className="paragraph">
            The objective of Ghost is to keep the secret word secret. The
            villagers begin the game knowing the word (chosen by the host),
            while the ghosts must guess it. Each player takes a turn giving a
            clue related to the word to reveal themselves to other villagers
            without revealing the word to the ghosts. After each round of clues
            a person is voted out as the ghost. If they were in fact the ghost,
            they have a chance to guess the secret word to win. Alternatively,
            the ghosts may win if they gain a majority. The other town role is
            Fool, who appear to themselves as ordinary villagers but share an
            alternate secret word, creating confusion among both teams.
          </div>
        </div>
        <div className="heading">Roles</div>
        <RoleSearch gameType={gameType} />
      </div>
    </div>
  );
}
