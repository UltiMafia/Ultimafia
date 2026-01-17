import React, { useLayoutEffect, useRef, useState, useContext } from "react";
import EmojiPicker from 'emoji-picker-react';
import { Box, Button, Popover, Stack, Tooltip } from "@mui/material";
import { useTheme } from "@emotion/react";

import { Emotes } from "./Emotes";
import { UserContext } from "../Contexts";
import { usePopoverOpen } from "hooks/usePopoverOpen";

import happy from "images/emotes/happy.webp";

function EmotePicker({ onEmoteSelected, className = "" }) {
  const user = useContext(UserContext);
  const theme = useTheme();

  const { popoverOpen, openByClick, anchorEl, handleClick, closePopover } =
    usePopoverOpen();

  const customEmotesMap = user.settings?.customEmotes || {};
  const customEmotes = Object.keys(customEmotesMap).map((emoteName) => {
    return {
      "id": emoteName,
      "names": [emoteName],
      "imgUrl": `/${customEmotesMap[emoteName].path}`,
    };
  });
  const siteEmotes = Object.keys(Emotes).map((emoteName) => {
    const emote = Emotes[emoteName];
    return {
      "id": emoteName,
      "names": [emoteName],
      "imgUrl": require(`images/emotes/${emote.name.toLowerCase()}.${emote.type}`),
    };
  });

  function selectEmote(emote) {
    onEmoteSelected(emote.emoji);
    closePopover();
  }

  return (
    <div className={`dropdown ${className}`}>
      <Tooltip title="Emotes!" placement="top">
        <Button
          className="dropdown-control"
          onClick={handleClick}
          sx={{
            height: "100%",
          }}
        >
          <img src={happy} />
        </Button>
      </Tooltip>
      <Popover
        open={popoverOpen}
        sx={{ pointerEvents: openByClick ? "auto" : "none" }}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        onClose={closePopover}
        disableScrollLock
        disableRestoreFocus
      >
        <EmojiPicker
          width="100%"
          height="80vh"
          emojiStyle="native"
          theme={theme.palette.mode}
          onEmojiClick={selectEmote}
          lazyLoadEmojis={true}
          customEmojis={[...customEmotes, ...siteEmotes]}
          style={{
            "--epr-picker-border-color": "var(--mui-palette-divider)",
            "--epr-bg-color": "var(--scheme-color)",
            "--epr-category-label-bg-color": "var(--scheme-color)",
            "--epr-horizontal-padding": "var(--mui-spacing)",
            "--epr-header-padding": "var(--mui-spacing)",
            "--epr-search-input-bg-color": "transparent",
            "--epr-search-border-color": "var(--mui-palette-divider)",
          }}
        />
      </Popover>
    </div>
  );
}

export default React.memo(EmotePicker);
