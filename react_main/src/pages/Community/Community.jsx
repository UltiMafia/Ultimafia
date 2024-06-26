import React, { useContext } from "react";
import { Route, Switch, Redirect } from "react-router-dom";

import Forums from "./Forums/Forums";
import UserSearch from "./UserSearch";
import Moderation from "./Moderation";
import Contributors from "./Contributors";
import Feedback from "./Feedback";
import { SubNav } from "../../components/Nav";
import { UserContext } from "../../Contexts";

export default function Community() {
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
    {
      text: "Contributors",
      path: `/community/contributors`,
    },
    {
      text: "Feedback",
      path: `/community/feedback`,
    },
  ];
  const user = useContext(UserContext);
  if (user.loaded && !user.loggedIn) return <Redirect to="/" />;

  return (
    <>
      <SubNav links={links} />
      <div className="inner-content">
        <Switch>
          <Route path="/community/forums" render={() => <Forums />} />
          <Route path="/community/users" render={() => <UserSearch />} />
          <Route path="/community/moderation" render={() => <Moderation />} />
          <Route
            path="/community/contributors"
            render={() => <Contributors />}
          />
          <Route path="/community/feedback" render={() => <Feedback />} />
          <Route render={() => <Redirect to="/community/forums" />} />
        </Switch>
      </div>
    </>
  );
}
