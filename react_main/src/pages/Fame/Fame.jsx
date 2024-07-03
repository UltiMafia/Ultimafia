import React from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';
import { useTheme } from '@mui/styles';
import { Box, Link, AppBar, Toolbar } from '@mui/material';

import Donors from './Donors';
import Contributors from './Contributors';
//import Leaderboard from './Leaderboard';
//import { SubNav } from '../../components/Nav';

export default function Fame(props) {
  const theme = useTheme();

  const links = [
    {
      text: 'Donors',
      path: '/fame/donors',
      exact: true,
    },
    {
      text: 'Contributors',
      path: '/fame/contributors',
      exact: true,
    },
    {/*
      text: 'Leaderboard',
      path: '/fame/Leaderboard',
      exact: true,
    */},
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
      <Box sx={{ padding: theme.spacing(3), margin: '0 auto' }}>
        <Switch>
          <Route exact path="/fame/donors" component={Donors} />
          <Route exact path="/fame/contributors" component={Contributors} />
          <Route render={() => <Redirect to="/fame/contributors" />} />
        </Switch>
      </Box>
    </>
  );
}