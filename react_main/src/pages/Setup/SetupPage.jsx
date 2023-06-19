import React, { useState, useEffect, useContext } from "react";
import {
  Route,
  Switch,
  Redirect,
  useParams,
  useHistory,
} from "react-router-dom";
import axios from "axios";

import { UserContext } from "../../Contexts";
import LoadingPage from "../Loading";
import Comments from "../Community/Comments";

import "../../css/setupPage.css";
import { useErrorAlert } from "../../components/Alerts";
import { NameWithAvatar } from "../User/User";
import Setup from "../../components/Setup";

export default function Setups() {
  return (
    <>
      <div className="inner-content">
        <Switch>
          <Route exact path="/setup/:setupId" render={() => <SetupPage />} />
        </Switch>
      </div>
    </>
  );
}

// TODO add more info next time
export function SetupPage() {
  const [setup, setSetup] = useState();
  // useful info but not in api
  // favourites

  const user = useContext(UserContext);
  const history = useHistory();
  const errorAlert = useErrorAlert();
  const { setupId } = useParams();

  useEffect(() => {
    if (setupId) {
      axios
        .get(`/setup/${setupId}`)
        .then((res) => {
          setSetup(res.data);

          document.title = `Setup | ${res.data.name} | UltiMafia`;
        })
        .catch((e) => {
          errorAlert(e);
          history.push("/play");
        });
    }
  }, [setupId]);

  if (user.loaded && !user.loggedIn) return <Redirect to="/play" />;
  // TODO if setupId not set, redirect to a setup page

  if (!setup || !user.loaded) return <LoadingPage />;

  let commentLocation = `setup/${setupId}`;

  // TODO stats
  // roleWins, rolePlays, played
  // played: 4
  // rolePlays: Object { Fool: 1, Villager: 2, Ghost: 1 }
  // roleWins: Object { Villager: 2, Fool: 1 }

  // TODO add button to host it

  return (
    <>
      <div className="span-panel main">
        <div className="setup-page">
          <div className="heading">Setup Info</div>

          <div className="meta">
            <SetupRowInfo title="Name" content={setup.name} />
            <SetupRowInfo title="Id" content={setup.id} />

            {setup.creator && (
              <SetupRowInfo
                title="Created by"
                content={
                  <NameWithAvatar
                    small
                    id={setup.creator.id}
                    name={setup.creator.name}
                    avatar={setup.creator.avatar}
                  />
                }
              />
            )}
            <SetupRowInfo title="No. players" valcontentue={setup.total} />
            <SetupRowInfo
              title="Ranked Allowed"
              content={setup.ranked ? "Yes" : "No"}
            />

            <SetupRowInfo
              title="Roles"
              content={
                <div className="setup-wrapper">
                  <Setup setup={setup} disablePopover />
                </div>
              }
            />
          </div>

          <div className="heading">Setup Statistics (Coming Soon) </div>
        </div>
      </div>
      <Comments location={commentLocation} />
    </>
  );
}

function SetupRowInfo(props) {
  return (
    <div className="setup-row-info">
      <div className="title">{props.title}</div>
      <div className="content">{props.content}</div>
    </div>
  );
}
