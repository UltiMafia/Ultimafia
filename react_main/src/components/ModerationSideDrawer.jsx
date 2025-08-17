import React, { useEffect, useState, useContext } from "react";
import { Redirect } from "react-router-dom";

import axios from "axios";
import { Alert, Box, Button, Divider, IconButton, Paper, Stack, SwipeableDrawer, TextField, Typography, useTheme } from "@mui/material";
import { UserContext } from "Contexts";
import { useErrorAlert } from "components/Alerts";

import { ModCommands, COMMAND_COLOR } from "pages/Community/Moderation"
import hammer from "images/emotes/hammer.webp";

export default function ModerationSideDrawer({open, setOpen, prefilledArgs}) {
  const [commandsAvailable, setCommandsAvailable] = useState(false);

  const user = useContext(UserContext);
  const theme = useTheme();
  const errorAlert = useErrorAlert();

  return (
    <>
      <IconButton
        edge="start"
        color={COMMAND_COLOR}
        aria-label="menu"
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
        <img src={hammer} />
      </IconButton>
      <Paper
        onClick={() => setOpen(true)}
        sx={{
          display: commandsAvailable ? undefined : "none",
          position: "fixed",
          top: 0,
          left: 0,
          height: "100%",
          width: "10px",
          backgroundColor: "transparent",
          zIndex: 1200,
          cursor: "pointer",
        }}
      />
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
        <ModCommands height={"100%"} prefilledArgs={prefilledArgs} setCommandsAvailable={setCommandsAvailable}/>
      </SwipeableDrawer>
    </>
  );
}