import React, { useEffect } from "react";

import { RoleSearch } from "../../../components/Roles";

import "../../../css/learn.css";

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
          <div className="paragraph">ghost game. guess the word.</div>
          <div className="paragraph">loreum</div>
          <div className="paragraph">ipsum</div>
        </div>
        <div className="heading">Roles</div>
        <RoleSearch gameType={gameType} />
      </div>
    </div>
  );
}
