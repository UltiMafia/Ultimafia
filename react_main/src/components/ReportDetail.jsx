import React, { useState, useContext, useEffect } from "react";
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
import { violationDefinitions } from "../constants/violations";

export default function ReportDetail({
  report: initialReport,
  onBack,
  onUpdate,
}) {
  const [report, setReport] = useState(initialReport);
  const [assignees, setAssignees] = useState(report.assignees || []);
  const [status, setStatus] = useState(report.status);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [finalRuling, setFinalRuling] = useState({
    banType: "",
    notes: "",
  });
  const [rule, setRule] = useState(report.rule);
  const [updatingRule, setUpdatingRule] = useState(false);
  const [handlingAppeal, setHandlingAppeal] = useState(false);
  const [appealNotes, setAppealNotes] = useState("");

  // Update rule state when report prop changes
  useEffect(() => {
    setRule(report.rule);
  }, [report.rule]);

  // Update report state when initialReport changes
  useEffect(() => {
    setReport(initialReport);
    setStatus(initialReport.status);
    setAssignees(initialReport.assignees || []);
  }, [initialReport]);

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
    if (!finalRuling.banType) {
      siteInfo.showAlert(
        "Please select a ban type or dismiss the report.",
        "error"
      );
      return;
    }

    const isDismissed = finalRuling.banType === "dismiss";

    try {
      setCompleting(true);
      const res = await axios.post(`/api/mod/reports/${report.id}/complete`, {
        finalRuling: isDismissed ? null : finalRuling,
        dismissed: isDismissed,
        notes: finalRuling.notes || "",
      });
      setReport(res.data.report);
      setShowCompleteDialog(false);
      // Reset form
      setFinalRuling({ banType: "", notes: "" });
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

  const handleRuleChange = async (newRule) => {
    if (newRule === rule) return; // No change needed

    try {
      setUpdatingRule(true);
      const res = await axios.post(`/api/mod/reports/${report.id}/rule`, {
        rule: newRule,
      });
      // Update from response if available, otherwise use newRule
      const updatedRule = res.data?.report?.rule || newRule;
      setRule(updatedRule);
      setReport({ ...report, rule: updatedRule });
      siteInfo.showAlert("Rule updated successfully", "success");
      if (onUpdate) onUpdate();
    } catch (e) {
      errorAlert(e);
      // Revert to original rule on error
      setRule(report.rule);
    } finally {
      setUpdatingRule(false);
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
                  name={report.reporterName || report.reporterId}
                  avatar={report.reporterAvatar}
                />
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Reported User
                </Typography>
                <NameWithAvatar
                  id={report.reportedUserId}
                  name={report.reportedUserName || report.reportedUserId}
                  avatar={report.reportedUserAvatar}
                />
              </Box>
              {report.gameId && (
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Game
                  </Typography>
                  <Typography>
                    <a
                      href={`/game/${report.gameId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {report.gameId}
                    </a>
                  </Typography>
                </Box>
              )}
              <Box>
                <Typography color="textSecondary">Rule Broken</Typography>
                {user.perms?.seeModPanel && report.status !== "complete" ? (
                  <FormControl fullWidth sx={{ mt: 1 }}>
                    <Select
                      value={rule}
                      onChange={(e) => {
                        setRule(e.target.value);
                        handleRuleChange(e.target.value);
                      }}
                      disabled={updatingRule}
                    >
                      {violationDefinitions.map((r) => (
                        <MenuItem key={r.name} value={r.name}>
                          {r.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <Typography>{report.rule}</Typography>
                )}
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

              {/* Appeal Information */}
              {report.appeal && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      Appeal Information
                    </Typography>
                    <Stack spacing={1}>
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Appeal Status
                        </Typography>
                        <Chip
                          label={
                            report.appeal.status === "pending"
                              ? "Pending"
                              : report.appeal.status === "approved"
                              ? "Approved"
                              : "Rejected"
                          }
                          color={
                            report.appeal.status === "pending"
                              ? "warning"
                              : report.appeal.status === "approved"
                              ? "success"
                              : "error"
                          }
                          size="small"
                        />
                      </Box>
                      {report.originalReport && (
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Original Report
                          </Typography>
                          <Typography variant="body2">
                            <a
                              href={`/community/reports/${report.originalReport.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Report #{report.originalReport.id}
                            </a>
                          </Typography>
                          <Typography variant="body2">
                            Violation:{" "}
                            {report.originalReport.finalRuling?.violationName ||
                              "N/A"}
                          </Typography>
                        </Box>
                      )}
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Appeal Reason
                        </Typography>
                        <Typography sx={{ whiteSpace: "pre-wrap" }}>
                          {report.appeal.description}
                        </Typography>
                      </Box>
                      {report.appeal.reviewNotes && (
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Review Notes
                          </Typography>
                          <Typography sx={{ whiteSpace: "pre-wrap" }}>
                            {report.appeal.reviewNotes}
                          </Typography>
                        </Box>
                      )}
                      {report.appeal.reviewedAt && (
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Reviewed
                          </Typography>
                          <Typography>
                            <Time
                              millisec={Date.now() - report.appeal.reviewedAt}
                              suffix=" ago"
                            />
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Box>
                </>
              )}
              {report.createdAt && (
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Created
                  </Typography>
                  <Typography>
                    <Time
                      millisec={Date.now() - report.createdAt}
                      suffix=" ago"
                    />
                  </Typography>
                </Box>
              )}
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
                          {entry.timestamp && (
                            <Time
                              millisec={Date.now() - entry.timestamp}
                              suffix=" ago"
                            />
                          )}
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
              {/* Appeal Actions */}
              {report.appeal &&
                report.appeal.status === "pending" &&
                user.perms?.seeModPanel && (
                  <>
                    <Divider />
                    <Typography variant="subtitle2">Appeal Actions</Typography>
                    <TextField
                      label="Review Notes (Optional)"
                      value={appealNotes}
                      onChange={(e) => setAppealNotes(e.target.value)}
                      fullWidth
                      multiline
                      rows={2}
                      placeholder="Add notes about your decision..."
                    />
                    <Button
                      variant="contained"
                      color="success"
                      onClick={async () => {
                        try {
                          setHandlingAppeal(true);
                          await axios.post(
                            `/api/mod/appeals/${report.appeal.id}/approve`,
                            { notes: appealNotes }
                          );
                          siteInfo.showAlert(
                            "Appeal approved successfully",
                            "success"
                          );
                          setAppealNotes("");
                          if (onUpdate) onUpdate();
                          // Reload report
                          const updatedRes = await axios.get(
                            `/api/mod/reports/${report.id}`
                          );
                          setReport(updatedRes.data);
                        } catch (e) {
                          errorAlert(e);
                        } finally {
                          setHandlingAppeal(false);
                        }
                      }}
                      disabled={handlingAppeal}
                    >
                      {handlingAppeal ? "Approving..." : "Approve Appeal"}
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={async () => {
                        try {
                          setHandlingAppeal(true);
                          await axios.post(
                            `/api/mod/appeals/${report.appeal.id}/reject`,
                            { notes: appealNotes }
                          );
                          siteInfo.showAlert(
                            "Appeal rejected successfully",
                            "success"
                          );
                          setAppealNotes("");
                          if (onUpdate) onUpdate();
                          // Reload report
                          const updatedRes = await axios.get(
                            `/api/mod/reports/${report.id}`
                          );
                          setReport(updatedRes.data);
                        } catch (e) {
                          errorAlert(e);
                        } finally {
                          setHandlingAppeal(false);
                        }
                      }}
                      disabled={handlingAppeal}
                    >
                      {handlingAppeal ? "Rejecting..." : "Reject Appeal"}
                    </Button>
                    <Divider />
                  </>
                )}

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
                {(report.assigneeInfo || report.assignees).map((assignee) => {
                  const assigneeId =
                    typeof assignee === "string" ? assignee : assignee.id;
                  const assigneeName =
                    typeof assignee === "string"
                      ? assignee
                      : assignee.name || assigneeId;
                  const assigneeAvatar =
                    typeof assignee === "string" ? false : assignee.avatar;
                  return (
                    <NameWithAvatar
                      key={assigneeId}
                      id={assigneeId}
                      name={assigneeName}
                      avatar={assigneeAvatar}
                    />
                  );
                })}
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
              Select users to assign to this report. You can assign multiple
              users.
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
                      sx={{
                        p: 1,
                        bgcolor: "background.paper",
                        borderRadius: 1,
                      }}
                    >
                      <NameWithAvatar id={assigneeId} name={assigneeId} />
                      <Button
                        size="small"
                        onClick={() =>
                          setAssignees(
                            assignees.filter((id) => id !== assigneeId)
                          )
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
        onClose={() => {
          setShowCompleteDialog(false);
          // Reset form when dialog closes
          setFinalRuling({ banType: "", notes: "" });
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Complete Report</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="h6">Violation Details</Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Violation name and ban length will be automatically determined
              based on the rule broken and previous offenses.
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Ban Type</InputLabel>
              <Select
                value={finalRuling.banType}
                label="Ban Type"
                onChange={(e) =>
                  setFinalRuling({ ...finalRuling, banType: e.target.value })
                }
                required
              >
                <MenuItem value="dismiss">
                  Dismiss Report (No Violation)
                </MenuItem>
                <MenuItem value="site">Site</MenuItem>
                <MenuItem value="game">Game</MenuItem>
                <MenuItem value="chat">Chat</MenuItem>
                <MenuItem value="forum">Forum</MenuItem>
                <MenuItem value="ranked">Ranked</MenuItem>
                <MenuItem value="competitive">Competitive</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Notes"
              value={finalRuling.notes}
              onChange={(e) =>
                setFinalRuling({ ...finalRuling, notes: e.target.value })
              }
              fullWidth
              multiline
              rows={3}
              placeholder={
                finalRuling.banType === "dismiss"
                  ? "Enter notes about why the report was dismissed..."
                  : "Enter notes about the violation..."
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowCompleteDialog(false);
              // Reset form when dialog closes
              setFinalRuling({ banType: "", notes: "" });
            }}
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
