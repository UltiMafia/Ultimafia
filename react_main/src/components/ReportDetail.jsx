import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Divider,
  Paper,
} from "@mui/material";
import { useErrorAlert } from "./Alerts";
import { UserSearchSelect } from "./Form";
import { Time } from "./Basic";
import { NameWithAvatar } from "pages/User/User";
import { UserContext, SiteInfoContext } from "../Contexts";
import ReportTypology from "./ReportTypology";

export default function ReportDetail({ report: initialReport, onBack, onUpdate }) {
  const [report, setReport] = useState(initialReport);
  const [assignees, setAssignees] = useState(report.assignees || []);
  const [status, setStatus] = useState(report.status);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [finalRuling, setFinalRuling] = useState({
    violationId: "",
    violationName: "",
    violationCategory: "Community",
    banType: "",
    banLength: "",
    banLengthMs: null,
    notes: "",
  });
  const [dismissed, setDismissed] = useState(false);

  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();
  const navigate = useNavigate();

  const handleStatusChange = async (newStatus) => {
    try {
      await axios.post(`/api/mod/reports/${report.id}/status`, {
        status: newStatus,
      });
      setStatus(newStatus);
      setReport({ ...report, status: newStatus });
      siteInfo.showAlert("Status updated successfully", "success");
      if (onUpdate) onUpdate();
    } catch (e) {
      errorAlert(e);
    }
  };

  const handleAssign = async () => {
    try {
      await axios.post(`/api/mod/reports/${report.id}/assign`, {
        assignees: assignees,
      });
      setReport({ ...report, assignees: assignees });
      setShowAssignDialog(false);
      siteInfo.showAlert("Assignees updated successfully", "success");
      if (onUpdate) onUpdate();
    } catch (e) {
      errorAlert(e);
    }
  };

  const handleComplete = async () => {
    if (!dismissed && (!finalRuling.violationId || !finalRuling.violationName || !finalRuling.banType)) {
      siteInfo.showAlert("Please fill in all required violation fields", "error");
      return;
    }

    try {
      setCompleting(true);
      const res = await axios.post(`/api/mod/reports/${report.id}/complete`, {
        finalRuling: dismissed ? null : finalRuling,
        dismissed: dismissed,
      });
      setReport(res.data.report);
      setShowCompleteDialog(false);
      siteInfo.showAlert("Report completed successfully", "success");
      if (onUpdate) onUpdate();
    } catch (e) {
      errorAlert(e);
    } finally {
      setCompleting(false);
    }
  };

  const handleReopen = async () => {
    try {
      await axios.post(`/api/mod/reports/${report.id}/reopen`, {
        newStatus: "in-progress",
      });
      setStatus("in-progress");
      setReport({ ...report, status: "in-progress" });
      siteInfo.showAlert("Report reopened successfully", "success");
      if (onUpdate) onUpdate();
    } catch (e) {
      errorAlert(e);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "success";
      case "in-progress":
        return "warning";
      case "complete":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Button onClick={onBack} variant="outlined">
          ← Back to Reports
        </Button>
        <Typography variant="h4">Report #{report.id}</Typography>
        <Chip
          label={report.status}
          color={getStatusColor(report.status)}
          size="small"
        />
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Report Information
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Reporter
                </Typography>
                <NameWithAvatar
                  id={report.reporterId}
                  name={report.reporterId}
                />
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Reported User
                </Typography>
                <NameWithAvatar
                  id={report.reportedUserId}
                  name={report.reportedUserId}
                />
              </Box>
              {report.gameId && (
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Game
                  </Typography>
                  <Typography>
                    <a href={`/game/${report.gameId}`} target="_blank" rel="noopener noreferrer">
                      {report.gameId}
                    </a>
                  </Typography>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Rule Broken
                </Typography>
                <Typography>{report.rule}</Typography>
              </Box>
              {report.description && (
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Description
                  </Typography>
                  <Typography sx={{ whiteSpace: "pre-wrap" }}>
                    {report.description}
                  </Typography>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Created
                </Typography>
                <Typography>
                  <Time timestamp={report.createdAt} />
                </Typography>
              </Box>
            </Stack>
          </Card>

          {report.finalRuling && (
            <Card sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Final Ruling
              </Typography>
              <ReportTypology finalRuling={report.finalRuling} />
            </Card>
          )}

          <Card sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              History
            </Typography>
            <Stack spacing={1}>
              {report.history &&
                report.history
                  .slice()
                  .reverse()
                  .map((entry, idx) => (
                    <Paper key={idx} sx={{ p: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={entry.status}
                          color={getStatusColor(entry.status)}
                          size="small"
                        />
                        <Typography variant="body2">
                          <Time timestamp={entry.timestamp} />
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          by {entry.changedBy}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          - {entry.action}
                        </Typography>
                        {entry.note && (
                          <Typography variant="body2" color="textSecondary">
                            ({entry.note})
                          </Typography>
                        )}
                      </Stack>
                    </Paper>
                  ))}
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Actions
            </Typography>
            <Stack spacing={2}>
              <Button
                variant="outlined"
                onClick={() => setShowAssignDialog(true)}
              >
                Manage Assignees
              </Button>
              {status !== "complete" && (
                <>
                  <FormControl fullWidth>
                    <InputLabel>Change Status</InputLabel>
                    <Select
                      value={status}
                      label="Change Status"
                      onChange={(e) => handleStatusChange(e.target.value)}
                    >
                      <MenuItem value="open">Open</MenuItem>
                      <MenuItem value="in-progress">In Progress</MenuItem>
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={() => setShowCompleteDialog(true)}
                  >
                    Complete Report
                  </Button>
                </>
              )}
              {status === "complete" && (
                <Button variant="outlined" onClick={handleReopen}>
                  Reopen Report
                </Button>
              )}
            </Stack>
          </Card>

          <Card sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Assignees
            </Typography>
            {report.assignees && report.assignees.length > 0 ? (
              <Stack spacing={1}>
                {report.assignees.map((assigneeId) => (
                  <NameWithAvatar
                    key={assigneeId}
                    id={assigneeId}
                    name={assigneeId}
                  />
                ))}
              </Stack>
            ) : (
              <Typography color="textSecondary">Unassigned</Typography>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* Assign Dialog */}
      <Dialog
        open={showAssignDialog}
        onClose={() => setShowAssignDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Manage Assignees</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="textSecondary">
              Select users to assign to this report. You can assign multiple users.
            </Typography>
            <Stack spacing={1}>
              <UserSearchSelect
                value=""
                onChange={(userId) => {
                  if (userId && !assignees.includes(userId)) {
                    setAssignees([...assignees, userId]);
                  }
                }}
                placeholder="Search and select user to add..."
              />
              {assignees.length > 0 && (
                <Stack spacing={0.5}>
                  {assignees.map((assigneeId) => (
                    <Stack
                      key={assigneeId}
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ p: 1, bgcolor: "background.paper", borderRadius: 1 }}
                    >
                      <NameWithAvatar id={assigneeId} name={assigneeId} />
                      <Button
                        size="small"
                        onClick={() =>
                          setAssignees(assignees.filter((id) => id !== assigneeId))
                        }
                      >
                        Remove
                      </Button>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAssignDialog(false)}>Cancel</Button>
          <Button onClick={handleAssign} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog
        open={showCompleteDialog}
        onClose={() => setShowCompleteDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Complete Report</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <Button
                variant={dismissed ? "contained" : "outlined"}
                onClick={() => setDismissed(true)}
                sx={{ mb: 1 }}
              >
                Dismiss Report (No Violation)
              </Button>
            </FormControl>
            <Divider>OR</Divider>
            <Typography variant="h6">Violation Details</Typography>
            <TextField
              label="Violation ID"
              value={finalRuling.violationId}
              onChange={(e) =>
                setFinalRuling({ ...finalRuling, violationId: e.target.value })
              }
              fullWidth
              required
              disabled={dismissed}
            />
            <TextField
              label="Violation Name"
              value={finalRuling.violationName}
              onChange={(e) =>
                setFinalRuling({ ...finalRuling, violationName: e.target.value })
              }
              fullWidth
              required
              disabled={dismissed}
            />
            <FormControl fullWidth>
              <InputLabel>Violation Category</InputLabel>
              <Select
                value={finalRuling.violationCategory}
                label="Violation Category"
                onChange={(e) =>
                  setFinalRuling({
                    ...finalRuling,
                    violationCategory: e.target.value,
                  })
                }
                disabled={dismissed}
              >
                <MenuItem value="Community">Community</MenuItem>
                <MenuItem value="Game">Game</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Ban Type</InputLabel>
              <Select
                value={finalRuling.banType}
                label="Ban Type"
                onChange={(e) =>
                  setFinalRuling({ ...finalRuling, banType: e.target.value })
                }
                disabled={dismissed}
              >
                <MenuItem value="site">Site</MenuItem>
                <MenuItem value="game">Game</MenuItem>
                <MenuItem value="chat">Chat</MenuItem>
                <MenuItem value="forum">Forum</MenuItem>
                <MenuItem value="ranked">Ranked</MenuItem>
                <MenuItem value="competitive">Competitive</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Ban Length (e.g., '1 day', '3 weeks', 'Permaban')"
              value={finalRuling.banLength}
              onChange={(e) =>
                setFinalRuling({ ...finalRuling, banLength: e.target.value })
              }
              fullWidth
              disabled={dismissed}
              helperText="Leave empty if no ban is warranted"
            />
            <TextField
              label="Notes"
              value={finalRuling.notes}
              onChange={(e) =>
                setFinalRuling({ ...finalRuling, notes: e.target.value })
              }
              fullWidth
              multiline
              rows={3}
              disabled={dismissed}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowCompleteDialog(false)}
            disabled={completing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleComplete}
            variant="contained"
            color="error"
            disabled={completing}
          >
            {completing ? "Completing..." : "Complete Report"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

