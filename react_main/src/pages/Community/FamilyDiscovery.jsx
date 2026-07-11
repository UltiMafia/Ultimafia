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
  FormControl,
  FormControlLabel,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
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
import { CoinAmount } from "../User/FamilyExtras";

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
                sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
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
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Box
                  component="i"
                  className={
                    family.applicationsOpen ? "fas fa-door-open" : "fas fa-lock"
                  }
                  aria-hidden="true"
                />
                {family.applicationsOpen ? "Applications Open" : "Closed"}
              </Box>
            }
          />
          <Chip
            size="small"
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Box component="i" className="fas fa-users" aria-hidden="true" />
                {`${family.memberCount}/${family.memberLimit}`}
              </Box>
            }
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
  const [sort, setSort] = useState("members");
  const [openOnly, setOpenOnly] = useState(false);
  const [total, setTotal] = useState(0);
  const errorAlert = useErrorAlert();
  const errorAlertRef = useRef(errorAlert);

  useEffect(() => {
    errorAlertRef.current = errorAlert;
  }, [errorAlert]);

  const loadFamilies = useCallback(() => {
    setLoaded(false);
    axios
      .get("/api/family/discover", {
        params: {
          search,
          sort,
          openOnly,
        },
      })
      .then((res) => {
        setFamilies(res.data.families || []);
        setTotal(res.data.total || 0);
        setLoaded(true);
      })
      .catch((e) => {
        setFamilies([]);
        setLoaded(true);
        errorAlertRef.current(e);
      });
  }, [openOnly, search, sort]);

  useEffect(() => {
    document.title = "Find Families | UltiMafia";
  }, []);

  useEffect(() => {
    loadFamilies();
  }, [loadFamilies]);

  // Debounce search input changes (300ms) to trigger search automatically
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  function submitSearch(event) {
    event.preventDefault();
    setSearch(searchInput.trim());
  }

  function onSortChange(event) {
    setSort(event.target.value);
  }

  function onOpenOnlyChange(event) {
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
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="sort-select-label">Sort by</InputLabel>
              <Select
                labelId="sort-select-label"
                id="sort-select"
                value={sort}
                label="Sort by"
                onChange={onSortChange}
              >
                <MenuItem value="open">Open First</MenuItem>
                <MenuItem value="members">Most Members</MenuItem>
                <MenuItem value="treasury">Most Treasury</MenuItem>
                <MenuItem value="newest">Newest</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch checked={openOnly} onChange={onOpenOnlyChange} />
              }
              label="Open only"
              sx={{ mx: 0 }}
            />
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
          <Grid item xs={12}>
            <Grid container spacing={2}>
              {families.map((family) => (
                <Grid item xs={12} md={6} xl={4} key={family.id}>
                  <FamilyCard family={family} />
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      )}
    </Stack>
  );
}
