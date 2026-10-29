// Admins' Ban Appeals page: the queue of site-ban appeals, and one case with
// the appeal, the ban, the report(s) behind it, the mod log, and the votes
// with their justifications. Only the admins who get appeals can load it
// (the server checks; the tab is hidden for everyone else).
import React, { useCallback, useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Link,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

import { useViewNavigate as useNavigate } from "hooks/useViewActivity";

export const BAN_APPEALS_PATH = "/policy/moderation/ban-appeals";

const STATUS_COLORS = {
  pending: "warning",
  accepted: "success",
  denied: "error",
};

const REPORT_LINK_TEXT = {
  ban: "Linked to this ban by its report ruling",
  report: "Linked to this ban by its report ruling",
  violation: "Linked through the violation issued with this ban",
  nearby:
    "No stored link: a report against this user filed in the 30 days before the ban",
};

function formatDate(ms) {
  if (!ms) return "-";
  return new Date(ms).toLocaleString();
}

function formatDuration(ms) {
  if (!ms || ms <= 0) return null;
  const day = 24 * 60 * 60 * 1000;
  if (ms >= day) {
    const days = Math.round(ms / day);
    return `${days} day${days === 1 ? "" : "s"}`;
  }
  const hours = Math.max(1, Math.round(ms / (60 * 60 * 1000)));
  return `${hours} hour${hours === 1 ? "" : "s"}`;
}

// "2 admins: accept 1 of 2 needed, deny 0 of 1 needed", the same wording as
// the appeal DM and the vote command.
export function tallyText(tally) {
  if (!tally || !tally.admins) return "No admins can vote";
  const admins = `${tally.admins} admin${tally.admins === 1 ? "" : "s"}`;
  return `${admins}: accept ${tally.accept} of ${tally.acceptAt} needed, deny ${tally.deny} of ${tally.denyAt} needed`;
}

// A queue cell that is a link to the case, filling the cell, so a click
// anywhere in the row (the name included) opens it, and it can be opened in
// a new tab.
function CaseCell({ to, children, sx }) {
  return (
    <TableCell sx={{ p: 0, ...sx }}>
      <Box
        component={RouterLink}
        to={to}
        sx={{
          display: "block",
          px: 2,
          py: "6px",
          color: "inherit",
          textDecoration: "none",
        }}
      >
        {children}
      </Box>
    </TableCell>
  );
}

function StatusChip({ status }) {
  return (
    <Chip
      size="small"
      label={String(status || "").toUpperCase()}
      color={STATUS_COLORS[status] || "default"}
      sx={{ fontWeight: 700 }}
    />
  );
}

function UserLink({ id, name }) {
  if (!id) return "-";
  return (
    <Link component={RouterLink} to={`/user/${id}`} underline="hover">
      {name || id}
    </Link>
  );
}

function errorText(err, fallback) {
  return (typeof err?.response?.data === "string" && err.response.data) ||
    fallback;
}

function caseLink(row) {
  return `${BAN_APPEALS_PATH}/${row.id}`;
}

export default function BanAppeals() {
  const { appealId } = useParams();
  return appealId ? <AppealCase appealId={appealId} /> : <AppealList />;
}

function AppealList() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("pending");
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = "Ban Appeals | UltiMafia";
  }, []);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setError(null);
    axios
      .get("/api/mod/banAppeals", { params: { filter } })
      .then((res) => !cancelled && setRows(res.data))
      .catch(
        (err) =>
          !cancelled &&
          setError(errorText(err, "Could not load ban appeals.")),
      );
    return () => {
      cancelled = true;
    };
  }, [filter]);

  return (
    <Stack spacing={2} data-testid="ban-appeals-list">
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
      >
        <Typography variant="h3">Ban Appeals</Typography>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={filter}
          onChange={(_, value) => value && setFilter(value)}
        >
          <ToggleButton value="pending">Pending</ToggleButton>
          <ToggleButton value="resolved">Resolved</ToggleButton>
          <ToggleButton value="all">All</ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
      {!error && !rows && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      )}
      {rows && rows.length === 0 && (
        <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
          {filter === "pending"
            ? "No pending appeals."
            : filter === "resolved"
              ? "No resolved appeals."
              : "No appeals yet."}
        </Typography>
      )}
      {rows && rows.length > 0 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Banned user</TableCell>
                <TableCell>Ban</TableCell>
                <TableCell>Banned on</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell>Appeal filed</TableCell>
                <TableCell>Tally</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  data-testid="ban-appeal-row"
                  sx={{ cursor: "pointer" }}
                  onClick={(e) => {
                    // The cell links navigate themselves.
                    if (e.target.closest("a")) return;
                    navigate(caseLink(row));
                  }}
                >
                  <CaseCell to={caseLink(row)} sx={{ fontWeight: 600 }}>
                    {row.username}
                  </CaseCell>
                  <CaseCell to={caseLink(row)}>
                    {row.ban
                      ? `${row.ban.label}${row.ban.active ? "" : " (ended)"}`
                      : "Ban removed"}
                  </CaseCell>
                  <CaseCell to={caseLink(row)}>
                    {formatDate(row.ban?.issuedAt)}
                  </CaseCell>
                  <CaseCell to={caseLink(row)}>
                    {!row.ban
                      ? "-"
                      : row.ban.permanent
                        ? "Never (permanent)"
                        : formatDate(row.ban.expires)}
                  </CaseCell>
                  <CaseCell to={caseLink(row)}>{formatDate(row.filedAt)}</CaseCell>
                  <CaseCell to={caseLink(row)}>
                    {tallyText(row.tally)}
                    {row.myVote && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        You voted {row.myVote}
                      </Typography>
                    )}
                  </CaseCell>
                  <CaseCell to={caseLink(row)}>
                    <StatusChip status={row.status} />
                  </CaseCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  );
}

function Field({ label, children }) {
  return (
    <Box sx={{ minWidth: 160 }}>
      <Typography variant="overline" color="text.secondary">
        {label}
      </Typography>
      <Box>{children}</Box>
    </Box>
  );
}

function Section({ title, children, testId }) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }} data-testid={testId}>
      <Typography variant="h4" sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

function AppealCase({ appealId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [vote, setVote] = useState("");
  const [justification, setJustification] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [voteError, setVoteError] = useState(null);
  const [saved, setSaved] = useState(false);

  const applyCase = useCallback((caseData) => {
    setData(caseData);
    setVote(caseData.myVote?.vote || "");
    setJustification(caseData.myVote?.justification || "");
  }, []);

  useEffect(() => {
    document.title = "Ban Appeal | UltiMafia";
    let cancelled = false;
    setData(null);
    setError(null);
    axios
      .get(`/api/mod/banAppeals/${encodeURIComponent(appealId)}`)
      .then((res) => !cancelled && applyCase(res.data))
      .catch(
        (err) =>
          !cancelled && setError(errorText(err, "Could not load the appeal.")),
      );
    return () => {
      cancelled = true;
    };
  }, [appealId, applyCase]);

  const back = (
    <Box>
      <Button component={RouterLink} to={BAN_APPEALS_PATH} size="small">
        Back to Ban Appeals
      </Button>
    </Box>
  );

  if (error)
    return (
      <Stack spacing={2}>
        {back}
        <Alert severity="error">{error}</Alert>
      </Stack>
    );
  if (!data)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );

  const trimmed = justification.trim();
  const canSubmit =
    data.canVote &&
    (vote === "accept" || vote === "deny") &&
    trimmed.length > 0 &&
    trimmed.length <= data.maxJustificationLength &&
    !submitting &&
    (!data.myVote ||
      data.myVote.vote !== vote ||
      data.myVote.justification !== trimmed);

  const submitVote = () => {
    setSubmitting(true);
    setVoteError(null);
    setSaved(false);
    axios
      .post(`/api/mod/banAppeals/${encodeURIComponent(data.id)}/vote`, {
        vote,
        justification: trimmed,
      })
      .then((res) => {
        applyCase(res.data);
        setSaved(true);
      })
      .catch((err) =>
        setVoteError(errorText(err, "Could not record your vote.")),
      )
      .finally(() => setSubmitting(false));
  };

  const ban = data.ban;
  const lengthText = ban.permanent
    ? "Permanent"
    : ban.lengthText || formatDuration(ban.lengthMs) || "-";

  return (
    <Stack spacing={2} data-testid="ban-appeal-case">
      {back}
      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
        <Typography variant="h3">
          Appeal from <UserLink id={data.userId} name={data.username} />
        </Typography>
        <StatusChip status={data.status} />
      </Stack>
      <Typography color="text.secondary" data-testid="case-tally">
        {tallyText(data.tally)}. Deciding does not lift the ban; an accepted
        appeal still needs a site Unban.
      </Typography>

      <Section title="Appeal" testId="case-appeal">
        <Typography variant="caption" color="text.secondary">
          Filed {formatDate(data.filedAt)}
        </Typography>
        <Typography sx={{ whiteSpace: "pre-wrap", mt: 1 }}>{data.text}</Typography>
      </Section>

      <Section title="Ban" testId="case-ban">
        {ban.removed ? (
          <Stack spacing={1}>
            <Alert severity="info">
              This ban no longer exists (it was lifted or removed).
            </Alert>
            <Field label="Reason at the time of the appeal">
              {ban.reason || "-"}
            </Field>
          </Stack>
        ) : (
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
              <Field label="Type">
                {ban.label}
                {ban.active ? "" : " (ended)"}
              </Field>
              <Field label="Scope">
                {ban.scope ? ban.scope.label : "Not recorded (older ban)"}
              </Field>
              <Field label="Banned by">
                <UserLink id={ban.bannedBy?.id} name={ban.bannedBy?.name} />
              </Field>
              <Field label="Length">{lengthText}</Field>
              <Field label="Banned on">{formatDate(ban.issuedAt)}</Field>
              <Field label="Expires">
                {ban.permanent ? "Never (permanent)" : formatDate(ban.expires)}
              </Field>
            </Stack>
            {ban.bannedAs && (
              <Alert severity="info">
                Banned as a linked account of{" "}
                <UserLink id={ban.bannedAs.id} name={ban.bannedAs.name} />.
              </Alert>
            )}
            <Field label="Reason">
              <Typography sx={{ whiteSpace: "pre-wrap" }}>{ban.reason}</Typography>
            </Field>
          </Stack>
        )}
      </Section>

      <Section title="Report(s) behind the ban" testId="case-reports">
        {data.reports.length === 0 ? (
          <Typography color="text.secondary">
            No report found. The ban may have been issued directly with the
            Ban command.
          </Typography>
        ) : (
          <Stack spacing={1.5} divider={<Divider flexItem />}>
            {data.reports.map((report) => (
              <Box key={report.id} data-testid="case-report">
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Link
                    component={RouterLink}
                    to={`/policy/moderation/reports/${report.id}`}
                    sx={{ fontWeight: 600 }}
                  >
                    Report {report.id}
                  </Link>
                  <Chip size="small" label={report.status} />
                  <Typography variant="caption" color="text.secondary">
                    {REPORT_LINK_TEXT[report.linkedBy] || ""}
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  Against <UserLink id={report.reportedUserId} name={report.reportedUserName} />
                  {" · "}Rule: {report.rule || "-"}
                  {" · "}Filed {formatDate(report.createdAt)}
                  {" · "}
                  {report.reporterCount} reporter
                  {report.reporterCount === 1 ? "" : "s"}
                  {report.gameId ? ` · Game ${report.gameId}` : ""}
                </Typography>
                {report.description && (
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 0.5 }}>
                    {report.description}
                  </Typography>
                )}
                {report.ruling && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Ruling
                    {report.completedByName ? ` by ${report.completedByName}` : ""}:{" "}
                    {[report.ruling.violationName, report.ruling.banLength, report.ruling.notes]
                      .filter(Boolean)
                      .join(" - ")}
                  </Typography>
                )}
              </Box>
            ))}
          </Stack>
        )}
      </Section>

      <Section title="Mod log for this user" testId="case-modlog">
        {data.modActions.length === 0 ? (
          <Typography color="text.secondary">No mod log entries.</Typography>
        ) : (
          <Stack spacing={0.5}>
            {data.modActions.map((action) => (
              <Typography
                key={action.id}
                variant="body2"
                sx={{ fontWeight: action.issuedThisBan ? 700 : 400 }}
              >
                {formatDate(action.date)} · {action.name} by {action.modName}
                {action.args.length > 1 ? ` (${action.args.slice(1).join(", ")})` : ""}
                {action.issuedThisBan ? " · issued this ban" : ""}
              </Typography>
            ))}
            <Box sx={{ pt: 1 }}>
              <Link component={RouterLink} to="/policy/moderation">
                Open the full moderation log
              </Link>
            </Box>
          </Stack>
        )}
      </Section>

      <Section title="Votes and justifications" testId="case-votes">
        <Alert severity="info" sx={{ mb: 1.5 }}>
          Justifications are shown only to the admins who can vote on appeals.
          The banned user never sees them.
        </Alert>
        {data.votes.length === 0 ? (
          <Typography color="text.secondary">No votes yet.</Typography>
        ) : (
          <Stack spacing={1.5} divider={<Divider flexItem />}>
            {data.votes.map((entry) => (
              <Box key={entry.voterId} data-testid="case-vote">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography sx={{ fontWeight: 600 }}>{entry.voterName}</Typography>
                  <Chip
                    size="small"
                    label={entry.vote.toUpperCase()}
                    color={entry.vote === "accept" ? "success" : "error"}
                    variant="outlined"
                  />
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(entry.at)}
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 0.5 }}>
                  {entry.justification || "(no justification recorded)"}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Section>

      <Section title={data.myVote ? "Change your vote" : "Your vote"} testId="case-vote-form">
        {!data.canVote ? (
          <Typography color="text.secondary">
            {data.status !== "pending"
              ? `This appeal is ${data.status.toUpperCase()}; votes are closed.`
              : "This appeal was not sent to you, so you can't vote on it."}
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            <RadioGroup row value={vote} onChange={(e) => setVote(e.target.value)}>
              <FormControlLabel value="accept" control={<Radio />} label="Accept" />
              <FormControlLabel value="deny" control={<Radio />} label="Deny" />
            </RadioGroup>
            <TextField
              label="Justification (required)"
              multiline
              minRows={3}
              value={justification}
              onChange={(e) =>
                setJustification(e.target.value.slice(0, data.maxJustificationLength))
              }
              helperText={`${trimmed.length}/${data.maxJustificationLength}. Visible to the voting admins only.`}
            />
            {voteError && <Alert severity="error">{voteError}</Alert>}
            {saved && <Alert severity="success">Vote recorded.</Alert>}
            <Box>
              <Button variant="contained" disabled={!canSubmit} onClick={submitVote}>
                {submitting
                  ? "Saving..."
                  : data.myVote
                    ? "Change vote"
                    : "Submit vote"}
              </Button>
            </Box>
          </Stack>
        )}
      </Section>
    </Stack>
  );
}
