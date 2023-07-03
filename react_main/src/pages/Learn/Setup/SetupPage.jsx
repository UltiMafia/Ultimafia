import React, { useState, useEffect, useContext } from "react";
import {
  Route,
  Switch,
  Redirect,
  useParams,
  useHistory,
} from "react-router-dom";
import axios from "axios";

import { SiteInfoContext, UserContext } from "../../../Contexts";
import LoadingPage from "../../Loading";
import Comments from "../../Community/Comments";

import "../../../css/setupPage.css";

import { useErrorAlert } from "../../../components/Alerts";
import { NameWithAvatar } from "../../User/User";
import Setup, { SmallRoleList } from "../../../components/Setup";

export default function Setups() {
  return (
    <>
      <div className="inner-content">
        <Switch>
          <Route
            exact
            path="/learn/setup/:setupId"
            render={() => <SetupPage />}
          />
        </Switch>
      </div>
    </>
  );
}

// TODO add more info next time
export function SetupPage() {
  const [setup, setSetup] = useState();
  const user = useContext(UserContext);
  const history = useHistory();
  const errorAlert = useErrorAlert();
  const { setupId } = useParams();

  const siteInfo = useContext(SiteInfoContext);
  const roleData = siteInfo.roles;

  useEffect(() => {
    if (setupId) {
      axios
        .get(`/setup/${setupId}`)
        .then((res) => {
          let setup = res.data;
          setup.roles = JSON.parse(setup.roles);
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

  // favourites
  // TODO stats
  // roleWins, rolePlays, played
  // played: 4
  // rolePlays: Object { Fool: 1, Villager: 2, Ghost: 1 }
  // roleWins: Object { Villager: 2, Fool: 1 }

  // TODO add button to host it

  let closedRoleInfo = [];
  // Roles
  if (setup.closed) {
    closedRoleInfo.push(
      <SetupRowInfo
        title="Unique Roles"
        content={setup.unique ? "Yes" : "No"}
        key="uniqueRoles"
      />
    );

    // Currently, only Mafia supports unique without modifier
    if (setup.unique && setup.gameType == "Mafia") {
      closedRoleInfo.push(
        <SetupRowInfo
          title="Unique Without Modifier"
          content={setup.uniqueWithoutModifier ? "Yes" : "No"}
          key="uniqueRolesWithoutModifier"
        />
      );
    }

    closedRoleInfo.push(
      <SetupRowInfo
        title="Role Groups"
        content={setup.useRoleGroups ? "Yes" : "No"}
        key="useRoleGroups"
      />
    );
  }

  /*
  const rolesets = [];
  if (setup.closed && !setup.useRoleGroups) {
    const roleset = setup.roles[0];
    var rolesByAlignment = {};

    for (let role in roleset) {
      let roleName = role.split(":")[0];

      for (let roleObj of roleData[setup.gameType]) {
        if (roleObj.name == roleName) {
          let alignment = roleObj.alignment;

          if (!rolesByAlignment[alignment]) rolesByAlignment[alignment] = {};

          rolesByAlignment[alignment][role] = roleset[role];
        }
      }
    }

    for (let alignment in rolesByAlignment) {
      rolesets.push(
        <SmallRoleList
          title={`${alignment} roles`}
          roles={rolesByAlignment[alignment]}
          gameType={setup.gameType}
          key={alignment}
        />
      );
    }
  } else {
    let multiName = setup.useRoleGroups ? "Role Groups" : "Role Sets";
    const sectionName = setup.roles.length > 1 ? multiName : "Roles";

    for (let i in setup.roles) {
      let roleset = setup.roles[i];
      let title = setup.useRoleGroups ? `(${setup.roleGroupSizes[i]})` : "";

      rolesets.push(
        <SmallRoleList
          title={title}
          roles={roleset}
          gameType={setup.gameType}
          key={i}
        />
      );
    }
  }
  */
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

            {closedRoleInfo}
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
