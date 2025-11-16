import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { Box, Paper } from "@mui/material";

import PrivacyPolicy from "./PrivacyPolicy";
import TermsOfService from "./TermsOfService";
import Rules from "./Rules";

export default function Policy() {
  return (
    <Paper sx={{ p: 2, textAlign: "justify" }}>
      <Routes>
        <Route path="rules" element={<Rules />} />
        <Route path="tos" element={<TermsOfService />} />
        <Route path="privacy" element={<PrivacyPolicy />} />
        <Route path="*" element={<Navigate to="rules" />} />
      </Routes>
    </Paper>
  );
}
