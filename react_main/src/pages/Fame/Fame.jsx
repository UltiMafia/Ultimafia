import React from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { ViewNavigate as Navigate } from "hooks/useViewActivity";
import { UiPage } from "components/ui";

import Donors from "./Donors";
import Contributors from "./Contributors";
import Competitive from "./Competitive";
import CompetitiveFaq from "./CompetitiveFaq";
import HallOfFame from "./HallOfFame";
import StockMarket from "./StockMarket";

export default function Fame(props) {
  const { pathname } = useLocation();

  return (
    <UiPage className="fame-page" width={pathname.endsWith("/faq") ? "prose" : "wide"}>
          <Routes>
            <Route path="competitive" element={<Competitive />} />
            <Route path="competitive/faq" element={<CompetitiveFaq />} />
            <Route path="hall-of-fame" element={<HallOfFame />} />
            <Route path="contributors" element={<Contributors />} />
            <Route path="donors" element={<Donors />} />
            <Route path="stocks" element={<StockMarket />} />
            <Route path="*" element={<Navigate to="competitive" />} />
          </Routes>
    </UiPage>
  );
}
