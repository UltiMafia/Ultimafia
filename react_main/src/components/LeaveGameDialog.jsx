import React, { useState, useEffect } from "react";
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

const DEFAULT_LOCK_SECONDS = 10;

export default function LeaveGameDialog({
  open,
  onClose,
  onConfirm,
  isParticipationRequired = false,
  lockSeconds = DEFAULT_LOCK_SECONDS,
  isPenaltyEnforced = true,
}) {
  const [alertOpen, setAlertOpen] = useState(false);
  const [lockRemaining, setLockRemaining] = useState(
    isParticipationRequired ? lockSeconds : 0
  );

  useEffect(() => {
    if (!open || !isParticipationRequired) {
      setLockRemaining(0);
      return;
    }
    setLockRemaining(lockSeconds);
    const interval = setInterval(() => {
      setLockRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [open, isParticipationRequired, lockSeconds]);

  const isLocked = lockRemaining > 0;

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
      <style>{`
        @keyframes leave-dialog-march {
          to { background-position: 24px 0, -24px 100%, 0 -24px, 100% 24px; }
        }
      `}</style>
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
            Are you sure you want to leave?
          </Typography>
          {isParticipationRequired && (
            <Typography
              variant="body2"
              sx={{ color: "error.main", fontWeight: 700, mt: 1 }}
            >
              {isPenaltyEnforced
                ? "YOU WILL BE PENALISED FOR LEAVING"
                : "Your participation is still required"}
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={handleStayClick} color="secondary" fullWidth>
            Stay
          </Button>
          <Box sx={{ position: "relative", flex: 1.4, minWidth: 140 }}>
            <Button
              onClick={onConfirm}
              color="primary"
              fullWidth
              disabled={isLocked}
              startIcon={<img src={exit} alt="Leave" />}
              sx={{ whiteSpace: "nowrap" }}
            >
              {isLocked ? `Leave (${lockRemaining})` : "Leave"}
            </Button>
            {isLocked && (
              <Box
                aria-hidden
                sx={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  borderRadius: 1,
                  backgroundImage: (theme) => {
                    const c = theme.palette.primary.main;
                    return `linear-gradient(90deg, ${c} 50%, transparent 50%), linear-gradient(90deg, ${c} 50%, transparent 50%), linear-gradient(0deg, ${c} 50%, transparent 50%), linear-gradient(0deg, ${c} 50%, transparent 50%)`;
                  },
                  backgroundRepeat: "repeat-x, repeat-x, repeat-y, repeat-y",
                  backgroundSize: "12px 2px, 12px 2px, 2px 12px, 2px 12px",
                  backgroundPosition: "0 0, 0 100%, 0 0, 100% 0",
                  animation: "leave-dialog-march 0.6s linear infinite",
                }}
              />
            )}
          </Box>
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
