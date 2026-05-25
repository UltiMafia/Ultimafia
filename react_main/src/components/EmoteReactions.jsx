import React, { useContext, useState } from "react";
import axios from "axios";
import update from "immutability-helper";

import { UserContext } from "Contexts";
import { useErrorAlert } from "components/Alerts";
import { NameWithAvatar } from "pages/User/User";
import EmotePicker from "components/EmotePicker";
import { Emote, CustomEmote, Emotes } from "components/Emotes";
import { Box, Popover, Stack, Typography } from "@mui/material";

import "css/emote-reactions.css";

function ReactionEmoteDisplay({ reaction }) {
  const emoteKey = reaction.emote?.toLowerCase();

  if (reaction.emoteKind === "site" && Emotes[emoteKey]) {
    return <Emote emote={emoteKey} />;
  }

  if (reaction.emoteKind === "custom" && reaction.emotePath) {
    return (
      <CustomEmote
        emote={{ name: reaction.emote, path: reaction.emotePath }}
      />
    );
  }

  return (
    <span className="reaction-unicode" role="img" aria-label={reaction.emote}>
      {reaction.emote}
    </span>
  );
}

export function EmoteReactions(props) {
  const item = props.item;
  const itemType = props.itemType;
  const itemHolder = props.itemHolder;
  const setItemHolder = props.setItemHolder;
  const itemKey = props.itemKey;

  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();
  const [reactionDetails, setReactionDetails] = useState(null);
  const [hoveredEmote, setHoveredEmote] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  const reactions = item.reactions || [];

  function resolveEmotePayload(emoteStr) {
    const key = String(emoteStr || "").toLowerCase();
    if (Emotes[key]) {
      return { emote: key, emoteKind: "site", emotePath: "" };
    }

    const customEmotes = user.settings?.customEmotes || {};
    if (customEmotes[key]) {
      return {
        emote: key,
        emoteKind: "custom",
        emotePath: customEmotes[key].path,
      };
    }

    return { emote: emoteStr, emoteKind: "unicode", emotePath: "" };
  }

  function applyReactionsToItem(itemId, newReactions) {
    const newItem = update(item, { reactions: { $set: newReactions } });

    if (!setItemHolder) return newItem;

    if (itemHolder == null || itemHolder === item) {
      setItemHolder(newItem);
      return;
    }

    const items = itemKey ? itemHolder[itemKey] : itemHolder;

    for (let i in items) {
      if (items[i].id === itemId) {
        const newItems = items.slice();
        newItems[i] = newItem;

        if (itemKey) {
          setItemHolder(
            update(itemHolder, {
              [itemKey]: { $set: newItems },
            })
          );
        } else {
          setItemHolder(newItems);
        }
        break;
      }
    }

    return newItem;
  }

  function onEmoteSelected(emoteStr) {
    if (!user.perms?.vote) return;

    const payload = resolveEmotePayload(emoteStr);

    axios
      .post("/api/reactions", {
        item: item.id,
        itemType,
        ...payload,
      })
      .then((res) => {
        applyReactionsToItem(item.id, res.data.reactions);
      })
      .catch(errorAlert);
  }

  function onReactionChipClick(reaction) {
    if (!user.perms?.vote) return;

    axios
      .post("/api/reactions", {
        item: item.id,
        itemType,
        emote: reaction.emote,
        emoteKind: reaction.emoteKind,
        emotePath: reaction.emotePath || "",
      })
      .then((res) => {
        applyReactionsToItem(item.id, res.data.reactions);
      })
      .catch(errorAlert);
  }

  function onChipMouseEnter(e, reaction) {
    if (!user.perms?.viewVotes) return;

    setAnchorEl(e.currentTarget);
    setHoveredEmote(reaction.emote);

    axios.get(`/api/reactions/${item.id}`).then((res) => {
      setReactionDetails(res.data);
    });
  }

  function onChipMouseLeave() {
    setAnchorEl(null);
    setHoveredEmote(null);
  }

  const hoveredReactors =
    reactionDetails?.find((r) => r.emote === hoveredEmote)?.reactors || [];

  return (
    <Box className="emote-reactions">
      {user.perms?.vote && (
        <EmotePicker
          className="emote-reactions-picker"
          onEmoteSelected={onEmoteSelected}
        />
      )}
      {reactions.map((reaction) => (
        <Box
          key={reaction.emote}
          component="button"
          type="button"
          className={`reaction-chip${reaction.mine ? " mine" : ""}`}
          onClick={() => onReactionChipClick(reaction)}
          onMouseEnter={(e) => onChipMouseEnter(e, reaction)}
          onMouseLeave={onChipMouseLeave}
        >
          <ReactionEmoteDisplay reaction={reaction} />
          <Typography component="span" className="reaction-count">
            {reaction.count}
          </Typography>
        </Box>
      ))}
      {user.perms?.viewVotes && (
        <Popover
          open={Boolean(anchorEl && hoveredEmote)}
          sx={{ pointerEvents: "none" }}
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
          transformOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
          disableScrollLock
          disableRestoreFocus
        >
          <Stack direction="column" spacing={1} sx={{ p: 1, minWidth: 160 }}>
            {hoveredReactors.length > 0 ? (
              hoveredReactors.map((reactor) => (
                <NameWithAvatar
                  key={reactor.id}
                  small
                  id={reactor.id}
                  name={reactor.name}
                  vanityUrl={reactor.vanityUrl}
                  avatar={reactor.avatar}
                />
              ))
            ) : (
              <Typography sx={{ alignSelf: "center" }}>None</Typography>
            )}
          </Stack>
        </Popover>
      )}
    </Box>
  );
}
