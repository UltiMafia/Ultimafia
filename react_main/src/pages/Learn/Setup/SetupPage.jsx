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
  Chip,
  Grid,
  IconButton,
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
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import ModerationSideDrawer from "components/ModerationSideDrawer";
import { useErrorAlert } from "components/Alerts";
import {
  getAlignmentColor,
  FullRoleList,
  SetupManipulationButtons,
} from "components/Setup";
import SetupDisplay from "components/Setup";
import GameIcon from "components/GameIcon";
import HostGameDialogue from "components/HostGameDialogue";
import { UserContext, SiteInfoContext } from "Contexts";

import Comments from "pages/Community/Comments";
import vegIcon from "images/emotes/veg.webp";
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
  return `${(ms / 60000).toFixed(1)} min`;
}

function weightedAvgMs(aMs, aCount, bMs, bCount) {
  const aValid = aMs != null && !Number.isNaN(aMs) && aCount > 0;
  const bValid = bMs != null && !Number.isNaN(bMs) && bCount > 0;
  if (!aValid && !bValid) return null;
  if (!aValid) return bMs;
  if (!bValid) return aMs;
  return (aMs * aCount + bMs * bCount) / (aCount + bCount);
}

function avgLengthColor(ms) {
  if (ms == null || Number.isNaN(ms)) return "#888";
  const minutes = ms / 60000;
  if (minutes < 10) return "#4caf50";
  if (minutes < 30) return "#ff9800";
  return "#e45050";
}

export function SetupPage() {
  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const theme = useTheme();
  const isLightMode = theme.palette.mode === "light";
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
  const [versionHistory, setVersionHistory] = useState(null); // [{ version, timestamp, diff }] newest first
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
  // Intentionally do not pass competitive — the comp state is expressed via
  // the pill, not the banner. Banner stays whichever ranked/lobby color it
  // would otherwise have.
  const setupHeadingBackgroundColor = getSetupBackgroundColor(colorInfo, true);
  // In dark mode, force white + drop shadow so text is readable on any of
  // the pastel/gold/pink banner colors. In light mode, use near-black text
  // without a shadow — the same pastels are bright enough that white text
  // disappears.
  const headerTextColor = isLightMode ? "#141414" : "#fff";
  const headerTextShadow = isLightMode ? "none" : "0 1px 3px rgba(0,0,0,0.75)";

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

  useEffect(() => {
    if (
      setupId &&
      tabValue === 3 &&
      shouldDisplayChangelog &&
      currentVersionNum != null &&
      versionHistory == null
    ) {
      // v0 is the initial creation — skip it; only show incremental changes.
      const versions = Array.from(
        Array(currentVersionNum + 1).keys()
      )
        .filter((v) => v > 0)
        .reverse();
      Promise.all(
        versions.map((v) =>
          axios
            .get(`/api/setup/${setupId}/version/${v}`)
            .then((res) => {
              const sv = res.data;
              let parsed = [];
              if (sv.changelog) {
                try {
                  parsed = JSON.parse(sv.changelog);
                } catch (e) {
                  parsed = [];
                }
              }
              return { version: v, timestamp: sv.timestamp, diff: parsed };
            })
            .catch(() => ({ version: v, timestamp: null, diff: [] }))
        )
      ).then(setVersionHistory);
    }
  }, [setupId, tabValue, shouldDisplayChangelog, currentVersionNum, versionHistory]);

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

  const canToggleRanked = !!user.perms?.approveRanked;
  const canToggleComp = !!user.perms?.approveCompetitive;
  const canArchive = !!user.perms?.archiveSetup;

  function onArchiveSetup() {
    if (!canArchive) return;
    if (
      !window.confirm(
        "Archive this setup? Ownership will transfer to the archive user."
      )
    )
      return;
    axios
      .post("/api/setup/archive", { id: setupId })
      .then(() => {
        siteInfo.showAlert("Setup archived.", "success");
        navigate(0);
      })
      .catch(errorAlert);
  }

  function onToggleRanked() {
    if (!canToggleRanked) return;
    axios
      .post("/api/setup/ranked", { setupId })
      .then(() => {
        setSetup((prev) => (prev ? { ...prev, ranked: !prev.ranked } : prev));
        siteInfo.showAlert("Ranked status toggled.", "success");
      })
      .catch(errorAlert);
  }

  function onToggleComp() {
    if (!canToggleComp) return;
    axios
      .post("/api/setup/competitive", { setupId })
      .then(() => {
        setSetup((prev) =>
          prev ? { ...prev, competitive: !prev.competitive } : prev
        );
        siteInfo.showAlert("Competitive status toggled.", "success");
      })
      .catch(errorAlert);
  }

  // Preserve the old determineSetupType variants, just rephrased to make
  // the "open" flag unambiguous with "open to play". "Whole" closed setups
  // are the default and don't need a suffix.
  let rolesVisibilityLabel;
  if (!setup.closed) {
    rolesVisibilityLabel =
      Array.isArray(setup.roles) && setup.roles.length > 1
        ? "Closed Roles | Multi"
        : "Open Roles";
  } else if (setup.useRoleGroups) {
    rolesVisibilityLabel = "Closed Roles | Groups";
  } else {
    rolesVisibilityLabel = "Closed Roles";
  }

  // Map roleKey -> slots per game. Setup keys use trailing ":" for no-modifier
  // (e.g. "Villager:") while stats rows drop it ("Villager"), so normalize.
  const roleSlotCounts = {};
  (Array.isArray(setup.roles) ? setup.roles : []).forEach((group) => {
    if (!group) return;
    Object.entries(group).forEach(([roleKey, count]) => {
      const normalized = roleKey.endsWith(":") ? roleKey.slice(0, -1) : roleKey;
      roleSlotCounts[normalized] = (roleSlotCounts[normalized] || 0) + count;
    });
  });

  function normalizeRoleRows(rows) {
    if (!rows) return rows;
    return rows.map((row) => {
      const slots = roleSlotCounts[row.key];
      if (!slots || slots <= 1) return row;
      return { ...row, totalGames: Math.round(row.totalGames / slots) };
    });
  }

  function mergeGranularRows(...buckets) {
    const byKey = new Map();
    buckets.forEach((bucket) => {
      (bucket || []).forEach((row) => {
        const existing = byKey.get(row.key);
        if (!existing) {
          byKey.set(row.key, { ...row });
        } else {
          const total = existing.totalGames + row.totalGames;
          const weightedRate =
            total > 0
              ? (existing.winRate * existing.totalGames +
                  row.winRate * row.totalGames) /
                total
              : 0;
          existing.totalGames = total;
          existing.winRate = weightedRate;
        }
      });
    });
    return Array.from(byKey.values()).sort((a, b) => b.winRate - a.winRate);
  }

  function getGranularForFilter(filter) {
    const granular = statsBundle?.granular;
    if (!granular) return null;
    if (filter === "rankedComp") {
      const ranked = granular.ranked || {};
      const comp = granular.competitive || {};
      return {
        alignment: mergeGranularRows(ranked.alignment, comp.alignment),
        role: mergeGranularRows(ranked.role, comp.role),
        averageLengthMs: weightedAvgMs(
          ranked.averageLengthMs,
          (ranked.alignment || []).reduce((s, r) => s + r.totalGames, 0),
          comp.averageLengthMs,
          (comp.alignment || []).reduce((s, r) => s + r.totalGames, 0)
        ),
      };
    }
    return granular[filter];
  }

  const mergedGranular = getGranularForFilter(statsGameFilter);

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
          // Universal legibility layer: in dark mode, white text with a
          // drop shadow reads well on pink/gold/pastel banners. In light
          // mode those same pastels are bright, so switch to dark text.
          color: headerTextColor,
          textShadow: headerTextShadow,
          "& .MuiTypography-root": {
            color: headerTextColor,
            textShadow: headerTextShadow,
          },
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
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", md: "center" }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
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
          </Stack>

          <Stack direction="column" spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
            >
              <Typography variant="h2" sx={{ mr: 0.5 }}>
                {setup.name}
              </Typography>
              <Chip
                label={rolesVisibilityLabel}
                size="small"
                sx={{
                  backgroundColor: "rgba(0,0,0,0.55)",
                  color: "#fff",
                  fontWeight: 600,
                  border: "1px solid rgba(255,255,255,0.25)",
                  textShadow: "none",
                  "& .MuiChip-label": { textShadow: "none" },
                }}
              />
              <StatusPill
                active={setup.ranked}
                canToggle={canToggleRanked}
                onClick={onToggleRanked}
                icon="fa-trophy"
                label="Ranked"
                color="#e45050"
              />
              <StatusPill
                active={setup.competitive}
                canToggle={canToggleComp}
                onClick={onToggleComp}
                icon="fa-crown"
                label="Comp"
                color="#ebd722"
                activeTextColor="#000"
              />
            </Stack>
            {setup.creator && (
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Typography variant="caption" sx={{ opacity: 0.85 }}>
                  Created by
                </Typography>
                <NameWithAvatar
                  small
                  id={setup.creator.id}
                  name={setup.creator.name}
                  avatar={setup.creator.avatar}
                />
                {canArchive && !setup.creator.name && (
                  <Button
                    size="small"
                    onClick={onArchiveSetup}
                    sx={{
                      textTransform: "none",
                      textShadow: "none",
                      fontWeight: 600,
                      borderRadius: 999,
                      py: 0.15,
                      px: 1.25,
                      minHeight: 0,
                      lineHeight: 1.4,
                      color: isLightMode ? "#2e7d32" : "#a5d6a7",
                      backgroundColor: isLightMode
                        ? "rgba(46, 125, 50, 0.12)"
                        : "rgba(129, 199, 132, 0.16)",
                      border: "1px solid",
                      borderColor: isLightMode
                        ? "rgba(46, 125, 50, 0.35)"
                        : "rgba(129, 199, 132, 0.35)",
                      "&:hover": {
                        backgroundColor: isLightMode
                          ? "rgba(46, 125, 50, 0.2)"
                          : "rgba(129, 199, 132, 0.26)",
                      },
                    }}
                  >
                    Archive
                  </Button>
                )}
              </Stack>
            )}
          </Stack>

          <Stack
            direction="column"
            spacing={1}
            alignItems={{ xs: "flex-start", md: "flex-end" }}
          >
            <Button
              onClick={() => setIshostGameDialogueOpen(true)}
              sx={{ textShadow: "none" }}
            >
              Host
            </Button>
            {shouldDisplayStats && (
              <Stack
                direction="column"
                spacing={0.5}
                alignItems={{ xs: "flex-start", md: "flex-end" }}
              >
              <Typography
                variant="overline"
                sx={{
                  fontSize: "0.65rem",
                  letterSpacing: "0.12em",
                  opacity: 0.7,
                  lineHeight: 1,
                }}
              >
                Version
              </Typography>
              <Select
                value={selectedVersionNum}
                onChange={(e) =>
                  handleVersionChange({ target: { value: e.target.value } })
                }
                variant="standard"
                disableUnderline
                IconComponent={(props) => (
                  <i
                    {...props}
                    className={`fas fa-chevron-down ${props.className || ""}`}
                    style={{ fontSize: "0.7rem", right: 10 }}
                  />
                )}
                sx={{
                  minWidth: 72,
                  backgroundColor: "rgba(0,0,0,0.55)",
                  borderRadius: 999,
                  px: 1.5,
                  py: 0.25,
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.2)",
                  transition: "border-color 120ms, background-color 120ms",
                  "&:hover": {
                    borderColor: "rgba(255,255,255,0.45)",
                    backgroundColor: "rgba(0,0,0,0.35)",
                  },
                  "& .MuiSelect-select": {
                    paddingTop: "2px",
                    paddingBottom: "2px",
                    paddingRight: "28px !important",
                  },
                  "& .MuiSelect-icon": {
                    color: "rgba(255,255,255,0.7)",
                    top: "calc(50% - 0.35em)",
                  },
                }}
              >
                {allVersions.map((v) => (
                  <MenuItem key={v} value={v}>
                    v{v}
                  </MenuItem>
                ))}
              </Select>
              </Stack>
            )}
          </Stack>
        </Stack>
      </Card>
      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
        <Tab label="Info" />
        <Tab label="Statistics" />
        <Tab label="Night Order" />
        <Tab label="Version History" />
      </Tabs>
      {tabValue === 0 && (
        <>
          <Box sx={{ mb: 1 }}>
            <StatBadge
              icon="fa-users"
              iconColor="#68a9dc"
              label="Roster"
              value={setup.total}
              suffix="players"
              compact
            />
          </Box>
          <FullRoleList setup={setup} compact={isPhoneDevice} />
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
                  <div className="heading">Actions</div>
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
          {(() => {
            const avgMs = mergedGranular?.averageLengthMs;
            const avgColor = avgLengthColor(avgMs);
            return (
              <Stack
                direction="row"
                spacing={2}
                flexWrap="wrap"
                useFlexGap
                sx={{ mb: 2 }}
              >
                <StatBadge
                  icon="fa-star"
                  iconColor="#ebd722"
                  label="Favorited"
                  value={setup.favorites ?? 0}
                  suffix="times"
                />
                <StatBadge
                  icon="fa-dice"
                  iconColor="#4caf50"
                  label="Played"
                  value={setup.playedCount ?? 0}
                  suffix="games"
                />
                {shouldDisplayStats && statsBundle && (
                  <>
                    <StatBadge
                      icon="fa-clock"
                      iconColor={avgColor}
                      label="Average length"
                      value={formatAvgLengthMs(avgMs)}
                    />
                    <StatBadge
                      iconImage={vegIcon}
                      iconColor="#8a8a8a"
                      label="Vegged games"
                      value={statsBundle?.totalVegs ?? 0}
                    />
                  </>
                )}
              </Stack>
            );
          })()}
          {shouldDisplayStats && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Stack direction="column" spacing={0.75}>
                  <Typography
                    variant="overline"
                    sx={{
                      fontSize: "0.7rem",
                      letterSpacing: "0.1em",
                      opacity: 0.6,
                      lineHeight: 1,
                    }}
                  >
                    Game type
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {[
                      { value: "all", label: "All" },
                      { value: "unranked", label: "Unranked" },
                      { value: "ranked", label: "Ranked", accent: "#e45050" },
                      { value: "competitive", label: "Competitive", accent: "#ebd722" },
                      { value: "rankedComp", label: "Ranked + Comp", accent: "#ff9800" },
                    ].map((opt) => {
                      const selected = statsGameFilter === opt.value;
                      const accent = opt.accent;
                      const g = getGranularForFilter(opt.value);
                      const hasData =
                        !!g &&
                        ((g.alignment && g.alignment.length > 0) ||
                          (g.role && g.role.length > 0));
                      return (
                        <Box
                          key={opt.value}
                          component="button"
                          disabled={!hasData}
                          onClick={() => hasData && setStatsGameFilter(opt.value)}
                          sx={{
                            cursor: hasData ? "pointer" : "not-allowed",
                            px: 1.75,
                            py: 0.5,
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            borderRadius: "6px",
                            border: 1,
                            borderColor: selected
                              ? accent || "text.primary"
                              : "divider",
                            backgroundColor: selected
                              ? accent
                                ? `${accent}22`
                                : "action.selected"
                              : "transparent",
                            color: selected
                              ? accent || "text.primary"
                              : "text.secondary",
                            opacity: hasData ? 1 : 0.35,
                            filter: hasData ? undefined : "grayscale(1)",
                            transition: "all 120ms",
                            "&:hover": hasData
                              ? {
                                  borderColor: accent || "text.primary",
                                  color: accent || "text.primary",
                                }
                              : undefined,
                          }}
                        >
                          {opt.label}
                        </Box>
                      );
                    })}
                  </Stack>
                </Stack>
              </Grid>
              <Grid item xs={12}>
                <div className="box-panel">
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    flexWrap="wrap"
                    sx={{ px: 2, pt: 1.5, pb: 0.5, gap: 1 }}
                  >
                    <Box>
                      <Typography
                        component="span"
                        sx={{ fontWeight: 700, fontSize: "1.25rem" }}
                      >
                        Win Rates
                      </Typography>
                      <Typography
                        component="span"
                        variant="body2"
                        sx={{ ml: 1, opacity: 0.6, fontWeight: 400 }}
                      >
                        {`· Total: ${versionGamesPlayed} games`}
                      </Typography>
                    </Box>
                    <ToggleButtonGroup
                      size="small"
                      exclusive
                      value={statsViewMode}
                      onChange={(_, v) => v && setStatsViewMode(v)}
                      sx={{
                        borderRadius: 999,
                        backgroundColor: "action.hover",
                        padding: "3px",
                        border: 1,
                        borderColor: "divider",
                        "& .MuiToggleButton-root": {
                          px: 2,
                          py: 0.25,
                          fontSize: "0.75rem",
                          textTransform: "none",
                          fontWeight: 600,
                          border: "none",
                          borderRadius: "999px !important",
                          color: "text.secondary",
                          "&:hover": { backgroundColor: "action.hover" },
                        },
                        "& .MuiToggleButton-root.Mui-selected": {
                          backgroundColor: "action.selected",
                          color: "text.primary",
                          "&:hover": { backgroundColor: "action.selected" },
                        },
                      }}
                    >
                      <ToggleButton value="alignment">Alignment</ToggleButton>
                      <ToggleButton value="role">Role</ToggleButton>
                    </ToggleButtonGroup>
                  </Stack>
                  <Box sx={{ maxWidth: 720, px: 2, pb: 2 }}>
                    {statsBundle?.hasGranular ? (
                      <SetupWinRateBars
                        rows={
                          statsViewMode === "role"
                            ? normalizeRoleRows(mergedGranular?.role)
                            : mergedGranular?.alignment
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
                  </Box>
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
                versionHistory == null ? (
                  <div className="box-panel">
                    <div className="content">
                      <Typography variant="body2" color="text.secondary">
                        Loading version history…
                      </Typography>
                    </div>
                  </div>
                ) : (
                  <Stack spacing={1.5}>
                    {versionHistory.map((entry) => (
                      <div key={entry.version} className="box-panel">
                        <div className="heading">
                          <Stack
                            direction="row"
                            alignItems="baseline"
                            spacing={1}
                            flexWrap="wrap"
                          >
                            <span>{`v${entry.version}`}</span>
                            {entry.timestamp && (
                              <Typography
                                component="span"
                                variant="body2"
                                sx={{ opacity: 0.55, fontWeight: 400 }}
                              >
                                {new Date(entry.timestamp).toLocaleString()}
                              </Typography>
                            )}
                          </Stack>
                        </div>
                        <Changelog diff={entry.diff} />
                      </div>
                    ))}
                  </Stack>
                )
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

// Pastel colors like #ebd722 (gold) disappear on a white background, so map
// them to a darker variant that still reads cleanly in light mode.
const LIGHT_MODE_COLOR_OVERRIDES = {
  "#ebd722": "#b8860b", // gold → dark goldenrod
  "#4caf50": "#2e7d32", // green → darker green
  "#68a9dc": "#1565c0", // blue → darker blue
  "#ff9800": "#ed6c02", // orange → darker orange
  "#e45050": "#c62828", // red → darker red
};

function StatBadge({ icon, iconImage, iconColor, label, value, suffix, compact }) {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";
  const displayColor = isLight
    ? LIGHT_MODE_COLOR_OVERRIDES[iconColor] || iconColor
    : iconColor;
  const iconSize = compact ? 32 : 44;
  const iconFont = compact ? "0.95rem" : "1.2rem";
  const valueVariant = compact ? "h5" : "h3";
  // Light-mode needs a denser background/border because the alpha blends
  // against white are otherwise invisible.
  const cardBgAlpha = isLight ? "22" : "14";
  const cardBorderAlpha = isLight ? "77" : "40";
  const iconBgAlpha = isLight ? "33" : "26";
  return (
    <Box
      sx={{
        flex: compact ? "0 0 auto" : 1,
        minWidth: compact ? 0 : 140,
        display: "inline-flex",
        alignItems: "center",
        gap: compact ? 1 : 1.5,
        px: compact ? 1.25 : 2,
        py: compact ? 0.75 : 1.25,
        borderRadius: 2,
        backgroundColor: `${displayColor}${cardBgAlpha}`,
        border: `1px solid ${displayColor}${cardBorderAlpha}`,
      }}
    >
      <Box
        sx={{
          width: iconSize,
          height: iconSize,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: `${displayColor}${iconBgAlpha}`,
          flexShrink: 0,
        }}
      >
        {iconImage ? (
          <img
            src={iconImage}
            alt={label}
            style={{
              width: compact ? 18 : 24,
              height: compact ? 18 : 24,
            }}
          />
        ) : (
          <i
            className={`fas ${icon}`}
            style={{ color: displayColor, fontSize: iconFont }}
          />
        )}
      </Box>
      <Stack spacing={0}>
        <Typography
          variant="caption"
          sx={{
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            opacity: 0.65,
            lineHeight: 1.2,
            fontSize: compact ? "0.65rem" : undefined,
          }}
        >
          {label}
        </Typography>
        <Stack direction="row" alignItems="baseline" spacing={0.75}>
          <Typography
            variant={valueVariant}
            sx={{
              color: isLight ? "text.primary" : displayColor,
              fontWeight: 700,
              lineHeight: 1.1,
            }}
          >
            {value}
          </Typography>
          {suffix && (
            <Typography variant="caption" sx={{ opacity: 0.55 }}>
              {suffix}
            </Typography>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}

function StatusPill({ active, canToggle, onClick, icon, label, color, activeTextColor }) {
  const textColor = activeTextColor || "#fff";
  const pill = (
    <Box
      component="button"
      type="button"
      disabled={!canToggle}
      onClick={canToggle ? onClick : undefined}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        flex: "0 0 auto",
        flexShrink: 0,
        width: "max-content",
        whiteSpace: "nowrap",
        gap: 0.5,
        px: 1,
        py: 0.25,
        m: 0,
        borderRadius: 999,
        fontFamily: "inherit",
        fontSize: "0.75rem",
        fontWeight: 700,
        lineHeight: 1.4,
        border: `2px solid ${color}`,
        backgroundColor: active ? color : "rgba(0,0,0,0.7)",
        color: active ? textColor : "#fff",
        opacity: active ? 1 : 0.9,
        textShadow: "none",
        boxShadow: active
          ? "0 1px 4px rgba(0,0,0,0.35)"
          : "0 1px 2px rgba(0,0,0,0.25)",
        cursor: canToggle ? "pointer" : "default",
        textTransform: "uppercase",
        letterSpacing: "0.03em",
        transition: "opacity 120ms, background-color 120ms",
        "&:hover": canToggle ? { opacity: 1 } : undefined,
        "&:disabled": { cursor: "default" },
      }}
    >
      <i
        className={`fas ${icon}`}
        style={{
          fontSize: "0.7rem",
          color: active ? textColor : color,
        }}
      />
      {label}
    </Box>
  );
  const tooltipText = `${label}${active ? "" : " (inactive)"}${
    canToggle ? " — click to toggle" : ""
  }`;
  return <Tooltip title={tooltipText}>{pill}</Tooltip>;
}

// Before the backend manifest generator was fixed, the game-settings block
// of each manifest used array indices instead of setting names, producing
// noise like "- 12: false". Relabel them when we encounter one so the diff
// at least communicates that it is legacy data rather than a real setting.
const LEGACY_SETTING_LINE = /^(\s*-\s*)(\d+)(\s*:\s*(?:true|false)\s*)$/i;

// Takes a diff object from https://www.npmjs.com/package/diff
// Renders only added/removed lines — context is stripped for compactness.
function Changelog({ diff }) {
  const changedLines = [];
  (diff || []).forEach((part) => {
    if (!part.added && !part.removed) return;
    const text = part.value.replace(/\n+$/, "");
    if (!text) return;
    text.split("\n").forEach((line) => {
      if (!line.trim()) return;
      const cleaned = line.replace(
        LEGACY_SETTING_LINE,
        (_, before, idx, after) => `${before}legacy setting #${idx}${after}`
      );
      changedLines.push({ added: !!part.added, line: cleaned });
    });
  });

  if (changedLines.length === 0) {
    return (
      <div className="changelog">
        <p className="changelog-empty">No changes in this version.</p>
      </div>
    );
  }

  return (
    <div className="changelog">
      {changedLines.map((entry, i) => (
        <p
          key={i}
          className={entry.added ? "color-added" : "color-removed"}
        >
          <span className="diff-marker">{entry.added ? "+" : "−"}</span>
          {entry.line}
        </p>
      ))}
    </div>
  );
}
