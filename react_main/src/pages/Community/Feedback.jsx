import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { UiAction, UiField } from "components/ui";
import { UserContext, SiteInfoContext } from "Contexts";
import "css/feedback.css";

const TYPE_OPTIONS = [
  { value: "bug", label: "Bug Report" },
  { value: "suggestion", label: "Suggestion" },
];

const CATEGORY_OPTIONS = [
  { value: "general", label: "General" },
  { value: "mafia", label: "Mafia" },
  { value: "minigames", label: "Minigames" },
  { value: "competitive", label: "Competitive" },
  { value: "forum", label: "Forum" },
  { value: "moderation", label: "Moderation" },
  { value: "other", label: "Other" },
];

const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 5000;

export default function Feedback() {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("bug");
  const [category, setCategory] = useState("general");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const submission = useRef(false);
  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);

  useEffect(() => {
    document.title = "Feedback | UltiMafia";
  }, []);

  const handleSubmit = async () => {
    if (!user.loggedIn || submission.current) return;
    if (!title.trim()) {
      siteInfo.showAlert("Please provide a title for your feedback.", "error");
      return;
    }
    if (!description.trim()) {
      siteInfo.showAlert("Please describe your feedback.", "error");
      return;
    }

    submission.current = true;
    setError(""); setSuccess("");
    try {
      setSubmitting(true);
      const res = await axios.post("/api/feedback/submit", {
        title: title.trim(),
        type,
        category,
        description: description.trim(),
      });

      setSuccess(typeof res.data === "string" ? res.data : "Your feedback has been submitted.");
      setTitle("");
      setType("bug");
      setCategory("general");
      setDescription("");
    } catch (e) {
      setError(typeof e.response?.data === "string" && e.response.data.length <= 200 ? e.response.data : "Could not submit your feedback. Your draft has been kept; please try again.");
    } finally {
      submission.current = false;
      setSubmitting(false);
    }
  };

  const disabled = !user.loggedIn || submitting;

  return (
    <section className="feedback-page">
      <header className="page-heading"><h1>Feedback</h1></header>
      <p>Report a bug or suggest a change. Submitting creates a tracked GitHub issue for the team to review.</p>
      {!user.loggedIn && <p className="feedback-sign-in"><Link to="/auth/login">Sign in</Link> to submit feedback.</p>}
      {success && <p role="status">{success}</p>}
      {error && <p role="alert">{error}</p>}
      <form className="feedback-form" onSubmit={event => { event.preventDefault(); handleSubmit(); }}>
          <div className="feedback-classification">
            <UiField select size="small" label="Feedback type" InputLabelProps={{ shrink: true }} SelectProps={{ native: true }} value={type} disabled={disabled} onChange={event => setType(event.target.value)}>{TYPE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</UiField>
            <UiField select size="small" label="Category" InputLabelProps={{ shrink: true }} SelectProps={{ native: true }} value={category} disabled={disabled} onChange={event => setCategory(event.target.value)}>{CATEGORY_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</UiField>
          </div>
          <UiField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            disabled={disabled}
            inputProps={{ maxLength: MAX_TITLE_LENGTH }}
            helperText={`${title.length}/${MAX_TITLE_LENGTH} characters`}
            placeholder="Brief summary of your feedback"
            required
          />
          <UiField
            label="Describe your feedback"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            minRows={8}
            placeholder="What happened? What did you expect? For a bug, include the steps to reproduce it and any relevant game or page link."
            disabled={disabled}
            inputProps={{ maxLength: MAX_DESCRIPTION_LENGTH }}
            helperText={`${description.length}/${MAX_DESCRIPTION_LENGTH} characters`}
            required
          />
          {user.loggedIn ? (
            <UiAction
              type="submit" variant="primary" busy={submitting}
              disabled={submitting || !title.trim() || !description.trim()}
            >
              Submit feedback
            </UiAction>
          ) : null}
      </form>
    </section>
  );
}
