import React, { useState, useContext } from "react";
import axios from "axios";
import { Box } from "@mui/material";
import { useErrorAlert } from "./Alerts";
import { SiteInfoContext } from "../Contexts";
import { UiField as TextField, UiText as Typography, UiAction, UiDialog } from "components/ui";

export default function AppealDialog({ open, onClose, report, onSuccess }) {
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();

  const handleSubmit = async () => {
    if (!description.trim()) {
      siteInfo.showAlert("Please provide a reason for your appeal.", "error");
      return;
    }

    try {
      setSubmitting(true);
      await axios.post("/api/user/appeals", {
        reportId: report.id,
        description: description.trim(),
      });

      siteInfo.showAlert(
        "Your appeal has been submitted and will be reviewed by moderators.",
        "success"
      );
      setDescription("");
      if (onSuccess) onSuccess();
    } catch (e) {
      if (e?.response?.data) {
        siteInfo.showAlert(e.response.data.toString(), "error");
      } else {
        errorAlert(e);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setDescription("");
      onClose();
    }
  };

  return (
    <UiDialog
      open={open}
      onClose={handleClose}
      title="Appeal Violation"
      actions={<>
        <UiAction variant="ghost" onClick={handleClose} disabled={submitting}>
          Cancel
        </UiAction>
        <UiAction
          variant="primary"
          onClick={handleSubmit}
          disabled={submitting || !description.trim()}
        >
          {submitting ? "Submitting..." : "Submit Appeal"}
        </UiAction>
      </>}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="body2" color="textSecondary">
          You are appealing the following violation:
        </Typography>
        <Box>
          <Typography variant="caption" color="textSecondary">
            Violation
          </Typography>
          <Typography variant="body2">
            {report.finalRuling?.violationName || "Violation"}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="textSecondary">
            Rule Broken
          </Typography>
          <Typography variant="body2">{report.rule}</Typography>
        </Box>
        <Typography variant="body2" color="textSecondary">
          Please explain why you believe this violation should be removed from
          your record. Provide as much detail as possible.
        </Typography>
        <TextField
          label="Appeal Reason"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          multiline
          rows={6}
          placeholder="Explain why this violation should be removed..."
          disabled={submitting}
        />
      </Box>
    </UiDialog>
  );
}
