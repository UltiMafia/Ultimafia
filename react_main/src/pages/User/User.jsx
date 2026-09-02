import React, { useContext, Suspense } from "react";

import { Route, Routes, Navigate } from "react-router-dom";

import { lazyWithRetry } from "lib/lazyWithRetry";
import { Loading } from "components/Loading";
import { UserContext } from "Contexts";

// Shared user widgets (Avatar, NameWithAvatar, MediaEmbed, ...) live in
// ./UserWidgets so that importing them does not drag this route's page tree
// (Profile/Settings/Shop/Inbox/Family and their deps) into the initial bundle.

// These five are siblings behind a router, so importing them statically meant
// viewing a profile also downloaded and evaluated Settings (and firebase/auth
// with it), Shop, Inbox and Family. Declared at module scope, not in render, so
// the component identities stay stable across re-renders.
const Profile = lazyWithRetry(() => import("./Profile"));
const Settings = lazyWithRetry(() => import("./Settings"));
const Shop = lazyWithRetry(() => import("./Shop"));
const Inbox = lazyWithRetry(() => import("./Inbox"));
const Family = lazyWithRetry(() => import("./Family"));

export default function User(props) {
  const user = useContext(UserContext);

  if (user.loaded && !user.loggedIn) return <Navigate to="/" />;

  // Local boundary: without it the nearest fallback is the one in Main, which
  // would blank the whole page (header and all) on every sub-route switch.
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Profile />} />
        <Route path="settings/*" element={<Settings />} />
        <Route path="shop" element={<Shop />} />
        <Route path="inbox" element={<Inbox />} />
        <Route path="family/:familyId" element={<Family />} />
        <Route path=":userId" element={<Profile />} />
      </Routes>
    </Suspense>
  );
}
