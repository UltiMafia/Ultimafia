import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import {
  Box,
  Chip,
  Stack,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from "@mui/material";
import { Time } from "./Basic";
import { NameWithAvatar } from "pages/User/User";
import { UserContext } from "../Contexts";
import { useErrorAlert } from "./Alerts";

export default function RapSheet({ userId }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();

  // Check if user is viewing their own profile and is not a mod
  const isSelfViewing = user.id === userId;
  const isMod = user.perms?.seeModPanel;
  const showRestrictedInfo = isMod || !isSelfViewing;

  useEffect(() => {
    if (!userId) return;

    const loadReports = async () => {
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

  return (
    <div className="box-panel" style={panelStyle}>
      <Typography variant="h3" style={headingStyle}>
        Rap Sheet
      </Typography>
      <div className="content">
        <Stack spacing={1}>
          {reports.map((report) => {
            const isDismissed = !report.finalRuling;
            const completedDate = report.completedAt
              ? new Date(report.completedAt)
              : null;
            
            // Determine violation status
            let violationStatus = null;
            let statusColor = "default";
            let statusLabel = "Dismissed";
            
            if (!isDismissed && report.violationTicket) {
              const status = report.violationTicket.status;
              if (status === "active") {
                violationStatus = "active";
                statusColor = "error";
                statusLabel = "Active";
              } else if (status === "expired") {
                violationStatus = "expired";
                statusColor = "default";
                statusLabel = "Expired";
              } else if (status === "permanent") {
                violationStatus = "permanent";
                statusColor = "error";
                statusLabel = "Active";
              }
            } else if (isDismissed) {
              statusColor = "default";
              statusLabel = "Dismissed";
            }

            return (
              <Accordion key={report.id} defaultExpanded={false}>
                <AccordionSummary
                  sx={{
                    "& .MuiAccordionSummary-content": {
                      alignItems: "center",
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ width: "100%", mr: 1 }}
                  >
                    <Chip
                      label={statusLabel}
                      color={statusColor}
                      size="small"
                    />
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      {isDismissed
                        ? "No violation"
                        : report.finalRuling?.violationName || "Violation"}
                    </Typography>
                    {report.completedAt && (
                      <Typography variant="caption" color="textSecondary">
                        <Time
                          millisec={Date.now() - report.completedAt}
                          suffix=" ago"
                        />
                      </Typography>
                    )}
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={1.5}>
                    {showRestrictedInfo && (
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Report ID
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: "monospace" }}
                        >
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
                          <NameWithAvatar
                            id={report.reporterId}
                            name={report.reporterName}
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
                        <Typography
                          variant="body2"
                          sx={{ whiteSpace: "pre-wrap" }}
                        >
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
                                <Typography
                                  variant="body2"
                                  sx={{ whiteSpace: "pre-wrap" }}
                                >
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
                            This report was reviewed and dismissed with no
                            violation found.
                          </Typography>
                        </Box>
                      </>
                    )}

                    {showRestrictedInfo &&
                      report.completedAt &&
                      completedDate && (
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
                                {new Date(
                                  report.violationTicket.activeUntil
                                ).toLocaleString()}
                              </Typography>
                            )}
                        </Box>
                      )}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Stack>
      </div>
    </div>
  );
}

