import React, { useEffect } from "react";

import { RoleSearch } from "../../components/Roles";

import "../../css/learn.css";

export default function LearnSecretDictator(props) {
  const gameType = "Secret Dictator";

  useEffect(() => {
    document.title = "Learn Secret Dictator | UltiMafia";
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
            The year is 1932. The place is pre-WWII Germany. In Secret Dictator,
            players are German politicians attempting to hold a fragile Liberal
            government together and stem the rising tide of Fascism. Watch out
            though—there are secret Fascists among you, and one player is Secret
            Dictator.
          </div>
          <div className="paragraph">
            At the beginning of the game, each player is secretly assigned to
            one of three roles: Liberal, Fascist, or the Dictator. The Liberals have a
            majority, but they don’t know for sure who anyone is; Fascists must
            resort to secrecy and sabotage to accomplish their goals. The Dictator
            plays for the Fascist team, and the Fascists know the Dictator’s identity
            from the outset, but most of the time, the Dictator doesn’t know the Fascists and must work
            to figure them out.
          </div>
          <div className="paragraph">
            The Liberals win by enacting five Liberal Policies or killing the
            Dictator. The Fascists win by enacting six Fascist Policies, or if
            the Dictator is elected Chancellor after three Fascist Policies have been
            enacted.
          </div>
          <div className="paragraph">
            Whenever a Fascist Policy is enacted, the government becomes more
            powerful, and the President is granted a single-use power which must
            be used before the next round can begin. It doesn’t matter what team
            the President is on; in fact, even Liberal players might be tempted
            to enact a Fascist Policy to gain new powers.
          </div>
        </div>
        <div className="heading">Roles</div>
        <RoleSearch gameType={gameType} />
      </div>
    </div>
  );
}
