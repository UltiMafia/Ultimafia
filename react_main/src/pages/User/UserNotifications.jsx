import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "./User";
import { useNow } from "../../hooks/useNow";
import { Tooltip } from "@mui/material";

import "../../css/main.css";

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
    <>
      <div
        style={{
          marginTop: "8px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div>
          <Tooltip title={getHeartRefreshMessage(user, "red")}>
            <i
              className="fas fa-heart"
              style={{ color: "#e23b3b", marginRight: "4px" }}
            ></i>
          </Tooltip>
          {user.redHearts ?? 0}
        </div>
        <div>
          <Tooltip title="Not implemented yet.">
            <i
              className="fas fa-heart"
              style={{ color: "#edb334", marginRight: "4px" }}
            ></i>
          </Tooltip>
          {user.goldHearts ?? 0}
        </div>
      </div>
      <i
        className="fas fa-bullhorn"
        onClick={() => openAnnouncements()}
        style={{ fontSize: "14px" }}
      />
      <SiteNotifs />
      <div style={{ marginLeft: "6px" }}>
        <Link to="/user" className="profile-link">
          <Avatar id={user.id} name={user.name} hasImage={user.avatar} />
        </Link>
      </div>
    </>
  );
}
