import React, { useState, useContext, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { UserContext } from "Contexts";
import { UiAction, UiField } from "components/ui";
import "css/feedback.css";

export default function Volunteer() {
  const [age, setAge] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const pending = useRef(false);
  const user = useContext(UserContext);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!user.loggedIn || pending.current) return;
    const ageNumber = parseInt(age, 10);
    if (!Number.isFinite(ageNumber) || ageNumber < 13 || ageNumber > 100) { setError("Enter an age between 13 and 100."); return; }
    if (!reason.trim()) { setError("Explain why you want to help lead UltiMafia."); return; }
    pending.current = true; setSubmitting(true); setError(""); setSuccess("");
    try {
      await axios.post("/api/report/volunteer", { age: ageNumber, reason: reason.trim() });
      setSuccess("Your application has been submitted.");
      setAge(""); setReason("");
    } catch (failure) {
      setError(typeof failure.response?.data === "string" && failure.response.data.length <= 200 ? failure.response.data : "Could not submit your application. Your draft has been kept; please try again.");
    } finally { pending.current = false; setSubmitting(false); }
  }

  return <section className="feedback-page">
    <header className="moderation-section-heading"><h2>Volunteer</h2></header>
    <p>Interested in joining the UltiMafia staff team? Tell us what you can bring to the team. Applications are reviewed by administrators.</p>
    {!user.loggedIn && <p><Link to="/auth/login">Sign in</Link> to apply.</p>}
    {success && <p role="status">{success}</p>}
    {error && <p role="alert">{error}</p>}
    <form className="feedback-form" onSubmit={handleSubmit}>
      <UiField label="Age" type="number" value={age} disabled={!user.loggedIn || submitting} onChange={event => setAge(event.target.value)} slotProps={{ htmlInput: { min: 13, max: 100 } }} required />
      <UiField label="Why do you want to help lead UltiMafia?" value={reason} disabled={!user.loggedIn || submitting} onChange={event => setReason(event.target.value)} multiline minRows={8} slotProps={{ htmlInput: { maxLength: 1500 } }} helperText={`${reason.length}/1500 characters`} required />
      {user.loggedIn && <UiAction type="submit" variant="primary" busy={submitting} disabled={!age.trim() || !reason.trim()}>Submit application</UiAction>}
    </form>
  </section>;
}
