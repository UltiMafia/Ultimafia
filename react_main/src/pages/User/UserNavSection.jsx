import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { NameWithAvatar, Avatar } from "./User";
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
import { SiteInfoContext } from "../../Contexts";

import "css/main.css";
import exitIcon from "../../images/emotes/exit.png";

export default function UserNavSection({
  openAnnouncements,
  user,
  useUnreadNotifications,
}) {
  const now = useNow(200);
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
        window.location.reload();
      })
      .catch((error) => {
        console.error("Logout failed:", error);
      });
  };

  // Use vanity URL for profile link if available
  const profilePath = user.vanityUrl ? `/user/${user.vanityUrl}` : "/user";

  // Create family avatar icon if family exists and has avatar
  const familyIcon = userFamily?.avatar ? (
    <div
      style={{
        width: "20px",
        height: "20px",
        borderRadius: "50%",
        backgroundImage: `url(/uploads/${userFamily.id}_family_avatar.webp?t=${cacheVal})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        flexShrink: 0,
      }}
    />
  ) : null;

  const userMenuItems = [
    { text: "Profile", path: profilePath },
    ...(userFamily
      ? [
          {
            text: userFamily.name,
            path: `/user/family/${userFamily.id}`,
            icon: familyIcon,
          },
        ]
      : []),
    { text: "Inbox", path: "/user/inbox" },
    { text: "Settings", path: "/user/settings" },
    { text: "Shop", path: "/user/shop" },
    { divider: true },
    {
      text: "Log Out",
      onClick: handleLogout,
      icon: (
        <img
          src={exitIcon}
          alt="exit"
          style={{ width: "16px", height: "16px" }}
        />
      ),
    },
  ];

  const UserMenuTrigger = ({ user }) => {
    return isMobile ? (
      <Avatar id={user.id} name={user.name} hasImage={user.avatar} />
    ) : (
      <NameWithAvatar
        id={user.id}
        name={user.name}
        avatar={user.avatar}
        noLink={true}
      />
    );
  };

  function timeToGo(timestamp) {
    // Utility to add leading zero
    function z(n) {
      return (n < 10 ? "0" : "") + n;
    }

    var diff = timestamp - now;
    if (diff < 0) diff = 0;

    // Get time components
    var hours = (diff / 3.6e6) | 0;
    var mins = ((diff % 3.6e6) / 6e4) | 0;
    var secs = Math.round((diff % 6e4) / 1e3);

    // Return formatted string
    return z(hours) + ":" + z(mins) + ":" + z(secs);
  }

  function getHeartRefreshMessage(user, type) {
    var timestamp = null;

    if (type === "red") timestamp = user.redHeartRefreshTimestamp;
    else if (type === "gold") timestamp = user.goldHeartRefreshTimestamp;

    if (timestamp && timestamp > 0) {
      const timeToGoString = timeToGo(timestamp);
      //console.log(type, timestamp, timeToGoString, user)
      return `Your ${type} hearts will replenish in: ${timeToGoString}`;
    } else {
      return `Your ${type} hearts are at full capacity. Go play some games!`;
    }
  }

  return (
    <Stack
      direction="row"
      spacing={isMobile ? 0.3 : 0.5}
      sx={{
        px: isMobile ? 0.25 : 0.5,
        alignItems: "center",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1em",
          columnGap: 0.5,
          width: "3em",
          alignItems: "center",
          textAlign: "right",
        }}
      >
        <Typography>{user.redHearts ?? 0}</Typography>
        <Tooltip title={getHeartRefreshMessage(user, "red")}>
          <i
            className="fas fa-heart"
            style={{ color: "#e23b3b", marginLeft: "auto" }}
          />
        </Tooltip>
        <Typography>{user.goldHearts ?? 0}</Typography>
        <Link to="/fame/competitive">
          <i
            className="fas fa-heart"
            style={{ color: "var(--gold-heart-color)", marginLeft: "auto" }}
          />
        </Link>
      </Box>
      <Divider orientation="vertical" flexItem />
      <IconButton
        size="small"
        onClick={() => openAnnouncements()}
        sx={{ p: 0.5 }}
      >
        <i
          className="fas fa-bullhorn"
          style={{ fontSize: isMobile ? "12px" : "14px" }}
        />
      </IconButton>
      <IconButton
        size="small"
        onClick={() => navigate("/user/inbox")}
        sx={{ p: 0.5 }}
      >
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <i
            className="fas fa-bell"
            style={{ fontSize: isMobile ? "12px" : "14px" }}
          />
        </Badge>
      </IconButton>
      <NavDropdown
        items={userMenuItems}
        customTrigger={UserMenuTrigger}
        customTriggerProps={{ user }}
      />
    </Stack>
  );
}
