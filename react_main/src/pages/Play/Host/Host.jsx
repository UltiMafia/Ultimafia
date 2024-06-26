import React, { useState, useEffect, useContext, useReducer } from "react";
import { useLocation, useHistory } from "react-router-dom";
import axios from "axios";

import { useTheme } from "@mui/material/styles";
import { Container, Box, Typography, Slider, TextField, IconButton, ButtonGroup, Button } from "@mui/material";

import { UserContext } from "../../../Contexts";
import { PageNav, SearchBar } from "../../../components/Nav";
import Setup from "../../../components/Setup";
import Form from "../../../components/Form";
import { ItemList, filterProfanity } from "../../../components/Basic";
import { useErrorAlert } from "../../../components/Alerts";

import "../../../css/host.css";
import { clamp } from "../../../lib/MathExt";

export default function Host(props) {
  const theme = useTheme();

  const gameType = props.gameType;
  const selSetup = props.selSetup;
  const setSelSetup = props.setSelSetup;
  const formFields = props.formFields;
  const updateFormFields = props.updateFormFields;
  const onHostGame = props.onHostGame;

  const [pageCount, setPageCount] = useState(1);
  const [setups, setSetups] = useState([]);

  const location = useLocation();
  const history = useHistory();

  const minSlots = 1;
  const maxSlots = 50;

  const preSelectedSetup = new URLSearchParams(location.search).get("setup");
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
            option: "Popular",
            query: "",
          };
        }
        case "ChangeMinSlots": {
          return { ...state, minSlots: action.value };
        }
        case "ChangeMaxSlots": {
          return { ...state, maxSlots: action.value };
        }
        default:
          return state;
      }
    },
    preSelectedSetup
      ? {
          gameType,
          page: 1,
          option: "Yours",
          query: "",
          minSlots: minSlots,
          maxSlots: maxSlots,
        }
      : {
          gameType,
          page: 1,
          option: "Popular",
          query: "",
          minSlots: minSlots,
          maxSlots: maxSlots,
        }
  );

  const errorAlert = useErrorAlert();

  const user = useContext(UserContext);

  useEffect(() => {
    if (preSelectedSetup) {
      axios
        .get(`/setup/${preSelectedSetup}`)
        .then((res) => {
          res.data.name = filterProfanity(res.data.name, user.settings);
          setSelSetup(res.data);
        })
        .catch(errorAlert);
    }
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
  }, [filters]);

  useEffect(() => {
    updateFormFields({
      ref: "setup",
      prop: "value",
      value: selSetup.name,
    });
  }, [selSetup]);

  function getSetupList(filters) {
    axios
      .get(`/setup/search?${new URLSearchParams(filters).toString()}`)
      .then((res) => {
        setSetups(res.data.setups);
        setPageCount(res.data.pages);
      });
  }

  function onHostNavClick(listType) {
    dispatchFilters({ type: "ChangeList", value: listType });
  }

  function onSearchInput(query) {
    dispatchFilters({ type: "ChangeQuery", value: query });
  }

  function onPageNav(page) {
    dispatchFilters({ type: "ChangePage", value: page });
  }

  function onMinSlotsChange(e, value) {
    value = clamp(value, minSlots, Math.min(filters.maxSlots, maxSlots));
    dispatchFilters({ type: "ChangeMinSlots", value });
  }

  function onMaxSlotsChange(e, value) {
    value = clamp(value, Math.max(filters.minSlots, minSlots), maxSlots);
    dispatchFilters({ type: "ChangeMaxSlots", value });
  }

  function onFavSetup(favSetup) {
    axios.post("/setup/favorite", { id: favSetup.id }).catch(errorAlert);

    const newSetups = setups.map((setup) =>
      setup.id === favSetup.id ? { ...setup, favorite: !setup.favorite } : setup
    );

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
      .post("/setup/delete", { id: setup.id })
      .then(() => {
        getSetupList(filters);
      })
      .catch(errorAlert);
  }

  const hostButtonLabels = [
    "Featured",
    "Popular",
    "Ranked",
    "Competitive",
    "Favorites",
    "Yours",
  ];

  return (
    <Container maxWidth="lg">
      <Box className="span-panel main host">
        <Box className="top-bar" display="flex" justifyContent="space-between">
          <ButtonGroup>
            {hostButtonLabels.map((label) => (
              <Button
                key={label}
                variant={filters.option === label ? "contained" : "outlined"}
                onClick={() => onHostNavClick(label)}
              >
                {label}
              </Button>
            ))}
          </ButtonGroup>
        </Box>
        <Box className="top-bar" display="flex" justifyContent="space-between" alignItems="center" mt={2}>
          <Box display="flex" alignItems="center">
            <Typography variant="body1">Min slots</Typography>
            <TextField
              type="number"
              inputProps={{ min: minSlots, max: Math.min(filters.maxSlots, maxSlots), step: 1 }}
              value={filters.minSlots}
              onChange={(e) => onMinSlotsChange(e, Number(e.target.value))}
              size="small"
              style={{ margin: theme.spacing(0, 2) }}
            />
            <Slider
              value={filters.minSlots}
              min={minSlots}
              max={Math.min(filters.maxSlots, maxSlots)}
              step={1}
              onChange={onMinSlotsChange}
              style={{ width: 200 }}
            />
          </Box>
          <Box display="flex" alignItems="center">
            <Typography variant="body1">Max slots</Typography>
            <TextField
              type="number"
              inputProps={{ min: Math.max(filters.minSlots, minSlots), max: maxSlots, step: 1 }}
              value={filters.maxSlots}
              onChange={(e) => onMaxSlotsChange(e, Number(e.target.value))}
              size="small"
              style={{ margin: theme.spacing(0, 2) }}
            />
            <Slider
              value={filters.maxSlots}
              min={Math.max(filters.minSlots, minSlots)}
              max={maxSlots}
              step={1}
              onChange={onMaxSlotsChange}
              style={{ width: 200 }}
            />
          </Box>
          <SearchBar
            value={filters.query}
            placeholder="🔎 Setup Name"
            onInput={onSearchInput}
          />
        </Box>
        <ItemList
          items={setups}
          map={(setup) => (
            <SetupRow
              setup={setup}
              sel={selSetup}
              listType={filters.option}
              onSelect={setSelSetup}
              onFav={onFavSetup}
              onEdit={onEditSetup}
              onCopy={onCopySetup}
              onDel={onDelSetup}
              odd={setups.indexOf(setup) % 2 === 1}
              key={setup.id}
            />
          )}
          empty="No setups"
        />
        <PageNav page={filters.page} maxPage={pageCount} onNav={onPageNav} />
        {user.loggedIn && (
          <Form
            fields={formFields}
            onChange={updateFormFields}
            submitText="Host"
            onSubmit={onHostGame}
          />
        )}
      </Box>
    </Container>
  );
}

function SetupRow(props) {
  const user = useContext(UserContext);

  let selIconFormat = "far";
  let favIconFormat = "far";

  if (props.sel.id === props.setup.id) selIconFormat = "fas";

  if (props.setup.favorite) favIconFormat = "fas";

  return (
    <Box className={`row ${props.odd ? "odd" : ""}`} display="flex" alignItems="center">
      {user.loggedIn && (
        <IconButton onClick={() => props.onSelect(props.setup)}>
          <i className={`fa-circle ${selIconFormat}`} />
        </IconButton>
      )}
      <Box className="setup-wrapper">
        <Setup setup={props.setup} />
      </Box>
      <Box className="setup-name" flex={1}>
        <Typography>{filterProfanity(props.setup.name, user.settings)}</Typography>
      </Box>
      {user.loggedIn && (
        <IconButton onClick={() => props.onFav(props.setup)}>
          <i className={`fa-star ${favIconFormat}`} />
        </IconButton>
      )}
      {user.loggedIn && props.setup.creator?.id === user.id && (
        <IconButton onClick={() => props.onEdit(props.setup)}>
          <i className="fa-pen-square fas" />
        </IconButton>
      )}
      {user.loggedIn && (
        <IconButton onClick={() => props.onCopy(props.setup)}>
          <i className="fa-copy fas" />
        </IconButton>
      )}
      {user.loggedIn && props.setup.creator?.id === user.id && (
        <IconButton onClick={() => props.onDel(props.setup)}>
          <i className="fa-times-circle fas" />
        </IconButton>
      )}
    </Box>
  );
}
