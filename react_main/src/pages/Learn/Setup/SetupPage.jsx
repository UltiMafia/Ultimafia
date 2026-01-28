import React, { useState, useEffect, useContext } from "react";
import {
  Route,
  Routes,
  Navigate,
  useParams,
  useNavigate,
} from "react-router-dom";
import axios from "axios";

import {
  Box,
  Button,
  Card,
  Divider,
  Grid,
  IconButton,
  Link,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import ModerationSideDrawer from "components/ModerationSideDrawer";
import { useErrorAlert } from "components/Alerts";
import {
  determineSetupType,
  getAlignmentColor,
  FullRoleList,
} from "components/Setup";
import GameIcon from "components/GameIcon";
import HostGameDialogue from "components/HostGameDialogue";
import { UserContext, SiteInfoContext } from "Contexts";

import Comments from "pages/Community/Comments";
import { SetupStrategiesSection } from "components/Strategies";
import { NameWithAvatar } from "pages/User/User";
import { Loading } from "components/Loading";
import {
  getRowStubColor,
  getSetupBackgroundColor,
} from "pages/Play/LobbyBrowser/gameRowColors";

import { PieChart } from "./PieChart";

import "css/setupPage.css";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";

export default function Setups() {
  return (
    <>
      <div className="inner-content">
        <SetupPage />
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
      colors[alignment] = getAlignmentColor(alignment);
      data[alignment] = `${alignmentWinrate[alignment]}`;
    } else if (alignment === "Mafia") {
      colors[alignment] = getAlignmentColor(alignment);
      data[alignment] = `${alignmentWinrate[alignment]}`;
    } else if (alignment === "Cult") {
      colors[alignment] = getAlignmentColor(alignment);
      data[alignment] = `${alignmentWinrate[alignment]}`;
    }
  });

  Object.keys(roleWinrate).forEach(function (roleName) {
    if (roleWinrate[roleName] === 0) {
      return;
    }

    const alignment = rolesRaw[roleName].alignment;
    if (alignment === "Independent") {
      colors[roleName] = getAlignmentColor(alignment);
      data[roleName] = `${roleWinrate[roleName]}`;
    }
  });

  return { data: data, colors: colors };
}

function getEloPieStats(factionRatings) {
  const data = {};
  const colors = {};

  if (!factionRatings) {
    return null;
  }

  factionRatings.forEach(function (factionRating) {
    const name = factionRating.factionName;
    const elo = factionRating.elo;

    if (name === "Village" || name === "Mafia" || name === "Cult") {
      colors[name] = getAlignmentColor(name);
      data[name] = elo;
    } else {
      colors[name] = getAlignmentColor("Independent");
      data[name] = elo;
    }
  });

  return { data: data, colors: colors };
}

export function SetupPage() {
  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const isPhoneDevice = useIsPhoneDevice();
  const navigate = useNavigate();
  const errorAlert = useErrorAlert();
  const { setupId } = useParams();

  const [setup, setSetup] = useState();
  const [gameType, setGameType] = useState("");
  const [pieData, setPieData] = useState(null);
  const [eloPieData, setEloPieData] = useState(null);
  const [currentVersionNum, setCurrentVersionNum] = useState(0);
  const [selectedVersionNum, setSelectedVersionNum] = useState(0);
  const [moderationDrawerOpen, setModerationDrawerOpen] = useState(false);
  const [versionTimestamp, setVersionTimestamp] = useState("");
  const [versionGamesPlayed, setVersionGamesPlayed] = useState(0);
  const [diff, setDiff] = useState([]); // Changelog diff
  const [ishostGameDialogueOpen, setIshostGameDialogueOpen] = useState(false);

  const allVersions = Array.from(Array(currentVersionNum + 1).keys()).reverse();
  const localDateString = new Date(
    Date.parse(versionTimestamp)
  ).toLocaleString();
  const shouldDisplayStats = gameType === "Mafia";
  const shouldDisplayChangelog = gameType === "Mafia";

  const colorInfo = {
    ranked: setup ? setup.ranked : false,
    lobby: gameType === "Mafia" ? (setup.closed ? "Sandbox" : "Main") : "Games",
  };
  const setupHeadingIconColor = getRowStubColor(colorInfo);
  const setupHeadingBackgroundColor = getSetupBackgroundColor(colorInfo, true);

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
          setVersionGamesPlayed(setup.setupVersion.played);

          document.title = `Setup | ${res.data.name} | UltiMafia`;

          if (setup.gameType === "Mafia") {
            setEloPieData(getEloPieStats(setup.factionRatings));
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
        });
    }
  }, [setupId]);

  if (user.loaded && !user.loggedIn) return <Navigate to="/play" />;
  // TODO if setupId not set, redirect to a setup page

  if (!setup || !user.loaded) return <Loading small />;

  let commentLocation = `setup/${setupId}`;

  // favourites

  // TODO add button to host it

  let closedRoleInfo = [];
  // Roles
  if (setup.closed) {
    closedRoleInfo.push(
      <Typography key="uniqueRoles">
        {"Unique roles/modifiers: "}
        {setup.unique ? "✅" : "❌"}
      </Typography>
    );

    // Currently, only Mafia supports unique without modifier
    if (setup.unique && setup.gameType === "Mafia") {
      closedRoleInfo.push(
        <Typography key="uniqueRolesWithoutModifier">
          {"Unique roles: "}
          {setup.uniqueWithoutModifier ? "✅" : "❌"}
        </Typography>
      );
    }
  }

  let handleVersionChange = (e) => {
    const newVersionNum = e.target.value;

    if (setupId) {
      axios
        .get(`/api/setup/${setupId}/version/${newVersionNum}`)
        .then((res) => {
          let setupVersion = res.data;
          setSelectedVersionNum(newVersionNum);
          setVersionTimestamp(setupVersion.timestamp);
          setVersionGamesPlayed(setupVersion.played);

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
        });
    }
  };

  const iconSize = isPhoneDevice ? 30 : 60;

  return (
    <Stack
      spacing={1}
      className="setup-page"
      sx={{
        maxWidth: "100%",
      }}
    >
      <Card
        variant="outlined"
        sx={{
          backgroundColor: setupHeadingBackgroundColor,
          mb: 1,
          p: 1,
        }}
      >
        {setup && (
          <HostGameDialogue
            open={ishostGameDialogueOpen}
            setOpen={setIshostGameDialogueOpen}
            setup={setup}
          />
        )}
        <ModerationSideDrawer
          open={moderationDrawerOpen}
          setOpen={setModerationDrawerOpen}
          prefilledArgs={{ setupId }}
        />
        <Grid
          container
          spacing={1}
          divider={<Divider orientation="vertical" flexItem />}
        >
          <Grid item xs={12} md={8}>
            <Stack
              direction="row"
              spacing={1}
              sx={{ height: "100%", alignItems: "center" }}
            >
              <IconButton
                onClick={() => setIshostGameDialogueOpen(true)}
                sx={{
                  p: isPhoneDevice ? 1 : 2,
                  borderRadius: "50%",
                  backgroundColor: setupHeadingIconColor,
                }}
              >
                <GameIcon gameType={setup.gameType} size={iconSize} />
              </IconButton>
              <Typography
                variant="h2"
                sx={{
                  ml: isPhoneDevice ? "auto !important" : undefined,
                }}
              >
                {setup.name}
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} md={2}>
            <Stack direction="column" spacing={0.5} sx={{ textAlign: "right" }}>
              <Typography sx={{ fontWeight: "600" }}>
                {determineSetupType(setup)}
              </Typography>
              <Typography>
                {"Players: "}
                {setup.total}
              </Typography>
              <Typography>
                {"Ranked: "}
                {setup.ranked ? "✅" : "❌"}
              </Typography>
              <Typography>
                {"Comp: "}
                {setup.competitive ? "✅" : "❌"}
              </Typography>
            </Stack>
          </Grid>
          {setup.creator && (
            <Grid item xs={12} md={2}>
              <Stack
                direction={isPhoneDevice ? "row" : "column"}
                sx={{
                  alignItems: "center",
                }}
              >
                <Typography
                  variant="italicRelation"
                  sx={{
                    ml: isPhoneDevice ? "auto" : 1,
                  }}
                >
                  {"Created by"}
                </Typography>
                <Box sx={{ ml: 1 }}>
                  <NameWithAvatar
                    small
                    id={setup.creator.id}
                    name={setup.creator.name}
                    avatar={setup.creator.avatar}
                  />
                </Box>
              </Stack>
            </Grid>
          )}
        </Grid>
      </Card>
      <Box>
        <FullRoleList setup={setup} compact={isPhoneDevice} />
      </Box>
      <Box>
        <Grid container spacing={1}>
          <Grid item xs={12} md={3}>
            <Stack direction="column" spacing={1}>
              {closedRoleInfo.length > 0 && (
                <div className="box-panel">
                  <div className="heading">Closed Setup Info</div>
                  <div className="content">{closedRoleInfo}</div>
                </div>
              )}
              <div className="box-panel">
                <div className="heading">Night Order</div>
                <div className="content">
                  <Link href={`/learn/setup/${setupId}/nightorder`}>
                    Click to Show
                  </Link>
                </div>
              </div>
            </Stack>
          </Grid>
          <Grid item xs={12} md={3}>
            {shouldDisplayStats && (
              <Stack direction="column" spacing={1}>
                <div className="box-panel">
                  <div className="heading">Select Version</div>
                  <select onChange={handleVersionChange}>
                    {allVersions.map((oldVersionNum) => (
                      <option value={oldVersionNum}>{oldVersionNum}</option>
                    ))}
                  </select>
                </div>
                {pieData && Object.keys(pieData.data).length > 0 && (
                  <div className="box-panel">
                    <div className="heading">
                      v{selectedVersionNum} Winrate (n = {versionGamesPlayed})
                    </div>
                    <div
                      className="content"
                      style={{ padding: "0", justifyContent: "center" }}
                    >
                      <PieChart
                        data={pieData.data}
                        colors={pieData.colors}
                        displayPieChart={true}
                        suffixFn={(value) =>
                          ` ${(100 * Number.parseFloat(value)).toFixed(0)}%`
                        }
                      />
                    </div>
                  </div>
                )}
                {eloPieData && Object.keys(eloPieData.data).length > 0 && (
                  <div className="box-panel">
                    <div className="heading">Faction Elo</div>
                    <div
                      className="content"
                      style={{ padding: "0", justifyContent: "center" }}
                    >
                      <PieChart
                        data={eloPieData.data}
                        colors={eloPieData.colors}
                        displayPieChart={true}
                        suffixFn={(value) =>
                          ` ${Number.parseFloat(value).toFixed(0)}`
                        }
                      />
                    </div>
                  </div>
                )}
              </Stack>
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            {shouldDisplayChangelog && (
              <div className="side column">
                <div className="box-panel">
                  <div className="heading">
                    Changelog for v{selectedVersionNum} ({localDateString})
                  </div>
                  <div>
                    <Changelog diff={diff} />
                  </div>
                </div>
              </div>
            )}
          </Grid>
        </Grid>
      </Box>
      <Comments location={commentLocation} />
      <SetupStrategiesSection setupId={setupId} />
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
