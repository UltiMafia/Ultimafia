import React, { useState, useEffect, useContext, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import { UserContext } from "Contexts";
import { NameWithAvatar } from "pages/User/UserWidgets";
import { Time } from "components/Basic";
import { UiAction, UiDialog, UiPending, UiTab, UiTabs } from "components/ui";
import { LatestRequest } from "../../../lib/latestRequest";

export default function GithubLinks() {
  const { user } = useOutletContext() || {};
  const currentUser = useContext(UserContext);
  const activeUser = user || currentUser;
  const canReview = activeUser?.perms?.approveGithubLinks;

  const [status, setStatus] = useState("pending");
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [confirmation, setConfirmation] = useState(null);
  const [pending, setPending] = useState(false);
  const requests = useRef(new LatestRequest());
  const submitting = useRef(false);

  useEffect(() => {
    const owner = requests.current, request = owner.begin();
    setLoading(true); setError("");
    axios.get(`/api/mod/githubLinks?status=${status}`, { signal: request.signal })
      .then(({ data }) => { if (request.isCurrent()) setLinks(Array.isArray(data) ? data : []); })
      .catch(() => { if (request.isCurrent()) setError("Could not load GitHub links. Please try again."); })
      .finally(() => { if (request.isCurrent()) setLoading(false); });
    return () => owner.invalidate();
  }, [status, retry]);

  async function review() {
    if (!confirmation || submitting.current || !canReview) return;
    submitting.current = true; setPending(true); setError("");
    try {
      await axios.post("/api/mod/githubLinks", { userId: confirmation.link.id, decision: confirmation.decision });
      setLinks(previous => previous.filter(link => link.id !== confirmation.link.id));
      setConfirmation(null);
    } catch (_) { setError("Could not review this GitHub link. Please try again."); }
    finally { submitting.current = false; setPending(false); }
  }

  return <section className="moderation-github">
    <header className="moderation-section-heading"><h2>GitHub links</h2><p>Connect a player's GitHub account after checking the request.</p></header>
    <UiTabs value={status} onChange={(_, value) => setStatus(value)} variant="scrollable" scrollButtons="auto" aria-label="GitHub link status">
      <UiTab label="Pending" value="pending" /><UiTab label="Approved" value="approved" /><UiTab label="Rejected" value="rejected" />
    </UiTabs>
    {loading && <UiPending label="Loading GitHub links" />}
    {error && <div role="alert"><p>{error}</p><UiAction onClick={() => setRetry(value => value + 1)}>Retry</UiAction></div>}
    {!loading && !error && !links.length && <p className="moderation-row-meta">No {status} GitHub links.</p>}
    <ul className="moderation-list">{links.map(link => <li key={link.id} className="moderation-list-row">
      <div>
        <div className="moderation-row-title"><NameWithAvatar id={link.id} name={link.name} avatar={link.avatar} /></div>
        <p className="moderation-row-meta"><a href={`https://github.com/${link.github.username}`} target="_blank" rel="noopener noreferrer">@{link.github.username}</a>{link.github.requestedAt && <> · requested <Time minSec millisec={Date.now() - link.github.requestedAt} suffix=" ago" /></>}</p>
      </div>
      {canReview && <div className="moderation-row-actions">
        {status !== "approved" && <UiAction variant="primary" disabled={pending} onClick={() => setConfirmation({ link, decision: "approved" })}>Approve link</UiAction>}
        {status !== "rejected" && <UiAction variant="danger-quiet" disabled={pending} onClick={() => setConfirmation({ link, decision: "rejected" })}>Reject link</UiAction>}
      </div>}
    </li>)}</ul>
    <UiDialog open={!!confirmation} title={confirmation?.decision === "approved" ? "Approve GitHub link?" : "Reject GitHub link?"} onClose={pending ? undefined : () => setConfirmation(null)}
      actions={<><UiAction disabled={pending} onClick={() => setConfirmation(null)}>Cancel</UiAction><UiAction variant={confirmation?.decision === "approved" ? "primary" : "danger"} busy={pending} onClick={review}>{confirmation?.decision === "approved" ? "Approve link" : "Reject link"}</UiAction></>}>
      <p>{confirmation?.decision === "approved" ? `Approve @${confirmation?.link.github.username} for ${confirmation?.link.name}?` : `Reject the GitHub link from ${confirmation?.link.name}?`}</p>
      {error && <p role="alert">{error}</p>}
    </UiDialog>
  </section>;
}
