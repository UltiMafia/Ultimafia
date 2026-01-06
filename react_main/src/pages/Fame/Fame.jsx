import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { Box, Card, Link, AppBar, Toolbar } from "@mui/material";

import Donors from "./Donors";
import Contributors from "./Contributors";
import Competitive from "./Competitive";
import CompetitiveFaq from "./CompetitiveFaq";

export default function Fame(props) {
  const theme = useTheme();

  return (
    <>
      <Box maxWidth="1080px" sx={{ flexGrow: 1 }}>
        <Card sx={{ padding: theme.spacing(3), textAlign: "justify" }}>
          <Routes>
            <Route path="competitive" element={<Competitive />} />
            <Route path="competitive/faq" element={<CompetitiveFaq />} />
            <Route path="contributors" element={<Contributors />} />
            <Route path="donors" element={<Donors />} />
            <Route path="*" element={<Navigate to="competitive" />} />
          </Routes>
        </Card>
      </Box>
    </>
  );
}
