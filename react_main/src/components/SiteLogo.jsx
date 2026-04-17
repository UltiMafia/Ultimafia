import React, { useContext } from "react";
import { Box } from "@mui/material";

import logovalentines from "images/logos/logo-valentines.png";
import logopride from "images/logos/logo-pride.png";
import logohalloween from "images/logos/logo-halloween.png";
import logowinter from "images/logos/logo-winter.png";
import logodefault from "images/logos/logo-default.png";
import { Link } from "react-router-dom";
import {
  isHalloweenThemeActive,
  isPrideThemeActive,
  isValentinesThemeActive,
  isWinterThemeActive,
} from "../utils/holidayThemes";
import { UserContext } from "../Contexts";

export default function SiteLogo({
  small = false,
  large = false,
  newTab = false,
}) {
  const user = useContext(UserContext);

  const getLogoSrc = () => {
    if (isValentinesThemeActive()) return logovalentines; // February: Valentine's
    if (isPrideThemeActive()) return logopride; // June: Pride
    if (isHalloweenThemeActive()) return logohalloween; // October: Halloween
    if (isWinterThemeActive()) return logowinter; // December: Winter

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
