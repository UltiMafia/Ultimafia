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
      <Box sx={{ 
        width: { xs: '100%', md: '1280px' }, 
        maxWidth: '100vw',
        position: 'relative',
        left: '50%',
        transform: 'translateX(-50%)',
        flexGrow: 1 
      }}>
        <Card sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
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
