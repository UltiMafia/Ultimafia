import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

import { UserContext } from "../Contexts";

// Soft prompt for new accounts to play the tutorial before ranked games.
// The server decides who's eligible (user.tutorialPrompt: joined after the
// tutorial shipped and hasn't finished one). Skip is always allowed.

const BANNER_KEY = "tutorialBannerDismissed";
const RANKED_SKIP_KEY = "tutorialRankedSkipped";

export function useTutorialPrompt() {
  const user = useContext(UserContext);
  return Boolean(user && user.loggedIn && user.tutorialPrompt);
}

export function TutorialLobbyBanner() {
  const eligible = useTutorialPrompt();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(BANNER_KEY) === "1"
  );
  if (!eligible || dismissed) return null;

  return (
    <Alert
      severity="info"
      icon={<span>📘</span>}
      data-testid="tutorial-banner"
      action={
        <>
          <Button component={Link} to="/play/tutorial" size="small" variant="contained">
            Play tutorial
          </Button>
          <Button
            size="small"
            color="inherit"
            onClick={() => {
              localStorage.setItem(BANNER_KEY, "1");
              setDismissed(true);
            }}
          >
            Skip
          </Button>
        </>
      }
    >
      New here? Play a quick guided game against bots before jumping into ranked.
    </Alert>
  );
}

// Wrap a ranked/competitive Join: returns an onClick that shows the dialog
// first (once per browser session) and the dialog element to render.
export function useRankedTutorialGate(onProceed) {
  const eligible = useTutorialPrompt();
  const [open, setOpen] = useState(false);

  function guard(e) {
    if (!eligible || sessionStorage.getItem(RANKED_SKIP_KEY) === "1") return;
    e.preventDefault();
    setOpen(true);
  }

  const dialog = (
    <Dialog open={open} onClose={() => setOpen(false)} data-testid="tutorial-ranked-dialog">
      <DialogTitle>Try the tutorial first?</DialogTitle>
      <DialogContent>
        <Typography variant="body2">
          Ranked games count toward your rating. If you're new, a short guided
          tutorial game against bots shows you how claims, investigations and
          the Mafia work. It doesn't affect your stats.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            sessionStorage.setItem(RANKED_SKIP_KEY, "1");
            setOpen(false);
            onProceed();
          }}
        >
          Skip, join ranked
        </Button>
        <Button component={Link} to="/play/tutorial" variant="contained" onClick={() => setOpen(false)}>
          Play tutorial
        </Button>
      </DialogActions>
    </Dialog>
  );

  return { guard, dialog };
}
