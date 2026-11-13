import React, { useEffect, useState, useContext } from "react";

import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Divider,
  IconButton,
  Paper,
  Stack,
  SwipeableDrawer,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { UserContext, InGameContext } from "Contexts";
import { useErrorAlert } from "components/Alerts";

import { ModCommands, COMMAND_COLOR } from "pages/Policy/Moderation";
import UiIcon from "./ui/UiIcon";

export default function ModerationSideDrawer({
  open,
  setOpen,
  prefilledArgs,
  allowedCategories,
}) {
  const [commandsAvailable, setCommandsAvailable] = useState(false);

  const user = useContext(UserContext);
  const inGame = useContext(InGameContext);
  const theme = useTheme();
  const errorAlert = useErrorAlert();

  // The drawer portals to <body>, so hiding the shell behind a game does not
  // hide it. Close it when a game takes the screen.
  useEffect(() => {
    if (inGame) setOpen(false);
  }, [inGame, setOpen]);

  return (
    <>
      <IconButton
        edge="start"
        color={COMMAND_COLOR}
        aria-label="Moderation tools"
        onClick={() => setOpen(true)}
        sx={{
          display: commandsAvailable ? undefined : "none",
          position: "fixed",
          top: "50%",
          left: 0,
          zIndex: 1201,
          visibility: open ? "hidden" : "visible",
          backgroundColor: COMMAND_COLOR,
          padding: "8px",
          borderRadius: "50%",
          boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.2)",
        }}
      >
        <UiIcon name="moderation" />
      </IconButton>
      <SwipeableDrawer
        anchor="left"
        open={open}
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        sx={{
          display: commandsAvailable ? undefined : "none",
          width: 240,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: 240, boxSizing: "border-box" },
        }}
      >
        <ModCommands
          height={"100%"}
          prefilledArgs={prefilledArgs}
          allowedCategories={allowedCategories}
          setCommandsAvailable={setCommandsAvailable}
        />
      </SwipeableDrawer>
    </>
  );
}
