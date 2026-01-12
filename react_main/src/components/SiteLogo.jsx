import React from "react";
import { Box } from "@mui/material";

import logovalentines from "images/branding/logo-valentines.png";
import logopride from "images/branding/logo-pride.png";
import logohalloween from "images/branding/logo-halloween.webp";
import logowinter from "images/branding/logo-winter.webp";
import logodefault from "images/branding/logo-default.png";

export default function SiteLogo({ height = 144, width = 247, ...props }) {
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
