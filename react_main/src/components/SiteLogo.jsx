import React from "react";
import { Box } from "@mui/material";

import umpride2 from "images/holiday/umpride2.png";
import logobloody from "images/holiday/fadelogoHalloween.webp";
import fadelogohat from "images/fadelogohat.png";

export default function SiteLogo({ height = 144, width = 247, ...props }) {
  const getLogoSrc = () => {
    const currentMonth = new Date().getMonth();
    // 0 = January, 11 = December

    if (currentMonth === 5) return umpride2; // June: Pride
    if (currentMonth === 9) return logobloody; // October: Halloween

    return fadelogohat; // Default
  };

  return (
    <Box
      component="img"
      sx={{
        height: 105,
        width: 179,
        ml: "auto",
        mr: "auto",
        display: "block",
      }}
      alt="Site logo"
      src={getLogoSrc()}
      {...props}
    />
  );
}
