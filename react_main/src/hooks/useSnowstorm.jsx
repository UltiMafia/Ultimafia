import { useEffect } from "react";

/**
 * Custom hook that conditionally loads snowstorm.js
 * Only loads and activates between December 1 and January 1
 * Respects user's disableSnowstorm setting
 */
export const useSnowstorm = (disableSnowstorm = false) => {
  useEffect(() => {
    const now = new Date();
    const month = now.getMonth() + 1; // getMonth() returns 0-11, so add 1

    // Active from December 1 through December 31, turns off on January 1
    const isHolidaySeason = month === 12;

    // Don't load if user has disabled it
    if (disableSnowstorm) {
      // If script is already loaded, stop it
      if (window.snowStorm && window.snowStorm.toggleSnow) {
        window.snowStorm.toggleSnow(false);
      }
      return;
    }

    if (isHolidaySeason) {
      // Check if script is already loaded
      if (document.querySelector('script[src="/snowstorm.js"]')) {
        // Script already loaded, make sure it's enabled
        if (window.snowStorm && window.snowStorm.toggleSnow) {
          window.snowStorm.toggleSnow(true);
        }
        return;
      }

      // Load the snowstorm script
      const script = document.createElement("script");
      script.src = "/snowstorm.js";
      script.async = true;
      document.head.appendChild(script);

      // Cleanup function to remove script if component unmounts (optional)
      return () => {
        const existingScript = document.querySelector(
          'script[src="/snowstorm.js"]'
        );
        if (existingScript) {
          existingScript.remove();
        }
        // Stop snowstorm if it's running
        if (window.snowStorm && window.snowStorm.toggleSnow) {
          window.snowStorm.toggleSnow(false);
        }
      };
    }
  }, [disableSnowstorm]);
};
