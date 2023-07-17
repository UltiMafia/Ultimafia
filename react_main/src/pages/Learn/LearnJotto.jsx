import React, { useEffect } from "react";

import { RoleSearch } from "../../components/Roles";

import "../../css/learn.css";

export default function LearnGhost(props) {
  const gameType = "Jotto";

  useEffect(() => {
    document.title = "Learn Jotto | UltiMafia";
  }, []);

  return (
    <div className="span-panel main">
      <div className="learn">
        <div className="heading">Synopsis</div>
        <div className="paragraphs">
          <div className="paragraph">
            Jotto is a logic-oriented word game, where players select a secret
            word and attempt to guess their opponent's words.
          </div>
        </div>
      </div>
    </div>
  );
}
