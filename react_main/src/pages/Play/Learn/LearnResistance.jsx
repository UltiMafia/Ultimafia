import React, { useEffect } from "react";

import { RoleSearch } from "../../../components/Roles";
import { PanelGrid } from "../../../components/Basic";

import "../../../css/learn.css";

export default function LearnResistance(props) {
  const gameType = "Resistance";

  useEffect(() => {
    document.title = "Learn Resistance | UltiMafia";
  }, []);

  return (
    <div className="span-panel main">
      <div className="learn">
        <div className="heading">Synopsis</div>
        <div className="paragraphs">
          <div className="paragraph">
            Based on the card game{" "}
            <a
              href="https://www.boardgamegeek.com/boardgame/41114/resistance"
              target="_blank"
              rel="noreferrer"
            >
              The Resistance
            </a>{" "}
            by Don Eskridge.
          </div>
          <div className="paragraph">
            In Resistance, a group of rebels is trying to overthrow the
            government by completing a series of missions. However, the
            government has caught word of the plan and has recruited spies to
            inflitrate the resistance and sabotage the missions.
          </div>
          <div className="paragraph">
            At the beginning of each mission a player is selected as the leader
            and must recruit several group members to the team. All players vote
            on the selected team and if the majority approve then the mission
            will proceed. Otherwise, a new leader is chosen to make a new team.
            If several leaders are unable to form a team then that mission
            automatically fails.
          </div>
          <div className="paragraph">
            During a mission the members of the teams who are spies can choose
            to either make the mission succeed or fail. If at least one team
            member opts for it to fail then the entire mission will fail,
            otherwise it will succeed. The game continues until a certain number
            of missions succeed or fail, with the Resistance and the Spies
            winning respectively.
          </div>
        </div>
        <div className="heading">Roles</div>
        <RoleSearch gameType={gameType} />
      </div>
    </div>
  );
}
