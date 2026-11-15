import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { Alert } from "@mui/material";

import { UserContext } from "../Contexts";
import { UiText as Typography, UiAction, UiDialog } from "components/ui";

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
          <UiAction component={Link} to="/play/tutorial" size="small" variant="primary">
            Play tutorial
          </UiAction>
          <UiAction
             variant="ghost" size="small" 
            
            onClick={() => {
              localStorage.setItem(BANNER_KEY, "1");
              setDismissed(true);
            }}
          >
            Skip
          </UiAction>
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
    <UiDialog
      open={open}
      onClose={() => setOpen(false)}
      title="Try the tutorial first?"
      actions={<>
        <UiAction
           variant="ghost" onClick={() => {
            sessionStorage.setItem(RANKED_SKIP_KEY, "1");
            setOpen(false);
            onProceed();
          }}
        >
          Skip, join ranked
        </UiAction>
        <UiAction component={Link} to="/play/tutorial" variant="primary" onClick={() => setOpen(false)}>
          Play tutorial
        </UiAction>
      </>}
    >
        <Typography variant="body2">
          Ranked games count toward your rating. If you're new, a short guided
          tutorial game against bots shows you how claims, investigations and
          the Mafia work. It doesn't affect your stats.
        </Typography>
    </UiDialog>
  );

  return { guard, dialog };
}
