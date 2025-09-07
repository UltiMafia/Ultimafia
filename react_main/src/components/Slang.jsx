import React from "react";
import { Popover, Typography } from "@mui/material";
import { badMathRandomWithSeed, hashStrToInt } from "../utilsFolder";
import { useTheme } from "@mui/material/styles";

export const Slang = ({ slang, original, slangifySeed, displayEmoji }) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handlePopoverOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handlePopoverClose = () => {
    setAnchorEl(null);
  };
  const open = Boolean(anchorEl);

  let emoji = slang.emoji;
  if (Array.isArray(emoji)) {
    // If multiple EMOJIs are provided, pick 1 randomly
    emoji =
      emoji[
        Math.floor(
          badMathRandomWithSeed(hashStrToInt(slangifySeed)) * emoji.length
        )
      ];
  }
  const emojiText = displayEmoji && emoji ? ` ${emoji}` : "";
  const text = slang.replacement || original + emojiText;

  return (
    <>
      <span
        style={{ textDecoration: "underline dotted 0px" }}
        onMouseEnter={handlePopoverOpen}
        onMouseLeave={handlePopoverClose}
      >
        {text}
      </span>

      <Popover
        id="mouse-over-popover"
        sx={{
          pointerEvents: "none",
        }}
        open={open}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        onClose={handlePopoverClose}
        disableAutoFocus
        disableEnforceFocus
        disableRestoreFocus
        slotProps={{
          paper: {
            style: { maxWidth: "50%", background: theme.palette.primary.main },
          },
        }}
      >
        <Typography sx={{ p: 1 }}>{slang.definition}</Typography>
      </Popover>
    </>
  );
};
