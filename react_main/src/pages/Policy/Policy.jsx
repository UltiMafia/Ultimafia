import React from "react";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Paper } from "@mui/material";

import PrivacyPolicy from "./PrivacyPolicy";
import TermsOfService from "./TermsOfService";
import Rules from "./Rules";
import Moderation from "./Moderation";
import { ModerationLog } from "./Moderation";
import Reports from "./Reports";
import CompetitiveManagement from "./Moderation/CompetitiveManagement";

function ReportsRedirect() {
  const location = useLocation();
  const suffix = location.pathname.replace("/policy/reports", "") || "";
  return (
    <Navigate
      to={`/policy/moderation/reports${suffix}`}
      replace
    />
  );
}

export default function Policy() {
  return (
    <Paper sx={{ p: 2, textAlign: "justify" }}>
      <Routes>
        <Route path="rules" element={<Rules />} />
        <Route path="tos" element={<TermsOfService />} />
        <Route path="privacy" element={<PrivacyPolicy />} />
        <Route path="moderation" element={<Moderation />}>
          <Route index element={<ModerationLog />} />
          <Route
            path="reports"
            element={<Reports basePath="/policy/moderation" />}
          />
          <Route
            path="reports/:reportId"
            element={<Reports basePath="/policy/moderation" />}
          />
          <Route path="competitive" element={<CompetitiveManagement />} />
        </Route>
        <Route path="reports/*" element={<ReportsRedirect />} />
        <Route path="*" element={<Navigate to="rules" />} />
      </Routes>
    </Paper>
  );
}
