import React from "react";
import { Route, Switch, Redirect } from "react-router-dom";

import PrivacyPolicy from "./PrivacyPolicy";
import TermsOfService from "./TermsOfService";
import { SubNav } from "../../components/Nav";

import "../../css/legal.css";

export default function Policy(props) {
  const links = [
    {
      text: "Rules",
      path: "/policy/rules",
      exact: true,
    },
    {
      text: "Terms of Service",
      path: "/policy/tos",
      exact: true,
    },
    {
      text: "Privacy Policy",
      path: "/policy/privacy",
      exact: true,
    },
  ];

  return (
    <>
      <SubNav links={links} />
      <div className="inner-content">
        <Switch>
          <Route exact path="/policy/rules" render={() => <Rules />} />
          <Route exact path="/policy/tos" render={() => <TermsOfService />} />
          <Route exact path="/policy/privacy" render={() => <PrivacyPolicy />} />
          <Route render={() => <Redirect to="/policy/rules" />} />
        </Switch>
      </div>
    </>
  );
}
