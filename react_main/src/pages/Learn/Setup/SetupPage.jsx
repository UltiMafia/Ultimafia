import React, { useState, useEffect, useContext } from "react";
import {
  Link as RouterLink,
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
import SetupDisplay from "components/Setup";
import GameIcon from "components/GameIcon";
import HostGameDialogue from "components/HostGameDialogue";
import { UserContext, SiteInfoContext } from "Contexts";

import Comments from "pages/Community/Comments";
import { SetupStrategiesSection } from "components/Strategies";
import { NameWithAvatar } from "pages/User/User";
import { TextEditor } from "components/Form";
import CustomMarkdown from "components/CustomMarkdown";
import { Loading } from "components/Loading";
import { VoteWidget } from "components/VoteWidget";
import {
  getRowStubColor,
  getSetupBackgroundColor,
} from "pages/Play/LobbyBrowser/gameRowColors";

import { RoleCount } from "components/Roles";
import { PieChart } from "./PieChart";
import { SetupWinRateBars } from "./SetupWinRateBars";

import "css/buttons.css";
import "css/setupPage.css";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";
import TwoPanelLayout from "components/SetupProfileLayout";

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

    const alignment = rolesRaw[roleName]?.alignment;
    if (alignment === "Independent") {
      colors[roleName] = getAlignmentColor(alignment);
      data[roleName] = `${roleWinrate[roleName]}`;
    }
  });

  return { data: data, colors: colors };
}

function formatAvgLengthMs(ms) {
  if (ms == null || Number.isNaN(ms)) return "—";
  return `${(ms / 60000).toFixed(1)} Minutes`;
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
  const [currentVersionNum, setCurrentVersionNum] = useState(0);
  const [selectedVersionNum, setSelectedVersionNum] = useState(0);
  const [moderationDrawerOpen, setModerationDrawerOpen] = useState(false);
  const [versionTimestamp, setVersionTimestamp] = useState("");
  const [versionGamesPlayed, setVersionGamesPlayed] = useState(0);
  const [diff, setDiff] = useState([]); // Changelog diff
  const [ishostGameDialogueOpen, setIshostGameDialogueOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [pieData, setPieData] = useState(null);
  const [statsBundle, setStatsBundle] = useState(null);
  const [statsViewMode, setStatsViewMode] = useState("alignment");
  const [statsGameFilter, setStatsGameFilter] = useState("all");
  const [lineage, setLineage] = useState(null); // { copiedFrom: { setup, copiedAt } | null, copiedTo: [] }
  const [description, setDescription] = useState("");
  const [editingDescription, setEditingDescription] = useState(false);
  const [oldDescription, setOldDescription] = useState("");

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
          setDescription(setup.description ?? "");

          document.title = `${res.data.name} | UltiMafia`;

          if (setup.gameType === "Mafia") {
            setStatsBundle(setup.stats || null);
            setPieData(
              getBasicPieStats(
                setup.stats?.alignmentWinrate,
                setup.stats?.roleWinrate,
                siteInfo?.rolesRaw?.Mafia
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

  useEffect(() => {
    if (setupId && tabValue === 3) {
      axios
        .get(`/api/setup/${setupId}/lineage`)
        .then((res) => setLineage(res.data))
        .catch(() => setLineage({ copiedFrom: null, copiedTo: [] }));
    }
  }, [setupId, tabValue]);

  if (user.loaded && !user.loggedIn) return <Navigate to="/play" />;
  if (!setupId) return <Navigate to="/learn/games" replace />;

  if (!setup || !user.loaded) return <Loading small />;

  let commentLocation = `setup/${setupId}`;
  const isSetupCreator = user.loggedIn && setup?.creator && user.id === setup.creator.id;

  function onSaveDescription() {
    axios
      .post("/api/setup/description", { id: setupId, description })
      .then(() => {
        setEditingDescription(false);
        setSetup((prev) => (prev ? { ...prev, description } : prev));
      })
      .catch(errorAlert);
  }

  function onCancelEditDescription() {
    setEditingDescription(false);
    setDescription(oldDescription);
  }

  function onDescriptionClick() {
    if (isSetupCreator && !editingDescription) {
      setOldDescription(description);
      setEditingDescription(true);
    }
  }

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

          if (gameType === "Mafia") {
            setStatsBundle(setupVersion.stats || null);
            setPieData(
              getBasicPieStats(
                setupVersion.stats?.alignmentWinrate,
                setupVersion.stats?.roleWinrate,
                siteInfo?.rolesRaw?.Mafia
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
              </Stack>
            </Grid>
          )}
          {shouldDisplayStats && (
            <Grid item xs={12} md={8} sx={{ alignSelf: "center" }}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                alignItems={{ xs: "stretch", md: "center" }}
                spacing={1}
                sx={{ width: { xs: "100%", md: "auto" } }}
              >
                <Typography component="label" variant="body2" sx={{ whiteSpace: "nowrap" }}>
                  Version
                </Typography>
                <Box sx={{ width: { xs: "100%", md: "auto" }, minWidth: 72 }}>
                  <select
                    value={selectedVersionNum}
                    onChange={handleVersionChange}
                    style={{ width: "100%", minWidth: 72, boxSizing: "border-box" }}
                  >
                    {allVersions.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </Box>
              </Stack>
            </Grid>
          )}
        </Grid>
      </Card>
      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
        <Tab label="Info" />
        <Tab label="Statistics" />
        <Tab label="Night Order" />
        <Tab label="Version History" />
      </Tabs>
      {tabValue === 0 && (
        <><FullRoleList setup={setup} compact={isPhoneDevice} />
          <TwoPanelLayout
          left={
            <>
              <div className="box-panel">
                <div className="heading">Description</div>
                <div
                  className={`content${isSetupCreator && !editingDescription ? " edit" : ""}`}
                  onClick={onDescriptionClick}
                  style={{ cursor: isSetupCreator && !editingDescription ? "pointer" : undefined }}
                >
                  {!editingDescription ? (
                    <div className="md-content">
                      <CustomMarkdown>{description || (isSetupCreator ? "Click to edit description (e.g. theme, tips, notes)." : "No description.")}</CustomMarkdown>
                    </div>
                  ) : (
                    <>
                      <TextEditor value={description} onChange={setDescription} />
                      <div className="buttons" style={{ marginTop: 8 }}>
                        <div className="btn btn-theme" onClick={onSaveDescription}>
                          Submit
                        </div>
                        <div className="btn btn-theme-sec" onClick={onCancelEditDescription}>
                          Cancel
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <Box sx={{ mt: 1 }}>
                <Comments fullWidth location={commentLocation} />
              </Box>
            </>
          }
          right={
            <>
              {closedRoleInfo.length > 0 && (
                <div className="box-panel">
                  <div className="heading">Closed Setup Info</div>
                  <div className="content">{closedRoleInfo}</div>
                </div>
              )}
              {user.loggedIn && (
                <div className="box-panel">
                  <div className="heading">Setup Panel</div>
                  <div className="content">
                    <SetupManipulationButtons
                      setup={setup}
                      onFav={onFavSetup}
                      onEdit={onEditSetup}
                      onCopy={onCopySetup}
                      onDel={onDelSetup}
                    />
                  </div>
                </div>
              )}
              <SetupStrategiesSection setupId={setupId} />
            </>
          }
        />
        </>
      )}
      {tabValue === 1 && (
        <Box>
          <Box className="box-panel" sx={{ mb: 2 }}>
            <div className="heading">Setup activity</div>
            <div className="content">
              <Typography variant="body2" color="text.secondary">
                {"Favorited "}
                {setup.favorites ?? 0}
                {" times!"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {"Played "}
                {setup.playedCount ?? 0}
                {" times!"}
              </Typography>
            </div>
          </Box>
          {shouldDisplayStats && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  alignItems={{ sm: "center" }}
                  flexWrap="wrap"
                >
                  <Typography component="label" variant="body2" sx={{ whiteSpace: "nowrap" }}>
                    View
                  </Typography>
                  <Box sx={{ minWidth: 120 }}>
                    <select
                      value={statsViewMode}
                      onChange={(e) => setStatsViewMode(e.target.value)}
                      style={{ width: "100%", boxSizing: "border-box" }}
                    >
                      <option value="alignment">Alignment</option>
                      <option value="role">Role</option>
                    </select>
                  </Box>
                  <Typography
                    component="label"
                    variant="body2"
                    sx={{ whiteSpace: "nowrap", ml: { sm: 1 } }}
                  >
                    Game type
                  </Typography>
                  <Box sx={{ minWidth: 120 }}>
                    <select
                      value={statsGameFilter}
                      onChange={(e) => setStatsGameFilter(e.target.value)}
                      style={{ width: "100%", boxSizing: "border-box" }}
                    >
                      <option value="all">All</option>
                      <option value="unranked">Unranked</option>
                      <option value="ranked">Ranked</option>
                      <option value="competitive">Competitive</option>
                    </select>
                  </Box>
                </Stack>
              </Grid>
              <Grid item xs={12} md={8}>
                <div className="box-panel">
                  <div className="heading">
                    v{selectedVersionNum} win rates (n = {versionGamesPlayed})
                  </div>
                  <div className="content">
                    {statsBundle?.hasGranular ? (
                      <SetupWinRateBars
                        rows={
                          statsViewMode === "alignment"
                            ? statsBundle.granular[statsGameFilter]?.alignment
                            : statsBundle.granular[statsGameFilter]?.role
                        }
                        rolesRaw={siteInfo?.rolesRaw?.Mafia}
                        emptyLabel={
                          statsGameFilter !== "all"
                            ? "No games for this filter yet. Try “All” or wait for more data."
                            : "No per-game statistics recorded yet."
                        }
                      />
                    ) : (
                      <>
                        {pieData &&
                          Object.keys(pieData.data).length > 0 &&
                          statsGameFilter === "all" && (
                            <PieChart
                              data={pieData.data}
                              colors={pieData.colors}
                              displayPieChart={true}
                              suffixFn={(value) =>
                                ` ${(100 * Number.parseFloat(value)).toFixed(0)}%`
                              }
                            />
                          )}
                        {statsGameFilter !== "all" && (
                          <Typography variant="body2" color="text.secondary">
                            Filtered breakdowns need per-game statistics. Legacy data only supports
                            the overview pie chart for “All” games.
                          </Typography>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </Grid>
              <Grid item xs={12} md={4}>
                <div className="box-panel">
                  <div className="heading">Summary</div>
                  <div className="content">
                    <Typography variant="body2" color="text.secondary">
                      Average length:{" "}
                      {formatAvgLengthMs(
                        statsBundle?.granular?.[statsGameFilter]?.averageLengthMs
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Total vegs (games excluded from stats): {statsBundle?.totalVegs ?? 0}
                    </Typography>
                  </div>
                </div>
              </Grid>
            </Grid>
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
                    <TableCell sx={{ verticalAlign: "middle" }}>Role</TableCell>
                    <TableCell sx={{ verticalAlign: "middle" }}>Action</TableCell>
                    <TableCell sx={{ verticalAlign: "middle" }}>Priority</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {nightOrderTableRows.map((row, idx) => (
                    <TableRow
                      key={`${row.roleName}-${row.actionName}-${idx}`}
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell component="th" scope="row" align="center" sx={{ verticalAlign: "middle" }}>
                        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                          {row.roleIcon}
                          <span>{row.roleName}</span>
                        </Stack>
                      </TableCell>
                      <TableCell align="center" sx={{ verticalAlign: "middle" }}>{row.actionName}</TableCell>
                      <TableCell align="center" sx={{ verticalAlign: "middle" }}>{row.nightOrder}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      )}
      {tabValue === 3 && (
        <TwoPanelLayout
          left={
            <>
              {shouldDisplayChangelog ? (
                <div className="box-panel">
                  <div className="heading">
                    Changelog for v{selectedVersionNum} ({localDateString})
                  </div>
                  <div>
                    <Changelog diff={diff} />
                  </div>
                </div>
              ) : (
                <div className="box-panel">
                  <div className="content">
                    <Typography color="text.secondary">
                      Version history is only available for Mafia setups.
                    </Typography>
                  </div>
                </div>
              )}
            </>
          }
          right={
            <div className="box-panel">
              <div className="heading">Lineage</div>
              <div className="content">
                {lineage == null ? (
                  <Typography variant="body2" color="text.secondary">
                    Loading…
                  </Typography>
                ) : (lineage.copiedFrom || lineage.copiedTo?.length > 0) ? (
                  <>
                    {lineage.copiedFrom && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Copied from
                        </Typography>
                        <Link
                          component={RouterLink}
                          to={`/learn/setup/${lineage.copiedFrom.setup.id}`}
                          underline="hover"
                          sx={{ display: "block" }}
                        >
                          <Box sx={{ p: 1, borderRadius: 1, bgcolor: "action.hover" }}>
                            <SetupDisplay setup={lineage.copiedFrom.setup} disablePopover />
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                              {lineage.copiedFrom.copiedAt
                                ? new Date(lineage.copiedFrom.copiedAt).toLocaleDateString()
                                : ""}
                            </Typography>
                          </Box>
                        </Link>
                      </Box>
                    )}
                    {lineage.copiedTo?.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Copied to
                        </Typography>
                        <Stack spacing={1}>
                          {lineage.copiedTo.map(({ setup: s, copiedAt }) => (
                            <Link
                              key={s.id}
                              component={RouterLink}
                              to={`/learn/setup/${s.id}`}
                              underline="hover"
                              sx={{ display: "block" }}
                            >
                              <Box sx={{ p: 1, borderRadius: 1, bgcolor: "action.hover" }}>
                                <SetupDisplay setup={s} disablePopover />
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                                  {copiedAt ? new Date(copiedAt).toLocaleDateString() : ""}
                                </Typography>
                              </Box>
                            </Link>
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No lineage to display.
                  </Typography>
                )}
              </div>
            </div>
          }
        />
      )}
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
