import React, { useCallback, useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Button,
  Chip,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
} from "@mui/material";
import { UserContext, SiteInfoContext } from "../../Contexts";
import { useErrorAlert } from "components/Alerts";
import { Loading } from "components/Loading";
import { Avatar } from "pages/User/User";
import { avatarUrl } from "utils/avatarUrl";

function userIsOwner(user) {
  return (user?.groups || []).some((g) => g && g.name === "Owner");
}

function statusColor(status) {
  if (status === "completed") return "success";
  if (status === "pending") return "warning";
  if (status === "rejected") return "error";
  if (status === "expired" || status === "failed") return "default";
  return "default";
}

function formatWhen(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

function InvoiceUserCell({ userId, userName }) {
  const siteInfo = useContext(SiteInfoContext);
  const [imgFailed, setImgFailed] = useState(false);
  const src = avatarUrl(userId, { cacheVal: siteInfo?.cacheVal });

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      {userId && src && !imgFailed ? (
        <Box
          component="img"
          src={src}
          alt=""
          onError={() => setImgFailed(true)}
          sx={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            objectFit: "cover",
            flexShrink: 0,
            bgcolor: "action.hover",
          }}
        />
      ) : (
        <Avatar small name={userName} />
      )}
      <Typography variant="body2">{userName}</Typography>
    </Stack>
  );
}

export default function Invoices() {
  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();

  const [status, setStatus] = useState("unpaid");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    axios
      .get("/api/crypto/admin/invoices", { params: { status, page } })
      .then((res) => setData(res.data))
      .catch(errorAlert)
      .finally(() => setLoading(false));
  }, [status, page, errorAlert]);

  useEffect(() => {
    document.title = "Invoices | UltiMafia";
  }, []);

  useEffect(() => {
    if (user.loaded && user.loggedIn && userIsOwner(user)) {
      load();
    }
  }, [user.loaded, user.loggedIn, user.groups, load]);

  async function review(invoiceId, action) {
    const verb = action === "approve" ? "approve and credit" : "reject";
    if (!window.confirm(`Really ${verb} invoice ${invoiceId}?`)) return;
    setBusyId(invoiceId);
    try {
      await axios.post(`/api/crypto/admin/invoices/${invoiceId}/${action}`);
      siteInfo.showAlert(
        action === "approve" ? "Invoice approved. Coins credited." : "Invoice rejected.",
        "success"
      );
      load();
    } catch (e) {
      errorAlert(e);
    } finally {
      setBusyId("");
    }
  }

  if (!user.loaded) return <Loading />;
  if (!user.loggedIn || !userIsOwner(user)) {
    return <Navigate to="/policy/rules" replace />;
  }

  const invoices = data?.invoices || [];
  const totalPages = Math.max(
    1,
    Math.ceil((data?.total || 0) / (data?.pageSize || 50))
  );

  return (
    <Stack spacing={2}>
      <Typography variant="h2">Invoices</Typography>
      <Typography variant="body2" color="textSecondary">
        Crypto donation invoices. Approve unpaid invoices to credit coins.
        Reject closes them without payment.
      </Typography>
      <TextField
        select
        label="Status"
        value={status}
        onChange={(e) => {
          setPage(1);
          setStatus(e.target.value);
        }}
        sx={{ maxWidth: 240 }}
      >
        <MenuItem value="unpaid">Unpaid</MenuItem>
        <MenuItem value="all">All</MenuItem>
        <MenuItem value="pending">Pending</MenuItem>
        <MenuItem value="expired">Expired</MenuItem>
        <MenuItem value="completed">Completed</MenuItem>
        <MenuItem value="rejected">Rejected</MenuItem>
        <MenuItem value="failed">Failed</MenuItem>
      </TextField>

      {loading && !data ? (
        <Loading />
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Created</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Network</TableCell>
                <TableCell>Token</TableCell>
                <TableCell>USD</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Coins</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9}>
                    <Typography variant="body2">No invoices.</Typography>
                  </TableCell>
                </TableRow>
              )}
              {invoices.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{formatWhen(row.createdAt)}</TableCell>
                  <TableCell>
                    <InvoiceUserCell
                      userId={row.userId}
                      userName={row.userName}
                    />
                  </TableCell>
                  <TableCell>{row.chainLabel || row.chain}</TableCell>
                  <TableCell>{row.asset}</TableCell>
                  <TableCell>${row.usd}</TableCell>
                  <TableCell>
                    {row.expectedAmount} {row.asset}
                  </TableCell>
                  <TableCell>{row.coins}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={row.status}
                      color={statusColor(row.status)}
                    />
                  </TableCell>
                  <TableCell>
                    {row.canApprove || row.canReject ? (
                      <Stack direction="row" spacing={1}>
                        {row.canApprove && (
                          <Button
                            size="small"
                            variant="contained"
                            disabled={busyId === row.id}
                            onClick={() => review(row.id, "approve")}
                          >
                            Approve
                          </Button>
                        )}
                        {row.canReject && (
                          <Button
                            size="small"
                            color="error"
                            disabled={busyId === row.id}
                            onClick={() => review(row.id, "reject")}
                          >
                            Reject
                          </Button>
                        )}
                      </Stack>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {totalPages > 1 && (
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            size="small"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <Typography variant="body2">
            Page {page} of {totalPages}
          </Typography>
          <Button
            size="small"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </Stack>
      )}
      {loading && data ? (
        <Box>
          <Loading />
        </Box>
      ) : null}
    </Stack>
  );
}
