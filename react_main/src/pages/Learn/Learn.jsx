import React, { useState, useEffect } from "react";
import { Route, Switch, Redirect, useLocation } from "react-router-dom";

import Setups from "./Setup/SetupPage";
import SetupsNightOrder from "./Setup/SetupNightOrder";
import RolePage from "./role/RolePage";
import Games from "./Games";
import Terminology from "./Terminology";
import Achievements from "./Achievements";

import "css/play.css";

import { Box, Card, Link, AppBar, Toolbar } from "@mui/material";
import { useTheme } from "@mui/styles";

export default function Learn(props) {
  const theme = useTheme();

  const links = [
    {
      text: "Games",
      path: "/learn/games",
      exact: true,
    },
    {
      text: "Terminology",
      path: "/learn/terminology",
      exact: true,
    },
    {
      text: "Achievements",
      path: "/learn/achievements",
      exact: true,
    },
  ];

  const location = useLocation();
  let setupView = location.pathname.startsWith("/learn/setup");

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          {links.map((link, index) => (
            <Link
              key={index}
              href={link.path}
              underline="none"
              color="inherit"
              variant="button"
              sx={{ margin: theme.spacing(1) }}
            >
              {link.text}
            </Link>
          ))}
          <Box sx={{ flexGrow: 1 }} />
        </Toolbar>
      </AppBar>
      <Box maxWidth="1080px" sx={{ mt: 1, flexGrow: 1 }}>
        <Card
          variant="outlined"
          sx={{ padding: theme.spacing(3), textAlign: "justify" }}
        >
          <Switch>
            <Route
              exact
              path="/learn/setup/:setupId"
              render={() => <Setups />}
            />
            <Route
              exact
              path="/learn/setup/:setupId/nightorder"
              render={() => <SetupsNightOrder />}
            />
            <Route
              exact
              path="/learn/role/:RoleName"
              render={() => <RolePage />}
            />
            <Route
              exact
              path="/learn/terminology"
              render={() => <Terminology />}
            />
            <Route
              exact
              path="/learn/achievements"
              render={() => <Achievements />}
            />
            <Route exact path="/learn/games" render={() => <Games />} />
            <Route render={() => <Redirect to="/learn/games" />} />
          </Switch>
        </Card>
      </Box>
    </>
  );
}
