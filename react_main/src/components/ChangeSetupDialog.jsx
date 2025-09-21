import React, { useState, useContext } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";

import changeling from "images/roles/cult/changeling-vivid.png";
import { useErrorAlert } from "./Alerts";
import { SiteInfoContext } from "../Contexts";

export default function ChangeSetupDialog({ open, onClose, gameId }) {
  const [setupId, setSetupId] = useState("");
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();

  const handleCancel = () => {
    if (onClose) onClose();
  };

  const handleSubmit = async () => {
    if (!setupId.trim()) {
      setAlertMessage("Please enter a valid Setup ID.");
      setAlertOpen(true);
      return;
    }

    try {
      await axios.post(`/api/game/${gameId}/change-setup`, {
        setupId: setupId.trim(),
      });
      siteInfo.showAlert("Setup successfully changed.", "success");
      if (onClose) onClose();
    } catch (err) {
      errorAlert(err);
    }
  };

  const handleAlertClose = (event, reason) => {
    if (reason === "clickaway") return;
    setAlertOpen(false);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            p: 2,
            flexWrap: "wrap",
          }}
        >
          <img
            src={changeling}
            alt="changeling"
            width="60"
            height="60"
            style={{ flexShrink: 0 }}
          />
          <DialogTitle
            sx={{
              p: 0,
              flex: 1,
              fontSize: "1.25rem",
              lineHeight: 1.3,
              fontWeight: 600,
              whiteSpace: "normal",
              wordBreak: "break-word",
            }}
          >
            Change Setup
          </DialogTitle>
        </Box>

        <DialogContent sx={{ px: 2 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Enter the Setup ID you would like to switch this lobby to.
          </Typography>
          <TextField
            label="Setup ID"
            fullWidth
            value={setupId}
            onChange={(e) => setSetupId(e.target.value)}
          />
        </DialogContent>

        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={handleCancel} color="secondary" fullWidth>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            color="primary"
            fullWidth
            variant="contained"
          >
            Change Setup
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={alertOpen}
        autoHideDuration={3500}
        onClose={handleAlertClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleAlertClose}
          severity="error"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
