import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { Box, Card } from "@mui/material";

import PrivacyPolicy from "./PrivacyPolicy";
import TermsOfService from "./TermsOfService";
import Rules from "./Rules";

export default function Policy(props) {
  const theme = useTheme();

  return (
    <>
      <Box maxWidth="1080px" sx={{ mt: 1, flexGrow: 1 }}>
        <Card sx={{ padding: theme.spacing(3), textAlign: "justify" }}>
          <Routes>
            <Route path="rules" element={<Rules />} />
            <Route path="tos" element={<TermsOfService />} />
            <Route path="privacy" element={<PrivacyPolicy />} />
            <Route path="*" element={<Navigate to="rules" />} />
          </Routes>
        </Card>
      </Box>
    </>
  );
}
