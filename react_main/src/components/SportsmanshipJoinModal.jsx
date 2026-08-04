import React, { useState } from "react";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";

/**
 * Text from docs/SPORTSMANSHIP.txt — First time join messages.
 * Keep wording AS-IS.
 */
const RANKED_CONTENT = {
  intro:
    "When you join ranked games, you agree to uphold a level of sportsmanship. We define sportsmanship on Ultimafia as:",
  bullets: [
    "Playing fair: Using the tools provided in the game to win the game to the best of your ability.",
    "Being respectful: Respecting your fellow players and their time.",
  ],
  closing:
    "It’s recommended that you have some familiarity with mafia, the party game (also known as werewolf) before playing ranked. If you wish to learn more, information can be found in the Learn section of the website and unranked games can be played without stakes.",
};

const COMPETITIVE_CONTENT = {
  intro:
    "When you join competitive games, you agree to uphold a level of sportsmanship. We define sportsmanship on Ultimafia as:",
  bullets: [
    "Playing fair: Using the tools provided in the game to win the game to the best of your ability.",
    "Being respectful: Respecting your fellow players and their time.",
  ],
  closing:
    "It’s recommended that you have some familiarity with Ultimafia specifically before playing competitive. If you are unsure of how mafia works on Ultimafia, consider starting with Ranked (red) games.",
};

export function SportsmanshipJoinModal({
  open,
  type,
  onAccept,
  onCancel,
}) {
  const [doNotShowAgain, setDoNotShowAgain] = useState(false);
  const content =
    type === "competitive" ? COMPETITIVE_CONTENT : RANKED_CONTENT;
  const title =
    type === "competitive"
      ? "Competitive Sportsmanship"
      : "Ranked Sportsmanship";

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      scroll="body"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body1" paragraph>
          {content.intro}
        </Typography>
        <List
          dense
          disablePadding
          sx={{
            listStyleType: "disc",
            pl: 2,
            mb: 2,
            "& .MuiListItem-root": { display: "list-item" },
          }}
        >
          {content.bullets.map((item) => (
            <ListItem key={item} disablePadding sx={{ py: 0.25 }}>
              <ListItemText
                primary={item}
                primaryTypographyProps={{ variant: "body1" }}
              />
            </ListItem>
          ))}
        </List>
        <Typography variant="body1" paragraph>
          {content.closing}
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={doNotShowAgain}
              onChange={(e) => setDoNotShowAgain(e.target.checked)}
            />
          }
          label="Do not show this again"
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} color="secondary">
          Cancel
        </Button>
        <Button
          onClick={() => onAccept(doNotShowAgain)}
          variant="contained"
          color="primary"
        >
          Accept
        </Button>
      </DialogActions>
    </Dialog>
  );
}
