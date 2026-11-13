// Actual production shell/routes. All reads are synthetic; all writes stay local.
import React, { Suspense, useState } from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import { initializeApp } from "firebase/app";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { Header, Footer } from "../src/Main";
import SiteLayout from "../src/components/SiteLayout";
import { SheetProvider } from "../src/components/Sheet";
import { ProfileSheetProvider } from "../src/components/ProfileSheet";
import ViewOverlayBoundary from "../src/components/ViewOverlayBoundary";
import { AppLocationContext, ViewActivityContext } from "../src/hooks/useViewActivity";
import { useAppViewport } from "../src/hooks/useAppViewport";
import { UserContext, SiteInfoContext } from "../src/Contexts";
import { getSiteTheme } from "../src/constants/themes";
import Play from "../src/pages/Play/Play";
import Learn from "../src/pages/Learn/Learn";
import Community from "../src/pages/Community/Community";
import User from "../src/pages/User/User";
import Fame from "../src/pages/Fame/Fame";
import Policy from "../src/pages/Policy/Policy";
import Activity from "../src/pages/Activity/Activity";
import { Welcome } from "../src/pages/Welcome/Welcome";
import { Loading } from "../src/components/Loading";
import { makeUser, makeSiteInfo, readFixture, routeCases } from "./routeReviewData";
import NewPageFixture from "./ui-audit/NewPageFixture";
import "../src/css/main.css";
import "../src/css/accessibility.css";
import "../src/css/redesign.css";

const params = new URLSearchParams(location.search);
const state = window.__routeReview = {
  ready: false, pending: 0, requests: [], writes: [], alerts: [], errors: [],
  unresolved: [], blocked: [], lastRequestAt: performance.now(), cases: routeCases,
  failNextRead: params.get("fixtureFailRead"),
  deferRead: params.get("fixtureDeferRead"),
};
const record = (type, value) => state.writes.push({ type, ...value });
const user = makeUser(params.get("fixtureMode") || "member");
user.state = { ...user };
Object.assign(user, Object.fromEntries(["set", "clear", "setInGame", "updateSetting", "refreshUser", "refreshGameMembership", "blockUserToggle"].map(name => [name, (...args) => record(name, { args })])));
const siteInfo = makeSiteInfo(record);
window.gtag = (...args) => record("analytics", { args });

// This is an explicit fake Firebase public project, never a real account/project.
initializeApp({ apiKey: "fake-route-review-public-key", authDomain: "route-review.invalid", projectId: "fake-route-review", appId: "1:000000000000:web:fake-route-review" });

axios.defaults.adapter = async config => {
  state.pending++;
  state.lastRequestAt = performance.now();
  const url = new URL(config.url, location.origin);
  const method = (config.method || "get").toLowerCase();
  for (const [key, value] of Object.entries(config.params || {})) if (value != null) url.searchParams.set(key, value);
  state.requests.push({ method, url: url.pathname + url.search });
  try {
    if (url.origin !== location.origin) throw new Error(`Non-local Axios request blocked: ${url.origin}`);
    if (state.deferRead === url.pathname) {
      state.deferRead = null;
      await new Promise(resolve => { state.releaseRead = resolve; });
    }
    if (state.failNextRead === url.pathname) {
      state.failNextRead = null;
      state.simulatedReadFailures = (state.simulatedReadFailures || 0) + 1;
      throw Object.assign(new Error("Simulated read failure"), { fixtureExpected: true });
    }
    let data;
    if (!["get", "head", "options"].includes(method)) {
      record("axios", { method, url: url.pathname, data: typeof config.data === "string" ? config.data : "local non-text payload" });
      // Only passive notification acknowledgement and an explicitly opted-in
      // settings-control test are simulated. No requests leave this adapter.
      if (url.pathname === "/api/notifs/read") data = { recordedLocally: true };
      else if (state.allowSettingsWrites && url.pathname === "/api/user/settings/update") data = { recordedLocally: true };
       else if (state.allowSetupWrites && url.pathname === "/api/setup/create") data = "fixture-created";
       else if (state.allowKarmaWrites && method === "post" && url.pathname === "/api/user/karma") {
         const payload = JSON.parse(config.data);
         state.karmaVotes = state.karmaVotes || {};
         const previous = state.karmaVotes[payload.targetId] || 0;
         const next = previous === payload.direction ? 0 : payload.direction;
         state.karmaVotes[payload.targetId] = next;
         data = String(next);
       }
       else if (state.allowFeedbackWrites && method === "post" && url.pathname === "/api/feedback/submit") {
         // No issue is created: this is the in-memory fixture adapter only.
         if (state.deferFeedback) {
           state.deferFeedback = false;
           await new Promise(resolve => { state.releaseFeedback = resolve; });
         }
         if (state.failFeedback) {
           state.failFeedback = false;
           throw Object.assign(new Error("Simulated feedback failure. Draft retained."), { fixtureExpected: true });
         }
         data = "Feedback recorded in the test fixture only.";
       }
        else if (state.allowTradeFailure && method === "post" && url.pathname === "/api/stocks/buy") {
         // Explicitly opted-in failure only: never simulate a balance-changing
         // success or forward a financial request outside this in-memory adapter.
         state.allowTradeFailure = false;
         await new Promise(resolve => { state.releaseTradeFailure = resolve; });
         state.simulatedTradeFailures = (state.simulatedTradeFailures || 0) + 1;
           throw Object.assign(new Error("Simulated trade failure. No trade was made."), { fixtureExpected: true });
         }
        else if (state.allowReportFailure && method === "post" && url.pathname === "/api/report/send") {
          state.allowReportFailure = false;
          await new Promise(resolve => { state.releaseReportFailure = resolve; });
          state.simulatedReportFailures = (state.simulatedReportFailures || 0) + 1;
          throw Object.assign(new Error("Simulated report failure. No report was delivered."), { fixtureExpected: true });
        }
       else if (method === "post" && state.adminFailurePath === url.pathname &&
         ["/api/dev/keys", "/api/dev/keys/fixture-client-1/revoke", "/api/crypto/admin/invoices/fixture-invoice-0/approve"].includes(url.pathname)) {
         state.adminFailurePath = null;
         await new Promise(resolve => { state.releaseAdminFailure = resolve; });
         state.simulatedAdminFailures = (state.simulatedAdminFailures || 0) + 1;
         throw Object.assign(new Error("Simulated administrative failure. No key or payment was changed."), { fixtureExpected: true });
       }
       else throw new Error(`Fixture is read-only; recorded ${method.toUpperCase()} ${url.pathname}`);
     } else data = readFixture(url, user);
    if (params.get("fixtureEmptyRead") === url.pathname) {
      if (["/api/dev/keys", "/api/dev/owner/keys", "/api/site/violations"].includes(url.pathname)) data = [];
      else if (url.pathname === "/api/crypto/admin/invoices") data = { invoices: [], total: 0, pageSize: 50 };
      else throw new Error("Unregistered empty-state contract");
    }
    return { data: JSON.parse(JSON.stringify(data)), status: 200, statusText: "OK", headers: {}, config };
  } catch (error) {
    if (!error.fixtureExpected) state.unresolved.push(error.message);
    throw Object.assign(error, { config, response: { status: 501, data: error.message } });
  } finally { state.pending--; state.lastRequestAt = performance.now(); }
};

// No real socket implementation can be created by a route.
window.WebSocket = class {
  constructor(url) { state.blocked.push({ type: "websocket", url: String(url) }); throw new Error("Sockets are disabled in the read-only route fixture"); }
};
window.addEventListener("unhandledrejection", event => state.errors.push(String(event.reason?.stack || event.reason)));
window.addEventListener("error", event => { if (event.error) state.errors.push(event.error.stack || event.message); });

class RouteBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { state.errors.push(`${error.stack}\n${info.componentStack}`); }
  render() {
    if (this.state.error) return <pre data-route-review-failure>{String(this.state.error)}</pre>;
    return this.props.children;
  }
}
function App() {
  useAppViewport();
  const location = useLocation();
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  return <AppLocationContext.Provider value={location}><ViewActivityContext.Provider value={true}>
    <ViewOverlayBoundary active={true}><SiteLayout header={<Header setShowAnnouncementTemporarily={setShowAnnouncement} />} footer={<Footer />}>
      <main id="main-content" tabIndex={-1}>
        <Suspense fallback={<Loading small />}><RouteBoundary>
           <Routes>
             <Route path="/audit/new-page" element={<NewPageFixture />} />
             <Route path="/welcome" element={<Welcome />} />
            <Route path="/play/*" element={<Play />} />
            <Route path="/learn/*" element={<Learn />} />
            <Route path="/community/*" element={<Community />} />
            <Route path="/user/*" element={<User />} />
            <Route path="/fame/*" element={<Fame />} />
            <Route path="/policy/*" element={<Policy />} />
            <Route path="/activity/*" element={<Activity />} />
            <Route path="/auth/login" element={<Welcome />} />
            <Route path="*" element={<pre data-route-review-failure>Unconfigured fixture route</pre>} />
          </Routes>
        </RouteBoundary></Suspense>
      </main>
    </SiteLayout></ViewOverlayBoundary>
  </ViewActivityContext.Provider></AppLocationContext.Provider>;
}
const light = params.get("theme") === "light";
document.documentElement.classList.add(light ? "light-mode" : "dark-mode");
ReactDOM.render(<BrowserRouter><ThemeProvider theme={getSiteTheme(undefined, light ? "light" : "dark")} defaultMode={light ? "light" : "dark"} noSsr>
  <CssBaseline /><UserContext.Provider value={user}><SiteInfoContext.Provider value={siteInfo}>
    <SheetProvider><ProfileSheetProvider><App /></ProfileSheetProvider></SheetProvider>
  </SiteInfoContext.Provider></UserContext.Provider>
</ThemeProvider></BrowserRouter>, document.getElementById("root"), () => { state.ready = true; });
