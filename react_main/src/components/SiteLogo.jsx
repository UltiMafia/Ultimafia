import React from "react";
import { Box } from "@mui/material";

import logovalentines from "images/logos/logo-valentines.png";
import logopride from "images/logos/logo-pride.png";
import logohalloween from "images/logos/logo-halloween.png";
import logowinter from "images/logos/logo-winter.png";
import logodefault from "images/logos/logo-default.png";
import { Link } from "react-router-dom";

export default function SiteLogo({
  small = false,
  large = false,
  newTab = false,
}) {
  const getLogoSrc = () => {
    const currentMonth = new Date().getMonth();
    // 0 = January, 11 = December

    if (currentMonth === 1) return logovalentines; // February: Valentine's
    if (currentMonth === 5) return logopride; // June: Pride
    if (currentMonth === 9) return logohalloween; // October: Halloween
    if (currentMonth === 11) return logowinter; // December: Winter

    return logodefault; // Default
  };

  let width = 245;
  let height = 53;
  if (small === true) {
    width = 175;
    height = 38;
  }
  else if (large === true) {
    width = 350;
    height = 75;
  }

  let linkProps = {};
  if (newTab === true) {
    linkProps = { target: "_blank", rel: "noopener noreferrer" };
  }

  return (
    <Link to="/play" {...linkProps} style={{ lineHeight: 0 }}>
      <img
        height={height}
        width={width}
        alt="Site logo"
        src={getLogoSrc()}
      />
    </Link>
  );
}
