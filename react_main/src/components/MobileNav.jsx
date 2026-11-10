import React, { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
} from "@mui/material";

import { UserContext } from "../Contexts";
import UiIcon from "./ui/UiIcon";

// Primary sections for the phone bottom bar. Play and Host are the everyday
// actions; Community and Profile round it out. Fame and Learn are occasional
// and stay in the header menu, so they are not worth a permanent tab.
function buildTabs(user) {
  const tabs = [
    { label: "Games", path: "/play", match: "/play", icon: "games" },
    { label: "Community", path: "/community/forums", match: "/community", icon: "chat" },
  ];

  if (user.loggedIn) {
    tabs.splice(1, 0, {
      label: "Host",
      path: "/play/host",
      match: "/play/host",
      icon: "add",
    });
  }

  tabs.push(
    user.loggedIn
      ? { label: "Profile", path: "/user", match: "/user", icon: "person" }
      : { label: "Login", path: "/welcome", match: "/welcome", icon: "forward" }
  );

  return tabs;
}

export function MobileNav() {
  const user = useContext(UserContext);
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = buildTabs(user);

  // Prefer the most specific match, so /play/host highlights Host, not Play.
  let activeIndex = -1;
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
      component="nav"
      aria-label="Primary navigation"
      className="mobile-nav"
      elevation={8}
      square
      sx={{
        flexShrink: 0,
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
        {tabs.map((tab, index) => (
          <BottomNavigationAction
            key={tab.path}
            label={tab.label}
            aria-current={activeIndex === index ? "page" : undefined}
            icon={<UiIcon name={tab.icon} />}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
