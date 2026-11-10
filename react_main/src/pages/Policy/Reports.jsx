import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useViewNavigate as useNavigate } from "hooks/useViewActivity";
import axios from "axios";
import { Autocomplete } from "@mui/material";
import { PageNav } from "components/Nav";
import { Time } from "components/Basic";
import { NameWithAvatar } from "pages/User/UserWidgets";
import ReportDetail from "components/ReportDetail";
import { UiAction, UiField, UiPending } from "components/ui";
import { LatestRequest } from "../../lib/latestRequest";

const statusLabels = { "in-progress": "In progress", complete: "Complete", open: "Open", appealed: "Appealed" };

export default function Reports({ basePath = "/policy" }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [assigneeQuery, setAssigneeQuery] = useState("");
  const [assigneeOptions, setAssigneeOptions] = useState([]);
  const [assigneeIdMap, setAssigneeIdMap] = useState({});
  const [reportedUserFilter, setReportedUserFilter] = useState("");
  const [reportedUserQuery, setReportedUserQuery] = useState("");
  const [reportedUserOptions, setReportedUserOptions] = useState([]);
  const [reportedUserIdMap, setReportedUserIdMap] = useState({});
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const reads = useRef(new LatestRequest());
  const navigate = useNavigate();
  const { reportId } = useParams();

  useEffect(() => {
    document.title = "Reports | UltiMafia";
    const owner = reads.current, request = owner.begin();
    setLoading(true); setError("");
    const endpoint = reportId ? `/api/mod/reports/${encodeURIComponent(reportId)}` : `/api/mod/reports?${new URLSearchParams({ page: String(page), limit: "20", ...(statusFilter ? { status: statusFilter } : {}), ...(assigneeFilter ? { assignee: assigneeFilter } : {}), ...(reportedUserFilter ? { reportedUser: reportedUserFilter } : {}) })}`;
    axios.get(endpoint, { signal: request.signal })
      .then(({ data }) => {
        if (!request.isCurrent()) return;
        if (reportId) { setSelectedReport(data); setShowDetail(true); }
        else { setReports(data.reports || []); setTotalPages(data.totalPages || 1); }
      })
      .catch(() => { if (request.isCurrent()) setError(reportId ? "Could not load this report." : "Could not load reports. Please try again."); })
      .finally(() => { if (request.isCurrent()) setLoading(false); });
    return () => owner.invalidate();
  }, [page, statusFilter, assigneeFilter, reportedUserFilter, reportId, retry]);

  useEffect(() => {
    if (!assigneeQuery) { setAssigneeOptions([]); return; }
    let current = true;
    axios.get(`/api/user/searchName?query=${encodeURIComponent(assigneeQuery)}`)
      .then(({ data }) => { if (current) { setAssigneeIdMap(Object.fromEntries(data.map(person => [person.name, person.id]))); setAssigneeOptions(data.map(person => person.name)); } })
      .catch(() => { if (current) setAssigneeOptions([]); });
    return () => { current = false; };
  }, [assigneeQuery]);

  useEffect(() => {
    if (!reportedUserQuery) { setReportedUserOptions([]); return; }
    let current = true;
    axios.get(`/api/user/searchName?query=${encodeURIComponent(reportedUserQuery)}`)
      .then(({ data }) => { if (current) { setReportedUserIdMap(Object.fromEntries(data.map(person => [person.name, person.id]))); setReportedUserOptions(data.map(person => person.name)); } })
      .catch(() => { if (current) setReportedUserOptions([]); });
    return () => { current = false; };
  }, [reportedUserQuery]);

  function openReport(report) { navigate(`${basePath}/reports/${report.id}`); setSelectedReport(report); setShowDetail(true); }
  function backToList() { navigate(`${basePath}/reports`); setShowDetail(false); setSelectedReport(null); }

  if (showDetail && selectedReport) return <ReportDetail report={selectedReport} onBack={backToList} onUpdate={() => setRetry(value => value + 1)} />;

  return <section className="moderation-reports">
    <header className="moderation-section-heading"><h2>Reports</h2><p>Open reports, check their status and assign moderators.</p></header>
    <div className="moderation-toolbar">
      <UiField select size="small" label="Status" InputLabelProps={{ shrink: true }} SelectProps={{ native: true }} value={statusFilter} onChange={event => { setStatusFilter(event.target.value); setPage(1); }}>
        <option value="">All</option><option value="open">Open</option><option value="in-progress">In progress</option><option value="complete">Complete</option>
      </UiField>
      <Autocomplete options={assigneeOptions} inputValue={assigneeQuery} onInputChange={(_, value) => setAssigneeQuery(value)} onChange={(_, value) => { setAssigneeFilter(value ? assigneeIdMap[value] || "" : ""); setPage(1); }} freeSolo clearOnEscape
        renderInput={params => <UiField {...params} size="small" label="Assignee" />} />
      <Autocomplete options={reportedUserOptions} inputValue={reportedUserQuery} onInputChange={(_, value) => setReportedUserQuery(value)} onChange={(_, value) => { setReportedUserFilter(value ? reportedUserIdMap[value] || "" : ""); setPage(1); }} freeSolo clearOnEscape
        renderInput={params => <UiField {...params} size="small" label="Reported player" />} />
    </div>
    {loading && <UiPending label="Loading reports" />}
    {error && <div role="alert"><p>{error}</p><UiAction onClick={() => setRetry(value => value + 1)}>Retry</UiAction></div>}
    {!loading && !error && reports.length === 0 && <p className="moderation-row-meta">No reports found.</p>}
    <ul className="moderation-list">{reports.map(report => <li className="moderation-list-row" key={report.id}>
      <div>
        <div className="moderation-row-title">
          <strong>Report {report.id}</strong>
          <span className={`moderation-status moderation-status-${report.status}`}>{statusLabels[report.status] || report.status}</span>
          <span className="moderation-row-meta">{report.rule}</span>
        </div>
        <p className="moderation-row-meta">Against <NameWithAvatar id={report.reportedUserId} name={report.reportedUserName || report.reportedUserId} avatar={report.reportedUserAvatar} />{report.createdAt && <> · <Time millisec={Date.now() - report.createdAt} suffix=" ago" /></>}</p>
        <p className="moderation-row-meta">Reported by {(report.reporterInfo?.length ? report.reporterInfo.map(person => person.name).join(", ") : report.reporterName || report.reporterId)} · Assigned to {(report.assigneeInfo?.length ? report.assigneeInfo.map(person => person.name).join(", ") : report.assignees?.length ? report.assignees.map(person => typeof person === "string" ? person : person.name).join(", ") : "Unassigned")}</p>
      </div>
      <div className="moderation-row-actions"><UiAction onClick={() => openReport(report)}>Open report</UiAction></div>
    </li>)}</ul>
    {totalPages > 1 && <PageNav page={page} maxPage={totalPages} onNav={setPage} />}
  </section>;
}
