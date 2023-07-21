import React, { useContext, useEffect } from "react";

import { RoleSearch } from "../../components/Roles";
import { PanelGrid } from "../../components/Basic";

import "../../css/learn.css";
import { SiteInfoContext } from "../../Contexts";
import { hyphenDelimit } from "../../utils";

export default function LearnDeityhunt(props) {
  const gameType = "Deityhunt";

  const siteInfo = useContext(SiteInfoContext);

  /*const modifiers = siteInfo.modifiers["Mafia"].map((e) => ({
    name: e.name,
    text: e.description,
    icon: (
      <div
        className={`icon modifier modifier-Mafia-${hyphenDelimit(e.name)}`}
      />
    ),
  }));*/

  useEffect(() => {
    document.title = "Learn Mafia | UltiMafia";
  }, []);

  return (
    <div className="span-panel main">
      <div className="learn">
        <div className="heading">Synopsis</div>
        <div className="paragraphs">
          <div className="paragraph">
            Inspired by{" "}
            <a
              href="https://bloodontheclocktower.com/"
              target="_blank"
            >
              Blood on the Clocktower
            </a>.
          </div>
          <div className="paragraph">
            Each player is either good or evil, with good players being either 
            Villagers or Outcasts, and evil players being either Followers or Deities.
            Good wins if the Deity is executed, while evil wins if the Deity is left alive.
          </div>
        </div>
        <div className="heading">Roles</div>
        <RoleSearch gameType={gameType} />
      </div>
    </div>
  );
}
