import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "./User";
import { useNow } from "../../hooks/useNow";
import { Box, Divider, Stack, Tooltip, Typography } from "@mui/material";

import "css/main.css";

export default function UserNotifications({
  openAnnouncements,
  user,
  SiteNotifs,
}) {
  const now = useNow(200);

  function timeToGo(timestamp) {
    // Utility to add leading zero
    function z(n) {
      return (n < 10? '0' : '') + n;
    }

    var diff = timestamp - now;

    // Allow for previous times
    var sign = diff < 0? '-' : '';
    diff = Math.abs(diff);

    // Get time components
    var hours = diff/3.6e6 | 0;
    var mins  = diff%3.6e6 / 6e4 | 0;
    var secs  = Math.round(diff%6e4 / 1e3);

    // Return formatted string
    return sign + z(hours) + ':' + z(mins) + ':' + z(secs);   
  }

  function getHeartRefreshMessage(user, type) {
    var timestamp = null;

    if (type === "red") timestamp = user.redHeartRefreshTimestamp;
    else if (type === "gold") timestamp = user.goldHeartRefreshTimestamp;

    if (timestamp && timestamp > 0) {
      const timeToGoString = timeToGo(timestamp);
      //console.log(type, timestamp, timeToGoString, user)
      return `Your ${type} hearts will replenish in: ${timeToGoString}`;
    }
    else {
      return `Your ${type} hearts are at full capacity. Go play some games!`;
    }
  }

  return (
    <Stack direction="row" sx={{
      pl: .5,
      alignItems: "center",
    }}>
      <div
        style={{
          display: "flex",
          width: "40px",
          flexDirection: "column",
          alignItems: "stretch",
        }}
      >
        <Stack direction="row">
          <Typography sx={{ width: "24px", pr: .5, textAlign: "right" }}>
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
          <Typography sx={{ width: "24px", pr: .5, textAlign: "right" }}>
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
      <Divider orientation="vertical" flexItem sx={{ mx: .5 }} />
      <i
        className="fas fa-bullhorn"
        onClick={() => openAnnouncements()}
        style={{ fontSize: "14px" }}
      />
      <SiteNotifs />
      <Box sx={{
        display: "inline-flex",
        alignItems: "center",
        mx: 1,
      }}>
        <Link to="/user" className="profile-link">
          <Avatar id={user.id} name={user.name} hasImage={user.avatar} />
        </Link>
      </Box>
    </Stack>
  );
}
