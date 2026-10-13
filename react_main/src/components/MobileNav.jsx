import React, { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
} from "@mui/material";

import { UserContext } from "../Contexts";

// Primary sections for the phone bottom bar. Play and Host are the everyday
// actions; Community and Profile round it out. Fame and Learn are occasional
// and stay in the header menu, so they are not worth a permanent tab.
function buildTabs(user) {
  const tabs = [
    { label: "Play", path: "/play", match: "/play", icon: "fa-dice" },
    { label: "Community", path: "/community/forums", match: "/community", icon: "fa-comments" },
  ];

  if (user.loggedIn) {
    tabs.splice(1, 0, {
      label: "Host",
      path: "/play/host",
      match: "/play/host",
      icon: "fa-plus-circle",
    });
  }

  tabs.push(
    user.loggedIn
      ? { label: "Profile", path: "/user", match: "/user", icon: "fa-user" }
      : { label: "Login", path: "/welcome", match: "/welcome", icon: "fa-sign-in-alt" }
  );

  return tabs;
}

export function MobileNav() {
  const user = useContext(UserContext);
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = buildTabs(user);

  // Prefer the most specific match, so /play/host highlights Host, not Play.
  let activeIndex = 0;
  let bestMatchLength = -1;
  tabs.forEach((tab, index) => {
    const path = location.pathname;
    const matches = path === tab.match || path.startsWith(tab.match + "/");
    if (matches && tab.match.length > bestMatchLength) {
      bestMatchLength = tab.match.length;
      activeIndex = index;
    }
  });

  return (
    <Paper
      className="mobile-nav"
      elevation={8}
      sx={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1200,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        backgroundColor: "background.paper",
      }}
    >
      <BottomNavigation
        showLabels
        value={activeIndex}
        onChange={(event, value) => navigate(tabs[value].path)}
        sx={{
          height: 56,
          "& .MuiBottomNavigationAction-label": { fontSize: "0.7rem" },
        }}
      >
        {tabs.map((tab) => (
          <BottomNavigationAction
            key={tab.path}
            label={tab.label}
            icon={<i className={`fas ${tab.icon}`} />}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
