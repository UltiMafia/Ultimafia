import React from "react";
import "css/profileReputation.css";

// A legend for the pie chart, not a second visualization. The pie shows the
// proportions; this adds the exact counts and percentages without repeating a
// bar that encodes the same three numbers again.
export default function ProfileStatsSummary({ wins, losses, abandons, total }) {
  const parts = [
    ["Wins", wins, "win"],
    ["Losses", losses, "loss"],
    ["Abandons", abandons, "abandon"],
  ];
  const winPercent = total ? Math.round((wins / total) * 100) : 0;
  return <div className="profile-results-summary">
    <div className="profile-results-heading">
      <strong>{winPercent}% win rate</strong>
      <span>{total.toLocaleString()} games</span>
    </div>
    <dl className="profile-results-legend">
      {parts.map(([label, value, kind]) => <div key={kind}>
        <dt><i className={`profile-result-swatch profile-result-${kind}`} aria-hidden />{label}</dt>
        <dd>{value.toLocaleString()}</dd>
        <span className="profile-result-percent">{total ? Math.round((value / total) * 100) : 0}%</span>
      </div>)}
    </dl>
  </div>;
}
