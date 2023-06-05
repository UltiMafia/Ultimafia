import React from "react";
import { Route, Switch, Redirect } from "react-router-dom";

import PrivacyPolicy from "./PrivacyPolicy";
import TermsOfService from "./TermsOfService";
import { SubNav } from "../../components/Nav";

import "../../css/legal.css";

export default function Legal(props) {
  const links = [
    {
      text: "Terms of Service",
      path: "/legal/tos",
      exact: true,
    },
    {
      text: "Privacy Policy",
      path: "/legal/privacy",
      exact: true,
    },
  ];

  return (
    <>
      <SubNav links={links} />
      <div className="inner-content">
        <Switch>
          <Route exact path="/legal/tos" render={() => <TermsOfService />} />
          <Route exact path="/legal/privacy" render={() => <PrivacyPolicy />} />
          <Route render={() => <Redirect to="/legal/tos" />} />
        </Switch>
      </div>
    </>
  );
}
