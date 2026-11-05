import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import {
  FINGERPRINT_BLOCK_BODY,
  FINGERPRINT_BLOCK_TITLE,
} from "../utils/fingerprintGuard";

// Shown when the browser refused to produce the device fingerprint the ban
// check depends on. MUI dialogs need a real element to point aria-labelledby
// at, so the id lives on the title rather than relying on aria-label.
export const FingerprintBlockedDialog = ({ open, onClose }) => (
  <Dialog
    open={Boolean(open)}
    onClose={onClose}
    maxWidth="xs"
    fullWidth
    aria-labelledby="fingerprint-blocked-title"
  >
    <DialogTitle id="fingerprint-blocked-title" sx={{ pb: 1 }}>
      {FINGERPRINT_BLOCK_TITLE}
    </DialogTitle>
    <DialogContent>
      <Typography variant="body2" color="text.secondary">
        {FINGERPRINT_BLOCK_BODY}
      </Typography>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={onClose}>Close</Button>
      <Button variant="contained" onClick={() => window.location.reload()}>
        Reload
      </Button>
    </DialogActions>
  </Dialog>
);
