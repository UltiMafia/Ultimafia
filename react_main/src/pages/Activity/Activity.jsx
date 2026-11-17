import React, { useContext, useMemo, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { ViewNavigate as Navigate } from "hooks/useViewActivity";
import { UiPage } from "components/ui";
import "css/activity.css";

import { UserContext } from "Contexts";
import Metrics from "./Metrics";
import LiveFeed from "./LiveFeed";
import { ActivityHeaderMeta, WindowSegment } from "./WindowFilterControls";

export default function SiteActivityPage() {
  const user = useContext(UserContext);
  const [windowKey, setWindowKey] = useState("24h");
  const snapshotAt = useMemo(() => new Date(), [windowKey]);

  if (!user.loaded) return null;
  if (!user.loggedIn)
    return <Navigate to="/play" replace />;

  return (
    <UiPage title="Site activity" className="activity-page" actions={<WindowSegment value={windowKey} onChange={setWindowKey} />}>
      <ActivityHeaderMeta snapshotAt={snapshotAt} />
      <Routes>
        <Route path="/" element={<Navigate to="metrics" replace />} />
        <Route path="metrics" element={<Metrics windowKey={windowKey} />} />
        <Route path="livefeed" element={<LiveFeed windowKey={windowKey} />} />
        <Route path="*" element={<Navigate to="metrics" replace />} />
      </Routes>
    </UiPage>
  );
}
