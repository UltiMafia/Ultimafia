import React from "react";
import { Link } from "react-router-dom";

import { NameWithAvatar } from "pages/User/UserWidgets";

const TYPE_VERBS = {
  comment: "commented on",
  thread: "posted thread",
  forumReply: "replied in",
  setupCreate: "created setup",
  setupEdit: "edited setup",
  pollVote: "voted on",
  stampTrade: "stamp trade",
  trophyAward: "awarded a trophy",
  modAction: "mod action",
  report: "filed a report",
  upvote: "voted on",
  login: "logged in",
  deckCreate: "created a deck",
  avatarChange: "changed avatar",
  nameChange: "changed name",
  settingsChange: "changed settings",
};

const CATEGORY_COLORS = {
  comments: "#b161d3",
  forum: "#d38d61",
  setups: "#61c7d3",
  polls: "#ebd722",
  profile: "#5cb85c",
  mod: "#e45050",
  upvotes: "#7d7d7d",
  logins: "#6c8ef1",
};

function relativeTime(ts) {
  if (!ts) return { value: "—", unit: "" };
  const diff = Date.now() - ts;
  if (diff < 60_000) return { value: "now", unit: "" };
  if (diff < 3_600_000)
    return { value: String(Math.floor(diff / 60_000)), unit: "m" };
  if (diff < 86_400_000)
    return { value: String(Math.floor(diff / 3_600_000)), unit: "h" };
  return { value: String(Math.floor(diff / 86_400_000)), unit: "d" };
}

// Backend already emits human-readable labels like "Setup: Coco's Epic"
// or "Role: Agent", so no further transformation is needed.
function prettyLabel(item) {
  return item.targetLabel || null;
}

export default function ActivityRow({ item, last }) {
  const verb = TYPE_VERBS[item.type] || item.type;
  const color = CATEGORY_COLORS[item.category] || "#7d7d7d";
  const label = prettyLabel(item);
  const time = relativeTime(item.timestamp);

  const targetEl = label ? (
    item.link ? (
      <Link
        to={item.link}
        style={{
          color: "inherit",
          fontWeight: 600,
          textDecoration: "none",
          borderBottom: `1px dotted ${color}aa`,
        }}
      >
        {label}
      </Link>
    ) : (
      <span className="activity-target-label">
        {label}
      </span>
    )
  ) : null;

  return (
    <article className="activity-row" data-last={last || undefined}>
      <div className="activity-actor">
        {item.actorId ? (
          <NameWithAvatar
            small
            id={item.actorId}
            name={item.actorName}
            avatar={item.actorAvatar}
          />
        ) : (
          <span>System</span>
        )}
      </div>
      <span className="activity-verb">{verb}</span>
      <div className="activity-target">
        {targetEl}
        {item.contentPreview && <span className="activity-preview"> — {item.contentPreview}</span>}
      </div>
      <span className="activity-time">{time.value}{time.unit}</span>
    </article>
  );
}
