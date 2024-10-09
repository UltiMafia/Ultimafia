import React from "react";
import { Link } from "react-router-dom";
import { Avatar } from "./User";

import "../../css/main.css";

export default function UserNotifications({
  openAnnouncements,
  user,
  SiteNotifs,
}) {
  return (
    <>
      <div style={{ marginTop: "8px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div>
          <i
            className="fas fa-heart"
            style={{ color: "#e23b3b", marginRight: "4px" }}
          ></i>
          {user.redHearts ?? 0}
        </div>        
        <div>
          <i
            className="fas fa-heart"
            style={{ color: "#edb334", marginRight: "4px" }}
          ></i>
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