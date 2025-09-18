import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Typography,
} from "@mui/material";

import godfather from "images/roles/mafia/godfather-vivid.png";
import exit from "images/emotes/exit.png";

export default function LeaveGameDialog({ open, onClose, onConfirm }) {
  const [alertOpen, setAlertOpen] = useState(false);

  const handleStayClick = () => {
    setAlertOpen(true);

    if (onClose) onClose();
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
            src={godfather}
            alt="godfather"
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
            Just when I thought I was out...
          </DialogTitle>
        </Box>

        <DialogContent sx={{ px: 2 }}>
          <Typography variant="body2">
            Are you sure you want to leave this game? You may incur a penalty if
            your participation is required!
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={handleStayClick} color="secondary" fullWidth>
            Stay
          </Button>
          <Button
            onClick={onConfirm}
            color="primary"
            fullWidth
            startIcon={<img src={exit} alt="Leave" />}
          >
            Leave
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
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          ...They pull me back in!
        </Alert>
      </Snackbar>
    </>
  );
}
