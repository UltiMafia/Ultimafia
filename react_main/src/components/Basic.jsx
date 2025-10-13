import React, { useEffect, useState } from "react";

import { emotify } from "./Emotes";
import { filterProfanitySegment } from "../lib/profanity";
import { MediaEmbed } from "../pages/User/User";
import { slangList } from "../constants/slangList";
import { Slang } from "./Slang";
import { Typography } from "@mui/material";

export function ItemList(props) {
  const itemRows = props.items.map(props.map);
  return <div className={`item-list ${props.className || ""}`}>{itemRows}</div>;
}

export function PanelGrid(props) {
  const panels = props.panels.map((panel, i) => (
    <div className="box-panel" key={i}>
      <div className="heading">
        {panel.icon}
        <div className="heading-text">{panel.name}</div>
      </div>
      <div className="content">{panel.text}</div>
    </div>
  ));
  return <div className="panel-grid">{panels}</div>;
}

export function Time(props) {
  let unit = "millisecond";
  let value = props.millisec;
  const suffix = props.suffix || "";
  const minSec = props.minSec;
  const abbreviate = props.abbreviate;

  const units = [
    {
      name: "second",
      abbrevation: "s",
      scale: 1000,
    },
    {
      name: "minute",
      abbrevation: "min",
      scale: 60,
    },
    {
      name: "hour",
      abbrevation: "h",
      scale: 60,
    },
    {
      name: "day",
      abbrevation: "d",
      scale: 24,
    },
    {
      name: "week",
      abbrevation: "w",
      scale: 7,
    },
    {
      name: "year",
      abbrevation: "y",
      scale: 52,
    },
  ];

  let i = 0;
  while (i < units.length - 1 && value >= units[i].scale) {
    value /= units[i].scale;
    unit = abbreviate ? units[i].abbrevation : units[i].name;
    i++;
  }

  if (minSec && unit === "millisecond") {
    if (abbreviate) {
      return `<1s${suffix}`
    }
    else {
      return `Less than a second${suffix}`;
    }
  }

  value = Math.floor(value);

  if (abbreviate) {
    return `${value}${unit}${suffix}`;
  }
  else {
    if (value > 1) unit += "s";
    return `${value} ${unit}${suffix}`;
  }
}

export function NotificationHolder(props) {
  const notifCount = props.notifCount;
  const onClick = props.onClick;
  const lOffset = props.lOffset;

  return (
    <div
      className={`notif-bound ${props.className || ""}`}
      onClick={onClick}
      ref={props.fwdRef}
    >
      {notifCount > 0 && (
        <>
          <i
            className={`fas fa-circle notif-icon ${lOffset ? "l-offset" : ""}`}
          >
            <div className="notif-count">{notifCount}</div>
          </i>
        </>
      )}
      {props.children}
    </div>
  );
}

export function UserText(props) {
  const [content, setContent] = useState(props.text);

  useEffect(() => {
    if (props.text == null) return;

    let text = props.text;

    if (props.filterProfanity)
      text = filterProfanity(
        text,
        props.settings,
        props.profChar,
        props.slangifySeed
      );

    if (props.linkify) text = linkify(text);

    // Any effects that inject elements need to be added after this point because the text property changes
    // throughout this useEffect function
    if (props.emotify) text = emotify(text, props.customEmotes);

    if (props.slangify)
      text = slangify({
        chatMessage: text,
        slangifySeed: props.slangifySeed,
        displayEmoji: props.terminologyEmoticons,
      });
    if (props.iconUsername) text = iconUsername(text, props.players);

    setContent(text);
  }, [props.text, props.terminologyEmoticons]);

  return content ?? "";
}

export function linkify(text) {
  if (text == null) return;

  if (!Array.isArray(text)) text = [text];

  const linkRegex = /http(s{0,1}):\/\/([\w.]+)\.(\w+)([^\s]*)/g;

  function onLinkCLick(e) {
    if (window.confirm("Visit external link?")) {
      return true;
    } else {
      e.stopPropagation();
      e.preventDefault();
    }
  }

  for (let i in text) {
    let _segment = text[i];
    let segment = [];
    let lastIndex = 0;
    let regexRes = linkRegex.exec(_segment);

    while (regexRes) {
      segment.push(_segment.slice(lastIndex, regexRes.index));
      segment.push(
        <a
          href={regexRes[0]}
          target="_blank"
          rel="noopener noreferrer nofollow"
          key={lastIndex}
          onClick={onLinkCLick}
        >
          {regexRes[0]}
        </a>
      );

      lastIndex = linkRegex.lastIndex;
      regexRes = linkRegex.exec(_segment);
    }

    segment.push(_segment.slice(lastIndex, _segment.length));
    text[i] = segment;
  }

  text = text.flat();
  return text.length === 1 ? text[0] : text;
}

// Takes a chat Message (string or [string]) and allows hovering over its <slang>, revealing a Popover w/ more info
export const slangify = ({ chatMessage, slangifySeed, displayEmoji }) => {
  if (typeof chatMessage == null) return; // do we really need this check? keeping it just for safety...

  if (typeof chatMessage === "string") {
    chatMessage = [chatMessage];
  }

  // don't slangify emojis!!!!
  if (!Array.isArray(chatMessage)) {
    return chatMessage;
  }

  chatMessage = chatMessage.map((word, wordIndex) => {
    if (typeof word !== "string" && !Array.isArray(word)) {
      return word; // don't slangify emojis
    }

    const wordTrimmed = word.trim();
    const slangKey = Object.keys(slangList).find(
      (key) => key.toLowerCase() === wordTrimmed.toLowerCase()
    );
    const slang = slangList[slangKey];
    if (slang) {
      const trailingSpace = word[word.length - 1] === " " ? "\u00A0" : ""; // "words" seem to have a MAXIMUM of 1 trailing space

      return (
        <>
          <Slang
            slang={slang}
            original={wordTrimmed}
            slangifySeed={slangifySeed + wordIndex}
            displayEmoji={displayEmoji}
          />
          {trailingSpace}
        </>
      );
    }

    return word;
  });

  return chatMessage;
};

export function filterProfanity(text, settings, char, seed) {
  if (text == null) return;

  if (!Array.isArray(text)) text = [text];

  settings = settings || {};

  for (let i in text) {
    let segment = text[i];

    if (typeof segment != "string") continue;

    char = char || "*";

    if (!settings.disablePg13Censor)
      segment = filterProfanitySegment("swears", segment, char, seed);

    if (!settings.disableAllCensors)
      segment = filterProfanitySegment("slurs", segment, char);

    text[i] = segment;
  }

  text = text.flat();
  return text.length === 1 ? text[0] : text;
}

export function iconUsername(text, players) {
  if (text == null) return;

  if (!Array.isArray(text)) text = [text];

  for (let i in text) {
    const segment = text[i];

    if (typeof segment != "string") continue;

    const words = segment.trim().split(" ");

    for (let j in words) {
      const word = words[j];
      let replaced = false;

      if (word.length > 1 && word.charAt(0) === "%") {
        const checkName = word.substring(1);

        const matchedPlayer = Object.values(players).find((curPlayer) => {
          return curPlayer.name === checkName;
        });

        if (matchedPlayer && matchedPlayer.avatar) {
          replaced = true;

          words[j] = (
            <InlineAvatar
              url={`url(/uploads/${matchedPlayer.userId}_avatar.webp)`}
              username={matchedPlayer.name}
            />
          );
        }
      }

      if (!replaced) {
        words[j] = words[j] + " ";
      }
    }

    text[i] = words;
  }

  text = text.flat();
  return text.length === 1 ? text[0] : text;
}

function InlineAvatar(props) {
  return (
    <div
      className="avatar small inline"
      title={props.username}
      style={{ backgroundImage: props.url }}
    >
      &#8203;
    </div>
  );
}

export function useOnOutsideClick(refs, action) {
  if (!Array.isArray(refs)) refs = [refs];

  function onOutsideClick(e) {
    for (let ref of refs)
      if (!ref || !ref.current || ref.current.contains(e.target)) return;

    action();
  }

  useEffect(() => {
    document.addEventListener("click", onOutsideClick);
    document.addEventListener("contextmenu", onOutsideClick);

    return () => {
      document.removeEventListener("click", onOutsideClick);
    };
  }, refs);
}

export const youtubeRegex =
  /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]{11}).*/;
