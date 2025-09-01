import React, { useState, useEffect, useContext, useReducer } from "react";
import { useLocation, useHistory } from "react-router-dom";
import axios from "axios";

import { UserContext } from "Contexts";
import { PageNav, SearchBar } from "components/Nav";
import Setup from "components/Setup";
import HostGameDialogue from "components/HostGameDialogue";
import { useErrorAlert } from "components/Alerts";

import "css/host.css";
import { clamp } from "../../../lib/MathExt";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";
import {
  Box,
  Button,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Stack,
  Tab,
  Tabs,
  SwipeableDrawer,
  useTheme,
} from "@mui/material";

import GameIcon from "components/GameIcon";
import { GameTypes } from "Constants";

export default function HostBrowser(props) {
  const defaultGameType = "Mafia";
  const defaultNavLabel = "Popular";
  const formFields = props.formFields;

  const [selSetup, setSelSetup] = useState(null);
  const [ishostGameDialogueOpen, setIshostGameDialogueOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [hostNavLabel, setHostNavLabel] = useState(defaultNavLabel);
  const [pageCount, setPageCount] = useState(1);
  const [setups, setSetups] = useState([]);

  const isPhoneDevice = useIsPhoneDevice();
  const theme = useTheme();
  const errorAlert = useErrorAlert();
  const location = useLocation();
  const history = useHistory();

  const minSlots = 1;
  const maxSlots = 50;

  const params = new URLSearchParams(location.search);
  const preSelectedDeck = new URLSearchParams(location.search).get("deck");

  const [filters, dispatchFilters] = useReducer(
    (state, action) => {
      switch (action.type) {
        case "ChangeList": {
          return { ...state, option: action.value, page: 1, query: "" };
        }
        case "ChangePage": {
          return { ...state, page: action.value };
        }
        case "ChangeQuery": {
          return { ...state, page: 1, query: action.value };
        }
        case "ChangeGame": {
          return {
            gameType: action.value,
            page: 1,
            option: defaultNavLabel,
            query: "",
          };
        }
        case "ChangeMinSlots": {
          return { ...state, minSlots: action.value };
        }
        case "ChangeMaxSlots": {
          return { ...state, maxSlots: action.value };
        }
      }
    },
    {
      page: 1,
      option: defaultNavLabel,
      query: "",
      minSlots: minSlots,
      maxSlots: maxSlots,
    }
  );

  const [gameType, setGameType] = useState(
    params.get("game") || localStorage.getItem("gameType") || defaultGameType
  );

  const handleListItemClick = (newValue) => {
    setGameType(newValue);
    localStorage.setItem("gameType", newValue);
    setDrawerOpen(false);
  };

  const toggleDrawer = (open) => (event) => {
    if (
      event &&
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }
    setDrawerOpen(open);
  };

  useEffect(() => {
    if (preSelectedDeck) {
      let anonymousGameField = formFields.find(
        (field) => field.ref === "anonymousGame"
      );
      if (anonymousGameField) {
        anonymousGameField.value = true;
      }
      let anonymousDeckIdField = formFields.find(
        (field) => field.ref === "anonymousDeckId"
      );
      if (anonymousDeckIdField) {
        anonymousDeckIdField.value = preSelectedDeck;
      }
    }
    const timeout = window.setTimeout(() => {
      getSetupList(filters);
    }, 100);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [filters, gameType]);

  function getSetupList(filters) {
    axios
      .get(
        `/api/setup/search?${new URLSearchParams({
          gameType: gameType,
          ...filters,
        }).toString()}`
      )
      .then((res) => {
        setSetups(res.data.setups);
        setPageCount(res.data.pages);
      });
  }

  function onHostNavClick(listType) {
    dispatchFilters({ type: "ChangeList", value: listType });
    setHostNavLabel(listType);
  }

  function onSearchInput(query) {
    dispatchFilters({ type: "ChangeQuery", value: query });
  }

  function onPageNav(page) {
    dispatchFilters({ type: "ChangePage", value: page });
  }

  function onMinSlotsChange(e) {
    let value = clamp(
      e.target.value,
      minSlots,
      Math.min(filters.maxSlots, maxSlots)
    );
    dispatchFilters({ type: "ChangeMinSlots", value });
  }

  function onMaxSlotsChange(e) {
    let value = clamp(
      e.target.value,
      Math.max(filters.minSlots, minSlots),
      maxSlots
    );
    dispatchFilters({ type: "ChangeMaxSlots", value });
  }

  function onSelectSetup(setup) {
    setSelSetup(setup);
    setIshostGameDialogueOpen(true);
  }

  function onFavSetup(favSetup) {
    axios.post("/api/setup/favorite", { id: favSetup.id }).catch(errorAlert);

    var newSetups = [...setups];

    for (let i in setups) {
      if (setups[i].id === favSetup.id) {
        newSetups[i].favorite = !setups[i].favorite;
        break;
      }
    }

    setSetups(newSetups);
  }

  function onEditSetup(setup) {
    history.push(`/play/create?edit=${setup.id}`);
  }

  function onCopySetup(setup) {
    history.push(`/play/create?copy=${setup.id}`);
  }

  function onDelSetup(setup) {
    axios
      .post("/api/setup/delete", { id: setup.id })
      .then(() => {
        getSetupList(filters);
      })
      .catch(errorAlert);
  }

  const hostButtonLabels = [
    "Yours",
    "Popular",
    "Favorites",
    "Featured",
    "Ranked",
    "Competitive",
  ];

  const hostNavTabs = (
    <Tabs
      value={hostNavLabel}
      onChange={(_, newValue) => onHostNavClick(newValue)}
      variant="scrollable"
      scrollButtons="auto"
      allowScrollButtonsMobile
    >
      {hostButtonLabels.map((label) => (
        <Tab key={label} label={<div>{label}</div>} value={label} />
      ))}
    </Tabs>
  );

  const setupRows = setups.map((setup) => (
    <SetupRow
      setup={setup}
      listType={filters.option}
      onSelect={onSelectSetup}
      onFav={onFavSetup}
      onEdit={onEditSetup}
      onCopy={onCopySetup}
      onDel={onDelSetup}
      odd={setups.indexOf(setup) % 2 === 1}
      key={setup.id}
    />
  ));

  return (
    <>
      {isPhoneDevice && (
        <>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleDrawer(true)}
            sx={{
              position: "fixed",
              top: "50%",
              left: 0,
              zIndex: 1201,
              visibility: drawerOpen ? "hidden" : "visible",
              backgroundColor: theme.palette.secondary.main,
              padding: "8px",
              borderRadius: "50%",
              boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.2)",
            }}
          >
            <GameIcon gameType={gameType} size={30} />
          </IconButton>
          <Paper
            onClick={toggleDrawer(true)}
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              height: "100%",
              width: "10px",
              backgroundColor: "transparent",
              zIndex: 1200,
              cursor: "pointer",
            }}
          />
          <SwipeableDrawer
            anchor="left"
            open={drawerOpen}
            onClose={toggleDrawer(false)}
            onOpen={toggleDrawer(true)}
            sx={{
              width: 240,
              flexShrink: 0,
              [`& .MuiDrawer-paper`]: { width: 240, boxSizing: "border-box" },
            }}
          >
            <List>
              {GameTypes.map((game) => (
                <ListItem
                  button
                  key={game}
                  selected={gameType === game}
                  onClick={() => handleListItemClick(game)}
                >
                  <ListItemIcon>
                    <GameIcon gameType={game} size={24} />
                  </ListItemIcon>
                  <ListItemText primary={game} />
                </ListItem>
              ))}
            </List>
          </SwipeableDrawer>
        </>
      )}
      <Stack
        direction="column"
        className="host"
        sx={{
          alignItems: "center",
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{
            justifyContent: "space-around",
            mt: 1,
            fontFamily: "var(--primaryFont)",
            fontWeight: "bold",
          }}
        >
          <Stack direction={isPhoneDevice ? "column" : "row"} spacing={1}>
            <Stack direction="row" spacing={1}>
              <Paper>
                <div className="range-wrapper-slots">
                  <i className="fas fa-filter" />
                  Min slots
                  <input
                    type="number"
                    min={minSlots}
                    max={Math.min(filters.maxSlots, maxSlots)}
                    step={1}
                    value={filters.minSlots}
                    onChange={onMinSlotsChange}
                  />
                  {!isPhoneDevice && (
                    <input
                      type="range"
                      min={minSlots}
                      max={Math.min(filters.maxSlots, maxSlots)}
                      step={1}
                      value={filters.minSlots}
                      onChange={onMinSlotsChange}
                    />
                  )}
                </div>
              </Paper>
              <Paper>
                <div className="range-wrapper-slots">
                  Max slots
                  <input
                    type="number"
                    min={Math.max(filters.minSlots, minSlots)}
                    max={maxSlots}
                    step={1}
                    value={filters.maxSlots}
                    onChange={onMaxSlotsChange}
                  />
                  {!isPhoneDevice && (
                    <input
                      type="range"
                      min={Math.max(filters.minSlots, minSlots)}
                      max={maxSlots}
                      step={1}
                      value={filters.maxSlots}
                      onChange={onMaxSlotsChange}
                    />
                  )}
                </div>
              </Paper>
            </Stack>
            <Paper>
              <SearchBar
                value={filters.query}
                placeholder="🔎 Setup Name or Role"
                onInput={onSearchInput}
              />
            </Paper>
          </Stack>
        </Stack>
        <Box
          sx={{
            alignSelf: "normal",
          }}
        >
          {hostNavTabs}
        </Box>
        <Box
          sx={{
            alignSelf: "stretch",
          }}
        >
          <Divider sx={{ mb: 1 }} />
          <Stack
            direction="row"
            sx={{
              alignItems: "stretch",
            }}
          >
            {!isPhoneDevice && (
              <Paper
                sx={{
                  maxHeight: "580px",
                  overflowY: "scroll",
                  mr: 1,
                  p: 0.5,
                }}
              >
                <Stack direction="column" spacing={0.5}>
                  {GameTypes.map((game) => (
                    <ListItem
                      button
                      key={game}
                      selected={gameType === game}
                      onClick={() => handleListItemClick(game)}
                      sx={{
                        borderRadius: "8px",
                      }}
                    >
                      <ListItemIcon>
                        <GameIcon gameType={game} size={24} />
                      </ListItemIcon>
                      <ListItemText primary={game} />
                    </ListItem>
                  ))}
                </Stack>
              </Paper>
            )}
            <Paper
              sx={{
                flexGrow: 1,
              }}
            >
              <Stack
                direction="column"
                divider={<Divider orientation="horizontal" flexItem />}
              >
                {setupRows}
              </Stack>
            </Paper>
          </Stack>
        </Box>
        <Paper
          sx={{
            p: 1,
            mt: 1,
            mb: 1,
          }}
        >
          <PageNav page={filters.page} maxPage={pageCount} onNav={onPageNav} />
        </Paper>
        {selSetup && (
          <HostGameDialogue
            open={ishostGameDialogueOpen}
            setOpen={setIshostGameDialogueOpen}
            setup={selSetup}
          />
        )}
      </Stack>
    </>
  );
}

function SetupRow(props) {
  const user = useContext(UserContext);
  const isPhoneDevice = useIsPhoneDevice();

  const favIconFormat = props.setup.favorite ? "fas" : "far";
  const maxRolesCount = isPhoneDevice ? 8 : 12;

  return (
    <Stack
      direction={isPhoneDevice ? "column-reverse" : "row"}
      spacing={1}
      className="setup-row"
      sx={{
        p: 1,
        alignItems: "center",
        justifyContent: "start",
        width: "100%",
      }}
    >
      {!isPhoneDevice && user.loggedIn && (
        <Button onClick={() => props.onSelect(props.setup)}>Host</Button>
      )}
      <Box
        sx={{
          alignSelf: "stretch",
        }}
      >
        <Setup setup={props.setup} maxRolesCount={maxRolesCount} fixedWidth />
      </Box>
      <Stack
        direction="row"
        sx={{
          alignSelf: "stretch",
          ml: isPhoneDevice ? undefined : "auto !important",
        }}
      >
        {isPhoneDevice && user.loggedIn && (
          <Button onClick={() => props.onSelect(props.setup)}>Host</Button>
        )}
        {user.loggedIn && (
          <Stack
            direction="row"
            sx={{
              // Setup manipulation buttons
              alignItems: "center",
              ml: "auto !important",
            }}
          >
            <IconButton aria-label="favorite">
              <i
                className={`setup-btn fav-setup fa-star ${favIconFormat}`}
                onClick={() => props.onFav(props.setup)}
              />
            </IconButton>
            {props.setup.creator?.id === user.id && (
              <IconButton aria-label="edit">
                <i
                  className={`setup-btn edit-setup fa-pen-square fas`}
                  onClick={() => props.onEdit(props.setup)}
                />
              </IconButton>
            )}
            <IconButton aria-label="copy">
              <i
                className={`setup-btn copy-setup fa-copy fas`}
                onClick={() => props.onCopy(props.setup)}
              />
            </IconButton>
            {props.setup.creator?.id === user.id && (
              <IconButton aria-label="delete">
                <i
                  className={`setup-btn del-setup fa-times-circle fas`}
                  onClick={() => props.onDel(props.setup)}
                />
              </IconButton>
            )}
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}
