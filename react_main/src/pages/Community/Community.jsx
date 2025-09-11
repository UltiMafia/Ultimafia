import React, { useContext } from "react";
import { Route, Switch, Redirect } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { Box, Card, Link, AppBar, Toolbar } from "@mui/material";

import Forums from "./Forums/Forums";
import UserSearch from "./UserSearch";
import Moderation from "./Moderation";
import { UserContext } from "../../Contexts";
import CustomAppBar from "components/CustomAppBar";

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
      <CustomAppBar links={links} />
      <Box maxWidth="1080px" sx={{ mt: 1, flexGrow: 1 }}>
        <Card sx={{ p: 1, textAlign: "justify" }}>
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
