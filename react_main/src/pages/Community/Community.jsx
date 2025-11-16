import React, { useContext } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { Box, Card, Link, AppBar, Toolbar } from "@mui/material";

import Forums from "./Forums/Forums";
import UserSearch from "./UserSearch";
import Moderation from "./Moderation";
import { UserContext } from "../../Contexts";

export default function Community() {
  const theme = useTheme();
  const user = useContext(UserContext);
  // Allow logged-out users to access Community page

  return (
    <>
      <Box maxWidth="1080px" sx={{ flexGrow: 1 }}>
        <Card sx={{ p: 1, textAlign: "justify" }}>
          <Routes>
            <Route path="forums/*" element={<Forums />} />
            <Route path="users" element={<UserSearch />} />
            <Route path="moderation" element={<Moderation />} />
            <Route path="*" element={<Navigate to="forums" />} />
          </Routes>
        </Card>
      </Box>
    </>
  );
}
