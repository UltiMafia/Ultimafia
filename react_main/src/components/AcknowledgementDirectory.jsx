import React, { useContext, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { UserContext } from "Contexts";
import { Avatar } from "pages/User/UserWidgets";
import { TextEditor, UserSearchSelect } from "./Form";
import CustomMarkdown from "./CustomMarkdown";
import { UiAction, UiDialog, UiPending, UiPageHeader } from "./ui";
import { LatestRequest } from "../lib/latestRequest";
import "css/acknowledgements.css";

const typeLabels = { code: "Code", art: "Art", music: "Music & sound", design: "Design" };

// The two acknowledgement directories share identity, readable bios and explicit
// editing/management actions; neither needs a grid of oversized avatar cards.
export default function AcknowledgementDirectory({ kind, title, children }) {
  const user = useContext(UserContext);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [editing, setEditing] = useState(null);
  const [bio, setBio] = useState("");
  const [pending, setPending] = useState(false);
  const [operation, setOperation] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchName, setSearchName] = useState("");
  const requests = useRef(new LatestRequest());
  const submitting = useRef(false);
  const donor = kind === "donor";
  const canManage = donor && user.loggedIn && user.perms?.giveGroup;

  useEffect(() => {
    document.title = `${title} | UltiMafia`;
    const owner = requests.current, request = owner.begin();
    setLoading(true); setError("");
    axios.get(`/api/site/${donor ? "donors" : "contributors"}`, { signal: request.signal })
      .then(({ data }) => { if (request.isCurrent()) setPeople(Array.isArray(data) ? data : []); })
      .catch(() => { if (request.isCurrent()) setError(`Could not load ${title.toLowerCase()}. Please try again.`); })
      .finally(() => { if (request.isCurrent()) setLoading(false); });
    return () => owner.invalidate();
  }, [donor, retry, title]);

  async function saveBio() {
    if (submitting.current || !editing || editing !== user.id || bio.length > 240) return;
    submitting.current = true; setPending(true); setError("");
    try {
      await axios.post(`/api/user/${kind}Bio`, { bio });
      setPeople(previous => previous.map(person => person.id === editing ? { ...person, bio } : person));
      setEditing(null);
    } catch (_) { setError("Could not save your bio. Your draft has been kept; please try again."); }
    finally { submitting.current = false; setPending(false); }
  }

  async function updateDonor() {
    if (submitting.current || !canManage || !operation || (operation.type === "add" && !selectedUser)) return;
    submitting.current = true; setPending(true); setError("");
    try {
      await axios.post(`/api/mod/${operation.type === "add" ? "addToGroup" : "removeFromGroup"}`, { groupName: "Donor", userId: operation.type === "add" ? selectedUser : operation.person.id });
      setOperation(null); setRetry(value => value + 1);
    } catch (_) { setError("Could not update donor status. Please try again."); }
    finally { submitting.current = false; setPending(false); }
  }

  return <section className="acknowledgement-directory">
    <UiPageHeader title={title} actions={canManage && <UiAction onClick={() => { setOperation({ type: "add" }); setSelectedUser(null); setSearchName(""); }}>Assign donor status</UiAction>} />
    {children && <div className="acknowledgement-intro">{children}</div>}
    {loading && <UiPending label={`Loading ${title.toLowerCase()}`} />}
    {error && <div role="alert"><p>{error}</p>{!editing && !operation && <UiAction onClick={() => setRetry(value => value + 1)}>Retry</UiAction>}</div>}
    {!loading && !error && !people.length && <p>No {title.toLowerCase()} are listed yet.</p>}
    <ul className="acknowledgement-list">{people.map(person => <li key={person.id} className="acknowledgement-row">
      <Avatar id={person.id} name={person.name} hasImage={person.avatar} size={56} />
      <div className="acknowledgement-details">
        <Link className="acknowledgement-name" to={`/user/${person.vanityUrl || person.id}`}>{person.name}</Link>
        {donor ? <p className="acknowledgement-meta">Donor</p> : <p className="acknowledgement-meta">{(person.types || []).map(type => typeLabels[type] || type).join(" · ")}</p>}
        {!donor && person.github && <p className="acknowledgement-meta"><a href={`https://github.com/${person.github.username}`} target="_blank" rel="noopener noreferrer">{person.github.username}</a> · {Number(person.github.lines || 0).toLocaleString()} lines</p>}
        {editing === person.id ? <div className="acknowledgement-editor">
          <TextEditor value={bio} onChange={setBio} readOnly={pending} />
          <p>{bio.length}/240 characters</p>
          <div className="ui-action-row"><UiAction variant="primary" busy={pending} disabled={bio.length > 240} onClick={saveBio}>Save bio</UiAction><UiAction disabled={pending} onClick={() => setEditing(null)}>Cancel</UiAction></div>
        </div> : person.bio && <div className="md-content"><CustomMarkdown>{person.bio}</CustomMarkdown></div>}
      </div>
      <div className="acknowledgement-actions">
        {user.loggedIn && user.id === person.id && editing !== person.id && <UiAction onClick={() => { setEditing(person.id); setBio(person.bio || ""); }}>Edit bio</UiAction>}
        {canManage && <UiAction variant="danger-quiet" onClick={() => { setError(""); setOperation({ type: "remove", person }); }}>Remove status</UiAction>}
      </div>
    </li>)}</ul>
    <UiDialog open={!!operation} title={operation?.type === "add" ? "Assign donor status" : "Remove donor status?"} onClose={pending ? undefined : () => setOperation(null)}
      actions={<><UiAction disabled={pending} onClick={() => setOperation(null)}>Cancel</UiAction><UiAction variant={operation?.type === "add" ? "primary" : "danger"} busy={pending} disabled={operation?.type === "add" && !selectedUser} onClick={updateDonor}>{operation?.type === "add" ? "Assign status" : "Remove status"}</UiAction></>}>
      {operation?.type === "add" ? <UserSearchSelect key="assign-donor" value={searchName} placeholder="Find a player" onChange={(id, name) => { setSelectedUser(id); setSearchName(name || ""); }} /> : <p>Remove donor status from {operation?.person.name}?</p>}
      {error && <p role="alert">{error}</p>}
    </UiDialog>
  </section>;
}
