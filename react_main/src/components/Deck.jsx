import React, { useContext, useRef } from "react";
import { filterProfanity } from "./Basic";
import { PopoverContext, UserContext } from "../Contexts";
import "../css/deck.css";

export default function AnonymousDeck(props) {
  const user = useContext(UserContext);
  const popover = useContext(PopoverContext);
  const deckRef = useRef();

  function onClick() {
    popover.onClick(
      `/deck/${props.deck.id}`,
      "deck",
      deckRef.current,
      filterProfanity(props.deck.name, user.settings)
    );
  }

  let displayName = `${props.deck.name} (${props.deck.id})`;
  return (
    <div className="deck" ref={deckRef} onClick={onClick}>
      <div className="deck-name">{displayName}</div>
    </div>
  );
}

export function tempParseWordsToProfiles(words) {
  let profiles = [];
  for (let w of words.split(/\s+/g)) {
    profiles.push({
      name: w.replace(/\s/g, ""),
    });
  }
  return profiles;
}

export function tempParseProfilesToWords(profiles) {
  let words = [];
  for (let p of profiles) {
    words.push(p.name);
  }
  return words.join(" ");
}

export class Profile {
  constructor(name, avatar, deathMessage, color, deckId) {
    this.name = name;
    this.avatar = avatar;
    this.deathMessage = deathMessage;
    this.color = color;
    this.deck = deckId;
  }
}
