import React, { useContext, useRef } from "react";
import { filterProfanity } from "./Basic";
import { PopoverContext, UserContext } from "../Contexts";

import "../css/deck.css";

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

  let profiles = JSON.parse(props.deck.profiles).map((p) => (
    <DeckProfile profile={p} />
  ));

  let displayName = `${props.deck.name} (${props.deck.id})`
  return (
    <div className="deck" ref={deckRef} onClick={onClick}>
      <div className="deck-name">{displayName}</div>
      {disablePopover && profiles}
    </div>
  );
}

export function tempParseWordsToProfiles(words) {
  let profiles = [];
  for (let w of words.split(" ")) {
    profiles.push({
      name: w,
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

function DeckProfile(props) {
  let profile = props.profile;
  //avatar
  //deathmessage

  return (
    <>
      <div className="deck-profile">
        <div className="profile-name">{profile.name}</div>
      </div>
    </>
  );
}
