import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Link as RouterLink } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Button,
  Chip,
  FormControlLabel,
  Grid,
  InputAdornment,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import { SiteInfoContext } from "Contexts";
import { useErrorAlert } from "components/Alerts";
import { Loading } from "components/Loading";
import { NameWithAvatar } from "../User/User";

function CoinAmount({ amount }) {
  return (
    <Stack
      component="span"
      direction="row"
      spacing={0.5}
      sx={{ display: "inline-flex", alignItems: "center" }}
    >
      <span>{Number(amount || 0).toLocaleString()}</span>
      <Box
        component="i"
        className="fas fa-coins"
        aria-label="Coins"
        sx={{ color: "#f5c542", fontSize: "0.95em" }}
      />
    </Stack>
  );
}

function FamilyAvatar({ family }) {
  const siteInfo = useContext(SiteInfoContext);
  const avatarUrl =
    typeof family.avatar === "string"
      ? family.avatar
      : family.avatar
        ? `/uploads/${family.id}_family_avatar.webp?t=${siteInfo.cacheVal}`
        : "";

  return (
    <Box
      sx={{
        width: 64,
        height: 64,
        borderRadius: "50%",
        backgroundColor: "background.default",
        backgroundImage: avatarUrl ? `url(${avatarUrl})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        border: "1px solid",
        borderColor: "divider",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {!avatarUrl && (
        <Box
          component="i"
          className="fas fa-users"
          aria-hidden="true"
          sx={{ color: "text.secondary", fontSize: 24 }}
        />
      )}
    </Box>
  );
}

function FamilyCard({ family }) {
  return (
    <Paper
      sx={{
        p: 2,
        height: "100%",
        borderRadius: "4px",
        backgroundColor: "var(--scheme-color)",
      }}
    >
      <Stack direction="column" spacing={1.5} sx={{ height: "100%" }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <FamilyAvatar family={family} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="h3"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {family.name}
            </Typography>
            {family.leader && (
              <Typography
                component="div"
                variant="caption"
                color="text.secondary"
              >
                Led by{" "}
                <NameWithAvatar
                  id={family.leader.id}
                  name={family.leader.name}
                  avatar={family.leader.avatar}
                  vanityUrl={family.leader.vanityUrl}
                />
              </Typography>
            )}
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
          <Chip
            size="small"
            color={family.applicationsOpen ? "success" : "default"}
            icon={
              <Box
                component="i"
                className={
                  family.applicationsOpen ? "fas fa-door-open" : "fas fa-lock"
                }
                aria-hidden="true"
              />
            }
            label={family.applicationsOpen ? "Applications Open" : "Closed"}
          />
          <Chip
            size="small"
            icon={
              <Box component="i" className="fas fa-users" aria-hidden="true" />
            }
            label={`${family.memberCount}/${family.memberLimit}`}
            variant="outlined"
          />
          <Chip
            size="small"
            icon={
              <Box component="i" className="fas fa-star" aria-hidden="true" />
            }
            label={`${family.score} pts`}
            variant="outlined"
          />
        </Stack>

        {family.bioPreview && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              minHeight: 40,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {family.bioPreview}
          </Typography>
        )}

        <Grid container spacing={1} sx={{ mt: "auto" }}>
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary">
              Treasury
            </Typography>
            <Typography variant="body2">
              <CoinAmount amount={family.treasury} />
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary">
              Trophies
            </Typography>
            <Typography variant="body2">{family.trophyCount}</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary">
              Perks
            </Typography>
            <Typography variant="body2">{family.perkCount}</Typography>
          </Grid>
        </Grid>

        <Button
          component={RouterLink}
          to={`/user/family/${family.id}`}
          variant="contained"
          size="small"
          startIcon={
            <Box component="i" className="fas fa-eye" aria-hidden="true" />
          }
        >
          View Family
        </Button>
      </Stack>
    </Paper>
  );
}

export default function FamilyDiscovery() {
  const [families, setFamilies] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("score");
  const [openOnly, setOpenOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const errorAlert = useErrorAlert();
  const errorAlertRef = useRef(errorAlert);

  useEffect(() => {
    errorAlertRef.current = errorAlert;
  }, [errorAlert]);

  const loadLeaderboard = useCallback(() => {
    axios
      .get("/api/family/leaderboard")
      .then((res) => {
        setLeaderboard(res.data.leaderboard || []);
      })
      .catch(() => {
        setLeaderboard([]);
      });
  }, []);

  const loadFamilies = useCallback(() => {
    setLoaded(false);
    axios
      .get("/api/family/discover", {
        params: {
          search,
          sort,
          openOnly,
          page,
          limit: 12,
        },
      })
      .then((res) => {
        setFamilies(res.data.families || []);
        setTotalPages(res.data.totalPages || 1);
        setTotal(res.data.total || 0);
        setLoaded(true);
      })
      .catch((e) => {
        setFamilies([]);
        setLoaded(true);
        errorAlertRef.current(e);
      });
  }, [openOnly, page, search, sort]);

  useEffect(() => {
    document.title = "Find Families | PassionMafia";
    loadLeaderboard();
  }, [loadLeaderboard]);

  useEffect(() => {
    loadFamilies();
  }, [loadFamilies]);

  function submitSearch(event) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function onSortChange(event) {
    setPage(1);
    setSort(event.target.value);
  }

  function onOpenOnlyChange(event) {
    setPage(1);
    setOpenOnly(event.target.checked);
  }

  return (
    <Stack direction="column" spacing={2}>
      <Paper
        sx={{
          p: 2,
          borderRadius: "4px",
          backgroundColor: "var(--scheme-color)",
        }}
      >
        <Stack direction="column" spacing={2}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1}
            sx={{
              alignItems: { xs: "stretch", md: "center" },
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography variant="h2">Find Families</Typography>
              <Typography variant="body2" color="text.secondary">
                Browse active families and find one that is accepting members.
              </Typography>
            </Box>
            <Button
              component={RouterLink}
              to="/user/settings/family"
              variant="outlined"
              startIcon={
                <Box component="i" className="fas fa-plus" aria-hidden="true" />
              }
            >
              Create Family
            </Button>
          </Stack>

          <Stack
            component="form"
            onSubmit={submitSearch}
            direction={{ xs: "column", md: "row" }}
            spacing={1}
            sx={{ alignItems: { xs: "stretch", md: "center" } }}
          >
            <TextField
              size="small"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search families"
              inputProps={{ maxLength: 40 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box
                      component="i"
                      className="fas fa-search"
                      aria-hidden="true"
                    />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1 }}
            />
            <Select size="small" value={sort} onChange={onSortChange}>
              <MenuItem value="score">Top Score</MenuItem>
              <MenuItem value="open">Open First</MenuItem>
              <MenuItem value="members">Most Members</MenuItem>
              <MenuItem value="treasury">Most Treasury</MenuItem>
              <MenuItem value="newest">Newest</MenuItem>
            </Select>
            <FormControlLabel
              control={
                <Switch checked={openOnly} onChange={onOpenOnlyChange} />
              }
              label="Open only"
              sx={{ mx: 0 }}
            />
            <Button type="submit" variant="contained">
              Search
            </Button>
          </Stack>

          <Typography variant="caption" color="text.secondary">
            {total.toLocaleString()} families found
          </Typography>
        </Stack>
      </Paper>

      {!loaded && <Loading small />}

      {loaded && families.length === 0 && (
        <Paper
          sx={{
            p: 2,
            borderRadius: "4px",
            backgroundColor: "var(--scheme-color)",
          }}
        >
          <Typography>No families found.</Typography>
        </Paper>
      )}

      {loaded && families.length > 0 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={8} lg={9}>
            <Grid container spacing={2}>
              {families.map((family) => (
                <Grid item xs={12} md={6} xl={4} key={family.id}>
                  <FamilyCard family={family} />
                </Grid>
              ))}
            </Grid>
            {totalPages > 1 && (
              <Stack direction="row" sx={{ justifyContent: "center", mt: 2 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(event, value) => setPage(value)}
                  color="primary"
                />
              </Stack>
            )}
          </Grid>
          <Grid item xs={12} md={4} lg={3}>
            {leaderboard.length > 0 && (
              <Paper sx={{ p: 2, borderRadius: "4px", backgroundColor: "var(--scheme-color)" }}>
                <Typography variant="h3" sx={{ fontSize: "1.25rem", fontWeight: 600, mb: 1 }}>
                  Leaderboard
                </Typography>
                <Stack direction="column" spacing={1}>
                  {leaderboard.slice(0, 10).map((entry) => (
                    <Stack
                      key={entry.id}
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Typography variant="body2" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {entry.rank}. {entry.name}
                      </Typography>
                      <Typography variant="caption" sx={{ flexShrink: 0, ml: 1 }}>
                        {entry.score} pts
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Paper>
            )}
          </Grid>
        </Grid>
      )}
    </Stack>
  );
}
