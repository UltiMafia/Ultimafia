import React from "react";
import { Route, Switch, Redirect } from "react-router-dom";
import { useTheme } from "@mui/styles";
import { Box, Card, Link, AppBar, Toolbar } from "@mui/material";

import Roadmap from "./Roadmap";

export default function Development(props) {
  const theme = useTheme();

  const links = [
    {
      text: "Roadmap",
      path: "/development/roadmap",
      exact: true,
    },
  ];

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
          sx={{ padding: theme.spacing(3), textAlign: "justify" }}
        >
          <Switch>
            <Route exact path="/development/roadmap" component={Roadmap} />
            <Route render={() => <Redirect to="/development/roadmap" />} />
          </Switch>
        </Card>
      </Box>
    </>
  );
}
