import React, { useEffect } from "react";

import { RoleSearch } from "../../components/Roles";

import "../../css/learn.css";

export default function LearnSplitDecision(props) {
  const gameType = "Split Decision";

  useEffect(() => {
    document.title = "Learn Split Decision | UltiMafia";
  }, []);

  return (
    <div className="span-panel main">
      <div className="learn">
        <div className="heading">Synopsis</div>
        <div className="paragraphs">
          <div className="paragraph">
            Based on the card game{" "}
            <a
              href="https://www.tuesdayknightgames.com/tworoomsandaboom"
              target="_blank"
            >
              2 Rooms and a Boom
            </a>{" "}
            by Tudesday Knight Games.
          </div>
          <div className="paragraph">
            In Split Decision, all players are randomly a split among two rooms,
            as well as split among two teams: Red and Blue. One player is
            assigned the role of President, and another is the Bomber. The game
            plays over a series of rounds, and in each round each room will
            elect a leader. Those leaders will then meet together and choose one
            or more players (the hostages) to swap between the rooms for the
            next round.
          </div>
          <div className="paragraph">
            As the game progresses the rounds will get shorter and the number of
            players swapped between rooms will decrease. It is the goal of the
            Red team for the President and the Bomber to end up in the same room
            after the last round. It is the goal of the Blue team for them to
            end up in different rooms.
          </div>
        </div>
        <div className="heading">Roles</div>
        <RoleSearch gameType={gameType} />
      </div>
    </div>
  );
}
