import React, { useState, useEffect, useContext, useReducer } from "react";
import { useLocation, useHistory } from "react-router-dom";
import axios from "axios";

import { UserContext } from "../../../Contexts";
import { PageNav, SearchBar } from "../../../components/Nav";
import Setup from "../../../components/Setup";
import Form from "../../../components/Form";
import { ItemList, filterProfanity } from "../../../components/Basic";
import { useErrorAlert } from "../../../components/Alerts";

import "../../../css/host.css";
import { TopBarLink } from "../Play";
import { clamp } from "../../../lib/MathExt";

export default function Host(props) {
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

  function onFavSetup(favSetup) {
    axios.post("/setup/favorite", { id: favSetup.id }).catch(errorAlert);

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
  const hostButtons = hostButtonLabels.map((label) => (
    <TopBarLink
      text={label}
      sel={filters.option}
      onClick={() => onHostNavClick(label)}
      key={label}
    />
  ));

  return (
    <div className="span-panel main host">
      <div className="top-bar">{hostButtons}</div>
      <div className="top-bar">
        <div className="range-wrapper-slots">
          Min slots
          <input
            type="number"
            min={minSlots}
            max={Math.min(filters.maxSlots, maxSlots)}
            step={1}
            value={filters.minSlots}
            onChange={onMinSlotsChange}
          />
          <input
            type="range"
            min={minSlots}
            max={Math.min(filters.maxSlots, maxSlots)}
            step={1}
            value={filters.minSlots}
            onChange={onMinSlotsChange}
          />
        </div>
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
          <input
            type="range"
            min={Math.max(filters.minSlots, minSlots)}
            max={maxSlots}
            step={1}
            value={filters.maxSlots}
            onChange={onMaxSlotsChange}
          />
        </div>
        <SearchBar
          value={filters.query}
          placeholder="Setup Name"
          onInput={onSearchInput}
        />
      </div>
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
    </div>
  );
}

function SetupRow(props) {
  const user = useContext(UserContext);

  let selIconFormat = "far";
  let favIconFormat = "far";

  if (props.sel.id === props.setup.id) selIconFormat = "fas";

  if (props.setup.favorite) favIconFormat = "fas";

  return (
    <div className={`row ${props.odd ? "odd" : ""}`}>
      {user.loggedIn && (
        <i
          className={`select-setup fa-circle ${selIconFormat}`}
          onClick={() => props.onSelect(props.setup)}
        />
      )}
      <div className="setup-wrapper">
        <Setup setup={props.setup} />
      </div>
      <div className="setup-name">
        {filterProfanity(props.setup.name, user.settings)}
      </div>
      {user.loggedIn && (
        <i
          className={`setup-btn fav-setup fa-star ${favIconFormat}`}
          onClick={() => props.onFav(props.setup)}
        />
      )}
      {user.loggedIn && props.setup.creator?.id === user.id && (
        <i
          className={`setup-btn edit-setup fa-pen-square fas`}
          onClick={() => props.onEdit(props.setup)}
        />
      )}
      {user.loggedIn && (
        <i
          className={`setup-btn copy-setup fa-copy fas`}
          onClick={() => props.onCopy(props.setup)}
        />
      )}
      {user.loggedIn && props.setup.creator?.id === user.id && (
        <i
          className={`setup-btn del-setup fa-times-circle fas`}
          onClick={() => props.onDel(props.setup)}
        />
      )}
    </div>
  );
}
