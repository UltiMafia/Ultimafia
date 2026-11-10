import React from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { ViewNavigate as Navigate } from "hooks/useViewActivity";
import { UiPage } from "components/ui";

import PrivacyPolicy from "./PrivacyPolicy";
import TermsOfService from "./TermsOfService";
import Rules from "./Rules";
import Moderation, { ModerationLog } from "./Moderation";
import { ModerationGroups, ModerationTools } from "./Moderation/ModerationPages";
import Reports from "./Reports";
import CompetitiveManagement from "./Moderation/CompetitiveManagement";
import StaffHandbook from "./Moderation/StaffHandbook";
import FlaggedIntake from "./Moderation/FlaggedIntake";
import GithubLinks from "./Moderation/GithubLinks";
import Volunteer from "./Moderation/Volunteer";
import BanAppeals from "./Moderation/BanAppeals";
import Invoices from "./Invoices";

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
  const { pathname } = useLocation();
  const prose = ["/policy/rules", "/policy/tos", "/policy/privacy"].includes(pathname);
  return (
    <UiPage className="policy-page" width={prose ? "prose" : "wide"}>
      <Routes>
        <Route path="rules" element={<Rules />} />
        <Route path="tos" element={<TermsOfService />} />
        <Route path="privacy" element={<PrivacyPolicy />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="moderation" element={<Moderation />}>
          <Route index element={<ModerationLog />} />
          <Route path="tools" element={<ModerationTools />} />
          <Route path="groups" element={<ModerationGroups />} />
          <Route
            path="reports"
            element={<Reports basePath="/policy/moderation" />}
          />
          <Route
            path="reports/:reportId"
            element={<Reports basePath="/policy/moderation" />}
          />
          <Route path="competitive" element={<CompetitiveManagement />} />
          <Route path="handbook" element={<StaffHandbook />} />
          <Route path="flagged-intake" element={<FlaggedIntake />} />
          <Route path="github-links" element={<GithubLinks />} />
          <Route path="volunteer" element={<Volunteer />} />
          <Route path="ban-appeals" element={<BanAppeals />} />
          <Route path="ban-appeals/:appealId" element={<BanAppeals />} />
        </Route>
        <Route path="reports/*" element={<ReportsRedirect />} />
        <Route path="*" element={<Navigate to="rules" />} />
      </Routes>
    </UiPage>
  );
}
