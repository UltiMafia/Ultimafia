import React, { useEffect, useState } from "react";
import ChangeHead from "components/gameComponents/ChangeHead";

const FLASH_INTERVAL = 800;

export const ChangeHeadPing = ({ title, timestamp }) => {
  const [alive, setAlive] = useState(false);

  useEffect(() => {
    if (title) {
      setAlive(true);

      let flashIndex = 0;
      const flashCount = 3;
      const flashInterval = setInterval(() => {
        ++flashIndex;
        if (flashIndex % 2) {
          setAlive(false);
          if (flashIndex + 1 >= flashCount * 2) {
            clearInterval(flashInterval);
          }
        } else {
          setAlive(true);
        }
      }, FLASH_INTERVAL);
      return () => clearInterval(flashInterval);
    }
  }, [title, timestamp]);

  if (!alive) {
    return null;
  }

  return <ChangeHead title={title} />;
};
