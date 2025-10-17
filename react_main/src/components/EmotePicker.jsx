import React, { useLayoutEffect, useRef, useState, useContext } from "react";
import { EmoteKeys, emotify } from "./Emotes";
import { useOnOutsideClick } from "./Basic";
import { Box, Button, Popover, Stack, Tooltip } from "@mui/material";
import { UserContext } from "../Contexts";

import happy from "images/emotes/happy.webp";
import { usePopoverOpen } from "hooks/usePopoverOpen";

import "css/emotes.css";

export default function EmotePicker(props) {
  const user = useContext(UserContext);
  let emotesToUse = user.settings?.customEmotes || {};
  /*
  if(props.players){
    for(let player of Object.values(props.players)){
      if(player.user?.id == user.id){
        emotesToUse = player.user.customEmotes;
        break;
      }
    }
  }
  */

  const { popoverOpen, popoverClasses, anchorEl, handleClick, closePopover } =
    usePopoverOpen();

  const userCustomEmotes = emotesToUse || {};
  const customEmotes = (
    <>
      {Object.keys(userCustomEmotes).map((customEmote) => (
        <div
          style={{ width: "var(--emote-size)", height: "var(--emote-size)" }}
          key={customEmote}
          onClick={(e) => selectEmote(e, customEmote)}
        >
          {emotify(customEmote, userCustomEmotes)}
        </div>
      ))}
    </>
  );

  const emotes = (
    <>
      {EmoteKeys.map((emote) => (
        <Box
          sx={{ width: "var(--emote-size)", height: "var(--emote-size)" }}
          key={emote}
          onClick={(e) => selectEmote(e, emote)}
        >
          {emotify(emote)}
        </Box>
      ))}
    </>
  );

  function selectEmote(e, emote) {
    props.onEmoteSelected(emote);
    if (!e.shiftKey) {
      closePopover();
    }
  }

  return (
    <div className={`dropdown ${props.className || ""}`}>
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
        sx={popoverClasses}
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
        <div className="emote-picker">
          {customEmotes}
          {emotes}
        </div>
      </Popover>
    </div>
  );
}
