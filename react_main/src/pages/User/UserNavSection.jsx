import React from "react";
import { useNavigate } from "react-router-dom";
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
} from "@mui/material";
import NavDropdown from "../../components/NavDropdown";

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

  const userMenuItems = [
    { text: "Profile", path: "/user" },
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
      {/* Hearts - Show only red hearts on mobile */}
      {isMobile ? (
        <Tooltip title={getHeartRefreshMessage(user, "red")}>
          <Stack direction="row" spacing={0.3} alignItems="center">
            <Typography
              sx={{
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              {user.redHearts ?? 0}
            </Typography>
            <i
              className="fas fa-heart"
              style={{ color: "#e23b3b", fontSize: "12px" }}
            ></i>
          </Stack>
        </Tooltip>
      ) : (
        <div
          style={{
            display: "flex",
            width: "40px",
            flexDirection: "column",
            alignItems: "stretch",
          }}
        >
          <Stack direction="row">
            <Typography
              sx={{
                width: "24px",
                pr: 0.5,
                textAlign: "right",
                fontSize: "16px",
              }}
            >
              {user.redHearts ?? 0}
            </Typography>
            <Tooltip title={getHeartRefreshMessage(user, "red")}>
              <i
                className="fas fa-heart"
                style={{ color: "#e23b3b", marginLeft: "auto" }}
              ></i>
            </Tooltip>
          </Stack>
          <Stack direction="row">
            <Typography
              sx={{
                width: "24px",
                pr: 0.5,
                textAlign: "right",
                fontSize: "16px",
              }}
            >
              {user.goldHearts ?? 0}
            </Typography>
            <Tooltip title="Not implemented yet.">
              <i
                className="fas fa-heart"
                style={{ color: "#edb334", marginLeft: "auto" }}
              ></i>
            </Tooltip>
          </Stack>
        </div>
      )}
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
