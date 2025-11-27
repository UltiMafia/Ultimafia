import React, { useContext, useEffect, useRef } from "react";
import { filterProfanity } from "./Basic";
import { UserContext } from "../Contexts";
import "css/deck.css";
import { usePopover, InfoPopover } from "components/Popover";
import { Typography } from "@mui/material";

export default function AnonymousDeck(props) {
  const user = useContext(UserContext);
  const popoverProps = usePopover({
    path: `/api/deck/${props.deck.id}`,
    type: "deck",
  });
  const { handleClick } = popoverProps;

  let displayName = `${props.deck.name} (${props.deck.id})`;
  return (
    <div className="deck">
      <InfoPopover {...popoverProps} title={filterProfanity(props.deck.name, user.settings)} />
      <Typography className="deck-name"
        onClick={handleClick}
        style={{ cursor: "pointer" }
      }>
        {displayName}
      </Typography>
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
