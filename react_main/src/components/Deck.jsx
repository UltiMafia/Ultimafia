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

  const deck = props.deck;
  const previews = deck.profilePreviews || [];
  const profileCount =
    deck.profileCount != null
      ? deck.profileCount
      : (deck.profiles && deck.profiles.length) || 0;

  let displayName = deck.name;
  return (
    <div className="deck deck-listing">
      <InfoPopover
        {...popoverProps}
        title={filterProfanity(deck.name, user.settings)}
      />
      <div
        className={`deck-cover ${deck.coverPhoto ? "" : "no-cover"}`}
        onClick={handleClick}
        style={
          deck.coverPhoto
            ? { backgroundImage: `url(/uploads${deck.coverPhoto})` }
            : undefined
        }
      />
      <div className="deck-listing-info">
        <Typography
          className="deck-name"
          onClick={handleClick}
          style={{ cursor: "pointer" }}
        >
          {displayName}
        </Typography>
        <div
          className="deck-preview-row"
          onClick={handleClick}
          style={{ cursor: "pointer" }}
        >
          {previews.map((profile) => (
            <div
              key={profile.id}
              className="deck-preview-avatar"
              title={filterProfanity(profile.name || "", user.settings)}
              style={
                profile.avatar
                  ? {
                      backgroundImage: `url(/uploads${profile.avatar})`,
                      borderColor: profile.color || "transparent",
                    }
                  : { borderColor: profile.color || "transparent" }
              }
            />
          ))}
          <span className="deck-profile-count">
            {profileCount} {profileCount === 1 ? "profile" : "profiles"}
          </span>
        </div>
      </div>
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
