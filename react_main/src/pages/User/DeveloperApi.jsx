import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { UserContext } from "Contexts";
import { useErrorAlert } from "components/Alerts";
import { UiAction, UiCard, UiDialog, UiField, UiPage, UiPending, UiTable, UiText } from "components/ui";
import { LatestRequest } from "lib/latestRequest";

const formatTime = (time) => (time ? new Date(time).toLocaleString(undefined, { hour12: true }) : "Never");

export default function DeveloperApi() {
  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();
  const [keys, setKeys] = useState([]);
  const [name, setName] = useState("");
  const [created, setCreated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [readError, setReadError] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revoking, setRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState(false);
  const reads = useRef(new LatestRequest());
  const isOwner = Number(user.rank) === Infinity;
  const permitted = !!user.perms?.devApi;

  const load = useCallback(() => {
    const request = reads.current.begin();
    setLoading(true);
    setReadError(false);
    return axios.get(isOwner ? "/api/dev/owner/keys" : "/api/dev/keys", { signal: request.signal })
      .then(res => { if (request.isCurrent()) setKeys(res.data); })
      .catch(() => { if (request.isCurrent()) setReadError(true); })
      .finally(() => { if (request.isCurrent()) setLoading(false); });
  }, [isOwner]);

  useEffect(() => {
    if (permitted) load();
    const requests = reads.current;
    return () => requests.invalidate();
  }, [permitted, load]);

  async function createKey() {
    if (creating) return;
    setCreating(true);
    setCreateError(false);
    try {
      const res = await axios.post("/api/dev/keys", { name });
      setCreated(res.data);
      setName("");
      load();
    } catch (error) { setCreateError(true); errorAlert(error); }
    finally { setCreating(false); }
  }

  async function revoke() {
    if (!revokeTarget || revoking) return;
    setRevoking(true);
    setRevokeError(false);
    try {
      await axios.post(`/api/dev/keys/${revokeTarget.clientId}/revoke`);
      setRevokeTarget(null);
      load();
    } catch (error) { setRevokeError(true); errorAlert(error); }
    finally { setRevoking(false); }
  }

  const columns = [
    { key: "name", label: "Name" },
    { key: "clientId", label: "Client ID", code: true },
    ...(isOwner ? [{ key: "userId", label: "Developer", code: true }] : []),
    ...[["createdAt", "Created"], ["expiresAt", "Expires"], ["lastUsedAt", "Last used"]].map(([key, label]) => ({ key, label, render: row => formatTime(row[key]) })),
    { key: "actions", label: "Actions", render: key => key.revokedAt ? "Revoked" :
      <UiAction variant="danger-quiet" onClick={() => { setRevokeError(false); setRevokeTarget(key); }}>Revoke</UiAction> },
  ];

  return <UiPage title="Developer API">
    {!permitted ? <UiText>Only developers can use the developer API.</UiText> : <>
      <UiText>Exchange a key for a short-lived token at POST /api/dev/token, then send it as Authorization: Bearer &lt;token&gt;.</UiText>
      <div className="ui-action-row">
        <UiField size="small" label="Key name" value={name} disabled={creating} onChange={event => setName(event.target.value)} />
        <UiAction variant="primary" busy={creating} onClick={createKey}>Create key</UiAction>
      </div>
      {createError && <UiText role="alert">Could not create key. Your key name has been retained.</UiText>}
      {created && <UiCard>
        <UiText>Copy the secret now. It is shown only once.</UiText>
        <UiText className="ui-code">Client ID: {created.clientId}<br />Client secret: {created.clientSecret}</UiText>
      </UiCard>}
      {readError ? <div role="alert">Could not load keys. <UiAction onClick={load}>Retry</UiAction></div> :
        loading ? <UiPending label="Loading keys" /> : <UiTable label="Developer API keys" columns={columns} rows={keys} rowKey="clientId" emptyMessage="No keys." />}
      <UiDialog open={!!revokeTarget} title="Revoke key" onClose={() => setRevokeTarget(null)} dismissible={!revoking}
        actions={<><UiAction disabled={revoking} onClick={() => setRevokeTarget(null)}>Cancel</UiAction><UiAction variant="danger" busy={revoking} onClick={revoke}>Revoke key</UiAction></>}>
        <UiText>Revoke {revokeTarget?.name || "this key"}? Applications using it will lose API access.</UiText>
        {revokeError && <UiText role="alert">Could not revoke key. Try again or cancel.</UiText>}
      </UiDialog>
    </>}
  </UiPage>;
}
