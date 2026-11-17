import React from "react";
import { VoteWidget } from "../VoteWidget";
import "./ui.css";

// Page-level voting: a fixed 40px pill that sits in the page header next to the
// page actions. Inline and row votes keep using VoteWidget directly.
export default function UiVoteControl({ ariaLabel, className = "", ...props }) {
  return (
    <div className={`ui-vote-control ${className}`}>
      <VoteWidget {...props} ariaLabel={ariaLabel} variant="page" />
    </div>
  );
}
