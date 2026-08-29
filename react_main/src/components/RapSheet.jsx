import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Stack,
  Tab,
  Tabs,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
} from "@mui/material";
import { NameWithAvatar } from "pages/User/UserWidgets";
import { UserContext, SiteInfoContext } from "../Contexts";
import { useErrorAlert } from "./Alerts";
import AppealDialog from "./AppealDialog";
import CasePanel from "./CasePanel";

// Verdict icons mapping
export const VERDICT_ICONS = {
  "No Violation": require(`images/verdicts/no-violation.png`),
  "Warning": require(`images/emotes/system.webp`),
  "Personal Attacks & Harassment (PA)": require(`images/verdicts/personal-attacks.png`),
  "Adult Content": require(`images/verdicts/adult-content.png`),
  "Instigation": require(`images/verdicts/instigation.png`),
  "Hazing": require(`images/verdicts/hazing.png`),
  "Outing of Personal Information (OPI)": require(`images/verdicts/outing-personal-information.png`),
  "Coercion": require(`images/verdicts/coercion.png`),
  "Impersonation": require(`images/verdicts/impersonation.png`),
  "Illegal Content & Activity (IC)": require(`images/verdicts/illegal-content.png`),
  "Antagonization": require(`images/emotes/system.webp`),
  "Game Throwing": require(`images/verdicts/game-throwing.png`),
  "Game-Related Abandonment (GRA)": require(`images/verdicts/game-related-abandonment.png`),
  "Insufficient Participation (ISP)": require(`images/verdicts/insufficient-participation.png`),
  "Outside of Game Information (OGI)": require(`images/verdicts/out-of-game-information.png`),
  "Exploits": require(`images/verdicts/exploits.png`),
  "Cheating": require(`images/verdicts/cheating.png`),
  "Intolerance": require(`images/verdicts/intolerance.png`),
};

function getVerdictIcon(violationName) {
  if (!violationName) {
    return VERDICT_ICONS["No Violation"];
  }
  const baseName = getViolationBaseName(violationName);
  return VERDICT_ICONS[baseName] || VERDICT_ICONS[violationName] || VERDICT_ICONS["No Violation"];
}

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


export function getViolationBaseName(violationName) {
  if (!violationName) return "";
  return violationName.replace(/\s*\(\d+(st|nd|rd|th)\s+Offense\)\s*$/, "").trim();
}

function extractOffenseNumber(violationName) {
  if (!violationName) return null;
  // Match patterns like "(1st Offense)", "(2nd Offense)", etc.
  const match = violationName.match(/\((\d+)(st|nd|rd|th)\s+Offense\)/);
  return match ? parseInt(match[1]) : null;
}

function isWarningReport(report) {
  return report.finalRuling?.warning === true;
}

function isDismissedReport(report) {
  return (
    (!report.finalRuling || !report.finalRuling.violationName) &&
    !isWarningReport(report)
  );
}

function isActiveViolation(report) {
  if (isWarningReport(report) || isDismissedReport(report)) {
    return false;
  }
  const status = report.violationTicket?.status;
  return status === "active" || status === "permanent";
}

function VerdictIcon({ report, onClick }) {
  const isWarning = isWarningReport(report);
  const isDismissed = isDismissedReport(report);
  const violationName = isWarning
    ? "Warning"
    : isDismissed
    ? "No Violation"
    : report.finalRuling?.violationName || "Violation";

  const verdictIcon = getVerdictIcon(violationName);
  const offenseNumber = extractOffenseNumber(report.finalRuling?.violationName);
  const degreeDigits = offenseNumber ? String(offenseNumber).split("") : [];

  return (
    <Box
      className="verdict-item"
      onClick={onClick}
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        "&:hover": { opacity: 0.8 },
      }}
    >
      <img
        src={verdictIcon}
        alt={violationName}
        className="verdict-icon"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
      {degreeDigits.length > 0 && <DigitsCount digits={degreeDigits} />}
    </Box>
  );
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

  const isWarning = isWarningReport(report);
  const isDismissed = isDismissedReport(report);
  const completedDate = report.completedAt ? new Date(report.completedAt) : null;

  // Extract offense number from violationName (format: "Rule Name (1st Offense)")
  const offenseNumber = extractOffenseNumber(report.finalRuling?.violationName);
  const degreeDigits = offenseNumber ? String(offenseNumber).split("") : [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isWarning
          ? "Warning"
          : isDismissed
          ? "No Violation"
          : report.finalRuling?.violationName || "Violation"}
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

          {showRestrictedInfo && report.reportedUserId && (
            <Box>
              <Typography variant="caption" color="textSecondary">
                Reported User
              </Typography>
              <Box>
                <NameWithAvatar
                  id={report.reportedUserId}
                  name={report.reportedUserName}
                  avatar={report.reportedUserAvatar}
                />
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
                {report.finalRuling?.notes && (
                  <Box sx={{ mt: 1.5 }}>
                    <Typography variant="caption" color="textSecondary">
                      Notes
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                      {report.finalRuling.notes}
                    </Typography>
                  </Box>
                )}
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

          {!isDismissed &&
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
  const [selectedTab, setSelectedTab] = useState(0);
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

  const panelStyle = { marginBottom: "16px" };
  const headingStyle = { marginBottom: "8px" };

  const activeReports = reports.filter(isActiveViolation);
  const inactiveReports = reports.filter((report) => !isActiveViolation(report));
  const tabReports = selectedTab === 0 ? activeReports : inactiveReports;

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
    <>
      <div className="box-panel" style={panelStyle}>
        <Typography variant="h3" style={headingStyle}>
          Rap Sheet
        </Typography>
        <Tabs
          value={selectedTab}
          onChange={(event, newValue) => setSelectedTab(newValue)}
          sx={{ mb: 1 }}
        >
          <Tab label={`Active (${activeReports.length})`} />
          <Tab label={`Inactive (${inactiveReports.length})`} />
        </Tabs>
        <CasePanel
          wrapInPanel={false}
          showHeading={false}
          emptyMessage={
            <Typography variant="body2" color="text.secondary">
              {selectedTab === 0
                ? "No active violations."
                : "No inactive or expired violations."}
            </Typography>
          }
        >
          {tabReports.map((report) => (
            <VerdictIcon
              key={report.id}
              report={report}
              onClick={() => handleVerdictClick(report)}
            />
          ))}
        </CasePanel>
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
    </>
  );
}