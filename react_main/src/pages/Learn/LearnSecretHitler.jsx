import React, { useEffect } from "react";

import { RoleSearch } from "../../components/Roles";

import "../../css/learn.css";

export default function LearnSecretHitler(props) {
  const gameType = "Secret Hitler";

  useEffect(() => {
    document.title = "Learn Secret Hitler | UltiMafia";
  }, []);

  return (
    <div className="span-panel main">
      <div className="learn">
        <div className="heading">Synopsis</div>
        <div className="paragraphs">
          <div className="paragraph">
            Based on the card game{" "}
            <a href="https://secrethitler.com" target="_blank">
              Secret Hitler
            </a>{" "}
            by Goat, Wolf, & Cabbage.
          </div>
          <div className="paragraph">
            In Secret Hitler, set in the late Weimar Republic, players take the
            roles of Liberals and Fascists.
          </div>
        </div>
        <div className="heading">Roles</div>
        <RoleSearch gameType={gameType} />
      </div>
    </div>
  );
}
