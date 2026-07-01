import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { Box, Card, Link, AppBar, Toolbar } from "@mui/material";

import Donors from "./Donors";
import Contributors from "./Contributors";
import Competitive from "./Competitive";
import CompetitiveFaq from "./CompetitiveFaq";
import HallOfFame from "./HallOfFame";
import StockMarket from "./StockMarket";

export default function Fame(props) {
  const theme = useTheme();

  return (
    <>
      <Box maxWidth="1280px" sx={{ flexGrow: 1, margin: "auto" }}>
        <Card sx={{ p: { xs: 1, sm: 2, md: 3 }, textAlign: "justify" }}>
          <Routes>
            <Route path="competitive" element={<Competitive />} />
            <Route path="competitive/faq" element={<CompetitiveFaq />} />
            <Route path="hall-of-fame" element={<HallOfFame />} />
            <Route path="contributors" element={<Contributors />} />
            <Route path="donors" element={<Donors />} />
            <Route path="stocks" element={<StockMarket />} />
            <Route path="*" element={<Navigate to="competitive" />} />
          </Routes>
        </Card>
      </Box>
    </>
  );
}
