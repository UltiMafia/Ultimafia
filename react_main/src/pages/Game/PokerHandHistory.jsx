import React, { useContext, useMemo, useState } from "react";
import { GameContext } from "../../Contexts";
import { SiteInfoContext } from "Contexts";

const PAGE_SIZE = 3;

function PokerCardImg({ card, highlighted }) {
  if (!card) {
    return <div className="card poker-history-card poker-history-card--empty" />;
  }
  return (
    <div
      className={`card c${card} poker-history-card${
        highlighted ? " poker-history-card--highlight" : ""
      }`}
    />
  );
}

function HandHistoryEntry({ entry, players, cacheVal }) {
  const winnerPlayer = players?.[entry.winnerId];
  const avatarUrl =
    winnerPlayer?.avatar && entry.winnerId
      ? `/uploads/${entry.winnerId}_avatar.webp?t=${cacheVal}`
      : null;
  const initial = entry.winnerName
    ? entry.winnerName.charAt(0).toUpperCase()
    : "?";

  // Build a quick lookup of cards in the winning 5-card combination so we can
  // highlight them when shown alongside hole/community cards.
  const highlightSet = useMemo(() => {
    if (!entry.revealed || !Array.isArray(entry.showdownCards)) return null;
    return new Set(entry.showdownCards);
  }, [entry]);

  const community = Array.isArray(entry.communityCards)
    ? entry.communityCards
    : [];
  const hole = Array.isArray(entry.holeCards) ? entry.holeCards : [];

  return (
    <div className="poker-history-entry">
      <div className="poker-history-entry-winner-block">
        <div className="poker-history-entry-avatar">
          {avatarUrl ? (
            <img src={avatarUrl} alt={entry.winnerName} />
          ) : (
            <span className="poker-history-entry-initial">{initial}</span>
          )}
        </div>
        <span className="poker-history-entry-crown" aria-label="winner">
          👑
        </span>
        <div className="poker-history-entry-name">{entry.winnerName}</div>
      </div>
      <div className="poker-history-entry-info">
        won <strong>{entry.pot}</strong> chips
        {entry.revealed && entry.scoreType ? (
          <> with a <strong>{entry.scoreType}</strong></>
        ) : null}
      </div>
      {entry.revealed ? (
        <div className="poker-history-entry-cards">
          {(hole.length === 0 ? [null, null] : hole).map((card, i) => (
            <PokerCardImg
              key={`h${i}`}
              card={card}
              highlighted={card ? highlightSet?.has(card) : false}
            />
          ))}
          <span className="poker-history-cards-divider" aria-hidden />
          {Array.from({ length: 5 }).map((_, i) => (
            <PokerCardImg
              key={`b${i}`}
              card={community[i]}
              highlighted={
                community[i] ? highlightSet?.has(community[i]) : false
              }
            />
          ))}
        </div>
      ) : (
        <div className="poker-history-entry-folded">Won by fold</div>
      )}
    </div>
  );
}

export default function PokerHandHistory({ history }) {
  const game = useContext(GameContext);
  const siteInfo = useContext(SiteInfoContext);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);

  const entries = Array.isArray(history) ? history : [];
  const total = entries.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  // Newest hands first.
  const ordered = useMemo(() => [...entries].reverse(), [entries]);

  const safePage = Math.min(page, totalPages - 1);
  const pageEntries = ordered.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE
  );

  if (total === 0) return null;

  return (
    <div className={`poker-history${open ? " poker-history--open" : ""}`}>
      <button
        type="button"
        className="poker-history-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="poker-history-toggle-label">
          Hand History ({total})
        </span>
        <span className="poker-history-toggle-chevron" aria-hidden>
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open ? (
        <div className="poker-history-panel">
          <div className="poker-history-list">
            {pageEntries.map((entry, i) => (
              <HandHistoryEntry
                key={safePage * PAGE_SIZE + i}
                entry={entry}
                players={game.players}
                cacheVal={siteInfo?.cacheVal}
              />
            ))}
          </div>
          {totalPages > 1 ? (
            <div className="poker-history-pagination">
              <button
                type="button"
                className="poker-history-page-btn"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
              >
                Prev
              </button>
              <span className="poker-history-page-indicator">
                {safePage + 1} / {totalPages}
              </span>
              <button
                type="button"
                className="poker-history-page-btn"
                onClick={() =>
                  setPage((p) => Math.min(totalPages - 1, p + 1))
                }
                disabled={safePage >= totalPages - 1}
              >
                Next
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
