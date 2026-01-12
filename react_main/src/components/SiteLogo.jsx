import React from "react";
import { Box } from "@mui/material";

import logovalentines from "images/logos/logo-valentines.png";
import logopride from "images/logos/logo-pride.png";
import logohalloween from "images/logos/logo-halloween.png";
import logowinter from "images/logos/logo-winter.png";
import logodefault from "images/logos/logo-default.png";

export default function SiteLogo({ height = 75, width = 350, ...props }) {
  const getLogoSrc = () => {
    const currentMonth = new Date().getMonth();
    // 0 = January, 11 = December

    if (currentMonth === 1) return logovalentines; // February: Valentine's
    if (currentMonth === 5) return logopride; // June: Pride
    if (currentMonth === 9) return logohalloween; // October: Halloween
    if (currentMonth === 11) return logowinter; // December: Winter

    return logodefault; // Default
  };

  return (
    <Box
      component="img"
      sx={{
        height: 75,
        width: 350,
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
