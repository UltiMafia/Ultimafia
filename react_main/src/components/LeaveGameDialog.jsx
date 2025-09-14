import React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

import godfather from "images/roles/mafia/godfather-vivid.png";

export default function LeaveGameDialog({ open, onClose, onConfirm }) {
  return (
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
        <Button onClick={onClose} color="secondary" fullWidth>
          Stay
        </Button>
        <Button onClick={onConfirm} color="primary" fullWidth>
          Leave
        </Button>
      </DialogActions>
    </Dialog>
  );
}
