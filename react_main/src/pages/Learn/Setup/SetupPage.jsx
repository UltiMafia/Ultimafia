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
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
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
  SetupManipulationButtons,
} from "components/Setup";
import GameIcon from "components/GameIcon";
import HostGameDialogue from "components/HostGameDialogue";
import { UserContext, SiteInfoContext } from "Contexts";

import Comments from "pages/Community/Comments";
import { SetupStrategiesSection } from "components/Strategies";
import { NameWithAvatar } from "pages/User/User";
import { Loading } from "components/Loading";
import { VoteWidget } from "components/VoteWidget";
import {
  getRowStubColor,
  getSetupBackgroundColor,
} from "pages/Play/LobbyBrowser/gameRowColors";

import { RoleCount } from "components/Roles";
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
  const [tabValue, setTabValue] = useState(0);
  const [setupStats, setSetupStats] = useState(null);
  const [statsView, setStatsView] = useState("alignment"); // "alignment" | "role"
  const [statsGameTypeFilter, setStatsGameTypeFilter] = useState("all"); // "all" | "unranked" | "ranked" | "competitive"

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
          setSetupStats(setup.setupVersion?.setupStats ?? null);

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
// TODO add button to host it
  function onFavSetup(favSetup) {
    axios.post("/api/setup/favorite", { id: favSetup.id }).catch(errorAlert);
    setSetup((prev) => (prev?.id === favSetup.id ? { ...prev, favorite: !prev.favorite } : prev));
  }

  function onEditSetup(s) {
    navigate(`/play/create?edit=${s.id}&game=${s.gameType}`);
  }

  function onCopySetup(s) {
    navigate(`/play/create?copy=${s.id}&game=${s.gameType}`);
  }

  function onDelSetup(s) {
    if (!window.confirm("Are you sure you want to delete this setup?")) return;
    axios
      .post("/api/setup/delete", { id: s.id })
      .then(() => navigate("/play"))
      .catch(errorAlert);
  }

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
          setSetupStats(setupVersion.setupStats ?? null);

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

  // Night order: flatten setup roles with siteInfo, collect night actions, sort by priority
  let useingRoles = [];
  if (setup && siteInfo?.rolesRaw?.[setup.gameType]) {
    for (let i = 0; i < setup.roles.length; i++) {
      useingRoles = useingRoles.concat(
        Object.keys(setup.roles[i]).map((key) => [
          key,
          siteInfo.rolesRaw[setup.gameType][key.split(":")[0]],
        ])
      );
    }
  }
  const roles = useingRoles;
  const hasMafia = roles.filter((r) => r[1].alignment === "Mafia").length > 0;
  const nightRoles = roles.filter((r) => r[1].nightOrder != null);
  let nightActions = [];
  if (hasMafia) {
    nightActions.push(["Mafia", ["Mafia Kill", -1]]);
  }
  for (const role of nightRoles) {
    for (const item of role[1].nightOrder) {
      nightActions.push([role[0], item]);
    }
  }
  for (let j = 0; j < nightActions.length; j++) {
    for (let u = 0; u < nightActions.length; u++) {
      if (nightActions[u][1][1] > nightActions[j][1][1]) {
        const temp = nightActions[j];
        nightActions[j] = nightActions[u];
        nightActions[u] = temp;
      }
    }
  }
  const nightOrderTableRows = nightActions.map((key) => ({
    roleIcon: (
      <RoleCount key={0} scheme="vivid" role={key[0]} gameType={setup.gameType} />
    ),
    roleName: key[0],
    actionName: key[1][0],
    nightOrder: key[1][1],
  }));

  // Compute filtered win rates from setupStats for Statistics tab (per-game data)
  const statsSource =
    setupStats && statsView === "role"
      ? setupStats.roleWinRates
      : setupStats?.alignmentWinRates;
  const filteredStatsRows = [];
  if (statsSource && typeof statsSource === "object") {
    for (const [name, entries] of Object.entries(statsSource)) {
      if (!Array.isArray(entries)) continue;
      const filtered = statsGameTypeFilter === "all"
        ? entries
        : entries.filter((e) => e && e[0] === statsGameTypeFilter);
      const wins = filtered.filter((e) => e[1] === true).length;
      const total = filtered.length;
      if (total > 0) {
        filteredStatsRows.push({
          name,
          wins,
          total,
          winRate: wins / total,
        });
      }
    }
    filteredStatsRows.sort((a, b) => b.total - a.total);
  }
  const gameLengths = setupStats?.gameLengths || [];
  const filteredGameLengths =
    statsGameTypeFilter === "all"
      ? gameLengths
      : gameLengths.filter((e) => e && e[0] === statsGameTypeFilter);
  const avgGameLengthMs =
    filteredGameLengths.length > 0
      ? filteredGameLengths.reduce((s, e) => s + (e[1] || 0), 0) /
        filteredGameLengths.length
      : null;
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
            <Stack direction="column" spacing={1}>
              <Stack
                direction="row"
                spacing={1}
                sx={{ height: "100%", alignItems: "center" }}
              >
                <VoteWidget
                  item={{
                    id: setup.id,
                    vote: setup.vote ?? 0,
                    voteCount: setup.voteCount ?? 0,
                  }}
                  itemType="setup"
                  setItemHolder={(newItem) =>
                    setSetup((prev) =>
                      prev?.id === newItem.id
                        ? { ...prev, vote: newItem.vote, voteCount: newItem.voteCount }
                        : prev
                    )
                  }
                />
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
              {user.loggedIn && (
                <SetupManipulationButtons
                  setup={setup}
                  onFav={onFavSetup}
                  onEdit={onEditSetup}
                  onCopy={onCopySetup}
                  onDel={onDelSetup}
                />
              )}
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
                spacing={0.5}
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
                <Typography variant="body2" color="text.secondary" sx={{ width: "100%", textAlign: isPhoneDevice ? "right" : "center" }}>
                  {"Favorited "}
                  {setup.favorites ?? 0}
                  {" times!"}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ width: "100%", textAlign: isPhoneDevice ? "right" : "center" }}>
                  {"Played "}
                  {setup.playedCount ?? 0}
                  {" times!"}
                </Typography>
              </Stack>
            </Grid>
          )}
        </Grid>
      </Card>
      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tab label="Info" />
        <Tab label="Statistics" />
        <Tab label="Night Order" />
        <Tab label="Forks" />
      </Tabs>
      {tabValue === 0 && (
        <Box>
          <FullRoleList setup={setup} compact={isPhoneDevice} />
          <Box sx={{ mt: 1 }}>
            <Grid container spacing={1}>
              <Grid item xs={12} md={3}>
                <Stack direction="column" spacing={1}>
                  {closedRoleInfo.length > 0 && (
                    <div className="box-panel">
                      <div className="heading">Closed Setup Info</div>
                      <div className="content">{closedRoleInfo}</div>
                    </div>
                  )}
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
        </Box>
      )}
      {tabValue === 1 && (
        <Box>
          {shouldDisplayStats && (
            <>
              <Stack direction="row" flexWrap="wrap" gap={2} sx={{ mb: 2 }}>
                <div className="box-panel">
                  <div className="heading">Select Version</div>
                  <select
                    value={selectedVersionNum}
                    onChange={handleVersionChange}
                  >
                    {allVersions.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>View</InputLabel>
                  <Select
                    value={statsView}
                    label="View"
                    onChange={(e) => setStatsView(e.target.value)}
                  >
                    <MenuItem value="alignment">Alignment</MenuItem>
                    <MenuItem value="role">Role</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Filter</InputLabel>
                  <Select
                    value={statsGameTypeFilter}
                    label="Filter"
                    onChange={(e) => setStatsGameTypeFilter(e.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="unranked">Unranked</MenuItem>
                    <MenuItem value="ranked">Ranked</MenuItem>
                    <MenuItem value="competitive">Competitive</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <div className="box-panel">
                    <div className="heading">
                      {statsView === "alignment"
                        ? "Alignment"
                        : "Role"}{" "}
                      win rates
                      {statsGameTypeFilter !== "all" && ` (${statsGameTypeFilter})`}
                    </div>
                    <div className="content">
                      {filteredStatsRows.length === 0 ? (
                        <Typography color="text.secondary">
                          Stats are recorded only for games
                          with no abandonments.
                        </Typography>
                      ) : (
                        <Stack spacing={1} sx={{ width: "100%" }}>
                          {filteredStatsRows.map((row) => (
                            <Box key={row.name}>
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                sx={{ mb: 0.25 }}
                              >
                                <Typography variant="body2">
                                  {row.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {row.wins}/{row.total} (
                                  {(100 * row.winRate).toFixed(0)}%)
                                </Typography>
                              </Stack>
                              <Box
                                sx={{
                                  height: 8,
                                  bgcolor: "action.hover",
                                  borderRadius: 1,
                                  overflow: "hidden",
                                }}
                              >
                                <Box
                                  sx={{
                                    height: "100%",
                                    width: `${100 * row.winRate}%`,
                                    bgcolor: "primary.main",
                                    borderRadius: 1,
                                  }}
                                />
                              </Box>
                            </Box>
                          ))}
                        </Stack>
                      )}
                    </div>
                  </div>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Stack spacing={1}>
                    <div className="box-panel">
                      <div className="heading">Game length</div>
                      <div className="content">
                        {filteredGameLengths.length === 0 ? (
                          <Typography variant="body2" color="text.secondary">
                            No data
                          </Typography>
                        ) : (
                          <Typography variant="body2">
                            {filteredGameLengths.length} game
                            {filteredGameLengths.length !== 1 ? "s" : ""}
                            {avgGameLengthMs != null && (
                              <>
                                {" "}
                                · avg{" "}
                                {Math.round(avgGameLengthMs / 60000)} min
                              </>
                            )}
                          </Typography>
                        )}
                      </div>
                    </div>
                    </Stack>
                </Grid>
              </Grid>
            </>
          )}
          {!shouldDisplayStats && (
            <Typography color="text.secondary">
              Statistics are only available for Mafia setups.
            </Typography>
          )}
        </Box>
      )}
      {tabValue === 2 && (
        <Box>
          <Typography variant="h2" gutterBottom>
            Setup Night Order
          </Typography>
          <Typography paragraph>
            The night order resolves from the lowest priority to the highest. Ties
            in priority are resolved by the player list
          </Typography>
          <Box className="paragraph">
            <TableContainer>
              <Table aria-label="night order">
                <TableHead>
                  <TableRow>
                    <TableCell>Role</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Priority</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {nightOrderTableRows.map((row, idx) => (
                    <TableRow
                      key={`${row.roleName}-${row.actionName}-${idx}`}
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell component="th" scope="row" align="center">
                        {row.roleIcon}
                        {row.roleName}
                      </TableCell>
                      <TableCell align="center">{row.actionName}</TableCell>
                      <TableCell align="center">{row.nightOrder}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      )}
      {tabValue === 3 && <Box />}
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
