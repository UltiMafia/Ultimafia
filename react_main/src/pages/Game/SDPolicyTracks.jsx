import React from "react";
import { Tooltip, Typography } from "@mui/material";

const POWER_LABELS = {
  PolicyPeek: "Policy Peek",
  InvestigateLoyalty: "Investigate Loyalty",
  CallSpecialElection: "Special Election",
  Execute: "Execute",
};

const POWER_ICONS = {
  PolicyPeek: "fas fa-eye",
  InvestigateLoyalty: "fas fa-search",
  CallSpecialElection: "fas fa-hand-point-up",
  Execute: "fas fa-skull",
};

const POWER_DESCRIPTIONS = {
  PolicyPeek:
    "The President secretly views the top 3 policies in the draw pile.",
  InvestigateLoyalty:
    "The President investigates a player's party membership card, learning whether they are Liberal or Fascist.",
  CallSpecialElection:
    "The President hand-picks the next Presidential Candidate, skipping the normal rotation.",
  Execute:
    "The President must execute one player. If Hitler is executed, Liberals win immediately.",
};


function ElectionTracker({ count }) {
  return (
    <Tooltip
      title={
        <Typography variant="body2">
          Counts consecutive failed elections. At 3, the top policy is automatically enacted and the tracker resets.
        </Typography>
      }
      placement="right"
      arrow
    >
      <div className="sd-election-tracker">
        {[0, 1, 2, 3].map((pos) => (
          <React.Fragment key={pos}>
            {pos > 0 && <div className="sd-election-tracker-line" />}
            <div className="sd-election-tracker-dot-wrapper">
              <div
                className={[
                  "sd-election-tracker-dot",
                  pos === count ? "sd-election-tracker-dot--active" : "",
                  pos === 3 ? "sd-election-tracker-dot--chaos" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              />
              <div className="sd-election-tracker-num">{pos}</div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </Tooltip>
  );
}

function DeckWidget({ deckInfo }) {
  if (!deckInfo) return null;
  const { deckSize, discardSize, refreshSize, startDeckLiberal, startDeckFascist } = deckInfo;

  return (
    <Tooltip
      title={
        <Typography variant="body2" component="div">
          <div>When the deck drops below {refreshSize} cards, the discard pile is reshuffled in.</div>
          <div style={{ marginTop: 6, color: "#aaa" }}>
            Original deck: {startDeckLiberal} Liberal · {startDeckFascist} Fascist ({startDeckLiberal + startDeckFascist} total)
          </div>
        </Typography>
      }
      placement="right"
      arrow
    >
      <div className="sd-deck-widget">
        <div className="sd-deck-stack">
          <div className="sd-deck-card sd-deck-card--back3" />
          <div className="sd-deck-card sd-deck-card--back2" />
          <div className="sd-deck-card sd-deck-card--top">
            <span className="sd-deck-count">{deckSize}</span>
          </div>
        </div>
        <div className="sd-deck-label">DECK</div>
      </div>
    </Tooltip>
  );
}

export function PolicyTracks({ policyInfo, presidentialPowersBoard, electionTracker, deckInfo }) {
  const liberalCount = policyInfo?.liberalPolicyCount ?? 0;
  const fascistCount = policyInfo?.fascistPolicyCount ?? 0;

  return (
    <div className="sd-policy-tracks">
      <div className="sd-policy-track">
        <div className="sd-policy-track-header sd-policy-track-header--liberal">
          LIBERAL
        </div>
        <div className="sd-policy-slots">
          {Array.from({ length: 5 }, (_, i) => {
            const slotNumber = i + 1;
            const enacted = slotNumber <= liberalCount;
            return (
              <div key={slotNumber} className="sd-policy-slot-wrapper">
                <div
                  className={[
                    "sd-policy-slot",
                    "sd-policy-slot--liberal",
                    enacted ? "sd-policy-slot--enacted" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                />
                {slotNumber === 5 && (
                  <div className="sd-policy-slot-label sd-policy-slot-label--win">
                    WIN
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="sd-tracker-row">
        <ElectionTracker count={electionTracker ?? 0} />
        <DeckWidget deckInfo={deckInfo} />
      </div>

      <div className="sd-policy-track">
        <div className="sd-policy-track-header sd-policy-track-header--fascist">
          FASCIST
        </div>
        <div className="sd-policy-slots">
          {Array.from({ length: 6 }, (_, i) => {
            const slotNumber = i + 1;
            const enacted = slotNumber <= fascistCount;
            const powerKey =
              presidentialPowersBoard?.[String(slotNumber)] ?? "";
            const powerLabel = POWER_LABELS[powerKey] ?? "";
            const powerIcon = POWER_ICONS[powerKey] ?? "";

            return (
              <div key={slotNumber} className="sd-policy-slot-wrapper">
                <div
                  className={[
                    "sd-policy-slot",
                    "sd-policy-slot--fascist",
                    enacted ? "sd-policy-slot--enacted" : "",
                    powerKey ? "sd-policy-slot--has-power" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {powerIcon && (
                    <Tooltip
                      title={
                        <>
                          <strong>{powerLabel}</strong>
                          <Typography variant="body2" style={{ marginTop: 4 }}>
                            {POWER_DESCRIPTIONS[powerKey]}
                          </Typography>
                        </>
                      }
                      placement="top"
                      arrow
                    >
                      <i className={`${powerIcon} sd-policy-slot-power-icon`} style={{ pointerEvents: "auto" }} />
                    </Tooltip>
                  )}
                </div>
                {slotNumber === 6 && (
                  <div className="sd-policy-slot-label sd-policy-slot-label--win">
                    WIN
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
