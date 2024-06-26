import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { Container, Box, Typography, TextField, Button, Paper } from "@mui/material";
import { useErrorAlert } from "../../components/Alerts";
import { UserContext, SiteInfoContext } from "../../Contexts";

export default function Report(props) {
  const [reportTitle, setReportTitle] = useState("");
  const [report, setReport] = useState("");

  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();

  useEffect(() => {
    document.title = "File Report | UltiMafia";
  }, []);

  function submitReport() {
    axios
      .post("/report/send", {
        title: reportTitle,
        value: report,
      })
      .then(() => {
        setReportTitle("");
        setReport("");
        siteInfo.showAlert("Thank you for filing your report.", "success");
      })
      .catch(errorAlert);
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        {user.loggedIn && (
          <>
            <Typography variant="h6" gutterBottom>
              If you observe rule or policy breaking behavior, please take the time to file a report.
            </Typography>
            <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Title"
                variant="outlined"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                fullWidth
              />
              <TextField
                label="Report"
                variant="outlined"
                value={report}
                onChange={(e) => setReport(e.target.value)}
                fullWidth
                multiline
                rows={4}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={submitReport}
              >
                Submit
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
}
