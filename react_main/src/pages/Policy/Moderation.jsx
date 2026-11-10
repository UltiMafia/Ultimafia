import React, { useState, useEffect, useContext } from "react";
import { NavLink, Outlet, useLocation, useOutletContext } from "react-router-dom";
import { useViewNavigate as useNavigate } from "hooks/useViewActivity";
import axios from "axios";
import { UserContext } from "Contexts";
import { UiIcon, UiPageHeader } from "components/ui";

import { ModerationRecent } from "./Moderation/ModerationPages";

import "css/main.css";
import "css/moderation.css";

export { ModCommands, COMMAND_COLOR } from "./Moderation/ModCommands";

export function ModerationLog() {
  return <ModerationRecent />;
}

function getPath(pathname) {
  if (pathname.includes("/reports")) return "/policy/moderation/reports";
  if (pathname.includes("/competitive")) return "/policy/moderation/competitive";
  if (pathname.includes("/handbook")) return "/policy/moderation/handbook";
  if (pathname.includes("/flagged-intake")) return "/policy/moderation/flagged-intake";
  if (pathname.includes("/github-links")) return "/policy/moderation/github-links";
  if (pathname.includes("/volunteer")) return "/policy/moderation/volunteer";
  if (pathname.includes("/ban-appeals")) return "/policy/moderation/ban-appeals";
  if (pathname.includes("/groups")) return "/policy/moderation/groups";
  if (pathname.includes("/tools")) return "/policy/moderation/tools";
  return "/policy/moderation";
}

const destinations = [
  ["/policy/moderation", "Recent actions", "settings", null],
  ["/policy/moderation/tools", "Run action", "moderation", "viewModActions"],
  ["/policy/moderation/groups", "Staff groups", "people", null],
  ["/policy/moderation/handbook", "Staff handbook", "book", null],
  ["/policy/moderation/volunteer", "Volunteer", "people", null],
  ["/policy/moderation/reports", "Reports", "flag", "viewModActions"],
  ["/policy/moderation/competitive", "Competitive", "trophy", "manageCompetitive"],
  ["/policy/moderation/flagged-intake", "Flagged intake", "warning", "whitelist"],
  ["/policy/moderation/github-links", "GitHub links", "link", "approveGithubLinks"],
  ["/policy/moderation/ban-appeals", "Ban appeals", "skull", "banAppeals"],
];

export default function Moderation() {
  const [results, setResults] = useState("");
  const user = useContext(UserContext);
  const location = useLocation();
  const navigate = useNavigate();
  const current = getPath(location.pathname);

  const [banAppealsAccess, setBanAppealsAccess] = useState(null);
  useEffect(() => {
    if (!user.loaded) return;
    if (!user?.perms?.unban) { setBanAppealsAccess(false); return; }
    let cancelled = false;
    axios.get("/api/mod/banAppeals/access")
      .then(res => !cancelled && setBanAppealsAccess(!!res.data.allowed))
      .catch(() => !cancelled && setBanAppealsAccess(false));
    return () => { cancelled = true; };
  }, [user.loaded, user?.perms?.unban]);

  useEffect(() => {
    if (banAppealsAccess === false && location.pathname.includes("/ban-appeals")) navigate("/policy/moderation", { replace: true });
  }, [banAppealsAccess, location.pathname, navigate]);

  useEffect(() => { document.title = "Moderation | UltiMafia"; }, []);
  useEffect(() => {
    if (!user.loaded) return;
    if ((location.pathname.includes("/reports") || location.pathname.includes("/tools")) && !user?.perms?.viewModActions) navigate("/policy/moderation", { replace: true });
    else if (location.pathname.includes("/competitive") && !user?.perms?.manageCompetitive) navigate("/policy/moderation", { replace: true });
    else if (location.pathname.includes("/flagged-intake") && !user?.perms?.whitelist) navigate("/policy/moderation", { replace: true });
    else if (location.pathname.includes("/github-links") && !user?.perms?.approveGithubLinks) navigate("/policy/moderation", { replace: true });
  }, [location.pathname, user.loaded, user?.perms?.viewModActions, user?.perms?.manageCompetitive, user?.perms?.whitelist, user?.perms?.approveGithubLinks, navigate]);

  const links = destinations.filter(([, , , permission]) => {
    if (permission === "banAppeals") return Boolean(banAppealsAccess);
    return !permission || Boolean(user?.perms?.[permission]);
  });

  return <div className="moderation-shell">
    <UiPageHeader variant="moderation" title="Moderation" description="Staff tools for reports, appeals, account safety and competitive operations." />
    <div className="moderation-layout">
      <nav className="moderation-navigation" aria-label="Moderation sections">
        {links.map(([to, label, icon]) => <NavLink key={to} to={to} end={to === "/policy/moderation"} className={({ isActive }) => isActive ? "moderation-nav-link is-active" : "moderation-nav-link"} aria-current={current === to ? "page" : undefined}>
          <UiIcon name={icon} size={20} /><span>{label}</span>
        </NavLink>)}
      </nav>
      <main className="moderation-content" id="moderation-content">
        <Outlet context={{ results, setResults, user }} />
      </main>
    </div>
  </div>;
}
