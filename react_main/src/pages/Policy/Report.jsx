import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { Box, Typography, TextField, Button } from "@mui/material";
import { useTheme } from "@mui/styles";
import { useErrorAlert } from "../../components/Alerts";
import { UserContext, SiteInfoContext } from "../../Contexts";

export default function Report(props) {
  const [reportTitle, setReportTitle] = useState("");
  const [report, setReport] = useState("");

  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();
  const theme = useTheme();

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
    <>
      <Typography variant="h4" gutterBottom>
        File a Report
      </Typography>
      {user.loggedIn && (
        <>
          <Typography paragraph>
            If you observe rule or policy breaking behavior, please take the
            time to file a report. Enter the name of the player you are
            reporting and provide a link to a game or an image for proof, and
            then enter a description of what occurred from your point of view.
          </Typography>
          <Box
            component="form"
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <TextField
              label="Report a Player"
              variant="outlined"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              fullWidth
            />
            <TextField
              label="Description"
              variant="outlined"
              value={report}
              onChange={(e) => setReport(e.target.value)}
              fullWidth
              multiline
              rows={4}
            />
            <Button onClick={submitReport}>Submit</Button>
          </Box>
        </>
      )}
    </>
  );
}
