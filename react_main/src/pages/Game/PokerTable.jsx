import React, { useContext, useMemo } from "react";
import { GameContext } from "../../Contexts";
import { SiteInfoContext } from "Contexts";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";

function PokerChipStack({ chips }) {
  const tooltip = `${chips} chips`;
  return (
    <span
      className={`poker-chip-stack${chips <= 0 ? " poker-chip-stack--empty" : ""}`}
      data-tooltip={tooltip}
      aria-label={tooltip}
    >
      <span className="poker-chip-count">{chips}</span>
    </span>
  );
}

const POSITION_MARKERS = {
  dealer: { label: "D", className: "poker-marker--dealer", title: "Dealer" },
  smallBlind: {
    label: "SB",
    className: "poker-marker--small-blind",
    title: "Small Blind",
  },
  bigBlind: {
    label: "BB",
    className: "poker-marker--big-blind",
    title: "Big Blind",
  },
};

export default function PokerTable() {
  const game = useContext(GameContext);
  const siteInfo = useContext(SiteInfoContext);
  const isPhoneDevice = useIsPhoneDevice();

  const stateViewing = game.stateViewing;
  const state = game.history.states[stateViewing];
  const extraInfo = state?.extraInfo;
  const randomizedPlayers = extraInfo?.randomizedPlayers ?? null;
  const selfId = game.self;
  const players = game.players;

  // Self anchored at the bottom; others fan clockwise around the oval.
  const reorderedSeats = useMemo(() => {
    if (!Array.isArray(randomizedPlayers) || randomizedPlayers.length === 0) {
      return [];
    }
    const selfIdx = randomizedPlayers.findIndex((p) => p.playerId === selfId);
    if (selfIdx < 0) return randomizedPlayers;
    return [
      ...randomizedPlayers.slice(selfIdx),
      ...randomizedPlayers.slice(0, selfIdx),
    ];
  }, [randomizedPlayers, selfId]);

  if (stateViewing < 0 || !state || !extraInfo) return null;

  const {
    whoseTurnIsIt,
    ThePot = 0,
    CommunityCards = [],
    dealerId,
    smallBlindId,
    bigBlindId,
    isTheFlyingDutchman,
    Phase,
    RoundNumber,
  } = extraInfo;

  const n = reorderedSeats.length;

  return (
    <div
      className={`poker-table-wrapper${
        isTheFlyingDutchman ? " poker-table-wrapper--dutchman" : ""
      }`}
    >
      <div className="poker-round-banner">
        {Phase ? <span className="poker-phase">{Phase}</span> : null}
        {typeof RoundNumber === "number" ? (
          <span className="poker-round-number">Round {RoundNumber + 1}</span>
        ) : null}
      </div>

      <div className="poker-table">
        <div className="poker-felt">
          <div className="poker-center">
            <div className="poker-community-cards">
              {Array.from({ length: 5 }).map((_, i) => {
                const card = CommunityCards[i];
                return (
                  <div
                    key={i}
                    className={
                      card
                        ? `card c${card} poker-community-card poker-community-card--filled`
                        : "card poker-community-card poker-community-card--empty"
                    }
                  />
                );
              })}
            </div>
            <div className="poker-pot" title={`Pot: ${ThePot} chips`}>
              <span className="poker-pot-icon" aria-hidden>
                <i className="fas fa-coins" />
              </span>
              <span className="poker-pot-amount">{ThePot}</span>
              <span className="poker-pot-label">Pot</span>
            </div>
          </div>

          {reorderedSeats.map((seat, i) => (
            <PokerSeat
              key={seat.playerId || seat.userId || i}
              seat={seat}
              indexInLayout={i}
              total={n}
              isSelf={seat.playerId === selfId}
              isCurrentTurn={seat.userId === whoseTurnIsIt}
              isDealer={seat.userId === dealerId}
              isSmallBlind={seat.userId === smallBlindId}
              isBigBlind={seat.userId === bigBlindId}
              isShowdown={Phase === "Showdown"}
              players={players}
              cacheVal={siteInfo?.cacheVal}
              isPhoneDevice={isPhoneDevice}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PokerSeat({
  seat,
  indexInLayout,
  total,
  isSelf,
  isCurrentTurn,
  isDealer,
  isSmallBlind,
  isBigBlind,
  isShowdown,
  players,
  cacheVal,
  isPhoneDevice,
}) {
  // Self at bottom (angle = pi/2), others spread clockwise.
  // On mobile, push seats further out so names don't overlap the felt.
  const angle =
    Math.PI / 2 + (2 * Math.PI * indexInLayout) / Math.max(total, 1);
  const radius = isPhoneDevice ? 50 : 42;
  const sin = Math.sin(angle);
  // On mobile, give the bottom half of the table extra vertical room so the
  // cards/name/badges of those seats clear the felt edge.
  const topBoost = isPhoneDevice && sin > 0.1 ? 10 : 0;
  const leftPct = 50 + radius * Math.cos(angle);
  const topPct = 50 + radius * sin + topBoost;

  const livePlayer = players?.[seat.playerId];
  const avatarUrl =
    livePlayer?.avatar && seat.userId
      ? `/uploads/${seat.userId}_avatar.webp?t=${cacheVal}`
      : null;

  const initial = seat.playerName
    ? seat.playerName.charAt(0).toUpperCase()
    : "?";

  const cards = Array.isArray(seat.CardsInHand) ? seat.CardsInHand : [];
  const showFaceUp = isSelf || isShowdown;
  const folded = seat.Folded === true;

  const positionBadges = [];
  if (isDealer) positionBadges.push(POSITION_MARKERS.dealer);
  if (isSmallBlind) positionBadges.push(POSITION_MARKERS.smallBlind);
  if (isBigBlind) positionBadges.push(POSITION_MARKERS.bigBlind);

  const seatClass = [
    "poker-seat",
    isSelf ? "poker-seat--self" : "",
    isCurrentTurn ? "poker-seat--current-turn" : "",
    folded ? "poker-seat--folded" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const betTooltip = `Current bid: ${seat.Bets || 0}`;

  return (
    <div
      className={seatClass}
      style={{ left: `${leftPct}%`, top: `${topPct}%` }}
    >
      <div className="poker-seat-cards">
        {cards.length === 0
          ? // Two empty placeholders so layout doesn't collapse before deal
            [0, 1].map((i) => (
              <div
                key={i}
                className={`card poker-hole-card poker-hole-card--empty${
                  isSelf ? "" : " poker-hole-card--opponent"
                }`}
              />
            ))
          : cards.map((card, i) => (
              <div
                key={i}
                className={`card poker-hole-card${
                  isSelf ? "" : " poker-hole-card--opponent"
                } ${showFaceUp ? `c${card}` : "card-unknown"}`}
              />
            ))}
      </div>

      <div className="poker-seat-avatar-wrap">
        {positionBadges.length > 0 && (
          <div className="poker-seat-position-row">
            {positionBadges.map((b) => (
              <span
                key={b.label}
                className={`poker-marker ${b.className}`}
                title={b.title}
              >
                {b.label}
              </span>
            ))}
          </div>
        )}
        <div className="poker-seat-avatar">
          {avatarUrl ? (
            <img src={avatarUrl} alt={seat.playerName} />
          ) : (
            <span className="poker-seat-avatar-initial">{initial}</span>
          )}
        </div>
      </div>

      <div className="poker-seat-name">{seat.playerName}</div>

      <div className="poker-seat-badges">
        <PokerChipStack chips={seat.Chips || 0} />
        {seat.Bets > 0 && (
          <span
            className="poker-badge poker-badge--bet"
            data-tooltip={betTooltip}
            aria-label={betTooltip}
          >
            {seat.Bets}
          </span>
        )}
        {folded && <span className="poker-folded-pill">FOLDED</span>}
      </div>
    </div>
  );
}
