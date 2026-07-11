import React, { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid2,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  TableSortLabel,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useSearchParams } from "react-router-dom";

import { useErrorAlert } from "components/Alerts";
import { Loading } from "components/Loading";
import { PageNav } from "components/Nav";
import TrophyCase from "components/TrophyCase";
import { UserContext } from "Contexts";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";
import { NameWithAvatar } from "pages/User/User";

import { TIER_ICONS } from "utils/skillRating";

const CATEGORY_OPTIONS = [
  { value: "skillRating", label: "Skill Rating" },
  { value: "loot", label: "Loot" },
];

const TIME_RANGE_OPTIONS = [{ value: "all", label: "All Time" }];
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function getColumns(category, isPhoneDevice) {
  const compactColumns = [
    { label: "Rank", sortKey: null },
    { label: "User", sortKey: "username" },
    { label: "Metric", sortKey: null },
  ];
  if (isPhoneDevice) return compactColumns;

  switch (category) {
    case "loot":
      return [
        { label: "Rank", sortKey: null },
        { label: "User", sortKey: "username" },
        { label: "Loot", sortKey: "lootScore" },
        { label: "Trophies", sortKey: null },
        { label: "Kudos", sortKey: "kudos" },
        { label: "Karma", sortKey: "karma" },
        { label: "Achievements", sortKey: "achievementsCount" },
        { label: "Scrapbook", sortKey: "scrapbookCompletion" },
      ];
    case "skillRating":
    default:
      return [
        { label: "Rank", sortKey: null },
        { label: "User", sortKey: "username" },
        { label: "Tier", sortKey: "skillTier" },
        { label: "Conservative Rank", sortKey: "skillRating" },
        { label: "Rating (μ)", sortKey: "skillMu" },
        { label: "Uncertainty (σ)", sortKey: "skillSigma" },
        { label: "Matches", sortKey: "skillGamesPlayed" },
      ];
  }
}

function renderDesktopCells(user, category) {
  switch (category) {
    case "loot":
      return [
        <Typography variant="body2">{user.lootScore}</Typography>,
        <Box sx={{ overflowX: "clip" }}>
          <TrophyCase
            trophies={user.trophies}
            showHeading={false}
            wrapInPanel={false}
          />
        </Box>,
        <Typography variant="body2">{user.kudos}</Typography>,
        <Typography variant="body2">{user.karma}</Typography>,
        <Typography variant="body2">{user.achievementsCount}</Typography>,
        <Typography variant="body2">{`${user.scrapbookCompletion}%`}</Typography>,
      ];
    case "skillRating":
    default:
      return [
        <Stack direction="row" spacing={1} alignItems="center">
          {TIER_ICONS[user.skillTier] && (
            <img src={TIER_ICONS[user.skillTier]} alt={user.skillTier} style={{ width: 20, height: 20 }} />
          )}
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{user.skillTier}</Typography>
        </Stack>,
        <Typography variant="body2" className="score" sx={{ fontWeight: 700 }}>{user.skillRating}</Typography>,
        <Typography variant="body2" className="score">{user.skillMu}</Typography>,
        <Typography variant="body2" className="score">{user.skillSigma}</Typography>,
        <Typography variant="body2">{user.skillGamesPlayed}</Typography>,
      ];
  }
}

function renderMobileMetric(user, category) {
  switch (category) {
    case "loot":
      return `${user.lootScore} loot`;
    case "skillRating":
    default:
      return (
        <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end">
          {TIER_ICONS[user.skillTier] && (
            <img src={TIER_ICONS[user.skillTier]} alt={user.skillTier} style={{ width: 16, height: 16 }} />
          )}
          <span>{user.skillTier} ({user.skillRating})</span>
        </Stack>
      );
  }
}

const StandingsTable = React.memo(function StandingsTable({
  category,
  users,
  currentUserId,
  isPhoneDevice,
  sortBy,
  sortDirection,
  onSort,
}) {
  const columns = getColumns(category, isPhoneDevice);
  const desktopMetricColumnCount = Math.max(columns.length - 3, 0);
  const desktopGridTemplate = `3em minmax(0, 1.6fr) minmax(0, 1.4fr)${
    desktopMetricColumnCount
      ? ` repeat(${desktopMetricColumnCount}, minmax(4.5em, 0.8fr))`
      : ""
  }`;
  function renderColumnLabel(column) {
    const label = (
      <Typography variant="caption" sx={{ fontWeight: 700 }}>
        {column.label}
      </Typography>
    );
    if (!column.tooltip) return label;
    return (
      <Tooltip title={column.tooltip}>
        <span>{label}</span>
      </Tooltip>
    );
  }

  return (
    <Stack direction="column" spacing={1} divider={<Divider flexItem />}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: isPhoneDevice
            ? "3em minmax(0, 1fr) minmax(0, 7em)"
            : desktopGridTemplate,
          gap: 1,
          alignItems: "center",
          fontWeight: 700,
        }}
      >
        {columns.map((column) =>
          column.sortKey && !isPhoneDevice ? (
            <TableSortLabel
              key={column.label}
              active={sortBy === column.sortKey}
              direction={sortBy === column.sortKey ? sortDirection : "desc"}
              onClick={() => onSort(column.sortKey)}
              sx={{ justifySelf: "start" }}
            >
              {renderColumnLabel(column)}
            </TableSortLabel>
          ) : (
            <Box key={column.label} sx={{ justifySelf: "start" }}>
              {renderColumnLabel(column)}
            </Box>
          )
        )}
      </Box>
      {users.map((user) => {
        const isCurrentUser = currentUserId && user.userId === currentUserId;

        return (
          <Box
            key={user.userId}
            sx={{
              display: "grid",
              gridTemplateColumns: isPhoneDevice
                ? "3em minmax(0, 1fr) minmax(0, 7em)"
                : desktopGridTemplate,
              gap: 1,
              alignItems: "center",
              borderRadius: 1,
              px: 1,
              py: 0.5,
              backgroundColor: isCurrentUser ? "action.selected" : "transparent",
            }}
          >
            <Typography variant="h4">{user.rank}.</Typography>
            <Box sx={{ overflowX: "clip" }}>
              <NameWithAvatar
                id={user.userId}
                name={user.username}
                avatar={user.avatar}
                vanityUrl={user.vanityUrl}
              />
            </Box>
            {isPhoneDevice ? (
              <Stack direction="column" spacing={0.25} sx={{ textAlign: "right" }}>
                <Typography variant="body2">{renderMobileMetric(user, category)}</Typography>
                <Typography variant="caption">
                  {user.wins}W / {user.losses}L
                </Typography>
              </Stack>
            ) : (
              renderDesktopCells(user, category)
            )}
          </Box>
        );
      })}
    </Stack>
  );
});

function SkillRatingAboutContent() {
  return (
    <>
      <Typography variant="body2" sx={{ mb: 1 }}>
        Our leaderboard uses a custom team-summing variant of <strong>OpenSkill</strong>, a Bayesian rating algorithm. It models player skill using two values:
      </Typography>
      <Box component="ul" sx={{ pl: 2, mt: 0, mb: 1, '& li': { mb: 0.5 } }}>
        <li>
          <strong>Skill Estimate (μ / Mu):</strong> The system's estimation of your skill level (defaults to 25.0).
        </li>
        <li>
          <strong>Uncertainty (σ / Sigma):</strong> The system's uncertainty about your rating (defaults to 8.33, decreasing as you play).
        </li>
      </Box>
      <Typography variant="body2" sx={{ mb: 1 }}>
        <strong>Conservative Rank:</strong> Standings are sorted by your conservative rank, calculated as <code>μ - 3 × σ</code>. This represents a statistical lower bound, guaranteeing your true skill is at least this high with 99% confidence. This ensures that new players with high uncertainty must play more games to earn a high position on the leaderboard.
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        <strong>Percentile Tiers:</strong> Active players with at least one match are placed into competitive tiers based on their conservative rank percentiles:
      </Typography>
      <Box component="ul" sx={{ pl: 0, mt: 0, mb: 1, listStyle: 'none', '& li': { display: 'flex', alignItems: 'center', mb: 0.5, gap: 1 } }}>
        <li>
          <img src={TIER_ICONS.Master} alt="Master" style={{ width: 20, height: 20 }} />
          <span><strong>Master:</strong> Top 2% (Percentile &ge; 98)</span>
        </li>
        <li>
          <img src={TIER_ICONS.Diamond} alt="Diamond" style={{ width: 20, height: 20 }} />
          <span><strong>Diamond:</strong> Next 8% (Percentile &ge; 90)</span>
        </li>
        <li>
          <img src={TIER_ICONS.Platinum} alt="Platinum" style={{ width: 20, height: 20 }} />
          <span><strong>Platinum:</strong> Next 15% (Percentile &ge; 75)</span>
        </li>
        <li>
          <img src={TIER_ICONS.Gold} alt="Gold" style={{ width: 20, height: 20 }} />
          <span><strong>Gold:</strong> Next 25% (Percentile &ge; 50)</span>
        </li>
        <li>
          <img src={TIER_ICONS.Silver} alt="Silver" style={{ width: 20, height: 20 }} />
          <span><strong>Silver:</strong> Next 30% (Percentile &ge; 20)</span>
        </li>
        <li>
          <img src={TIER_ICONS.Bronze} alt="Bronze" style={{ width: 20, height: 20 }} />
          <span><strong>Bronze:</strong> Bottom 20% (Percentile &lt; 20)</span>
        </li>
      </Box>
      <Typography variant="body2">
        Only completed ranked or competitive matches are counted.
      </Typography>
    </>
  );
}

export default function HallOfFame() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [skillRatingAboutOpen, setSkillRatingAboutOpen] = useState(false);
  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();
  const isPhoneDevice = useIsPhoneDevice();

  const requestedCategory = searchParams.get("category") || "skillRating";
  const category = CATEGORY_OPTIONS.some((option) => option.value === requestedCategory)
    ? requestedCategory
    : "skillRating";
  const timeRange = searchParams.get("timeRange") || "all";
  const sortBy = searchParams.get("sortBy") || "";
  const sortDirection = searchParams.get("sortDirection") === "asc" ? "asc" : "desc";
  const page = Math.max(Number.parseInt(searchParams.get("page") || "1", 10), 1);
  const pageSize = Math.max(
    Number.parseInt(searchParams.get("pageSize") || "25", 10),
    1
  );
  const minGames = Math.max(
    Number.parseInt(searchParams.get("minGames") || "50", 10),
    0
  );

  useEffect(() => {
    document.title = "Hall of Fame | UltiMafia";
  }, []);

  useEffect(() => {
    setLoading(true);
    axios
      .get("/api/hall-of-fame", {
        params: {
          category,
          page,
          pageSize,
          minGames,
          timeRange,
          sortBy: sortBy || undefined,
          sortDirection,
        },
      })
      .then((response) => {
        setData(response.data);
      })
      .catch(errorAlert)
      .finally(() => {
        setLoading(false);
      });
  }, [category, page, pageSize, minGames, timeRange, sortBy, sortDirection]);

  const filterSummary = useMemo(() => {
    if (!data) return null;
    return `${data.total} ranked players`;
  }, [data]);

  function updateParams(nextValues) {
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      Object.entries(nextValues).forEach(([key, value]) => {
        if (value == null || value === "") nextParams.delete(key);
        else nextParams.set(key, String(value));
      });
      return nextParams;
    });
  }

  useEffect(() => {
    if (requestedCategory !== category) {
      updateParams({ category, sortBy: null, sortDirection: null, page: 1 });
    }
  }, [requestedCategory, category]);

  function handleCategoryChange(_, nextValue) {
    updateParams({
      category: nextValue,
      sortBy: null,
      sortDirection: null,
      page: 1,
    });
  }

  function handleSort(nextSortBy) {
    if (!nextSortBy) return;

    const activeSortBy = data?.sort?.sortBy || sortBy || data?.metric;
    const activeSortDirection = data?.sort?.sortDirection || sortDirection;
    const nextDirection =
      activeSortBy === nextSortBy && activeSortDirection === "desc" ? "asc" : "desc";

    updateParams({
      sortBy: nextSortBy,
      sortDirection: nextDirection,
      page: 1,
    });
  }

  function handleJumpToMyRank() {
    if (!data?.myRank) return;
    updateParams({
      page: Math.ceil(data.myRank / pageSize),
    });
  }

  if (loading && !data) {
    return <Loading />;
  }

  const activeSortBy = data?.sort?.sortBy || sortBy || data?.metric || "skillRating";
  const activeSortDirection = data?.sort?.sortDirection || sortDirection;

  return (
    <Stack direction="column" spacing={1}>
      <Grid2 container columns={isPhoneDevice ? 1 : 3} spacing={1}>
        <Grid2 size={2}>
          <Stack direction="column" spacing={0.5}>
            <Typography variant="h2" sx={{ textAlign: isPhoneDevice ? "center" : "left" }}>
              Hall of Fame
            </Typography>
            <Typography
              variant="body2"
              sx={{ textAlign: isPhoneDevice ? "center" : "left" }}
            >
              Recognition for top players by skill rating and collected loot — trophies,
              kudos, karma, achievements, and scrapbook progress.
            </Typography>
          </Stack>
        </Grid2>
        <Grid2 size={1}>
          <Paper
            elevation={2}
            sx={{
              p: 1.5,
              height: "100%",
            }}
          >
            <Stack direction="column" spacing={0.5}>
              <Typography variant="h4">Current filters</Typography>
              <Typography variant="body2">{filterSummary}</Typography>
              {data?.myRank && (
                <Typography variant="body2">Your rank: #{data.myRank}</Typography>
              )}
            </Stack>
          </Paper>
        </Grid2>
      </Grid2>

      <Tabs
        centered
        value={category}
        onChange={handleCategoryChange}
        variant={isPhoneDevice ? "scrollable" : "standard"}
        allowScrollButtonsMobile
        sx={{
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        {CATEGORY_OPTIONS.map((option) => (
          <Tab key={option.value} label={option.label} value={option.value} />
        ))}
      </Tabs>

      <Paper elevation={2} sx={{ p: 2 }}>
        <Stack direction="column" spacing={1}>
          <Grid2 container columns={isPhoneDevice ? 1 : 5} spacing={1}>
            <Grid2 size={1}>
              <FormControl fullWidth size="small">
                <InputLabel id="hof-time-range-label">Time Range</InputLabel>
                <Select
                  labelId="hof-time-range-label"
                  value={timeRange}
                  label="Time Range"
                  onChange={(event) =>
                    updateParams({
                      timeRange: event.target.value,
                      page: 1,
                    })
                  }
                >
                  {TIME_RANGE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid2>
            <Grid2 size={1}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Min Games"
                value={minGames}
                onChange={(event) =>
                  updateParams({
                    minGames: Math.max(Number(event.target.value || 0), 0),
                    page: 1,
                  })
                }
              />
            </Grid2>
            <Grid2 size={1}>
              <FormControl fullWidth size="small">
                <InputLabel id="hof-page-size-label">Items per page</InputLabel>
                <Select
                  labelId="hof-page-size-label"
                  value={pageSize}
                  label="Items per page"
                  onChange={(event) =>
                    updateParams({
                      pageSize: event.target.value,
                      page: 1,
                    })
                  }
                >
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid2>
            <Grid2 size={1}>
              <FormControl fullWidth size="small" disabled>
                <InputLabel id="hof-game-mode-label">Game Mode</InputLabel>
                <Select labelId="hof-game-mode-label" value="all" label="Game Mode">
                  <MenuItem value="all">All</MenuItem>
                </Select>
              </FormControl>
            </Grid2>
            <Grid2 size={1}>
              <FormControl fullWidth size="small" disabled>
                <InputLabel id="hof-setup-label">Setup</InputLabel>
                <Select labelId="hof-setup-label" value="all" label="Setup">
                  <MenuItem value="all">All</MenuItem>
                </Select>
              </FormControl>
            </Grid2>
          </Grid2>
        </Stack>
      </Paper>

      <Paper elevation={2} sx={{ p: 2 }}>
        <Stack direction="column" spacing={1}>
          <Stack
            direction={isPhoneDevice ? "column" : "row"}
            spacing={1}
            sx={{ alignItems: "center" }}
          >
            <Stack direction="column" spacing={0}>
              <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                <Typography variant="h3">
                  {CATEGORY_OPTIONS.find((option) => option.value === category)?.label} Leaders
                </Typography>
                {category === "skillRating" && (
                  <IconButton
                    onClick={() => setSkillRatingAboutOpen(true)}
                    aria-label="skill rating about"
                  >
                    <i className="fas fa-question-circle" />
                  </IconButton>
                )}
              </Stack>
              <Typography variant="caption">
                Sorted by {data?.metricLabel || "leaderboard metric"} (
                {activeSortDirection === "asc" ? "ascending" : "descending"})
              </Typography>
            </Stack>
            <Box sx={{ marginLeft: isPhoneDevice ? undefined : "auto !important" }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                {user.loggedIn && (
                  <Tooltip title={data?.myRank ? "Jump to your page" : "You are currently unranked"}>
                    <span>
                      <Button
                        variant="outlined"
                        onClick={handleJumpToMyRank}
                        disabled={!data?.myRank}
                      >
                        Jump to My Rank
                      </Button>
                    </span>
                  </Tooltip>
                )}
                <PageNav
                  page={page}
                  maxPage={Math.max(data?.pages || 1, 1)}
                  onNav={(nextPage) => updateParams({ page: nextPage })}
                />
              </Stack>
            </Box>
          </Stack>

          {loading ? (
            <Loading />
          ) : data?.users?.length ? (
            <StandingsTable
              category={category}
              users={data.users}
              currentUserId={user.id}
              isPhoneDevice={isPhoneDevice}
              sortBy={activeSortBy}
              sortDirection={activeSortDirection}
              onSort={handleSort}
            />
          ) : (
            <Typography variant="body2">No ranked users matched the current filters.</Typography>
          )}
        </Stack>
      </Paper>

      <Dialog
        open={skillRatingAboutOpen}
        onClose={() => setSkillRatingAboutOpen(false)}
        maxWidth="sm"
        fullWidth
        scroll="body"
      >
        <DialogTitle>About the Skill Rating System</DialogTitle>
        <DialogContent>
          <SkillRatingAboutContent />
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
