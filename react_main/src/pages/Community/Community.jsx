import React from "react";
import { Route, Routes } from "react-router-dom";
import { ViewNavigate as Navigate } from "hooks/useViewActivity";
import { UiPage } from "components/ui";

import Forums from "./Forums/Forums";
import UserSearch from "./UserSearch";
import Feedback from "./Feedback";
import FamilyDiscovery from "./FamilyDiscovery";

export default function Community() {
  // Allow logged-out users to access Community page

  return (
    <UiPage className="community-page">
          <Routes>
            <Route path="forums/*" element={<Forums />} />
            <Route path="users" element={<UserSearch />} />
            <Route path="families" element={<FamilyDiscovery />} />
            <Route path="feedback" element={<Feedback />} />
            <Route path="*" element={<Navigate to="forums" />} />
          </Routes>
    </UiPage>
  );
}
