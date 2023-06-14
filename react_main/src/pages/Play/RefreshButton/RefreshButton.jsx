import React from "react";
import "./RefreshButton.css";

export function RefreshButton(props) {
  return (
    <i
      className={`refreshButton fas fa-sync-alt fa-lg ${
        props.isSpinning ? "fa-spin" : ""
      }`}
    />
  );
}
