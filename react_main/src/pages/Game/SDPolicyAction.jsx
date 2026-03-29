import React from "react";

function PolicyCard({ policy, selected, onClick }) {
  const isVeto = policy === "Veto Agenda";
  const isLiberal = policy === "Liberal";
  const modifier = isVeto ? "veto" : isLiberal ? "liberal" : "fascist";
  return (
    <button
      className={`sd-policy-card sd-policy-card--${modifier}${selected ? " sd-policy-card--selected" : ""}`}
      onClick={onClick}
    >
      <span className="sd-policy-card-label">{policy}</span>
    </button>
  );
}

function VetoAssentModal({ meeting, socket }) {
  const currentVote = meeting.votes ? Object.values(meeting.votes)[0] : null;

  const handleSelect = (selection) => {
    socket.send("vote", { meetingId: meeting.id, selection });
  };

  return (
    <div className="sd-peek-overlay">
      <div className="sd-peek-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="sd-peek-title">VETO REQUEST</div>
        <div className="sd-peek-subtitle">
          The Chancellor wants to discard all policies and advance the election tracker.
          Do you consent?
        </div>
        <div className="sd-veto-assent-buttons">
          <button
            className={`sd-veto-assent-btn sd-veto-assent-btn--accept${currentVote === "Yes" ? " sd-veto-assent-btn--selected" : ""}`}
            onClick={() => handleSelect("Yes")}
          >
            Accept Veto
          </button>
          <button
            className={`sd-veto-assent-btn sd-veto-assent-btn--reject${currentVote === "No" ? " sd-veto-assent-btn--selected" : ""}`}
            onClick={() => handleSelect("No")}
          >
            Reject Veto
          </button>
        </div>
      </div>
    </div>
  );
}

export function SDPolicyAction({ discardMeeting, enactMeeting, vetoMeeting, socket }) {
  if (vetoMeeting && !vetoMeeting.playerHasVoted) {
    return <VetoAssentModal meeting={vetoMeeting} socket={socket} />;
  }

  const activeMeeting = discardMeeting || enactMeeting;
  if (!activeMeeting || activeMeeting.playerHasVoted) return null;

  const handleSelect = (selection) => {
    socket.send("vote", { meetingId: activeMeeting.id, selection });
  };

  const currentVote = activeMeeting.votes
    ? Object.values(activeMeeting.votes)[0]
    : null;

  return (
    <div className="sd-policy-action">
      <div className="sd-policy-action-label">{activeMeeting.actionName}</div>
      <div className="sd-policy-card-tray">
        {(activeMeeting.targets || []).map((policy, i) => (
          <PolicyCard
            key={`${policy}-${i}`}
            policy={policy}
            selected={currentVote === policy}
            onClick={() => handleSelect(policy)}
          />
        ))}
      </div>
    </div>
  );
}
