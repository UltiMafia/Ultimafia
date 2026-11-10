import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { NameWithAvatar, Avatar } from "./UserWidgets";
import { FamilyAvatarImage } from "utils/avatarUrl";
import { useNow } from "../../hooks/useNow";
import { useIsPhoneDevice } from "../../hooks/useIsPhoneDevice";
import {
  Divider,
  Stack,
  Tooltip,
  Typography,
  IconButton,
  Badge,
  Box,
} from "@mui/material";
import NavDropdown from "../../components/NavDropdown";
import CountBadge from "../../components/CountBadge";
import { SiteInfoContext } from "../../Contexts";
import DmButton from "../../components/dms/DmButton";

import "css/main.css";
import UiIcon from "../../components/ui/UiIcon";
import CoinIcon from "../../components/CoinIcon";

export default function UserNavSection({
  openAnnouncements,
  user,
  useUnreadNotifications,
}) {
  const navigate = useNavigate();
  const isMobile = useIsPhoneDevice();
  const unreadCount = useUnreadNotifications();
  const [userFamily, setUserFamily] = useState(null);
  const { cacheVal } = useContext(SiteInfoContext);

  useEffect(() => {
    if (user.loggedIn) {
      axios
        .get("/api/family/user/family")
        .then((res) => {
          setUserFamily(res.data.family);
        })
        .catch(() => {
          // Ignore errors, user might not have a family
        });
    }
  }, [user.loggedIn]);

  const handleLogout = () => {
    axios
      .post("/api/user/logout")
      .then(() => {
        user.clear();
        navigate("/");
      })
      .catch((error) => {
        console.error("Logout failed:", error);
      });
  };

  // Use vanity URL for profile link if available
  const profilePath = user.vanityUrl ? `/user/${user.vanityUrl}` : "/user";

  // Create family avatar icon if family exists and has avatar
  const familyIcon = userFamily?.avatar ? (
    <FamilyAvatarImage
      id={userFamily.id}
      size={20}
      cacheVal={cacheVal}
    />
  ) : null;

  const userMenuItems = [
    ...(isMobile ? [{ text: `${user.redHearts ?? 0} red hearts · ${user.goldHearts ?? 0} gold hearts`, info: true }, { divider: true }] : []),
    {
      text: "Profile",
      path: profilePath,
      icon: (<UiIcon name="person" />),
    },
    ...(userFamily
      ? [
          {
            text: userFamily.name,
            path: `/user/family/${userFamily.id}`,
            icon: familyIcon,
          },
        ]
      : []),
    {
      text: "Notifications",
      path: "/user/notifications",
      icon: (
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <UiIcon name="notification" />
        </Badge>
      ),
    },
    {
      text: "Settings",
      path: "/user/settings",
      icon: (<UiIcon name="settings" />),
    },
    {
      text: "Shop",
      path: "/user/shop",
      icon: (<CoinIcon size={16} />),
    },
    ...(user.perms?.devApi
      ? [
          {
            text: "Developer API",
            path: "/user/developer",
            icon: (<UiIcon name="code" />),
          },
        ]
      : []),
    {
      text: "Announcements",
      onClick: openAnnouncements,
      icon: (<UiIcon name="info" />),
    },
    { divider: true },
    {
      text: "Log Out",
      onClick: handleLogout,
      icon: (
        <UiIcon name="leave" />
      ),
    },
  ];

  return (
    <Stack className="user-nav" direction="row" spacing={0.5} divider={<Divider orientation="vertical" flexItem />} sx={{
      px: 1,
      alignItems: "center",
      justifyContent: "end",
    }}>
      <DmButton />
      <Stack className="user-nav-balances">
        <Box sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1em",
          columnGap: 0.5,
          width: "3em",
          alignItems: "center",
          textAlign: "right",
        }}>
          <Typography variant="body2">
            {user.redHearts ?? 0}
          </Typography>
          <HeartRefreshTooltip user={user} type="red">
            <UiIcon name="heartFilled" size={16} label="Red hearts" style={{ color: "#e23b3b", marginLeft: "auto" }} />
          </HeartRefreshTooltip>
          <Typography variant="body2">
            {user.goldHearts ?? 0}
          </Typography>
          <Link to="/fame/competitive" aria-label="Gold hearts — Competitive">
            <UiIcon name="heartFilled" size={16} style={{ color: "var(--gold-heart-color)", marginLeft: "auto" }} />
          </Link>
        </Box>
      </Stack>
      <NavDropdown
        items={userMenuItems}
        triggerAriaLabel="User menu"
        customTrigger={
          <CountBadge count={unreadCount} label="unread notifications">
            <Avatar id={user.id} name={user.name} hasImage={user.avatar} size={isMobile ? 32 : 40} />
          </CountBadge>
        }
      />
    </Stack>
  );
}

function timeToGo(timestamp, now) {
  function z(n) {
    return (n < 10 ? "0" : "") + n;
  }

  var diff = timestamp - now;
  if (diff < 0) diff = 0;

  var hours = (diff / 3.6e6) | 0;
  var mins = ((diff % 3.6e6) / 6e4) | 0;
  var secs = Math.round((diff % 6e4) / 1e3);

  return z(hours) + ":" + z(mins) + ":" + z(secs);
}

function getHeartRefreshMessage(user, type, now) {
  var timestamp = null;

  if (type === "red") timestamp = user.redHeartRefreshTimestamp;
  else if (type === "gold") timestamp = user.goldHeartRefreshTimestamp;

  if (timestamp && timestamp > 0) {
    return `Your ${type} hearts will replenish in: ${timeToGo(timestamp, now)}`;
  }
  return `Your ${type} hearts are at full capacity. Go play some games!`;
}

function HeartRefreshTooltip({ user, type, children }) {
  const now = useNow(1000);
  return (
    <Tooltip title={getHeartRefreshMessage(user, type, now)}>
      {children}
    </Tooltip>
  );
}
