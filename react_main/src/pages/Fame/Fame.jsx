import React from "react";
import { Route, Switch, Redirect } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { Box, Card, Link, AppBar, Toolbar } from "@mui/material";

import Donors from "./Donors";
import Contributors from "./Contributors";
import Leaderboard from "./Leaderboard";
import CustomAppBar from "components/CustomAppBar";

export default function Fame(props) {
  const theme = useTheme();

  const links = [
    {
      text: "Leaderboard",
      path: "/fame/leaderboard",
      exact: true,
    },
    {
      text: "Contributors",
      path: "/fame/contributors",
      exact: true,
    },
    {
      text: "Donors",
      path: "/fame/donors",
      exact: true,
    },
  ];

  return (
    <>
      <CustomAppBar links={links} />
      <Box maxWidth="1080px" sx={{ mt: 1, flexGrow: 1 }}>
        <Card sx={{ padding: theme.spacing(3), textAlign: "justify" }}>
          <Switch>
            <Route exact path="/fame/leaderboard" component={Leaderboard} />
            <Route exact path="/fame/contributors" component={Contributors} />
            <Route exact path="/fame/donors" component={Donors} />
            <Route render={() => <Redirect to="/fame/leaderboard" />} />
          </Switch>
        </Card>
      </Box>
    </>
  );
}
