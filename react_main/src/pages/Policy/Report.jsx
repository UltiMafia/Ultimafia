import React, { useState, useEffect, useContext } from "react";
import axios from "axios";

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
    <div className="report-page">
      <div className="span-panel main">
        {user.loggedIn && (
          <>
            <div className="heading">
              If you observe rule or policy breaking behavior, please take the time to file a report.
            </div>
            <div className="report-form form">
              <div className="field-wrapper">
                <div className="label">Title:</div>
                <input
                  type="text"
                  placeholder="Title"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                />
              </div>
              <div className="field-wrapper">
                <div className="label">Report:</div>
                <input
                  type="text"
                  placeholder="Report"
                  value={report}
                  onChange={(e) => setReport(e.target.value)}
                />
              </div>
              <div
                className="btn btn-theme-sec submit"
                onClick={submitReport}
              >
                Submit
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
