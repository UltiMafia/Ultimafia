import React, { useState, useEffect, useContext } from "react";
import {
  Route,
  Switch,
  Redirect,
  useParams,
  useHistory,
  Link,
} from "react-router-dom";
import axios from "axios";

import { UserContext, SiteInfoContext } from "../../../Contexts";
import Comments from "../../Community/Comments";
import { PieChart } from "./PieChart";

import "../../../css/setupPage.css";

import { useErrorAlert } from "../../../components/Alerts";
import { NameWithAvatar } from "../../User/User";
import Setup from "../../../components/Setup";
import { NewLoading } from "../../Welcome/NewLoading";
import { Stack, Typography } from "@mui/material";

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

function getBasicPieStats(alignmentWinrate, roleWinrate, rolesRaw) {
  const data = {};
  const colors = {};

  if (!alignmentWinrate || !roleWinrate || !rolesRaw) {
    return null;
  }

  Object.keys(alignmentWinrate).forEach(function (alignment) {
    if (alignment === "Independent") {
      return;
    }

    if (alignment === "Village") {
      colors[alignment] = "#66adff";
      data[alignment] = `${alignmentWinrate[alignment]}`;
    } else if (alignment === "Mafia") {
      colors[alignment] = "#505d66";
      data[alignment] = `${alignmentWinrate[alignment]}`;
    } else if (alignment === "Cult") {
      colors[alignment] = "#b161d3";
      data[alignment] = `${alignmentWinrate[alignment]}`;
    }
  });

  Object.keys(roleWinrate).forEach(function (roleName) {
    if (roleWinrate[roleName] === 0) {
      return;
    }

    const alignment = rolesRaw[roleName].alignment;
    if (alignment === "Independent") {
      colors[roleName] = "#c7ce48";
      data[roleName] = `${roleWinrate[roleName]}`;
    }
  });

  return { data: data, colors: colors };
}

export function SetupPage() {
  const [setup, setSetup] = useState();
  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const history = useHistory();
  const errorAlert = useErrorAlert();
  const { setupId } = useParams();
  const [gameType, setGameType] = useState("");
  const [pieData, setPieData] = useState(null);
  const [currentVersionNum, setCurrentVersionNum] = useState(0);
  const [selectedVersionNum, setSelectedVersionNum] = useState(0);
  const [versionTimestamp, setVersionTimestamp] = useState("");
  const [diff, setDiff] = useState([]); // Changelog diff

  const allVersions = Array.from(Array(currentVersionNum + 1).keys()).reverse();
  const localDateString = new Date(
    Date.parse(versionTimestamp)
  ).toLocaleString();
  const shouldDisplayStats = gameType === "Mafia";
  const shouldDisplayChangelog = gameType === "Mafia";

  useEffect(() => {
    if (setupId) {
      axios
        .get(`/api/setup/${setupId}`, { headers: { includeStats: true } })
        .then((res) => {
          let setup = res.data;
          setup.roles = JSON.parse(setup.roles);
          setSetup(res.data);
          setGameType(setup.gameType);
          setCurrentVersionNum(setup.version);
          setSelectedVersionNum(setup.version);
          setVersionTimestamp(setup.setupVersion.timestamp);

          document.title = `Setup | ${res.data.name} | UltiMafia`;

          if (setup.gameType === "Mafia") {
            setPieData(
              getBasicPieStats(
                setup.stats.alignmentWinrate,
                setup.stats.roleWinrate,
                siteInfo.rolesRaw["Mafia"]
              )
            );

            const changelog = setup.setupVersion.changelog;
            if (changelog) {
              setDiff(JSON.parse(changelog));
            }
          }
        })
        .catch((e) => {
          console.error(e);
          errorAlert(e);
        });
    }
  }, [setupId]);

  if (user.loaded && !user.loggedIn) return <Redirect to="/play" />;
  // TODO if setupId not set, redirect to a setup page

  if (!setup || !user.loaded) return <NewLoading small />;

  let commentLocation = `setup/${setupId}`;

  // favourites

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
    if (setup.unique && setup.gameType === "Mafia") {
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

  let handleVersionChange = (e) => {
    const newVersionNum = e.target.value;
    setSelectedVersionNum(newVersionNum);

    if (setupId) {
      axios
        .get(`/api/setup/${setupId}/version/${newVersionNum}`)
        .then((res) => {
          let setupVersion = res.data;
          setVersionTimestamp(setupVersion.timestamp);

          if (gameType === "Mafia") {
            setPieData(
              getBasicPieStats(
                setupVersion.stats.alignmentWinrate,
                setupVersion.stats.roleWinrate,
                siteInfo.rolesRaw["Mafia"]
              )
            );

            const changelog = setupVersion.changelog;
            if (changelog) {
              setDiff(JSON.parse(changelog));
            } else {
              setDiff([]);
            }
          }
        })
        .catch((e) => {
          errorAlert(e);
          history.push("/play");
        });
    }
  };

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
    <Stack direction="column" spacing={1}>
      <Setup setup={setup} disablePopover />
      <div className="setup-page">
        <div className="span-panel main">
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
            <SetupRowInfo title="No. players" content={setup.total} />
            <SetupRowInfo
              title="Ranked Allowed"
              content={setup.ranked ? "Yes" : "No"}
            />

            <SetupRowInfo
              title="Competitive Allowed"
              content={setup.competitive ? "Yes" : "No"}
            />
            
            {closedRoleInfo}
            <SetupRowInfo
              title="Night Order"
              content ={ <Link to= {`/learn/setup/${setupId}/nightorder`}>Click to Show</Link>}
            />
          </div>
        </div>
        {shouldDisplayStats && (
          <div className="side column">
            <div className="box-panel version-selector">
              <div className="heading">Select Version</div>
              <select onChange={handleVersionChange}>
                {allVersions.map((oldVersionNum) => (
                  <option value={oldVersionNum}>{oldVersionNum}</option>
                ))}
              </select>
            </div>
            <div className="box-panel winrate-stats">
              <div className="heading">Win Statistics</div>
              <div className="content">
                {/* {ratings}
              <div
                className="expand-icon-wrapper"
                onClick={() => setShowStatsModal(true)}
              >
                <i className="fas fa-expand-arrows-alt" />
              </div> */}
              </div>
              <div
                className="content"
                style={{ padding: "0", justifyContent: "center" }}
              >
                {pieData && (
                  <PieChart
                    data={pieData.data}
                    colors={pieData.colors}
                    displayPieChart={true}
                  />
                )}
              </div>
            </div>
          </div>
        )}
        {shouldDisplayChangelog && (
          <div className="side column">
            <div className="box-panel changelog-panel">
              <div className="heading">
                Changelog for version {selectedVersionNum}
              </div>
              <div className="heading">Changed on: {localDateString}</div>
              <div>
                <Changelog diff={diff} />
              </div>
            </div>
          </div>
        )}
      </div>
      <Comments location={commentLocation} />
    </Stack>
  );
}

function postprocessUnchangedLines(diff, contextAmount) {
  const newDiff = [];

  var i = 0;
  diff.forEach((part) => {
    if (part.added || part.removed) {
      newDiff.push(part);
    } else {
      const unchangedLines = part.value.split("\n");

      var snippet1Index = 0;
      var snippet2Index = unchangedLines.length - 1;

      // Look at the previous part to see if it was changed or not
      var prevPartIndex = i - 1;
      if (prevPartIndex >= 0) {
        if (diff[prevPartIndex].added || diff[prevPartIndex].removed) {
          snippet1Index = contextAmount;
        }
      }

      // Look at the next part to see if it was changed or not
      var nextPartIndex = i + 1;
      if (nextPartIndex < diff.length) {
        if (diff[nextPartIndex].added || diff[nextPartIndex].removed) {
          snippet2Index = unchangedLines.length - 1 - contextAmount;
        }
      }

      if (snippet1Index >= snippet2Index) {
        newDiff.push(part);
      } else {
        const pushSnippet1 = snippet1Index > 0;
        const pushSnippet2 = snippet2Index < unchangedLines.length - 1;

        if (pushSnippet1) {
          newDiff.push({
            value: unchangedLines.slice(0, snippet1Index).join("\n"),
            added: false,
            removed: false,
          });
        }
        if (pushSnippet1 || pushSnippet2) {
          newDiff.push({
            value: "...",
            added: false,
            removed: false,
            skipped: true,
          });
        }
        if (pushSnippet2) {
          newDiff.push({
            value: unchangedLines.slice(snippet2Index).join("\n"),
            added: false,
            removed: false,
          });
        }
      }
    }

    i++;
  });

  return newDiff;
}

// Takes a diff object from https://www.npmjs.com/package/diff
function Changelog({ diff }) {
  const lines = [];

  const postprocessedDiff = postprocessUnchangedLines(diff, 5);

  var i = 0;
  postprocessedDiff.forEach((part) => {
    const className = part.added
      ? "color-added"
      : part.removed
      ? "color-removed"
      : part.skipped
      ? "color-skipped"
      : "color-unchanged";
    lines.push(
      <p key={i} className={className}>
        {part.value}
      </p>
    );
    i++;
  });

  return <div className="changelog">{lines}</div>;
}

function SetupRowInfo(props) {
  return (
    <div className="setup-row-info">
      <div className="title">{props.title}</div>
      <div className="content">{props.content}</div>
    </div>
  );
}
