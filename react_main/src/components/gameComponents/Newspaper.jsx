import React, { useEffect, useState } from "react";

import { emotify, Emotes } from "../Emotes";
import { Avatar } from "../../pages/User/User";

import "css/newspaper.css";

export default function Newspaper(props) {
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
        <h3>{death.name}</h3>
      </div>

      <div className="newspaper-paragraph">{emotify(death.deathMessage)}</div>

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

function emotifyInline(text) {
  if (!text) return;
  if (!Array.isArray(text)) text = [text];
  for (let i in text) {
    let segment = text[i];
    if (typeof segment != "string") continue;
    const words = segment.split(" ");
    for (let j in words) {
      let word = words[j].toLowerCase();
      if (Emotes[word] && typeof Emotes[word] != "function") {
        const emote = Emotes[word];
        words[j] = `<div class="emote" title=${
          emote.name
        } style="background-image: url('/images/emotes/${emote.name.toLowerCase()}.${
          emote.type
        }')"></div>`;
      } else {
        if (j < words.length - 1) words[j] += " ";
      }
    }
    text[i] = words;
  }
  return text.flat().join("");
}
