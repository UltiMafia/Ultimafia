import React, { useState, useContext } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { useErrorAlert } from "./Alerts";
import { SiteInfoContext } from "../Contexts";

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
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Appeal Violation</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
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
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting || !description.trim()}
        >
          {submitting ? "Submitting..." : "Submit Appeal"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

