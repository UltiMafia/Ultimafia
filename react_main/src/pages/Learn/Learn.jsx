import React, { useState, useEffect } from "react";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";

import Setups from "./Setup/SetupPage";
import SetupsNightOrder from "./Setup/SetupNightOrder";
import RolePage from "./role/RolePage";
import Games from "./Games";
import LearnGlossary from "./LearnGlossary";

import "css/play.css";

import { Box, Card, Link, AppBar, Toolbar } from "@mui/material";
import { useTheme } from "@mui/material/styles";

export default function Learn(props) {
  const theme = useTheme();
  const location = useLocation();
  let setupView = location.pathname.startsWith("/learn/setup");

  return (
    <>
      <Box sx={{ flexGrow: 1 }}>
        <Card sx={{ padding: theme.spacing(3), textAlign: "justify" }}>
          <Routes>
            <Route path="games" element={<Games />} />
            <Route path="setup/:setupId" element={<Setups />} />
            <Route
              path="setup/:setupId/nightorder"
              element={<SetupsNightOrder />}
            />
            <Route path="role/:RoleName" element={<RolePage />} />
            <Route path="glossary" element={<LearnGlossary />} />
            <Route path="*" element={<Navigate to="games" />} />
          </Routes>
        </Card>
      </Box>
    </>
  );
}
