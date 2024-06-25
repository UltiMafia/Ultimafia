import React, { useContext } from "react";
import { Route, Switch, Redirect } from "react-router-dom";
import { Box, Link, AppBar, Toolbar } from '@mui/material';
import { useTheme } from "@mui/styles";

import Forums from "./Forums/Forums";
import UserSearch from "./UserSearch";
import Moderation from "./Moderation";
import Contributors from "./Contributors";
import { SubNav } from "../../components/Nav";
import { UserContext } from "../../Contexts";

export default function Community() {
  const theme = useTheme();
  const user = useContext(UserContext);

  const links = [
    { text: "Forums", path: "/community/forums" },
    { text: "Users", path: "/community/users" },
    { text: "Moderation", path: "/community/moderation" },
    { text: "Contributors", path: "/community/contributors" },
    // { text: "Feedback", path: "/community/feedback" },
  ];

  if (user.loaded && !user.loggedIn) {
    return <Redirect to="/" />;
  }

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
      <Box sx={{ padding: theme.spacing(3), maxWidth: '800px', margin: '0 auto' }}>
        <Switch>
          <Route path="/community/forums" component={Forums} />
          <Route path="/community/users" component={UserSearch} />
          <Route path="/community/moderation" component={Moderation} />
          <Route path="/community/contributors" component={Contributors} />
          {/* <Route path="/community/feedback" component={Feedback} /> */}
          <Route render={() => <Redirect to="/community/forums" />} />
        </Switch>
      </Box>
    </>
  );
}