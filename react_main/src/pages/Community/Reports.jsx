import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Button,
  Card,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
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
import { useErrorAlert } from "components/Alerts";
import { PageNav } from "components/Nav";
import { Time } from "components/Basic";
import { NameWithAvatar } from "pages/User/User";
import { UserContext, SiteInfoContext } from "../../Contexts";
import { NewLoading } from "pages/Welcome/NewLoading";
import ReportDetail from "components/ReportDetail";

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [reportedUserFilter, setReportedUserFilter] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();
  const navigate = useNavigate();
  const { reportId } = useParams();

  useEffect(() => {
    document.title = "Reports | UltiMafia";
    if (reportId) {
      loadReport(reportId);
    } else {
      loadReports();
    }
  }, [page, statusFilter, assigneeFilter, reportedUserFilter, reportId]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });
      if (statusFilter) params.append("status", statusFilter);
      if (assigneeFilter) params.append("assignee", assigneeFilter);
      if (reportedUserFilter) params.append("reportedUser", reportedUserFilter);

      const res = await axios.get(`/api/mod/reports?${params.toString()}`);
      setReports(res.data.reports || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (e) {
      errorAlert(e);
    } finally {
      setLoading(false);
    }
  };

  const loadReport = async (id) => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/mod/reports/${id}`);
      setSelectedReport(res.data);
      setShowDetail(true);
    } catch (e) {
      errorAlert(e);
      navigate("/community/reports");
    } finally {
      setLoading(false);
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

  const handleReportClick = (report) => {
    navigate(`/community/reports/${report.id}`);
    setSelectedReport(report);
    setShowDetail(true);
  };

  const handleBackToList = () => {
    navigate("/community/reports");
    setShowDetail(false);
    setSelectedReport(null);
    loadReports();
  };

  if (loading && !selectedReport) {
    return <NewLoading />;
  }

  if (showDetail && selectedReport) {
    return (
      <ReportDetail
        report={selectedReport}
        onBack={handleBackToList}
        onUpdate={loadReports}
      />
    );
  }

  return (
    <Box>
      <Typography variant="h3" sx={{ mb: 2 }}>
        Reports
      </Typography>

      <Stack spacing={2} sx={{ mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="in-progress">In Progress</MenuItem>
                <MenuItem value="complete">Complete</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Assignee User ID"
              value={assigneeFilter}
              onChange={(e) => {
                setAssigneeFilter(e.target.value);
                setPage(1);
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Reported User ID"
              value={reportedUserFilter}
              onChange={(e) => {
                setReportedUserFilter(e.target.value);
                setPage(1);
              }}
            />
          </Grid>
        </Grid>
      </Stack>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Reported User</TableCell>
              <TableCell>Reporter</TableCell>
              <TableCell>Rule</TableCell>
              <TableCell>Assignees</TableCell>
              <TableCell>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography sx={{ py: 2 }}>No reports found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow
                  key={report.id}
                  hover
                  onClick={() => handleReportClick(report)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                      {report.id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={report.status}
                      color={getStatusColor(report.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <NameWithAvatar
                      id={report.reportedUserId}
                      name={report.reportedUserId}
                    />
                  </TableCell>
                  <TableCell>
                    <NameWithAvatar
                      id={report.reporterId}
                      name={report.reporterId}
                    />
                  </TableCell>
                  <TableCell>{report.rule}</TableCell>
                  <TableCell>
                    {report.assignees && report.assignees.length > 0 ? (
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {report.assignees.slice(0, 3).map((assigneeId) => (
                          <NameWithAvatar
                            key={assigneeId}
                            id={assigneeId}
                            name={assigneeId}
                            size="small"
                          />
                        ))}
                        {report.assignees.length > 3 && (
                          <Typography variant="caption">
                            +{report.assignees.length - 3}
                          </Typography>
                        )}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        Unassigned
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Time timestamp={report.createdAt} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPages > 1 && (
        <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
          <PageNav
            page={page}
            maxPage={totalPages}
            onNav={(newPage) => setPage(newPage)}
          />
        </Box>
      )}
    </Box>
  );
}

