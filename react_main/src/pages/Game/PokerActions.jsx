import React, { useContext, useEffect, useMemo, useState } from "react";
import { GameContext } from "../../Contexts";
import { Slider } from "@mui/material";
import { UiAction, UiDialog, UiField } from "components/ui";

export default function PokerActions() {
  const game = useContext(GameContext);
  const stateViewing = game.stateViewing;
  const state = game.history.states[stateViewing];
  const isCurrentState = stateViewing === game.history.currentState;
  const extraInfo = state?.extraInfo;
  const meetings = state?.meetings;
  const selfId = game.self;

  // The Microphone item creates two meetings during a player's turn:
  //   - "Move"   (custom inputType, targets like ["Call","Fold"] or ["Check","Fold"])
  //   - "Raise"  (text inputType, numeric, sends the bet amount)
  const moveMeeting = useMemo(
    () =>
      meetings
        ? Object.values(meetings).find(
            (m) => m && m.name === "Move" && m.amMember
          )
        : undefined,
    [meetings]
  );
  const raiseMeeting = useMemo(
    () =>
      meetings
        ? Object.values(meetings).find(
            (m) => m && m.name === "Raise" && m.amMember
          )
        : undefined,
    [meetings]
  );

  const myTurn = !game.review && isCurrentState && !!moveMeeting && moveMeeting.canVote;
  const currentTurnName = extraInfo?.whoseTurnName || "";

  const me = (extraInfo?.randomizedPlayers || []).find(
    (p) => p.playerId === selfId
  );
  const myChips = me?.Chips ?? 0;
  const myBidding = me?.Bets ?? 0;
  const lastAmountBid = extraInfo?.lastAmountBid ?? 0;
  const minimumBet = extraInfo?.minimumBet ?? 1;

  const callAmount = Math.max(0, lastAmountBid - myBidding);
  const callIsAllIn = callAmount > 0 && myChips < callAmount;
  const isCheck = callAmount === 0;
  const moveTargets = Array.isArray(moveMeeting?.targets)
    ? moveMeeting.targets
    : [];

  // Smallest valid raise (extra chips on top of what the player has already put in)
  // Server requires: target + AmountBidding >= lastAmountBid AND >= minimumBet,
  // and target <= myChips.
  const minRaiseExtra = Math.max(
    1,
    Math.max(lastAmountBid, minimumBet) - myBidding
  );
  const maxRaiseExtra = Math.max(minRaiseExtra, myChips);

  const [raisePopoverOpen, setRaisePopoverOpen] = useState(false);
  const [raiseAmount, setRaiseAmount] = useState(minRaiseExtra);

  // Reset/clamp raise amount whenever bounds change or popover toggles
  useEffect(() => {
    setRaiseAmount((prev) => {
      const clamped = Math.min(maxRaiseExtra, Math.max(minRaiseExtra, prev));
      return Number.isFinite(clamped) ? clamped : minRaiseExtra;
    });
  }, [minRaiseExtra, maxRaiseExtra, raisePopoverOpen]);

  // Close popover when it stops being your turn
  useEffect(() => {
    if (!myTurn && raisePopoverOpen) setRaisePopoverOpen(false);
  }, [myTurn, raisePopoverOpen]);

  if (!state || !extraInfo) return null;

  function castMoveVote(selection) {
    if (!myTurn || !moveMeeting || !moveTargets.includes(selection)) return;
    game.socket.send("vote", {
      meetingId: moveMeeting.id,
      selection,
    });
  }

  function castRaiseVote(amount) {
    if (!myTurn || !raiseMeeting?.canVote) return;
    game.socket.send("vote", {
      meetingId: raiseMeeting.id,
      selection: String(amount),
    });
    setRaisePopoverOpen(false);
  }

  function handleRaiseClick() {
    if (!myTurn) return;
    setRaisePopoverOpen((open) => !open);
  }

  const callLabel = isCheck
    ? "Check"
    : callIsAllIn
    ? `Call All-In (${myChips})`
    : `Call ${callAmount}`;

  const canFold = moveTargets.includes("Fold");
  const canCallOrCheck =
    moveTargets.includes("Call") || moveTargets.includes("Check");
  const canRaise = !!raiseMeeting && myChips > 0 && raiseMeeting.canVote;

  // The pot is recorded in the state for "% of pot" raise shortcuts
  const pot = extraInfo.ThePot || 0;
  const halfPot = Math.max(minRaiseExtra, Math.min(maxRaiseExtra, Math.floor(pot / 2)));
  const fullPot = Math.max(minRaiseExtra, Math.min(maxRaiseExtra, pot));

  return (
    <div className="poker-actions-wrap">
      <div
        className="poker-actions-status"
        style={myTurn ? { visibility: "hidden" } : undefined}
      >
        {myTurn
          ? " "
          : currentTurnName
          ? `Waiting for ${currentTurnName}…`
          : "Waiting for next turn…"}
      </div>

      <div className={`poker-actions${myTurn ? "" : " poker-actions--disabled"}`}>
        <UiAction variant="danger-quiet" style={{ flex: 1 }}
          onClick={() => castMoveVote("Fold")}
          disabled={!myTurn || !canFold}
        >
          Fold
        </UiAction>

        <UiAction variant="primary" style={{ flex: 1 }}
          onClick={() => castMoveVote(isCheck ? "Check" : "Call")}
          disabled={!myTurn || !canCallOrCheck}
        >
          {callLabel}
        </UiAction>

        <div className="poker-action-raise-wrap">
          <UiAction style={{ width: "100%" }}
            onClick={handleRaiseClick}
            disabled={!myTurn || !canRaise}
          >
            Raise
          </UiAction>

          {raisePopoverOpen && canRaise && (
            <PokerRaisePopover
              minRaise={minRaiseExtra}
              maxRaise={maxRaiseExtra}
              halfPot={halfPot}
              fullPot={fullPot}
              amount={raiseAmount}
              onAmountChange={setRaiseAmount}
              onConfirm={() => castRaiseVote(raiseAmount)}
              onCancel={() => setRaisePopoverOpen(false)}
              callAmount={callAmount}
              myBidding={myBidding}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export function PokerRaisePopover({
  minRaise,
  maxRaise,
  halfPot,
  fullPot,
  amount,
  onAmountChange,
  onConfirm,
  onCancel,
  callAmount,
  myBidding,
}) {
  function setClamped(value) {
    const n = parseInt(value, 10);
    if (Number.isNaN(n)) {
      onAmountChange(minRaise);
      return;
    }
    onAmountChange(Math.min(maxRaise, Math.max(minRaise, n)));
  }

  // Show the resulting total bid for clarity ("you'd be at X total")
  const totalBidIfConfirmed = myBidding + amount;
  const aboveCallBy = Math.max(0, amount - callAmount);

  return (
    <UiDialog title="Raise amount" onClose={onCancel} actions={<>
      <UiAction onClick={onCancel}>Cancel</UiAction>
      <UiAction variant="primary" onClick={onConfirm}>Confirm</UiAction>
    </>}>
      <div className="ui-form-stack">
       <p>Your resulting total bid: {totalBidIfConfirmed}.</p>
        {aboveCallBy > 0 && (
          <span>
             {callAmount > 0 ? `${aboveCallBy} above the call amount.` : "First bet."}
          </span>
        )}
      <Slider
        min={minRaise}
        max={maxRaise}
        value={amount}
        step={1}
        onChange={(_, value) => setClamped(value)}
        aria-label="Raise amount slider"
      />

        <UiField fullWidth label="Raise amount"
          type="number"
          value={amount}
          inputProps={{ min: minRaise, max: maxRaise, step: 1 }}
          onChange={(e) => setClamped(e.target.value)}
        />
        <div className="ui-action-row ui-amount-shortcuts">
          <UiAction
            onClick={() => onAmountChange(minRaise)}
          >
            Min
          </UiAction>
          <UiAction
            onClick={() => onAmountChange(halfPot)}
            disabled={halfPot <= minRaise}
          >
            ½ Pot
          </UiAction>
          <UiAction
            onClick={() => onAmountChange(fullPot)}
            disabled={fullPot <= minRaise}
          >
            Pot
          </UiAction>
          <UiAction
            onClick={() => onAmountChange(maxRaise)}
          >
            All-in
          </UiAction>
        </div>
      </div>

    </UiDialog>
  );
}
