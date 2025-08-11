import React, { useContext } from "react";
import { Route, Switch, Redirect } from "react-router-dom";
import { useTheme } from "@mui/styles";
import { Box, Card, Link, AppBar, Toolbar } from "@mui/material";

import Forums from "./Forums/Forums";
import UserSearch from "./UserSearch";
import Moderation from "./Moderation";
import { UserContext } from "../../Contexts";

export default function Community() {
  const theme = useTheme();

  const links = [
    {
      text: "Forums",
      path: `/community/forums`,
    },
    {
      text: "Users",
      path: `/community/users`,
    },
    {
      text: "Moderation",
      path: `/community/moderation`,
    },
  ];
  const user = useContext(UserContext);
  if (user.loaded && !user.loggedIn) return <Redirect to="/" />;

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
        </Toolbar>
      </AppBar>
      <Box maxWidth="1080px" sx={{ padding: theme.spacing(3) }}>
        <Card
          variant="outlined"
          sx={{ p: 1, textAlign: "justify" }}
        >
          <Switch>
            <Route path="/community/forums" render={() => <Forums />} />
            <Route path="/community/users" render={() => <UserSearch />} />
            <Route path="/community/moderation" render={() => <Moderation />} />
            <Route render={() => <Redirect to="/community/forums" />} />
          </Switch>
        </Card>
      </Box>
    </>
  );
}
