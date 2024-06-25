import React from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';
import { useTheme } from '@mui/styles';
import { Box, Link, AppBar, Toolbar } from '@mui/material';

import PrivacyPolicy from './PrivacyPolicy';
import TermsOfService from './TermsOfService';
import Rules from './Rules';
//import { SubNav } from '../../components/Nav';

export default function Policy(props) {
  const theme = useTheme();

  const links = [
    {
      text: 'Rules',
      path: '/policy/rules',
      exact: true,
    },
    {
      text: 'Terms of Service',
      path: '/policy/tos',
      exact: true,
    },
    {
      text: 'Privacy Policy',
      path: '/policy/privacy',
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
      <Box sx={{ padding: theme.spacing(3), maxWidth: '800px', margin: '0 auto' }}>
        <Switch>
          <Route exact path="/policy/rules" component={Rules} />
          <Route exact path="/policy/tos" component={TermsOfService} />
          <Route exact path="/policy/privacy" component={PrivacyPolicy} />
          <Route render={() => <Redirect to="/policy/rules" />} />
        </Switch>
      </Box>
    </>
  );
}
