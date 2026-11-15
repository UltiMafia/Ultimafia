import React, { useState, useEffect } from "react";
import { Box, FormControlLabel, Stack, Link } from "@mui/material";
import { useCookieConsent } from "../hooks/useCookieConsent";
import { Link as RouterLink } from "react-router-dom";
import { UiText as Typography, UiCheckbox as Checkbox, UiAction, UiDialog } from "components/ui";

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

  const dialogActions = (<Stack direction="row" spacing={1} sx={{ width: "100%", justifyContent: "flex-end" }}>
          {showDetails ? (
            <>
              <UiAction  variant="ghost" onClick={handleRejectAll} >
                Reject All
              </UiAction>
              <UiAction  variant="primary" onClick={handleCustomSave}  >
                Save Preferences
              </UiAction>
            </>
          ) : (
            <>
              <UiAction  variant="ghost" onClick={handleRejectAll} >
                Reject
              </UiAction>
              <UiAction  variant="primary" onClick={handleAcceptAll}  >
                Accept All
              </UiAction>
            </>
          )}
        </Stack>);

  return (
    <UiDialog
      open={open}
      title="We use cookies"
      dismissible={false}
      actions={dialogActions}
    >
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
              <Link component={RouterLink} to="/policy/privacy">
                Privacy Policy
              </Link>.
            </Typography>
          </Box>
        )}
        
        {!showDetails && (
          <UiAction
            variant="ghost"
            size="small"
            className="cookie-customize"
            onClick={() => setShowDetails(true)}
          >
            Customize Preferences
          </UiAction>
        )}

    </UiDialog>
  );
}
