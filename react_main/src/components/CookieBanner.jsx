import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
} from "@mui/material";

export default function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const consentGiven = localStorage.getItem("cookieConsent");
    if (!consentGiven) {
      setOpen(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookieConsent", "accepted");
    setOpen(false);
  };

  const handleReject = () => {
    localStorage.setItem("cookieConsent", "rejected");
    setOpen(false);
  };

  return (
    <Dialog open={open} maxWidth="sm" fullWidth>
      <DialogContent>
        <Typography variant="h4">We use cookies</Typography>
        <Typography variant="body2">
          UltiMafia uses cookies to improve user experience. By clicking
          "Accept," you agree to the use of cookies.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleAccept} color="primary" variant="contained">
          Accept
        </Button>
        <Button onClick={handleReject} color="secondary">
          Reject
        </Button>
      </DialogActions>
    </Dialog>
  );
}
