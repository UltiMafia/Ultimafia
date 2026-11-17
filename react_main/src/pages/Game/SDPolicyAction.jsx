import React from "react";
import { UiDialog, UiAction } from "components/ui";

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

export function VetoAssentModal({ meeting, socket }) {
  const currentVote = meeting.votes ? Object.values(meeting.votes)[0] : null;

  const handleSelect = (selection) => {
    socket.send("vote", { meetingId: meeting.id, selection });
  };

  return (
    <UiDialog title="Veto request" dismissible={false} actions={<>
      <UiAction variant="primary" aria-pressed={currentVote === "Yes"} onClick={() => handleSelect("Yes")}>Accept veto</UiAction>
      <UiAction aria-pressed={currentVote === "No"} onClick={() => handleSelect("No")}>Reject veto</UiAction>
    </>}>
        <p>
          The Chancellor wants to discard all policies and advance the election tracker.
          Do you consent?
        </p>
    </UiDialog>
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
