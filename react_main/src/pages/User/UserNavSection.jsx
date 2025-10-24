import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { NameWithAvatar, Avatar } from "./User";
import { useNow } from "../../hooks/useNow";
import { useIsPhoneDevice } from "../../hooks/useIsPhoneDevice";
import { Box, Divider, Stack, Tooltip, Typography, Menu, MenuItem } from "@mui/material";

import "css/main.css";
import exitIcon from "../../images/emotes/exit.png";

function UserMenu({ user, onLogout }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const isMobile = useIsPhoneDevice();
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (path) => {
    handleClose();
    if (path) {
      navigate(path);
    }
  };

  const handleLogout = () => {
    handleClose();
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

  return (
    <>
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          cursor: "pointer",
        }}
        onClick={handleClick}
      >
        {isMobile ? (
          <Avatar
            id={user.id}
            name={user.name}
            hasImage={user.avatar}
          />
        ) : (
          <NameWithAvatar
            id={user.id}
            name={user.name}
            avatar={user.avatar}
            noLink={true}
          />
        )}
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: isMobile ? "left" : "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: isMobile ? "left" : "right",
        }}
        slotProps={{
          paper: {
            sx: {
              minWidth: isMobile ? "200px" : "160px",
              maxWidth: "90vw",
            },
          },
        }}
      >
        <MenuItem onClick={() => handleMenuItemClick("/user")}>
          Profile
        </MenuItem>
        <MenuItem onClick={() => handleMenuItemClick("/user/settings")}>
          Settings
        </MenuItem>
        <MenuItem onClick={() => handleMenuItemClick("/user/shop")}>
          Shop
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <img
            src={exitIcon}
            alt="exit"
            style={{ width: "16px", height: "16px", marginRight: "8px" }}
          />
          Log Out
        </MenuItem>
      </Menu>
    </>
  );
}

export default function UserNavSection({
  openAnnouncements,
  user,
  SiteNotifs,
}) {
  const now = useNow(200);

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
      spacing={0.5}
      sx={{
        px: 0.5,
        alignItems: "center",
      }}
    >
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
      <Divider orientation="vertical" flexItem />
      <i
        className="fas fa-bullhorn"
        onClick={() => openAnnouncements()}
        style={{ fontSize: "14px" }}
      />
      <SiteNotifs />
      <UserMenu user={user} />
    </Stack>
  );
}

