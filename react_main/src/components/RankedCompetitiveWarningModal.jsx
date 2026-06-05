import React from "react";
import axios from "axios";
import { Button, Link, Typography } from "@mui/material";
import { Modal } from "components/Modal";

const WARNING_CONTENT = {
  ranked: {
    header: "Before You Play Ranked",
    paragraphs: [
      "Ranked games are actively moderated. You are expected to play in good faith, follow the site rules, and treat other players respectfully.",
      "Ranked play affects your skill rating and red hearts. You can also earn fortune from ranked wins, but that fortune does not count toward competitive standings.",
      "Violations in ranked games can result in ranked or competitive bans. If you would rather learn without that pressure, casual unranked games are always available.",
    ],
  },
  competitive: {
    header: "Before You Play Competitive",
    paragraphs: [
      "Competitive games are actively moderated tournament matches. You are expected to play in good faith, follow the site rules, and treat other players respectfully.",
      "Competitive play uses gold hearts and can award fortune points, prestige, and permanent trophies at the end of a season.",
      "Violations in competitive games can result in ranked or competitive bans. If you would rather play without that pressure, casual or ranked games are always available.",
    ],
  },
};

export function hasSeenModeWarning(user, mode) {
  const prop =
    mode === "ranked" ? "seenRankedWarning" : "seenCompetitiveWarning";
  const value = user?.settings?.[prop];
  return value === true || value === "true";
}

export function getPendingModeWarnings(user, { ranked = false, competitive = false } = {}) {
  const pending = [];
  if (ranked && !hasSeenModeWarning(user, "ranked")) pending.push("ranked");
  if (competitive && !hasSeenModeWarning(user, "competitive"))
    pending.push("competitive");
  return pending;
}

export default function RankedCompetitiveWarningModal({
  mode,
  show,
  onAcknowledge,
  onCancel,
}) {
  if (!mode || !WARNING_CONTENT[mode]) return null;

  const content = WARNING_CONTENT[mode];

  return (
    <Modal
      show={show}
      onBgClick={onCancel}
      header={content.header}
      content={
        <>
          {content.paragraphs.map((paragraph) => (
            <Typography key={paragraph} paragraph>
              {paragraph}
            </Typography>
          ))}
          <Typography paragraph>
            Read the full rules on the{" "}
            <Link href="/policy/rules">Policy page</Link>.
          </Typography>
        </>
      }
      footer={
        <>
          <Button onClick={onCancel}>Go Back</Button>
          <Button variant="contained" onClick={onAcknowledge}>
            I Understand
          </Button>
        </>
      }
    />
  );
}

export async function acknowledgeModeWarning(user, mode) {
  const prop =
    mode === "ranked" ? "seenRankedWarning" : "seenCompetitiveWarning";

  await axios.post("/api/user/settings/update", {
    prop,
    value: "true",
  });

  if (user?.updateSetting) {
    user.updateSetting(prop, true);
  }
}
