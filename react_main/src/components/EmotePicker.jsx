import React, { useContext, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import {
  Box,
  Button,
  Popover,
  Stack,
  Tooltip,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { useTheme } from "@emotion/react";

import { Emotes } from "./Emotes";
import { UserContext } from "../Contexts";
import { usePopoverOpen } from "hooks/usePopoverOpen";
import "css/emotes.css";

import happy from "images/emotes/happy.webp";

function StickerPanel({ stickers, onSelect }) {
  if (!stickers.length) {
    return (
      <Box sx={{ p: 2, maxWidth: 320 }}>
        <Typography variant="body2" sx={{ opacity: 0.85 }}>
          Buy sticker slots in the Shop, then upload them in Settings → Game.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: 320,
        maxHeight: "min(70vh, 480px)",
        overflowY: "auto",
        p: 1,
      }}
    >
      <Stack spacing={0.75}>
        {stickers.map((sticker) => (
          <Button
            key={sticker.id || sticker.shortcode}
            onClick={() => onSelect(sticker.shortcode)}
            fullWidth
            sx={{
              justifyContent: "flex-start",
              textTransform: "none",
              gap: 1.5,
              py: 0.75,
              px: 1,
              border: (theme) => `1px solid ${theme.palette.divider}`,
              color: "inherit",
            }}
          >
            <Box
              className="sticker"
              title={sticker.name}
              sx={{
                flexShrink: 0,
                width: 56,
                height: 56,
                backgroundImage: `url('/${sticker.path}')`,
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
              }}
            />
            <Typography
              variant="body2"
              noWrap
              sx={{ textAlign: "left", minWidth: 0 }}
            >
              {sticker.shortcode}
            </Typography>
          </Button>
        ))}
      </Stack>
    </Box>
  );
}

function EmotePicker({ onEmoteSelected, className = "", players }) {
  const user = useContext(UserContext);
  const theme = useTheme();
  const [panel, setPanel] = useState("emotes"); // "emotes" | "stickers"

  const { popoverOpen, openByClick, anchorEl, handleClick, closePopover } =
    usePopoverOpen();

  const customEmotesMap = user.settings?.customEmotes || {};
  const customEmotes = Object.keys(customEmotesMap).map((emoteName) => {
    return {
      id: emoteName,
      names: [emoteName],
      imgUrl: `/${customEmotesMap[emoteName].path}`,
    };
  });
  const siteEmotes = Object.keys(Emotes).map((emoteName) => {
    const emote = Emotes[emoteName];
    return {
      id: emoteName,
      names: [emoteName],
      imgUrl: require(
        `images/emotes/${emote.name.toLowerCase()}.${emote.type}`
      ),
    };
  });

  // In-game player maps are remapped from Mongo on join (same source as
  // :shortcode: rendering). UserContext settings can be a stale Redis cache
  // that predates stickers, which made the Stickers tab empty while colon
  // insert still worked.
  const selfPlayer =
    players &&
    Object.values(players).find(
      (p) => p && user?.id && (p.userId === user.id || p.id === user.id)
    );
  const customStickersMap =
    (selfPlayer && selfPlayer.customStickers) ||
    user.settings?.customStickers ||
    {};
  const stickers = Object.keys(customStickersMap).map((key) => ({
    shortcode: key,
    ...customStickersMap[key],
  }));

  function selectEmote(emote) {
    const value = emote.isCustom
      ? emote.names?.[0] || emote.id
      : emote.emoji;
    onEmoteSelected(value);
    closePopover();
  }

  function selectSticker(shortcode) {
    onEmoteSelected(shortcode);
    closePopover();
  }

  function handleOpen(e) {
    setPanel("emotes");
    handleClick(e);
  }

  return (
    <div className={`dropdown ${className}`}>
      <Tooltip title="Emotes & Stickers!" placement="top">
        <Button
          className="dropdown-control"
          onClick={handleOpen}
          sx={{
            height: "100%",
            backgroundColor: "transparent",
            border: `1px solid ${theme.palette.primary.main}`,
          }}
        >
          <img src={happy} alt="Emotes" />
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
        <Box
          sx={{
            bgcolor: "var(--scheme-color)",
            color: "var(--scheme-color-text)",
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box
            sx={{
              px: 1,
              pt: 1,
              pb: 0.5,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <ToggleButtonGroup
              exclusive
              size="small"
              fullWidth
              value={panel}
              onChange={(_, next) => {
                if (next != null) setPanel(next);
              }}
              sx={{
                "& .MuiToggleButton-root": {
                  textTransform: "none",
                  py: 0.5,
                  color: "inherit",
                  borderColor: theme.palette.divider,
                },
                "& .Mui-selected": {
                  bgcolor: `${theme.palette.primary.main}22 !important`,
                  color: "inherit !important",
                },
              }}
            >
              <ToggleButton value="emotes">Emotes</ToggleButton>
              <ToggleButton value="stickers">
                Stickers{stickers.length ? ` (${stickers.length})` : ""}
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {panel === "stickers" ? (
            <StickerPanel stickers={stickers} onSelect={selectSticker} />
          ) : (
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
          )}
        </Box>
      </Popover>
    </div>
  );
}

export default React.memo(EmotePicker);
