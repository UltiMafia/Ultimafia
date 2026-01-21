import React from "react";
import { Box } from "@mui/material";

export default function IconGallery() {
  const getIconClass = (index) => {
    const currentMonth = new Date().getMonth();
    // 0 = January, 11 = December
    // Month 1 = February (Valentine's Day)
    // Month 5 = June (Pride month)

    const defaultClasses = [
      "role role-icon-vivid-Mafia-Cop small",
      "role role-icon-vivid-Mafia-Doctor small",
      "role role-icon-vivid-Mafia-Gunsmith small",
      "role role-icon-vivid-Mafia-Miller small",
      "role role-icon-vivid-Mafia-Villager small",
      "role role-icon-vivid-Mafia-Godfather small",
      "role role-icon-vivid-Mafia-Hooker small",
      "role role-icon-vivid-Mafia-Mafioso small",
      "role role-icon-vivid-Mafia-Cult-Leader small",
      "role role-icon-vivid-Mafia-Fool small",
      "role role-icon-vivid-Mafia-Magus small",
    ];

    // Valentine's classes
    const valentinesClasses = [
      "role role-icon-vivid-Suitress small",
      "role role-icon-vivid-Virgin small",
      "role role-icon-vivid-Mistress small",
      "role role-icon-vivid-Heartbreaker small",
      "role role-icon-vivid-Astrologer small",
      "role role-icon-vivid-Succubus small",
      "role role-icon-vivid-Incubus small",
      "role role-icon-vivid-Lover small",
      "role role-icon-vivid-Matchmaker small",
      "role role-icon-vivid-Panda-Bear small",
      "role role-icon-vivid-Yandere small"
    ];

    // Pride classes
    const prideClasses = [
      "role role-icon-vivid-redmafiac small",      // 0: Cop
      "role role-icon-vivid-yellowmafiac small",   // 1: Doctor
      null,                                         // 2: Gunsmith (no Pride version)
      null,                                         // 3: Miller (no Pride version)
      "role role-icon-vivid-greenmafiac small",     // 4: Villager
      null,                                         // 5: Godfather (no Pride version)
      "role role-icon-vivid-purplemafiac small",   // 6: Hooker
      "role role-icon-vivid-bluemafiac small",     // 7: Mafioso
      null,                                         // 8: Cult Leader (no Pride version)
      null,                                         // 9: Fool (no Pride version)
      null,                                         // 10: Magus (no Pride version)
    ];

    if (currentMonth === 1) {
      // Valentine's icons for February - use Valentine's class if available, otherwise default
      return valentinesClasses[index] || defaultClasses[index];
    }

    if (currentMonth === 5) {
      // Pride icons for June - use Pride class if available, otherwise default
      return prideClasses[index] || defaultClasses[index];
    }

    // Default icons for all other months
    return defaultClasses[index];
  };

  return (
    <Box align="center" className="role-icon-scheme-vivid">
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((index) => (
        <div
          key={index}
          className={getIconClass(index)}
          style={{ display: "inline-block" }}
        />
      ))}
    </Box>
  );
}
