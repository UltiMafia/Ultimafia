import React, { useState, useContext, useEffect, useRef } from "react";
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
  FormHelperText,
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
import { NameWithAvatar } from "pages/User/UserWidgets";
import { UserContext, SiteInfoContext } from "../Contexts";
import ReportTypology from "./ReportTypology";
import { useViolations } from "../hooks/useViolations";
import RapSheet, { getViolationBaseName } from "./RapSheet";

const MAX_OFFENSE_NUMBER = 10;

function nextOffenseNumberForRule(reports, ruleName) {
  if (!ruleName) return 1;
  const activeCount = (reports || []).filter((entry) => {
    const ticket = entry.violationTicket;
    if (!ticket) return false;
    if (ticket.status !== "active" && ticket.status !== "permanent") {
      return false;
    }
    const ticketName = ticket.violationName || entry.finalRuling?.violationName;
    return getViolationBaseName(ticketName) === ruleName;
  }).length;
  return Math.min(activeCount + 1, MAX_OFFENSE_NUMBER);
}

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
    rule: "",
    offenseNumber: 1,
    notes: "",
  });
  const [handlingAppeal, setHandlingAppeal] = useState(false);
  const [appealNotes, setAppealNotes] = useState("");
  const [reportedUserReports, setReportedUserReports] = useState([]);
  const offenseOverrideRef = useRef(false);
  const claimingAppealRef = useRef(false);

  useEffect(() => {
    if (!showCompleteDialog || !report?.reportedUserId) {
      return;
    }

    let cancelled = false;
    axios
      .get(`/api/user/${report.reportedUserId}/reports`)
      .then((res) => {
        if (!cancelled) {
          setReportedUserReports(res.data.reports || []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReportedUserReports([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [showCompleteDialog, report?.reportedUserId]);

  useEffect(() => {
    if (showCompleteDialog) {
      offenseOverrideRef.current = false;
    }
  }, [showCompleteDialog]);

  useEffect(() => {
    claimingAppealRef.current = false;
  }, [report?.id]);

  useEffect(() => {
    if (!finalRuling.rule || offenseOverrideRef.current) {
      return;
    }
    const nextOffenseNumber = nextOffenseNumberForRule(
      reportedUserReports,
      finalRuling.rule
    );
    setFinalRuling((prev) =>
      prev.offenseNumber === nextOffenseNumber
        ? prev
        : { ...prev, offenseNumber: nextOffenseNumber }
    );
  }, [reportedUserReports, finalRuling.rule]);

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
  const { violationDefinitions, loading: violationsLoading } = useViolations();
  const suggestedOffenseNumber = nextOffenseNumberForRule(
    reportedUserReports,
    finalRuling.rule
  );

  const handleStatusChange = async (newStatus) => {
    try {
      await axios.post(`/api/mod/reports/${report.id}/status`, {
        status: newStatus,
      });
      setStatus(newStatus);
      let nextAssignees = report.assignees || [];
      if (newStatus === "in-progress" && user.id) {
        const hasOtherAssignees = nextAssignees.some((id) => id !== user.id);
        nextAssignees = hasOtherAssignees
          ? [user.id]
          : nextAssignees.includes(user.id)
          ? nextAssignees
          : [...nextAssignees, user.id];
        setAssignees(nextAssignees);
      }
      setReport({
        ...report,
        status: newStatus,
        assignees: nextAssignees,
      });
      siteInfo.showAlert("Status updated successfully", "success");
      if (onUpdate) onUpdate();
    } catch (e) {
      claimingAppealRef.current = false;
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
    const isWarning = finalRuling.banType === "warning";

    if (!finalRuling.notes?.trim()) {
      siteInfo.showAlert(
        "Please enter a decision summary for this verdict.",
        "error"
      );
      return;
    }

    if (!isDismissed && !isWarning) {
      if (!finalRuling.rule) {
        siteInfo.showAlert("Please select a rule (violation type).", "error");
        return;
      }
      if (!finalRuling.offenseNumber || finalRuling.offenseNumber < 1) {
        siteInfo.showAlert(
          "Please select a violation rating (1st, 2nd, 3rd, etc.).",
          "error"
        );
        return;
      }
    }

    try {
      setCompleting(true);
      const res = await axios.post(`/api/mod/reports/${report.id}/complete`, {
        finalRuling: isDismissed || isWarning ? null : finalRuling,
        dismissed: isDismissed,
        warning: isWarning,
        notes: finalRuling.notes || "",
      });
      setReport(res.data.report);
      setShowCompleteDialog(false);
      // Reset form
      setFinalRuling({ banType: "", rule: "", offenseNumber: 1, notes: "" });
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
      case "appealed":
        return "info";
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
                  {report.reporterInfo?.length > 1 ? "Reporters" : "Reporter"}
                </Typography>
                {report.reporterInfo?.length > 0 ? (
                  <Stack spacing={1.5}>
                    {report.reporterInfo.map((r) => (
                      <Paper key={r.id} variant="outlined" sx={{ p: 1.5 }}>
                        <NameWithAvatar
                          id={r.id}
                          name={r.name || r.id}
                          avatar={r.avatar}
                          avatarVersion={r.avatarVersion}
                        />
                        {(r.rule || r.description) && (
                          <Box sx={{ mt: 1, pl: 0 }}>
                            {r.rule && (
                              <Typography variant="body2" color="textSecondary">
                                Rule: {r.rule}
                              </Typography>
                            )}
                            {r.description && (
                              <Typography
                                variant="body2"
                                sx={{ whiteSpace: "pre-wrap", mt: 0.5 }}
                              >
                                {r.description}
                              </Typography>
                            )}
                            {r.submittedAt && (
                              <Typography
                                variant="caption"
                                color="textSecondary"
                                sx={{ display: "block", mt: 0.5 }}
                              >
                                <Time
                                  millisec={Date.now() - r.submittedAt}
                                  suffix=" ago"
                                />
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <>
                    <NameWithAvatar
                      id={report.reporterId}
                      name={report.reporterName || report.reporterId}
                      avatar={report.reporterAvatar}
                      avatarVersion={report.reporterAvatarVersion}
                    />
                  </>
                )}
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Reported User
                </Typography>
                <NameWithAvatar
                  id={report.reportedUserId}
                  name={report.reportedUserName || report.reportedUserId}
                  avatar={report.reportedUserAvatar}
                  avatarVersion={report.reportedUserAvatarVersion}
                />
              </Box>
              <RapSheet userId={report.reportedUserId} />
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
              {(!report.reporterInfo || report.reporterInfo.length === 0) && (
                <>
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
                </>
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
                              href={`/policy/reports/${report.originalReport.id}`}
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
                      onChange={(e) => {
                        setAppealNotes(e.target.value);
                        if (
                          report.linkedAppealId &&
                          status === "open" &&
                          !claimingAppealRef.current
                        ) {
                          claimingAppealRef.current = true;
                          handleStatusChange("in-progress");
                        }
                      }}
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
              {/* Hide status change and complete buttons for appeals */}
              {!report.linkedAppealId && status !== "complete" && (
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
              {/* Hide reopen button for appeals that have been approved/rejected */}
              {!report.linkedAppealId && status === "complete" && (
                <Button variant="outlined" onClick={handleReopen}>
                  Reopen Report
                </Button>
              )}
              {/* Also hide reopen button if appeal is approved or rejected */}
              {report.linkedAppealId &&
                report.appeal &&
                (report.appeal.status === "approved" ||
                  report.appeal.status === "rejected") && (
                  <Typography variant="body2" color="textSecondary">
                    This appeal has been {report.appeal.status}. The report
                    cannot be reopened.
                  </Typography>
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
                      avatarVersion={assignee.avatarVersion}
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
          setFinalRuling({ banType: "", rule: "", offenseNumber: 1, notes: "" });
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Complete Report</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="h6">Violation Details</Typography>
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
                <MenuItem value="warning">
                  Warning (No Violation)
                </MenuItem>
                <MenuItem value="site">Site</MenuItem>
                <MenuItem value="game">Game</MenuItem>
                <MenuItem value="chat">Chat</MenuItem>
                <MenuItem value="forum">Forum</MenuItem>
                <MenuItem value="ranked">Ranked</MenuItem>
                <MenuItem value="competitive">Competitive</MenuItem>
              </Select>
            </FormControl>
            {finalRuling.banType !== "dismiss" && finalRuling.banType !== "warning" && (
              <>
                <FormControl fullWidth>
                  <InputLabel>Rule (Violation Type)</InputLabel>
                  <Select
                    value={finalRuling.rule}
                    label="Rule (Violation Type)"
                    onChange={(e) => {
                      const rule = e.target.value;
                      offenseOverrideRef.current = false;
                      setFinalRuling({
                        ...finalRuling,
                        rule,
                        offenseNumber: nextOffenseNumberForRule(
                          reportedUserReports,
                          rule
                        ),
                      });
                    }}
                    required
                    disabled={violationsLoading}
                  >
                    {violationDefinitions.map((violation) => (
                      <MenuItem key={violation.id} value={violation.name}>
                        {violation.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Violation Rating</InputLabel>
                  <Select
                    value={finalRuling.offenseNumber}
                    label="Violation Rating"
                    onChange={(e) => {
                      offenseOverrideRef.current = true;
                      setFinalRuling({
                        ...finalRuling,
                        offenseNumber: parseInt(e.target.value),
                      });
                    }}
                    required
                  >
                    <MenuItem value={1}>1st Offense</MenuItem>
                    <MenuItem value={2}>2nd Offense</MenuItem>
                    <MenuItem value={3}>3rd Offense</MenuItem>
                    <MenuItem value={4}>4th Offense</MenuItem>
                    <MenuItem value={5}>5th Offense</MenuItem>
                    <MenuItem value={6}>6th Offense</MenuItem>
                    <MenuItem value={7}>7th Offense</MenuItem>
                    <MenuItem value={8}>8th Offense</MenuItem>
                    <MenuItem value={9}>9th Offense</MenuItem>
                    <MenuItem value={10}>10th Offense</MenuItem>
                  </Select>
                  {finalRuling.rule && (
                    <FormHelperText>
                      {finalRuling.offenseNumber === suggestedOffenseNumber
                        ? suggestedOffenseNumber === 1
                          ? "No active records of this rule; autofilled as 1st Offense. You can override."
                          : `Autofilled from ${
                              suggestedOffenseNumber - 1
                            } active record(s) of this rule. You can override.`
                        : `Suggested ${suggestedOffenseNumber}${
                            suggestedOffenseNumber === 1
                              ? "st"
                              : suggestedOffenseNumber === 2
                              ? "nd"
                              : suggestedOffenseNumber === 3
                              ? "rd"
                              : "th"
                          } Offense from ${
                            suggestedOffenseNumber - 1
                          } active record(s). Currently overridden.`}
                    </FormHelperText>
                  )}
                </FormControl>
              </>
            )}
            <TextField
              label="Decision Summary"
              value={finalRuling.notes}
              onChange={(e) =>
                setFinalRuling({ ...finalRuling, notes: e.target.value })
              }
              fullWidth
              multiline
              rows={3}
              required
              placeholder={
                finalRuling.banType === "dismiss"
                  ? "Summarize why the report was dismissed..."
                  : finalRuling.banType === "warning"
                  ? "Summarize the warning..."
                  : "Summarize the decision..."
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowCompleteDialog(false);
              // Reset form when dialog closes
              setFinalRuling({ banType: "", rule: "", offenseNumber: 1, notes: "" });
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
