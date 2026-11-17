import React, { useContext, useState } from "react";
import axios from "axios";
import { Tooltip } from "@mui/material";
import { UserContext } from "Contexts";
import { useErrorAlert } from "components/Alerts";
import { UiAction, UiIcon } from "components/ui";
import { KUDOS_ICON, KARMA_ICON, POINTS_ICON, POINTS_NEGATIVE_ICON, PRESTIGE_ICON } from "./profileIcons";
import "css/profileReputation.css";

const facts = [
  ["Kudos", KUDOS_ICON, "kudos", "Earned from outstanding performance in ranked and competitive games."],
  ["Fortune", POINTS_ICON, "points", "Earned by winning ranked and competitive games. Accumulates toward prestige at the end of a competitive round."],
  ["Misfortune", POINTS_NEGATIVE_ICON, "pointsNegative", "Accumulated from losing ranked and competitive games."],
  ["Prestige", PRESTIGE_ICON, "championshipPoints", "Awarded to the top 10 fortune earners at the end of each competitive round."],
];

export default function ProfileReputation({ karma, setKarma, userId, values }) {
  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();
  const [pending, setPending] = useState(false);
  const signedIn = user.loggedIn;
  const canVote = signedIn && Boolean(user.perms?.vote);

  async function vote(direction) {
    if (!canVote || pending) return;
    setPending(true);
    const previous = karma;
    const nextVote = previous.vote === direction ? 0 : direction;
    const voteCount = previous.voteCount - previous.vote + nextVote;
    setKarma({ ...previous, vote: nextVote, voteCount });
    try {
      const { data } = await axios.post("/api/user/karma", { targetId: userId, direction });
      setKarma(previousKarma => ({ ...previousKarma, vote: Number(data), voteCount: previous.voteCount - previous.vote + Number(data) }));
    } catch (error) { setKarma(previous); errorAlert(error); }
    finally { setPending(false); }
  }

  const voteDescription = user.id === userId ? "This is your profile." : karma.vote === 1 ? "You upvoted this profile." : karma.vote === -1 ? "You downvoted this profile." : "You have not voted on this profile.";

  return <section className="profile-reputation" aria-label="Reputation">
    <div className="profile-karma" aria-label={`Karma: ${karma.voteCount}`}>
      <img src={KARMA_ICON} alt="" className="profile-reputation-icon" />
      <div className="profile-karma-copy">
        <div className="profile-karma-score">
          <strong>{karma.voteCount}</strong>
          <span>Karma</span>
          {canVote && <div className="profile-karma-actions" role="group" aria-label="Vote on this profile">
            <UiAction iconOnly variant="ghost" aria-label="Upvote profile" aria-pressed={karma.vote === 1} disabled={pending} onClick={() => vote(1)}><UiIcon name="up" /></UiAction>
            <UiAction iconOnly variant="ghost" aria-label="Downvote profile" aria-pressed={karma.vote === -1} disabled={pending} onClick={() => vote(-1)}><UiIcon name="down" /></UiAction>
          </div>}
        </div>
        <small>{signedIn ? voteDescription : "Profile upvotes from other players"}</small>
      </div>
    </div>
    <dl className="profile-reputation-facts">
      {facts.map(([label, icon, key, description]) => <Tooltip key={label} title={description} arrow>
        <div><dt><img src={icon} alt="" />{label}</dt><dd>{Number(values[key] || 0).toLocaleString()}</dd></div>
      </Tooltip>)}
    </dl>
  </section>;
}
