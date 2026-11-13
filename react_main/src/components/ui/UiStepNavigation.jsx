import React from "react";
import UiAction from "./UiAction";
import "./ui.css";

// A single-row step control on phones. Long destination names remain available
// to assistive technology without making a sticky footer cover the editor.
export default function UiStepNavigation({ label = "Steps", currentStep, stepCount,
  onBack, onNext, nextLabel, onComplete, completeLabel = "Finish",
  busy = false, completeDisabled = false, completionMessage, sticky = false }) {
  if (!Number.isInteger(currentStep) || !Number.isInteger(stepCount) ||
    stepCount < 1 || currentStep < 0 || currentStep >= stepCount) {
    throw new TypeError("UiStepNavigation requires a valid currentStep and stepCount");
  }
  return <nav aria-label={label} className={`ui-step-navigation${sticky ? " ui-step-navigation--sticky" : ""}`}>
    <UiAction disabled={currentStep === 0 || busy} onClick={onBack}>Back</UiAction>
    <span className="ui-step-position" aria-live="polite">
      <span className="ui-step-position-label">Step {currentStep + 1} of {stepCount}</span>
      <span className="ui-step-position-compact" aria-hidden="true">{currentStep + 1} / {stepCount}</span>
    </span>
    {currentStep < stepCount - 1 ? (
      <UiAction variant="primary" disabled={busy} onClick={onNext}
        aria-label={nextLabel ? `Next: ${nextLabel}` : "Next"}>
        <span>Next{nextLabel && <span className="ui-step-destination" aria-hidden="true">: {nextLabel}</span>}</span>
      </UiAction>
    ) : completionMessage ? <span className="ui-step-message">{completionMessage}</span> : (
      <UiAction variant="primary" busy={busy} disabled={completeDisabled} onClick={onComplete}>{completeLabel}</UiAction>
    )}
  </nav>;
}
