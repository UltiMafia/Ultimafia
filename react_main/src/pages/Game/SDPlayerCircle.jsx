import React, { useState, useContext } from "react";
import { SiteInfoContext } from "Contexts";
import { RoleCount } from "components/Roles";

const CONFIRM_DIALOG_TEXT = {
  "Nominate Chancellor": (name) => `Nominate ${name} as Chancellor?`,
  "Execute": (name) => `Execute ${name}?`,
  "Nominate as Presidential Candidate": (name) => `Nominate ${name} for Special Election?`,
  "Investigate Loyalty": (name) => `Investigate ${name}'s loyalty?`,
};

export function PlayerCircle({
  players,
  candidateInfo,
  nominationMeeting,
  executiveMeeting,
  electionMeeting,
  voteResults,
  selfId,
  socket,
  roles,
}) {
  const siteInfo = useContext(SiteInfoContext);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const {
    lastElectedPresident,
    lastElectedChancellor,
    presidentialNominee,
    chancellorNominee,
  } = candidateInfo || {};

  // Whichever player-select meeting is active drives token highlights
  const activeMeeting = nominationMeeting || executiveMeeting;
  const eligibleTargets = new Set(activeMeeting?.targets || []);

  const electionMemberIds = new Set(
    (electionMeeting?.members || []).map((m) => m.id)
  );

  const handleTokenClick = (player) => {
    if (!activeMeeting || !eligibleTargets.has(player.id)) return;
    setConfirmTarget(player);
  };

  const handleConfirm = () => {
    if (!confirmTarget || !activeMeeting) return;
    socket.send("vote", {
      meetingId: activeMeeting.id,
      selection: confirmTarget.id,
    });
    setConfirmTarget(null);
  };

  const handleCancel = () => setConfirmTarget(null);

  const handleVote = (choice) => {
    if (!electionMeeting) return;
    socket.send("vote", {
      meetingId: electionMeeting.id,
      selection: choice,
    });
  };

  const n = players.length;
  const radius = 200;
  const cx = 250;
  const cy = 250;

  return (
    <>
      <div className="sd-circle-container" style={{ width: 560, height: 560, position: "relative" }}>
        {players.map((player, i) => {
          const angle = (2 * Math.PI * i) / n - Math.PI / 2;
          const left = cx + radius * Math.cos(angle);
          const top = cy + radius * Math.sin(angle);

          const roleName = roles[player.id];

          const isPresidentialNominee = player.name === presidentialNominee;
          const isChancellorNominee = player.name === chancellorNominee;
          const isLastPresident = player.name === lastElectedPresident;
          const isLastChancellor = player.name === lastElectedChancellor;
          const isDead = !!player.dead;
          const isEligible = eligibleTargets.has(player.id);
          const isSelf = player.id === selfId;

          const avatarUrl = player.avatar && player.userId
            ? `/uploads/${player.userId}_avatar.webp?t=${siteInfo.cacheVal}`
            : null;
          const avatarContent = avatarUrl
            ? <img src={avatarUrl} alt={player.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
            : (player.name ? player.name.charAt(0).toUpperCase() : "👤");

          let placard = null;
          if (isPresidentialNominee) {
            placard = <div className="sd-placard sd-placard--president">President</div>;
          } else if (isChancellorNominee) {
            placard = <div className="sd-placard sd-placard--chancellor">Chancellor</div>;
          }

          let prevCornerIcon = null;
          if (!isPresidentialNominee && !isChancellorNominee) {
            if (isLastPresident) {
              prevCornerIcon = <div className="sd-prev-corner sd-prev-corner--president" title="Previous President"><i className="fas fa-crown" /></div>;
            } else if (isLastChancellor) {
              prevCornerIcon = <div className="sd-prev-corner sd-prev-corner--chancellor" title="Previous Chancellor"><i className="fas fa-landmark" /></div>;
            }
          }

          // Determine vote card to display below this player's token
          let voteCard = null;
          if (i === 0) console.log("[SD votes]", { electionMeeting: !!electionMeeting, voteResults, playerIds: players.map(p => p.id) });

          if (electionMeeting && electionMemberIds.has(player.id)) {
            if (isSelf) {
              // Always show both cards; highlight the selected one in yellow
              const myVote = electionMeeting.votes?.[selfId];
              voteCard = (
                <div className="sd-vote-buttons">
                  <button
                    className={`sd-vote-btn sd-vote-btn--ja${myVote === "Ja!" ? " sd-vote-btn--selected" : ""}`}
                    onClick={(e) => { e.stopPropagation(); handleVote("Ja!"); }}
                  >
                    Ja!
                  </button>
                  <button
                    className={`sd-vote-btn sd-vote-btn--nein${myVote === "Nein!" ? " sd-vote-btn--selected" : ""}`}
                    onClick={(e) => { e.stopPropagation(); handleVote("Nein!"); }}
                  >
                    Nein!
                  </button>
                </div>
              );
            }
          } else if (!electionMeeting && voteResults && voteResults[player.id]) {
            const result = voteResults[player.id];
            voteCard = (
              <div className={`sd-vote-card sd-vote-card--${result === "Ja!" ? "ja" : "nein"} sd-vote-card--persisted`}>
                {result}
              </div>
            );
          }

          return (
            <div
              key={player.id || player.userId || i}
              className={[
                "sd-player-token",
                isDead ? "dead" : "",
                isEligible ? "sd-player-token--eligible" : "",
              ].filter(Boolean).join(" ")}
              style={{
                position: "absolute",
                left,
                top,
                transform: "translate(-50%, -50%)",
                opacity: isDead ? 0.4 : 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                cursor: isEligible && activeMeeting ? "pointer" : "default",
              }}
              onClick={() => handleTokenClick(player)}
            >
              <div className="sd-token-avatar-wrap">
                <div className={`sd-token-avatar${isEligible ? " sd-token-avatar--eligible" : ""}`}>
                  {avatarContent}
                </div>
                {prevCornerIcon}
              </div>
              {placard}
              <div className="sd-token-name-row">
                <div
                  className="sd-token-name"
                  style={{
                    textDecoration: isDead ? "line-through" : "none",
                  }}
                >
                  {player.name}
                </div>
                {roleName && (
                  <div className="sd-role-col">
                    <RoleCount role={roleName} gameType="Secret Dictator" showPopover small />
                    {isSelf && <div className="sd-you-tag">YOU</div>}
                  </div>
                )}
              </div>
              {voteCard}
            </div>
          );
        })}
      </div>

      {confirmTarget && activeMeeting && (
        <div className="sd-nominate-overlay" onClick={handleCancel}>
          <div className="sd-nominate-dialog" onClick={(e) => e.stopPropagation()}>
            <p className="sd-nominate-text">
              {(CONFIRM_DIALOG_TEXT[activeMeeting.actionName] || ((n) => `${activeMeeting.actionName}: ${n}?`))(confirmTarget.name)
                .split(new RegExp(`(${confirmTarget.name})`))
                .map((part, i) => part === confirmTarget.name
                  ? <strong key={i}>{part}</strong>
                  : part
                )}
            </p>
            <div className="sd-nominate-actions">
              <button className="sd-nominate-btn sd-nominate-btn--ok" onClick={handleConfirm}>
                OK
              </button>
              <button className="sd-nominate-btn sd-nominate-btn--cancel" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
