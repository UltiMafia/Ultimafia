import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Chip,
  Stack,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
} from "@mui/material";
import { Time } from "./Basic";
import { NameWithAvatar } from "pages/User/User";
import { UserContext, SiteInfoContext } from "../Contexts";
import { useErrorAlert } from "./Alerts";
import AppealDialog from "./AppealDialog";

// Mapping from violation names to role icon classes
const VIOLATION_TO_ROLE_ICON = {
  "No Violation": "role-icon-vivid-Mafia-Villager",
  "Personal Attacks & Harassment": "role-icon-vivid-Mafia-Stalker",
  "Personal Attacks & Harassment (PA)": "role-icon-vivid-Mafia-Stalker",
  "Adult Content": "role-icon-vivid-Mafia-Hooker",
  "Instigation": "role-icon-vivid-Mafia-Informant",
  "Hazing": "role-icon-vivid-Mafia-Cult-Leader",
  "Outing of Personal Information": "role-icon-vivid-Mafia-Paparazzo",
  "Coercion": "role-icon-vivid-Mafia-Interrogator",
  "Impersonation": "role-icon-vivid-Mafia-Disguiser",
  "Illegal Content & Activity": "role-icon-vivid-Mafia-Pyromaniac",
  "Gamethrowing": "role-icon-vivid-Mafia-Fool",
  "Game-related Abandonment": "role-icon-vivid-Mafia-Coward",
  "Insufficient Participation": "role-icon-vivid-Mafia-Amnesiac",
  "Outside of Game Information": "role-icon-vivid-Mafia-Jinx",
  "Exploits": "role-icon-vivid-Mafia-Cthulhu",
  "Cheating": "role-icon-vivid-Mafia-Busybody",
};

function DigitsCount({ digits }) {
  if (!digits || digits.length === 0) return null;
  return (
    <div
      className="digits-wrapper"
      style={{
        position: "absolute",
        bottom: "0px",
        right: "0px",
      }}
    >
      {digits.map((digit, index) => (
        <div key={index} className={`digit digit-${digit}`} />
      ))}
    </div>
  );
}

function getVerdictIconClass(violationName) {
  if (!violationName) {
    return VIOLATION_TO_ROLE_ICON["No Violation"];
  }
  // Remove offense suffix if present (e.g., " (1st Offense)")
  const baseName = violationName.replace(/\s*\(\d+(st|nd|rd|th)\s+Offense\)\s*$/, "");
  return VIOLATION_TO_ROLE_ICON[baseName] || VIOLATION_TO_ROLE_ICON[violationName] || VIOLATION_TO_ROLE_ICON["No Violation"];
}

function extractOffenseNumber(violationName) {
  if (!violationName) return null;
  // Match patterns like "(1st Offense)", "(2nd Offense)", etc.
  const match = violationName.match(/\((\d+)(st|nd|rd|th)\s+Offense\)/);
  return match ? parseInt(match[1]) : null;
}

function VerdictDialog({
  open,
  onClose,
  report,
  showRestrictedInfo,
  isSelfViewing,
  violationStatus,
  statusLabel,
  statusColor,
  onAppealClick,
}) {
  if (!report) return null;

  const isDismissed = !report.finalRuling || !report.finalRuling.violationName;
  const completedDate = report.completedAt ? new Date(report.completedAt) : null;

  // Extract offense number from violationName (format: "Rule Name (1st Offense)")
  const offenseNumber = extractOffenseNumber(report.finalRuling?.violationName);
  const degreeDigits = offenseNumber ? String(offenseNumber).split("") : [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isDismissed ? "No Violation" : report.finalRuling?.violationName || "Violation"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1.5}>
          {showRestrictedInfo && (
            <Box>
              <Typography variant="caption" color="textSecondary">
                Report ID
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                {report.id}
              </Typography>
            </Box>
          )}

          {showRestrictedInfo && report.reporterName && (
            <Box>
              <Typography variant="caption" color="textSecondary">
                Reported By
              </Typography>
              <Box>
                <NameWithAvatar id={report.reporterId} name={report.reporterName} />
              </Box>
            </Box>
          )}

          <Box>
            <Typography variant="caption" color="textSecondary">
              Rule Broken
            </Typography>
            <Typography variant="body2">{report.rule}</Typography>
          </Box>

          {report.gameId && (
            <Box>
              <Typography variant="caption" color="textSecondary">
                Game
              </Typography>
              <Typography variant="body2">
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

          {showRestrictedInfo && report.description && (
            <Box>
              <Typography variant="caption" color="textSecondary">
                Description
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                {report.description}
              </Typography>
            </Box>
          )}

          {!isDismissed && report.finalRuling && (
            <>
              <Divider />
              <Box>
                {showRestrictedInfo && (
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Final Ruling
                  </Typography>
                )}
                <Stack spacing={0.5}>
                  {showRestrictedInfo && (
                    <>
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Violation
                        </Typography>
                        <Typography variant="body2">
                          {report.finalRuling.violationName}
                        </Typography>
                      </Box>
                      {report.finalRuling.violationCategory && (
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Category
                          </Typography>
                          <Typography variant="body2">
                            {report.finalRuling.violationCategory}
                          </Typography>
                        </Box>
                      )}
                      {report.finalRuling.banType && (
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Ban Type
                          </Typography>
                          <Typography variant="body2">
                            {report.finalRuling.banType}
                          </Typography>
                        </Box>
                      )}
                      {report.finalRuling.banLength && (
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Ban Length
                          </Typography>
                          <Typography variant="body2">
                            {report.finalRuling.banLength}
                          </Typography>
                        </Box>
                      )}
                    </>
                  )}
                  {report.finalRuling.notes && (
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        Notes
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                        {report.finalRuling.notes}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Box>
            </>
          )}

          {isDismissed && (
            <>
              <Divider />
              <Box>
                <Typography variant="body2" color="textSecondary">
                  This report was reviewed and dismissed with no violation found.
                </Typography>
              </Box>
            </>
          )}

          {showRestrictedInfo && report.completedAt && completedDate && (
            <Box>
              <Typography variant="caption" color="textSecondary">
                Completed
              </Typography>
              <Typography variant="body2">
                {completedDate.toLocaleString()}
              </Typography>
            </Box>
          )}

          {showRestrictedInfo &&
            !isDismissed &&
            report.violationTicket && (
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Violation Status
                </Typography>
                <Typography variant="body2">
                  {violationStatus === "active" && "Active"}
                  {violationStatus === "expired" && "Expired"}
                  {violationStatus === "permanent" && "Permanent"}
                </Typography>
                {report.violationTicket.activeUntil &&
                  report.violationTicket.activeUntil > 0 && (
                    <Typography variant="caption" color="textSecondary">
                      Active until:{" "}
                      {new Date(report.violationTicket.activeUntil).toLocaleString()}
                    </Typography>
                  )}
              </Box>
            )}

          {/* Appeal button - only show for violations (not dismissed) and if user is viewing their own profile */}
          {isSelfViewing &&
            !isDismissed &&
            report.finalRuling &&
            report.linkedViolationTicketId && (
              <Box sx={{ mt: 2 }}>
                <Button variant="outlined" color="primary" onClick={onAppealClick}>
                  Appeal Violation
                </Button>
              </Box>
            )}

        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function RapSheet({ userId }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAppealDialog, setShowAppealDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showVerdictDialog, setShowVerdictDialog] = useState(false);
  const [selectedVerdictReport, setSelectedVerdictReport] = useState(null);
  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();

  // Check if user is viewing their own profile and is not a mod
  const isSelfViewing = user.id === userId;
  const isMod = user.perms?.seeModPanel;
  const showRestrictedInfo = isMod || !isSelfViewing;

  const loadReports = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const res = await axios.get(`/api/user/${userId}/reports`);
      setReports(res.data.reports || []);
    } catch (e) {
      if (e.response?.status === 403 || e.response?.status === 401) {
        // User doesn't have permission - don't show component
        setReports([]);
      } else {
        errorAlert(e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [userId]);

  // Don't render if no reports and not loading (or if user doesn't have permission)
  if (loading) {
    return null; // Or a loading indicator if desired
  }

  if (reports.length === 0) {
    return null;
  }

  const panelStyle = {
    marginBottom: "16px",
  };

  const headingStyle = {
    marginBottom: "8px",
  };

  const handleVerdictClick = (report) => {
    setSelectedVerdictReport(report);
    setShowVerdictDialog(true);
  };

  const handleAppealClick = (report) => {
    setShowVerdictDialog(false);
    setSelectedReport(report);
    setShowAppealDialog(true);
  };

  return (
    <div className="box-panel" style={panelStyle}>
      <Typography variant="h3" style={headingStyle}>
        Rap Sheet
      </Typography>
      <div className="content">
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          {reports.map((report) => {
            // A report is dismissed if finalRuling is null or doesn't have a violationName
            // If it has a violationName, it's a violation, not dismissed
            const isDismissed = !report.finalRuling || !report.finalRuling.violationName;
            const violationName = isDismissed
              ? "No Violation"
              : report.finalRuling?.violationName || "Violation";

            // Determine violation status
            let violationStatus = null;
            if (!isDismissed && report.violationTicket) {
              const status = report.violationTicket.status;
              if (status === "active") {
                violationStatus = "active";
              } else if (status === "expired") {
                violationStatus = "expired";
              } else if (status === "permanent") {
                violationStatus = "permanent";
              }
            }

            // Get icon class for this verdict
            const iconClass = getVerdictIconClass(violationName);

            // Extract offense number from violationName (format: "Rule Name (1st Offense)")
            const offenseNumber = extractOffenseNumber(report.finalRuling?.violationName);
            const degreeDigits = offenseNumber ? String(offenseNumber).split("") : [];

            return (
              <Box
                key={report.id}
                className="verdict-item"
                onClick={() => handleVerdictClick(report)}
                sx={{
                  position: "relative",
                  cursor: "pointer",
                  "&:hover": {
                    opacity: 0.8,
                  },
                }}
              >
                <div className={`role ${iconClass} small`} style={{ position: "relative" }}>
                  {degreeDigits.length > 0 && <DigitsCount digits={degreeDigits} />}
                </div>
              </Box>
            );
          })}
        </Box>
      </div>
      {showVerdictDialog && selectedVerdictReport && (
        <VerdictDialog
          open={showVerdictDialog}
          onClose={() => {
            setShowVerdictDialog(false);
            setSelectedVerdictReport(null);
          }}
          report={selectedVerdictReport}
          showRestrictedInfo={showRestrictedInfo}
          isSelfViewing={isSelfViewing}
          violationStatus={
            !selectedVerdictReport.finalRuling ||
            !selectedVerdictReport.finalRuling.violationName
              ? null
              : selectedVerdictReport.violationTicket?.status === "active"
              ? "active"
              : selectedVerdictReport.violationTicket?.status === "expired"
              ? "expired"
              : selectedVerdictReport.violationTicket?.status === "permanent"
              ? "permanent"
              : null
          }
          statusLabel=""
          statusColor="default"
          onAppealClick={() => handleAppealClick(selectedVerdictReport)}
        />
      )}
      {showAppealDialog && selectedReport && (
        <AppealDialog
          open={showAppealDialog}
          onClose={() => {
            setShowAppealDialog(false);
            setSelectedReport(null);
          }}
          report={selectedReport}
          onSuccess={() => {
            setShowAppealDialog(false);
            setSelectedReport(null);
            // Reload reports to update the UI
            loadReports();
          }}
        />
      )}
    </div>
  );
}