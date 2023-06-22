import React, { useContext, useRef } from "react";
import { filterProfanity } from "./Basic";
import { PopoverContext, UserContext } from "../Contexts";

export default function AnonymousDeck(props) {
  const user = useContext(UserContext);
  const popover = useContext(PopoverContext);
  const deckRef = useRef();
  const disablePopover = props.disablePopover;

  function onClick() {
    if (disablePopover) {
      return;
    }

    popover.onClick(
      `/deck/${props.deck.id}`,
      "deck",
      deckRef.current,
      filterProfanity(props.deck.name, user.settings),
      (data) => (data.profiles = JSON.parse(data.profiles))
    );
  }

  return (
    <div className="deck" ref={deckRef} onClick={onClick}>
      <div className="deck-name">{props.deck.name}</div>
    </div>
  );
}

export function tempParseWordsToProfiles(words) {
  let profiles = [];
  for (let w in words.split(" ")) {
    profiles.push({
      name: w,
    });
  }
  return profiles;
}

export function tempParseProfilesToWords(profiles) {
  let words = [];
  for (let p in profiles) {
    words.push(p.name);
  }
  return words;
}
