import React, { useContext } from "react";

import { Route, Routes, Navigate } from "react-router-dom";

import Profile from "./Profile";
import Settings from "./Settings";
import Shop from "./Shop";
import Inbox from "./Inbox";
import Family from "./Family";
import { UserContext } from "Contexts";

// Shared user widgets (Avatar, NameWithAvatar, MediaEmbed, ...) live in
// ./UserWidgets so that importing them does not drag this route's page tree
// (Profile/Settings/Shop/Inbox/Family and their deps) into the initial bundle.

export default function User(props) {
  const user = useContext(UserContext);

  if (user.loaded && !user.loggedIn) return <Navigate to="/" />;

  return (
    <Routes>
      <Route path="/" element={<Profile />} />
      <Route path="settings/*" element={<Settings />} />
      <Route path="shop" element={<Shop />} />
      <Route path="inbox" element={<Inbox />} />
      <Route path="family/:familyId" element={<Family />} />
      <Route path=":userId" element={<Profile />} />
    </Routes>
  );
}
