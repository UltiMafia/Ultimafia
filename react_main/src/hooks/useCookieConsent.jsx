import { useState, useEffect, useCallback } from "react";

const COOKIE_CONSENT_KEY = "cookieConsent";
const COOKIE_PREFERENCES_KEY = "cookiePreferences";

// Default cookie preferences
const DEFAULT_PREFERENCES = {
  essential: true, // Always required, cannot be disabled
  analytics: false,
  functional: false,
};

/**
 * Hook to manage cookie consent and preferences
 * Returns consent state and functions to update preferences
 */
export function useCookieConsent() {
  const [consentGiven, setConsentGiven] = useState(null);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);

  // Load consent and preferences from localStorage on mount
  useEffect(() => {
    const storedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    const storedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);

    if (storedConsent) {
      setConsentGiven(storedConsent === "accepted" || storedConsent === "rejected");
      
      if (storedPreferences) {
        try {
          const parsed = JSON.parse(storedPreferences);
          setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
        } catch (e) {
          console.error("Error parsing cookie preferences:", e);
        }
      }
    } else {
      setConsentGiven(false);
    }
  }, []);

  // Apply cookie preferences (enable/disable analytics, etc.)
  useEffect(() => {
    if (consentGiven === null) return; // Still loading

    // Wait for gtag to be available
    const checkGtag = () => {
      if (window.gtag) {
        if (consentGiven && preferences.analytics) {
          // Enable Google Analytics
          window.gtag("consent", "update", {
            analytics_storage: "granted",
          });
          // Load GA script if not already loaded
          if (!document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
            const script = document.createElement("script");
            script.async = true;
            script.src = "https://www.googletagmanager.com/gtag/js?id=G-X5P3N0872P";
            document.head.appendChild(script);
            script.onload = () => {
              window.gtag("config", "G-X5P3N0872P");
            };
          }
        } else {
          // Disable Google Analytics
          window.gtag("consent", "update", {
            analytics_storage: "denied",
          });
        }
      } else {
        // Retry after a short delay if gtag isn't ready yet
        setTimeout(checkGtag, 100);
      }
    };
    
    checkGtag();
  }, [consentGiven, preferences.analytics]);

  const updatePreferences = useCallback((newPreferences) => {
    const updated = { ...preferences, ...newPreferences };
    // Essential cookies are always required
    updated.essential = true;
    setPreferences(updated);
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(updated));
    
    // Update consent if preferences change
    if (consentGiven) {
      localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    }
  }, [preferences, consentGiven]);

  const acceptAll = useCallback(() => {
    const allAccepted = {
      essential: true,
      analytics: true,
      functional: true,
    };
    setPreferences(allAccepted);
    setConsentGiven(true);
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(allAccepted));
    
    // Enable analytics
    if (window.gtag) {
      window.gtag("consent", "update", {
        analytics_storage: "granted",
      });
    }
  }, []);

  const rejectAll = useCallback(() => {
    const onlyEssential = {
      essential: true,
      analytics: false,
      functional: false,
    };
    setPreferences(onlyEssential);
    setConsentGiven(true);
    localStorage.setItem(COOKIE_CONSENT_KEY, "rejected");
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(onlyEssential));
    
    // Disable analytics
    if (window.gtag) {
      window.gtag("consent", "update", {
        analytics_storage: "denied",
      });
    }
  }, []);

  const saveCustomPreferences = useCallback((customPreferences) => {
    updatePreferences(customPreferences);
    setConsentGiven(true);
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
  }, [updatePreferences]);

  return {
    consentGiven,
    preferences,
    updatePreferences,
    acceptAll,
    rejectAll,
    saveCustomPreferences,
  };
}
