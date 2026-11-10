import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { ViewNavigate as Navigate } from "hooks/useViewActivity";
import axios from "axios";
import { Chip } from "@mui/material";
import { UserContext, SiteInfoContext } from "../../Contexts";
import { useErrorAlert } from "components/Alerts";
import { UiAction, UiDialog, UiField, UiMenuItem, UiPageHeader, UiPending, UiTable, UiText } from "components/ui";
import { NameWithAvatar } from "pages/User/UserWidgets";
import { LatestRequest } from "lib/latestRequest";

function userIsOwner(user) {
  return (user?.groups || []).some((group) => group && group.name === "Owner");
}

function statusColor(status) {
  if (status === "completed") return "success";
  if (status === "pending") return "warning";
  if (status === "rejected") return "error";
  return "default";
}

function formatWhen(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString(undefined, { hour12: true });
}

export default function Invoices() {
  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [readError, setReadError] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reviewError, setReviewError] = useState(false);
  const reads = useRef(new LatestRequest());
  const permitted = user.loaded && user.loggedIn && userIsOwner(user);

  const load = useCallback(() => {
    const request = reads.current.begin();
    setLoading(true);
    setReadError(false);
    return axios.get("/api/crypto/admin/invoices", { params: { status, page }, signal: request.signal })
      .then(res => { if (request.isCurrent()) setData(res.data); })
      .catch(() => { if (request.isCurrent()) setReadError(true); })
      .finally(() => { if (request.isCurrent()) setLoading(false); });
  }, [status, page]);

  useEffect(() => { document.title = "Invoices | UltiMafia"; }, []);
  useEffect(() => {
    if (permitted) load();
    const requests = reads.current;
    return () => requests.invalidate();
  }, [permitted, load]);

  async function review() {
    if (!reviewTarget || busy) return;
    const { invoiceId, action } = reviewTarget;
    setBusy(true);
    setReviewError(false);
    try {
      await axios.post(`/api/crypto/admin/invoices/${invoiceId}/${action}`);
      siteInfo.showAlert(action === "approve" ? "Invoice approved. Coins credited." : "Invoice rejected.", "success");
      setReviewTarget(null);
      load();
    } catch (error) { setReviewError(true); errorAlert(error); }
    finally { setBusy(false); }
  }

  if (!user.loaded) return <UiPending />;
  if (!permitted) return <Navigate to="/policy/rules" replace />;

  const invoices = data?.invoices || [];
  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / (data?.pageSize || 50)));
  const columns = [
    { key: "createdAt", label: "Created", render: row => formatWhen(row.createdAt) },
    { key: "userId", label: "User", render: row => <NameWithAvatar small id={row.userId} name={row.userName} avatar={Boolean(row.userAvatar)} /> },
    { key: "chain", label: "Network", render: row => row.chainLabel || row.chain },
    { key: "asset", label: "Token" },
    { key: "usd", label: "USD", render: row => `$${row.usd}` },
    { key: "expectedAmount", label: "Amount", render: row => `${row.expectedAmount} ${row.asset}` },
    { key: "coins", label: "Coins" },
    { key: "status", label: "Status", render: row => <Chip size="small" label={row.status} color={statusColor(row.status)} /> },
    { key: "actions", label: "Actions", render: row => row.canApprove || row.canReject ? <div className="ui-action-row">
      {row.canApprove && <UiAction variant="primary" disabled={busy} onClick={() => { setReviewError(false); setReviewTarget({ invoiceId: row.id, action: "approve" }); }}>Approve</UiAction>}
      {row.canReject && <UiAction variant="danger-quiet" disabled={busy} onClick={() => { setReviewError(false); setReviewTarget({ invoiceId: row.id, action: "reject" }); }}>Reject</UiAction>}
    </div> : "-" },
  ];

  return <>
    <UiPageHeader title="Invoices" description="Crypto donation invoices. Approve unpaid invoices to credit coins. Reject closes them without payment." />
    <div className="ui-action-row">
      <UiField select label="Status" value={status} disabled={busy} onChange={event => { setPage(1); setStatus(event.target.value); }}>
        {["all", "unpaid", "pending", "expired", "completed", "rejected", "failed"].map(value => <UiMenuItem key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</UiMenuItem>)}
      </UiField>
    </div>
    {readError ? <div role="alert">Could not load invoices. <UiAction onClick={load}>Retry</UiAction></div> :
      loading ? <UiPending label="Loading invoices" /> : <UiTable label="Donation invoices" columns={columns} rows={invoices} rowKey="id" emptyMessage="No invoices." />}
    {totalPages > 1 && <div className="ui-action-row">
      <UiAction disabled={page <= 1 || busy || loading} onClick={() => setPage(value => value - 1)}>Previous</UiAction>
      <UiText>Page {page} of {totalPages}</UiText>
      <UiAction disabled={page >= totalPages || busy || loading} onClick={() => setPage(value => value + 1)}>Next</UiAction>
    </div>}
    <UiDialog open={!!reviewTarget} title={reviewTarget?.action === "approve" ? "Approve invoice" : "Reject invoice"}
      dismissible={!busy} onClose={() => setReviewTarget(null)} actions={<>
        <UiAction disabled={busy} onClick={() => setReviewTarget(null)}>Cancel</UiAction>
        <UiAction variant={reviewTarget?.action === "approve" ? "primary" : "danger"} busy={busy} onClick={review}>
          {reviewTarget?.action === "approve" ? "Approve and credit" : "Reject invoice"}
        </UiAction>
      </>}>
      <UiText>{reviewTarget?.action === "approve" ? "Approve and credit coins for" : "Reject"} invoice {reviewTarget?.invoiceId}?</UiText>
      {reviewError && <UiText role="alert">Could not review invoice. Try again or cancel.</UiText>}
    </UiDialog>
  </>;
}
