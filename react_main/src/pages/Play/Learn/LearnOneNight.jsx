import React, { useEffect } from "react";

import { RoleSearch } from "../../../components/Roles";
import { PanelGrid } from "../../../components/Basic";

import "../../../css/learn.css";

export default function LearnOneNight(props) {
  const gameType = "One Night";

  useEffect(() => {
    document.title = "Learn One Night | UltiMafia";
  }, []);

  return (
    <div className="span-panel main">
      <div className="learn">
        <div className="heading">Synopsis</div>
        <div className="paragraphs">
          <div className="paragraph">
            Based on{" "}
            <a
              href="https://beziergames.com/collections/one-night-ultimate-werewolf"
              target="_blank"
              rel="noreferrer"
            >
              One Night Ultimate Werewolf
            </a>{" "}
            by Bezier Games.
          </div>
          <div className="paragraph">
            One Night is a game of logical deduction similar to Mafia, but with
            only one Night and one Day phase.
          </div>
          <div className="paragraph">
            The Village side must kill one of the Werewolves to win, and
            Werewolves must kill one of the village. The Village also loses if
            there are no Werewolves present but they kill a Village member. The
            one night is typically eventful; the role you are given at the
            beginning of the night may not be the card you end up with. Actions
            will all take place at once at the end of the night. The order of
            events is given by times in the role descriptions.
          </div>
        </div>
        <div className="heading">Roles</div>
        <RoleSearch gameType={gameType} />
      </div>
    </div>
  );
}
