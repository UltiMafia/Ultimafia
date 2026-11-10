import React from "react";
import { useIsPhoneDevice } from "../hooks/useIsPhoneDevice";
import { MobileNav } from "./MobileNav";
import SiteNavigation from "./SiteNavigation";

// Shared by production and visual tests: one content scroller, with navigation
// outside it. Hidden retained pages keep their component and scroll state.
export default function SiteLayout({ header, footer, beforeHeader, hidden, children }) {
  const phone = useIsPhoneDevice();
  return (
    <div className={`app-shell site-layout${phone ? " is-phone" : ""}`} style={hidden ? { display: "none" } : undefined}>
      {beforeHeader}
      {header}
      <div className="site-body">
        {!phone && <SiteNavigation />}
        <div className="site-wrapper">
          <div className="site-content">{children}</div>
          {!phone && footer}
        </div>
      </div>
      {phone && <MobileNav />}
    </div>
  );
}
