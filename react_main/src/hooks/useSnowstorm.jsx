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

    // Function to stop snowstorm
    const stopSnowstorm = () => {
      // snowstorm.js creates a global 'snowStorm' variable accessible via window.snowStorm
      if (window.snowStorm) {
        if (window.snowStorm.stop) {
          window.snowStorm.stop();
        }
        // Also ensure it's disabled and inactive
        if (window.snowStorm.active !== false) {
          window.snowStorm.active = false;
        }
        if (window.snowStorm.disabled !== true) {
          window.snowStorm.disabled = true;
        }
      }
    };

    // Function to start snowstorm
    const startSnowstorm = () => {
      if (window.snowStorm) {
        // First, ensure it's not disabled
        if (window.snowStorm.disabled) {
          window.snowStorm.disabled = false;
        }

        // If it's not active, start it
        if (!window.snowStorm.active) {
          // Try to resume first if it was frozen
          if (window.snowStorm.resume) {
            window.snowStorm.resume();
          }
          // Then start it
          if (window.snowStorm.start) {
            window.snowStorm.start();
          } else if (window.snowStorm.toggleSnow) {
            // Fallback to toggle if start doesn't work
            window.snowStorm.toggleSnow();
          }
        } else if (window.snowStorm.active === false) {
          // If explicitly set to false, toggle it on
          if (window.snowStorm.toggleSnow) {
            window.snowStorm.toggleSnow();
          }
        }
      }
    };

    // Don't load if user has disabled it
    if (disableSnowstorm) {
      // If script is already loaded, stop it
      stopSnowstorm();

      // Also check periodically in case script loads later
      const checkInterval = setInterval(() => {
        if (window.snowStorm) {
          stopSnowstorm();
          clearInterval(checkInterval);
        }
      }, 100);

      return () => {
        clearInterval(checkInterval);
        stopSnowstorm();
      };
    }

    if (isHolidaySeason) {
      // Check if script is already loaded
      const existingScript = document.querySelector(
        'script[src="/snowstorm.js"]'
      );

      if (existingScript) {
        // Script already loaded, start it
        // Try immediately
        startSnowstorm();

        // Also check periodically in case it's still initializing
        const checkInterval = setInterval(() => {
          if (window.snowStorm) {
            startSnowstorm();
            clearInterval(checkInterval);
          }
        }, 100);

        return () => {
          clearInterval(checkInterval);
          stopSnowstorm();
        };
      }

      // Load the snowstorm script
      const script = document.createElement("script");
      script.src = "/snowstorm.js";
      script.async = true;

      // Wait for script to load before trying to control it
      script.onload = () => {
        // Give it a moment to initialize
        setTimeout(() => {
          if (disableSnowstorm) {
            // If user disabled it while loading, stop it
            stopSnowstorm();
          } else {
            // Otherwise, start it
            startSnowstorm();
          }
        }, 50);
      };

      document.head.appendChild(script);

      // Cleanup function to remove script if component unmounts
      return () => {
        stopSnowstorm();
        const scriptToRemove = document.querySelector(
          'script[src="/snowstorm.js"]'
        );
        if (scriptToRemove) {
          scriptToRemove.remove();
        }
      };
    }
  }, [disableSnowstorm]);
};
