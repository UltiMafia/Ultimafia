import React, { useContext } from "react";

import { emotify } from "../Emotes";
import { Avatar } from "../../pages/User/User";
import { GameContext } from "Contexts";

import "css/newspaper.css";

function Newspaper(props) {
  const title = props.title || "Obituary";
  const timestamp = props.timestamp || Date.now();
  const deaths = props.deaths || [];
  const dayCount = props.dayCount || 0;
  const isAlignmentReveal = props.isAlignmentReveal || false;

  // Example props.deaths input data:
  /* [{
        id: "l-jKFhbq6",
        name: "nearbear",
        avatar: true,
        avatarId: "l-jKFhbq6",
        deathMessage: "nearbear :zzz: died :zzz: while :zzz: testing :zzz: this :zzz: new :zzz: feature",
        revealMessage: "nearbear's role is Prankster:Insane/Telepathic",
        lastWill: ":will: nearbear did not leave a will."
    }, {
        id: "asdfasdf",
        name: "TheGameGuy",
        avatar: false,
        avatarId: "asdfasdf",
        deathMessage: "n1 TheGameGuy if you are jealous that he is better than you at EpicMafia. You can make up a fake excuse if you want to.",
        revealMessage: "TheGameGuy's role is Cop:Insane",
        lastWill: ":will: As read from TheGameGuy's last will: I knew you guys were jealous."
    }] */

  // Subtract 100 years from the game's start time to get MAFIA time
  const gameDate = new Date(timestamp + dayCount * 24 * 60 * 60 * 1000);
  gameDate.setFullYear(gameDate.getFullYear() - 100);

  const obituaries = deaths.map((death) => (
    <div className="obituary" key={death.id}>
      <div className="obituary-header">
        <div>{death.name}</div>
      </div>
      <div style={{ display: "flex", alignItems: "left", gap: "10px" }}>
        <div className="obituary-avatar">
          <Avatar
            id={death.id}
            hasImage={death.avatar}
            avatarId={death.avatarId}
            name={death.name}
            large
            isSquare
          />
        </div>

        <div className="newspaper-paragraph">{emotify(death.deathMessage)}</div>
      </div>
      {death.revealMessage && (
        <div className="newspaper-paragraph">
          {formatRevealMessage(
            death.revealMessage,
            death.name,
            isAlignmentReveal
          )}
        </div>
      )}

      {death.lastWill && (
        <div className="newspaper-paragraph">{emotify(death.lastWill)}</div>
      )}
    </div>
  ));

  return (
    <div className="newspaper">
      <div className="newspaper-title">{title}</div>
      <div className="newspaper-subheader">{gameDate.toDateString()}</div>

      {obituaries.length > 0 ? (
        obituaries
      ) : (
        <div className="newspaper-no-one-died">No one died last night.</div>
      )}
    </div>
  );
}

// --- Helper Functions ---
function formatRevealMessage(revealMessage, playerName, isAlignmentReveal) {
  const revealType = isAlignmentReveal ? "alignment" : "role";
  const revealResult = isAlignmentReveal
    ? getAlignmentName(revealMessage)
    : reformatRoleName(getRoleName(revealMessage));
  return (
    <>
      {playerName}'s {revealType} was:
      <span className="newspaper-emphasis"> {revealResult}</span>
    </>
  );
}
const ROLE_SEARCH_TERM = "'s role is ";
function getRoleName(text) {
  if (!text) return "???";
  const indexStart = text.lastIndexOf(ROLE_SEARCH_TERM);
  const indexEnd = indexStart + ROLE_SEARCH_TERM.length;
  return text.substring(indexEnd);
}
const ALIGNMENT_SEARCH_TERM = "'s alignment is ";
function getAlignmentName(text) {
  if (!text) return "???";
  const indexStart = text.lastIndexOf(ALIGNMENT_SEARCH_TERM);
  const indexEnd = indexStart + ALIGNMENT_SEARCH_TERM.length;
  return text.substring(indexEnd);
}
function reformatRoleName(role) {
  const tokens = role.split(":");
  const roleName = tokens[0];
  const modifiers = tokens.length > 1 ? tokens[1].split("/") : [""];
  return `${modifiers.join(" ")} ${roleName}`;
}

export function ObituariesMessage(props) {
  const game = useContext(GameContext);

  const message = props.message;

  var title = null;
  if (message.source === "Day") {
    title = "Evening News";
  } else if (message.source === "Night") {
    title = "Obituaries";
  } else if (message.source === "Postgame") {
    title = "The Miller Times";
  } else {
    title = "Breaking News";
  }

  const deaths = message.obituaries.map((obituary) => {
    return {
      id: obituary.playerInfo.userId,
      name: obituary.playerInfo.name,
      avatar: obituary.playerInfo.avatar,
      customEmotes: obituary.playerInfo.customEmotes,
      deathMessage: obituary.snippets.deathMessage,
      revealMessage: obituary.snippets.revealMessage,
      lastWill: obituary.snippets.lastWill,
    };
  });

  return (
    <>
      <Newspaper
        title={title}
        timestamp={message.time}
        dayCount={message.dayCount}
        deaths={deaths}
        isAlignmentReveal={game.getSetupGameSetting("Alignment Only Reveal")}
      />
    </>
  );
}
