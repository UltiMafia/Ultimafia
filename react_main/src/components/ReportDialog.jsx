import React, { useState, useContext, useEffect, useRef } from "react";
import axios from "axios";
import { UiAction, UiDialog, UiField, UiMenuItem, UiPending, UiText } from "./ui";
import { UserSearchSelect } from "./Form";
import { UserContext, SiteInfoContext } from "../Contexts";
import { useViolations } from "../hooks/useViolations";

let nextReportFormId = 0;

export default function ReportDialog({ open, onClose, prefilledArgs = {} }) {
  const [game, setGame] = useState(prefilledArgs.game || "");
  const [userReported, setUserReported] = useState(
    prefilledArgs.userId || prefilledArgs.user || ""
  );
  const [ruleBroken, setRuleBroken] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [formId] = useState(() => `report-form-${++nextReportFormId}`);
  const submitInFlight = useRef(false);
  const session = useRef(0);

  // Reset form only when the dialog opens, not on every parent re-render (e.g. game
  // state updates) which pass a new prefilledArgs object identity each time.
  const dialogSessionStartedRef = useRef(false);
  useEffect(() => {
    if (!open) {
      dialogSessionStartedRef.current = false;
      session.current++;
      return;
    }
    if (dialogSessionStartedRef.current) {
      return;
    }
    dialogSessionStartedRef.current = true;
    const userId = prefilledArgs.userId || prefilledArgs.user || "";
    setGame(prefilledArgs.game || "");
    setUserReported(userId);
    setRuleBroken("");
    setDescription("");
    setSubmitError("");
    setSubmitting(false);
    submitInFlight.current = false;
  }, [
    open,
    prefilledArgs.game,
    prefilledArgs.userId,
    prefilledArgs.user,
  ]);
  useEffect(() => () => { session.current++; }, []);

  // Get display value for user (prefer userName, fall back to userId)
  const userDisplayValue =
    prefilledArgs.userName ||
    userReported ||
    prefilledArgs.userId ||
    prefilledArgs.user ||
    "";

  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const { violationDefinitions, loading: violationsLoading, error: violationsError, reload } = useViolations();
  const rulesAvailable = !violationsLoading && !violationsError && violationDefinitions.length > 0;

  const handleSubmit = async () => {
    if (!open || !user.loggedIn || submitInFlight.current || !rulesAvailable) return;
    const reportedUserValue =
      userReported && typeof userReported === "object" && userReported.id
        ? userReported.id
        : userReported;

    if (!reportedUserValue || !ruleBroken) {
      setSubmitError("Please choose a user to report and select the rule that was broken.");
      return;
    }

    const submittedSession = session.current;
    submitInFlight.current = true;
    setSubmitting(true);
    setSubmitError("");
    try {
      await axios.post("/api/report/send", {
        game: game || undefined,
        user: reportedUserValue,
        rule: ruleBroken,
        description: description || undefined,
      });
      if (submittedSession !== session.current) return;

      setGame("");
      setUserReported("");
      setRuleBroken("");
      setDescription("");

      siteInfo.showAlert(
        "Thank you — your report was delivered to moderators.",
        "success"
      );
      onClose();
    } catch (e) {
      if (submittedSession === session.current) {
        setSubmitError(e?.response?.data
          ? e.response.data.toString()
          : "Could not submit report. Try again or cancel. Your draft has been retained.");
      }
    } finally {
      if (submittedSession === session.current) {
        submitInFlight.current = false;
        setSubmitting(false);
      }
    }
  };

  return (
    <UiDialog open={open} title="Report user" onClose={onClose} dismissible={!submitting}
      actions={<>
        <UiAction onClick={onClose} disabled={submitting}>Cancel</UiAction>
        <UiAction type="submit" form={formId} variant="primary" busy={submitting}
          disabled={!user.loggedIn || !rulesAvailable}>Submit Report</UiAction>
      </>}>
        {user.loggedIn ? (
          <form id={formId} className="ui-form-stack" aria-busy={submitting || undefined}
            onSubmit={event => { event.preventDefault(); handleSubmit(); }}>
            <UiText variant="body2" color="text.secondary">
              Please provide as much detail as possible when reporting rule or
              policy violations.
            </UiText>

            <UiField
              label="Game"
              value={game}
              onChange={(e) => setGame(e.target.value)}
              fullWidth
              disabled={submitting || !!prefilledArgs.game}
            />

            {prefilledArgs.userId || prefilledArgs.user ? (
              <UiField
                label="User Reported"
                value={userDisplayValue}
                disabled
                fullWidth
              />
            ) : (
              <UserSearchSelect
                onChange={(value) => setUserReported(value)}
                placeholder="User Reported"
                value={userReported}
                disabled={submitting}
              />
            )}

            <UiField select selectText="wrap" fullWidth
                value={ruleBroken}
                label="Rule Broken"
                onChange={(e) => setRuleBroken(e.target.value)}
                disabled={submitting || !rulesAvailable}
              >
                {violationDefinitions.map((rule) => (
                  <UiMenuItem key={rule.name} value={rule.name}>
                    {rule.name}
                  </UiMenuItem>
                ))}
            </UiField>
            {violationsLoading ? <UiPending compact label="Loading rules" /> : violationsError ? (
              <div role="alert">Could not load rules. <UiAction onClick={reload}>Retry</UiAction></div>
            ) : !violationDefinitions.length ? <UiText role="status">No report rules are available.</UiText> : null}

            <UiField
              label="Description (Optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={4}
              disabled={submitting}
            />
            {submitError && <UiText role="alert">{submitError}</UiText>}
          </form>
        ) : (
          <UiText role="status">
            You must be logged in to file a report.
          </UiText>
        )}
    </UiDialog>
  );
}
