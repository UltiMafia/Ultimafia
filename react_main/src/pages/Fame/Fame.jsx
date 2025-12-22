import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { Box, Card, Link, AppBar, Toolbar } from "@mui/material";

import Donors from "./Donors";
import Contributors from "./Contributors";
import Leaderboard from "./Leaderboard";

export default function Fame(props) {
  const theme = useTheme();

  return (
    <>
      <Box maxWidth="1080px" sx={{ flexGrow: 1 }}>
        <Card sx={{ padding: theme.spacing(3), textAlign: "justify" }}>
          <Routes>
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="contributors" element={<Contributors />} />
            <Route path="donors" element={<Donors />} />
            <Route path="*" element={<Navigate to="leaderboard" />} />
          </Routes>
        </Card>
      </Box>
    </>
  );
}
