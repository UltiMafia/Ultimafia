import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { Box, Paper } from "@mui/material";

import PrivacyPolicy from "./PrivacyPolicy";
import TermsOfService from "./TermsOfService";
import Rules from "./Rules";
import Moderation from "./Moderation";
import Reports from "./Reports";

export default function Policy() {
  return (
    <Paper sx={{ p: 2, textAlign: "justify" }}>
      <Routes>
        <Route path="rules" element={<Rules />} />
        <Route path="tos" element={<TermsOfService />} />
        <Route path="privacy" element={<PrivacyPolicy />} />
        <Route path="moderation" element={<Moderation />} />
        <Route path="reports/*" element={<Reports />} />
        <Route path="reports/:reportId" element={<Reports />} />
        <Route path="reports" element={<Reports />} />
        <Route path="*" element={<Navigate to="rules" />} />
      </Routes>
    </Paper>
  );
}
