import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Checkbox,
  Stack,
  Link,
  Divider,
} from "@mui/material";
import { useCookieConsent } from "../hooks/useCookieConsent";

export default function CookieBanner() {
  const [open, setOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { consentGiven, preferences, acceptAll, rejectAll, saveCustomPreferences } = useCookieConsent();

  useEffect(() => {
    if (consentGiven === false) {
      setOpen(true);
    }
  }, [consentGiven]);

  const handleAcceptAll = () => {
    acceptAll();
    setOpen(false);
  };

  const handleRejectAll = () => {
    rejectAll();
    setOpen(false);
  };

  const handleCustomSave = () => {
    saveCustomPreferences(preferences);
    setOpen(false);
  };

  const handlePreferenceChange = (key) => (event) => {
    if (key === "essential") return; // Essential cookies cannot be disabled
    
    const newPreferences = {
      ...preferences,
      [key]: event.target.checked,
    };
    saveCustomPreferences(newPreferences);
  };

  return (
    <Dialog 
      open={open} 
      maxWidth="sm" 
      fullWidth
      onClose={() => {}} // Prevent closing by clicking outside
      disableEscapeKeyDown
    >
      <DialogTitle>We use cookies</DialogTitle>
      <DialogContent>
        <Typography variant="body2" paragraph>
          UltiMafia uses cookies to enhance your experience, analyze site usage, 
          and assist in our marketing efforts. By clicking "Accept All," you agree 
          to the use of all cookies. You can also customize your preferences or 
          reject non-essential cookies.
        </Typography>
        
        {showDetails && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Cookie Preferences
            </Typography>
            
            <Stack spacing={1} sx={{ mt: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={preferences.essential}
                    disabled
                    size="small"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      Essential Cookies
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Required for the site to function. These cannot be disabled.
                    </Typography>
                  </Box>
                }
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={preferences.analytics}
                    onChange={handlePreferenceChange("analytics")}
                    size="small"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      Analytics Cookies
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Help us understand how visitors interact with our website 
                      (e.g., Google Analytics).
                    </Typography>
                  </Box>
                }
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={preferences.functional}
                    onChange={handlePreferenceChange("functional")}
                    size="small"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      Functional Cookies
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Remember your preferences and settings to enhance your experience.
                    </Typography>
                  </Box>
                }
              />
            </Stack>
            
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
              For more information, please see our{" "}
              <Link href="/policy/privacy" target="_blank">
                Privacy Policy
              </Link>.
            </Typography>
          </Box>
        )}
        
        {!showDetails && (
          <Button
            onClick={() => setShowDetails(true)}
            size="small"
            sx={{ mt: 1 }}
          >
            Customize Preferences
          </Button>
        )}
      </DialogContent>
      <DialogActions>
        <Stack direction="row" spacing={1} sx={{ width: "100%", justifyContent: "flex-end" }}>
          {showDetails ? (
            <>
              <Button onClick={handleRejectAll} color="secondary">
                Reject All
              </Button>
              <Button onClick={handleCustomSave} color="primary" variant="contained">
                Save Preferences
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleRejectAll} color="secondary">
                Reject
              </Button>
              <Button onClick={handleAcceptAll} color="primary" variant="contained">
                Accept All
              </Button>
            </>
          )}
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
