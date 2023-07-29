import React from "react";
import { Route, Switch, Redirect } from "react-router-dom";

import Forums from "./Forums/Forums";
import Emotes from "../Chat/EmoteList";
import UserSearch from "./UserSearch";
import Moderation from "./Moderation";
import Feedback from "./Feedback";
import { SubNav } from "../../components/Nav";

export default function Community() {
  const links = [
    {
      text: "Forums",
      path: `/community/forums`,
    },
    {
      text: "Emotes",
      path: `/community/emotes`,
    },
    {
      text: "Users",
      path: `/community/users`,
    },
    {
      text: "Moderation",
      path: `/community/moderation`,
    },
    {
      text: "Feedback",
      path: `/community/feedback`,
    },
  ];

  return (
    <>
      <SubNav links={links} />
      <div className="inner-content">
        <Switch>
          <Route path="/community/forums" render={() => <Forums />} />
          <Route path="/community/emotes" render={() => <Emotes /> } />
          <Route path="/community/users" render={() => <UserSearch />} />
          <Route path="/community/moderation" render={() => <Moderation />} />
          <Route path="/community/feedback" render={() => <Feedback />} />
          <Route render={() => <Redirect to="/community/forums" />} />
        </Switch>
      </div>
    </>
  );
}
