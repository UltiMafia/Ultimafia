import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import { useErrorAlert } from "components/Alerts";
import { UserSearchSelect } from "components/Form";
import { SiteInfoContext } from "Contexts";

const HARD_BLOCKERS = new Set([
  "targetMissing",
  "targetDeleted",
  "targetBanned",
  "targetSystem",
  "missingSelection",
  "fromUserMissing",
  "cap",
]);

function blockerText(item) {
  if (!item) return "Restore cannot proceed.";
  if (item.code === "cap") {
    return `Over the setup cap (owned ${item.owned}, adding ${item.adding}, max ${item.max}).`;
  }
  if (item.code === "targetMissing") return "That user does not exist.";
  if (item.code === "fromUserMissing") return "The source user does not exist.";
  if (item.code === "targetDeleted") return "That account is deleted.";
  if (item.code === "targetBanned") return "That account is banned.";
  if (item.code === "targetSystem") return "That account cannot own setups.";
  if (item.code === "missingSelection") {
    return "Provide setup ids or a from user id.";
  }
  if (item.code === "setupMissing") return `Setup not found: ${item.id}`;
  return item.code || "Restore cannot proceed.";
}

function parseSetupIds(text) {
  return String(text || "")
    .split(/[\s,]+/)
    .map((id) => id.trim())
    .filter(Boolean);
}

export function RestoreSetupsForm({ initial, onDone }) {
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();
  const [toUserId, setToUserId] = useState(
    initial && initial.userId ? initial.userId : ""
  );
  const [setupIdsText, setSetupIdsText] = useState(
    initial && initial.setupId ? initial.setupId : ""
  );
  const [fromUserId, setFromUserId] = useState("");
  const [reassignGuides, setReassignGuides] = useState(false);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  function clearPreview() {
    setPreview(null);
  }

  function payload(dryRun) {
    const setupIds = parseSetupIds(setupIdsText);
    const body = {
      toUserId: String(toUserId || "").trim(),
      reassignGuides: !!reassignGuides,
      dryRun: !!dryRun,
    };
    if (setupIds.length) body.setupIds = setupIds;
    else if (String(fromUserId || "").trim()) {
      body.fromUserId = String(fromUserId).trim();
    }
    return body;
  }

  function onPreview() {
    setBusy(true);
    axios
      .post("/api/setup/restore", payload(true))
      .then((res) => setPreview(res.data || {}))
      .catch(errorAlert)
      .finally(() => setBusy(false));
  }

  function onConfirm() {
    if (!preview) return;
    const blockers = preview.blockers || [];
    if (blockers.some((item) => HARD_BLOCKERS.has(item && item.code))) return;
    setBusy(true);
    const body = payload(false);
    delete body.dryRun;
    axios
      .post("/api/setup/restore", body)
      .then((res) => {
        const restored = (res.data && res.data.restored) || [];
        const count = restored.filter((row) => row && !row.skipped).length;
        siteInfo.showAlert(
          `Restored ${count} setup${count === 1 ? "" : "s"}.`,
          "success"
        );
        if (onDone) onDone();
      })
      .catch(errorAlert)
      .finally(() => setBusy(false));
  }

  const blockers = (preview && preview.blockers) || [];
  const hard = blockers.filter((item) => HARD_BLOCKERS.has(item && item.code));
  const rows = (preview && preview.setups) || [];
  const counts = (preview && preview.counts) || {};
  const actionable = rows.some(
    (row) => row && (row.status === "restore" || row.status === "already")
  );
  const canConfirm = !!preview && hard.length === 0 && actionable && !busy;

  return (
    <Stack spacing={1} sx={{ mt: 1 }}>
      <UserSearchSelect
        placeholder="Target user"
        onChange={(id) => {
          if (id) {
            setToUserId(id);
            clearPreview();
          }
        }}
      />
      <TextField
        label="Target user id"
        value={toUserId}
        onChange={(e) => {
          setToUserId(e.target.value);
          clearPreview();
        }}
        size="small"
        fullWidth
      />
      <TextField
        label="Setup ids"
        placeholder="Comma or space separated. Used instead of From user id."
        value={setupIdsText}
        onChange={(e) => {
          setSetupIdsText(e.target.value);
          clearPreview();
        }}
        size="small"
        fullWidth
        multiline
        minRows={2}
      />
      <TextField
        label="From user id"
        placeholder="Restore every eligible setup from this user"
        value={fromUserId}
        onChange={(e) => {
          setFromUserId(e.target.value);
          clearPreview();
        }}
        size="small"
        fullWidth
      />
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={reassignGuides}
            onChange={(e) => {
              setReassignGuides(e.target.checked);
              clearPreview();
            }}
          />
        }
        label="Reassign guides"
      />
      <Stack direction="row" spacing={1}>
        <Button onClick={onPreview} disabled={busy}>
          Preview
        </Button>
        <Button onClick={onConfirm} disabled={!canConfirm}>
          Confirm
        </Button>
      </Stack>
      {preview ? (
        <Box>
          {blockers.length ? (
            <Stack spacing={0.5} sx={{ mb: 1 }}>
              {blockers.map((item, index) => (
                <Typography key={`${item.code || "blocker"}-${index}`} color="error" variant="body2">
                  {blockerText(item)}
                </Typography>
              ))}
            </Stack>
          ) : null}
          <Typography variant="body2" sx={{ mb: 1 }}>
            {`Linked: ${counts.guides || 0} guides, ${counts.games || 0} games, ${counts.favorites || 0} favorites, ${counts.votes || 0} votes.`}
          </Typography>
          <Box sx={{ maxHeight: 280, overflow: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Setup</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Reason</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length ? (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.id}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.status}</TableCell>
                      <TableCell>{row.reason || ""}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4}>No setups matched.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </Box>
      ) : null}
    </Stack>
  );
}

function exemptSummary(exempt) {
  if (!exempt) return "";
  return Object.keys(exempt)
    .map((key) => {
      const list = exempt[key] || [];
      return list.length ? `${key} ${list.length}` : null;
    })
    .filter(Boolean)
    .join(", ");
}

export function ArchiveStaleForm({ onDone }) {
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setBusy(true);
    axios
      .post("/api/setup/archiveStale", { dryRun: true })
      .then((res) => {
        if (!cancelled) setPreview(res.data || {});
      })
      .catch((e) => {
        if (!cancelled) errorAlert(e);
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [errorAlert]);

  function onConfirm() {
    if (!preview || !preview.count) return;
    if (!window.confirm(`Archive ${preview.count} stale setups?`)) return;
    setBusy(true);
    axios
      .post("/api/setup/archiveStale", { confirm: true })
      .then((res) => {
        const count = res.data && typeof res.data.count === "number" ? res.data.count : 0;
        siteInfo.showAlert(
          `Archived ${count} stale setup${count === 1 ? "" : "s"}.`,
          "success"
        );
        if (onDone) onDone();
      })
      .catch(errorAlert)
      .finally(() => setBusy(false));
  }

  const matched = (preview && preview.matched) || [];
  const shown = matched.slice(0, 200);
  const hidden = matched.length - shown.length;
  const skipped = exemptSummary(preview && preview.exempt);
  const transferCount = ((preview && preview.transfers) || []).length;

  return (
    <Stack spacing={1} sx={{ mt: 1 }}>
      {busy && !preview ? (
        <Typography variant="body2">Loading preview…</Typography>
      ) : null}
      {preview ? (
        <Box>
          <Typography variant="body2">
            {`${preview.count || 0} setups would be archived.`}
          </Typography>
          {transferCount ? (
            <Typography variant="body2">
              {`${transferCount} will move off deleted accounts.`}
            </Typography>
          ) : null}
          {skipped ? (
            <Typography variant="body2">{`Left alone: ${skipped}.`}</Typography>
          ) : null}
          <Box sx={{ maxHeight: 280, overflow: "auto", mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Setup</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Played</TableCell>
                  <TableCell>Transfer</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shown.length ? (
                  shown.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.id}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.played}</TableCell>
                      <TableCell>{row.transfer ? "yes" : ""}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4}>No stale setups.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
          {hidden > 0 ? (
            <Typography variant="body2" sx={{ mt: 1 }}>
              {`Showing 200 of ${matched.length}.`}
            </Typography>
          ) : null}
        </Box>
      ) : null}
      <Button onClick={onConfirm} disabled={busy || !preview || !preview.count}>
        Confirm
      </Button>
    </Stack>
  );
}
