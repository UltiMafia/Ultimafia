import React from "react";
import { Route, Routes } from "react-router-dom";
import { ViewNavigate as Navigate } from "hooks/useViewActivity";

import Setups from "./Setup/SetupPage";
import RolePage from "./role/RolePage";
import Games from "./Games";
import LearnGlossary from "./LearnGlossary";

import "css/play.css";

import { UiPage } from "components/ui";

export default function Learn(props) {

  return (
    <UiPage className="reference-page">
          <Routes>
            <Route path="games" element={<Games />} />
            <Route path="setup/:setupId" element={<Setups />} />
            <Route path="role/:RoleName" element={<RolePage />} />
            <Route path="glossary" element={<LearnGlossary />} />
            <Route path="*" element={<Navigate to="games" />} />
          </Routes>
    </UiPage>
  );
}
