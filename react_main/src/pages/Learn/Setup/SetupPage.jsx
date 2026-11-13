import React, { useState, useEffect, useContext } from "react";
import { UiSection, UiAction, UiField, UiStatRow, UiStat, UiPageHeader, UiTabs, UiTab } from "components/ui";
import {
  Link as RouterLink,
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import { ViewNavigate as Navigate, useViewNavigate as useNavigate } from "hooks/useViewActivity";
import axios from "axios";

import {
  Box,
  Button,
  Grid,
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
import { SetupStrategiesSection } from "components/Strategies";
import { NameWithAvatar } from "pages/User/UserWidgets";
import { TextEditor } from "components/Form";
import CustomMarkdown from "components/CustomMarkdown";
import { Loading } from "components/Loading";
import { VoteWidget } from "components/VoteWidget";

import { RoleCount } from "components/Roles";
import { PieChart } from "./PieChart";
import { SetupWinRateBars } from "./SetupWinRateBars";

import "css/buttons.css";
import "css/setupPage.css";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";
import TwoPanelLayout from "components/SetupProfileLayout";

export default function Setups() {
  return <SetupPage />;
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


  // Night order: flatten setup roles with siteInfo, collect night actions, sort by priority
  let useingRoles = [];
  if (
    setup &&
    Array.isArray(setup.roles) &&
    siteInfo?.rolesRaw?.[setup.gameType]
  ) {
    const rolesRaw = siteInfo.rolesRaw[setup.gameType];
    for (let i = 0; i < setup.roles.length; i++) {
      for (const key of Object.keys(setup.roles[i] || {})) {
        const roleData = rolesRaw[key.split(":")[0]];
        if (roleData) {
          useingRoles.push([key, roleData]);
        }
      }
    }
  }
  const roles = useingRoles;
  const hasMafia = roles.some((r) => r[1].alignment === "Mafia");
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
      spacing={3}
      className="setup-page"
      sx={{
        maxWidth: "100%",
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
      <UiPageHeader
        variant="detail"
        title={setup.name}
        leading={<GameIcon gameType={setup.gameType} size={32} />}
        actions={
          <div className="setup-header-actions">
            <UiAction variant="primary" onClick={() => setIshostGameDialogueOpen(true)}>
              Host game
            </UiAction>
            {shouldDisplayStats && (
              <UiField
                select
                size="small"
                SelectProps={{ native: true }}
                value={selectedVersionNum}
                onChange={(event) => handleVersionChange({ target: { value: event.target.value } })}
              >
                {allVersions.map((version) => (
                  <option key={version} value={version}>v{version}</option>
                ))}
              </UiField>
            )}
          </div>
        }
      >
        <div className="setup-kind-badge">
          {setup.gameType} setup · {setup.total} players
        </div>
        <div className="setup-meta-row">
          <span className="setup-status">{rolesVisibilityLabel}</span>
          <StatusPill
            active={setup.ranked}
            canToggle={canToggleRanked}
            onClick={onToggleRanked}
            label="Ranked"
            color="#e45050"
          />
          <StatusPill
            active={setup.competitive}
            canToggle={canToggleComp}
            onClick={onToggleComp}
            label="Competitive"
            color="#ebd722"
          />
          {setup.creator && (
            <span className="setup-creator-byline">
              Created by{" "}
              <NameWithAvatar
                small
                id={setup.creator.id}
                name={setup.creator.name}
                avatar={setup.creator.avatar}
              />
            </span>
          )}
          {canArchive && !setup.creator.name && (
            <UiAction
              variant="ghost"
              onClick={onArchiveSetup}
              className="setup-archive-action"
            >
              Archive
            </UiAction>
          )}
        </div>
      </UiPageHeader>
      <UiTabs value={tabValue} onChange={(_, v) => setTabValue(v)} variant="scrollable" scrollButtons="auto" aria-label="Setup tabs">
        <UiTab label="Overview" />
        <UiTab label="Statistics" />
        <UiTab label="Night actions" />
        <UiTab label="Version history" />
      </UiTabs>
      {tabValue === 0 && (
        <>
          <UiSection title={setup.closed ? "Possible roles" : "Roles"} className="setup-roster">
            {setup.closed && <p>Hidden roles are drawn from these pools.</p>}
            <FullRoleList setup={setup} compact={isPhoneDevice} showNames />
          </UiSection>
          <div className="setup-overview">
            <div className="setup-description">
              <UiSection title="Description" className="setup-description-section">
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
                        <UiAction variant="primary" onClick={onSaveDescription}>Save description</UiAction>
                        <UiAction onClick={onCancelEditDescription}>Cancel</UiAction>
                      </div>
                    </>
                  )}
                </div>
              </UiSection>
              <UiSection title="Discussion" className="setup-discussion-section"><Comments fullWidth location={commentLocation} /></UiSection>
            </div>
            <aside className="setup-secondary">
              {closedRoleInfo.length > 0 && (
                <div className="box-panel">
                  <div className="heading">Closed Setup Info</div>
                  <div className="content">{closedRoleInfo}</div>
                </div>
              )}
              {user.loggedIn && (
                <UiSection title="Save or customize" className="ui-card">
                  <div className="setup-save-panel">
                    <div className="setup-rating-row">
                      <span>Community rating</span>
                      <div className="role-vote-pill">
                        <VoteWidget item={{ id: setup.id, vote: setup.vote ?? 0, voteCount: setup.voteCount ?? 0 }} itemType="setup" setItemHolder={(newItem) => setSetup(previous => previous?.id === newItem.id ? { ...previous, vote: newItem.vote, voteCount: newItem.voteCount } : previous)} />
                      </div>
                    </div>
                    <div className="setup-save-actions">
                      <SetupManipulationButtons setup={setup} onFav={onFavSetup} onEdit={onEditSetup} onCopy={onCopySetup} onDel={onDelSetup} showLabels />
                    </div>
                  </div>
                </UiSection>
              )}
              <SetupStrategiesSection setupId={setupId} title={setup?.name} />
            </aside>
          </div>
        </>
      )}
      {tabValue === 1 && (
        <Box>
          {(() => {
            const avgMs = mergedGranular?.averageLengthMs;
            return (
              <UiStatRow className="setup-stats">
                <UiStat label="Favorited" value={setup.favorites ?? 0} detail="times" />
                <UiStat label="Played" value={setup.playedCount ?? 0} detail="games" />
                {shouldDisplayStats && statsBundle && <>
                  <UiStat label="Average length" value={formatAvgLengthMs(avgMs)} />
                  <UiStat label="Vegged games" value={statsBundle?.totalVegs ?? 0} />
                </>}
              </UiStatRow>
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
                      { value: "ranked", label: "Ranked" },
                      { value: "competitive", label: "Competitive" },
                      { value: "rankedComp", label: "Ranked + Comp" },
                    ].map((opt) => {
                      const selected = statsGameFilter === opt.value;
                      const g = getGranularForFilter(opt.value);
                      const hasData =
                        !!g &&
                        ((g.alignment && g.alignment.length > 0) ||
                          (g.role && g.role.length > 0));
                      return (
                        <UiAction
                          key={opt.value}
                          variant="ghost"
                          className={`setup-filter${selected ? " is-selected" : ""}`}
                          disabled={!hasData}
                          aria-pressed={selected}
                          onClick={() => hasData && setStatsGameFilter(opt.value)}
                        >
                          {opt.label}
                        </UiAction>
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
                        payouts={
                          statsViewMode === "alignment" &&
                          (setup.ranked || setup.competitive) &&
                          statsBundle?.fortunePayouts
                            ? Object.fromEntries(
                                statsBundle.fortunePayouts.map((p) => [
                                  p.faction,
                                  p,
                                ])
                              )
                            : undefined
                        }
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

function StatusPill({ active, canToggle, onClick, label, color }) {
  if (!active && !canToggle) return null;
  const statusStyle = active && color ? { borderColor: color, color } : undefined;
  if (canToggle) {
    return (
      <UiAction
        variant="ghost"
        className={`setup-status-action ${active ? "is-active" : "is-off"}`}
        style={statusStyle}
        onClick={onClick}
        aria-pressed={!!active}
      >
        {label}: {active ? "on" : "off"}
      </UiAction>
    );
  }
  return <span className="setup-status" style={statusStyle}>{label}</span>;
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
