import React from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
  Box,
} from "@mui/material";

export const BanDialog = ({ open, setOpen, banExpires }) => {
  const handleClose = () => {
    setOpen(false);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "error.main",
          color: "error.contrastText",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <i className="fas fa-ban" />
          <span>Site Banned</span>
        </Box>
        <Button
          variant="outlined"
          onClick={handleClose}
          sx={{
            minWidth: "32px",
            p: 0,
            color: "error.contrastText",
            borderColor: "error.contrastText",
            "&:hover": {
              borderColor: "error.contrastText",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            },
          }}
        >
          <i className="fas fa-times" />
        </Button>
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          You have received a violation.
        </Typography>
        <Typography variant="body1" paragraph>
          Your account has been site-banned and you cannot access the site at
          this time.
        </Typography>
        <Box
          sx={{
            p: 2,
            backgroundColor: "error.light",
            borderRadius: 1,
            mb: 2,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: "bold" }}>
            Ban Type: Site Ban
          </Typography>
          <Typography variant="body2">
            Expires: {formatDate(banExpires)}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          If you believe this ban was issued in error, please contact the
          moderation team.
        </Typography>
      </DialogContent>
    </Dialog>
  );
};
