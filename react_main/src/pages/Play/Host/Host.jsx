import React, {useState, useEffect, useContext, useReducer} from "react";
import { useLocation, useHistory } from "react-router-dom";
import axios from "axios";

import { UserContext, SiteInfoContext } from "../../../Contexts";
import { PageNav, SearchBar } from "../../../components/Nav";
import Setup from "../../../components/Setup";
import Form from "../../../components/Form";
import { ItemList, filterProfanity } from "../../../components/Basic";
import { useErrorAlert } from "../../../components/Alerts";
import { camelCase } from "../../../utils";

import "../../../css/host.css";
import { TopBarLink } from "../Play";
import {clamp} from "../../../lib/MathExt";
import AnonymousDeck from "../../../components/Deck";

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

  const preSelectedSetup = new URLSearchParams(location.search).get("setup");
  const [filters, dispatchFilters] = useReducer((state, action) => {
      switch (action.type) {
          case 'ChangeList': {
              return {...state, option: action.value, page: 1, query: ''};
          }
          case 'ChangePage': {
              return {...state, page: action.value};
          }
          case 'ChangeQuery': {
              return {...state, page: 1, query: action.value}
          }
          case 'ChangeGame': {
              return {gameType: action.value, page: 1, option: 'Popular', query: ''}
          }
          case 'ChangeMinSlots': {
              return {...state, minSlots: action.value}
          }
          case 'ChangeMaxSlots': {
              return {...state, maxSlots: action.value}
          }
      }
    },preSelectedSetup ? {
      gameType,
      page: 1,
      option: 'Yours',
      query: '',
      minSlots: 3,
      maxSlots: 50
  } : {
      gameType,
      page: 1,
      option: 'Popular',
      query: '',
      minSlots: 3,
      maxSlots: 50
  });

  const errorAlert = useErrorAlert();

  const user = useContext(UserContext);

  useEffect(() => {
    if (preSelectedSetup) {
      axios.get(`/setup/${preSelectedSetup}`)
        .then((res) => {
          res.data.name = filterProfanity(res.data.name, user.settings);
          setSelSetup(res.data);
        })
        .catch(errorAlert);
        const timeout = window.setTimeout(() => {
          getSetupList(filters)
      }, 100);
      return () => {
          window.clearTimeout(timeout);
      }
    }
  }, [filters]);

  useEffect(() => {
    updateFormFields({
      ref: "setup",
      prop: "value",
      value: selSetup.name,
    });
  }, [selSetup]);

  function getSetupList(filters) {
    axios.get(`/setup/search?${new URLSearchParams(filters).toString()}`)
      .then((res) => {
        setSetups(res.data.setups);
        setPageCount(res.data.pages);
      });
  }

  function onHostNavClick(listType) {
    dispatchFilters({type: 'ChangeList', value: listType});
  }

  function onSearchInput(query) {
    dispatchFilters({type: 'ChangeQuery', value: query});
  }

  function onPageNav(page) {
    dispatchFilters({type: 'ChangePage', value: page});
  }
  function onMinSlotsChange(e) {
    let value = clamp(e.target.value, 3, Math.min(filters.maxSlots, 50));
    dispatchFilters({type: 'ChangeMinSlots', value});  }
  function onMaxSlotsChange(e) {
    let value = clamp(e.target.value, Math.max(filters.minSlots, 3), 50);
    dispatchFilters({type: 'ChangeMaxSlots', value});  }

  function onFavSetup(favSetup) {
    axios.post("/setup/favorite", { id: favSetup.id }).catch(errorAlert);

    var newSetups = [...setups];

    for (let i in setups) {
      if (setups[i].id == favSetup.id) {
        newSetups[i].favorite = !setups[i].favorite;
        break;
      }
    }

    setSetups(newSetups);
  }

  function onEditSetup(setup) {
    history.push(`/play/create?edit=${setup.id}`);
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

  let [deckDisplay, setDeckDisplay] = useState();

  useEffect(() => {
    //setDeckDisplay();
  }, [formFields["anonymousDeckId"]]);

  return (
    <div className="span-panel main host">
      <div className="top-bar">
        {hostButtons}
        </div>
            <div className="top-bar">
                <div className="range-wrapper-slots">
                Min slots
                    <input
                        type="number"
                        min={3}
                        max={Math.min(filters.maxSlots, 50)}
                        step={1}
                        value={filters.minSlots}
                        onChange={onMinSlotsChange} />
                    <input
                        type="range"
                        min={3}
                        max={Math.min(filters.maxSlots, 50)}
                        step={1}
                        value={filters.minSlots}
                        onChange={onMinSlotsChange} />
                </div>
                <div className="range-wrapper-slots">
                Max slots
                    <input type="number"
                           min={Math.max(filters.minSlots, 3)}
                           max={50}
                           step={1}
                           value={filters.maxSlots}
                           onChange={onMaxSlotsChange}/>
                    <input
                        type="range"
                        min={Math.max(filters.minSlots, 3)}
                        max={50}
                        step={1}
                        value={filters.maxSlots}
                        onChange={onMaxSlotsChange} />
                </div>
                <SearchBar value={filters.query} placeholder="Setup Name" onInput={onSearchInput} />
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
            onDel={onDelSetup}
            odd={setups.indexOf(setup) % 2 == 1}
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
      {deckDisplay && <AnonymousDeck deck={deckDisplay} disablePopover />}
    </div>
  );
}

function SetupRow(props) {
  const user = useContext(UserContext);

  let selIconFormat = "far";
  let favIconFormat = "far";

  if (props.sel.id == props.setup.id) selIconFormat = "fas";

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
      {user.loggedIn && props.listType == "Yours" && (
        <i
          className={`setup-btn edit-setup fa-pen-square fas`}
          onClick={() => props.onEdit(props.setup)}
        />
      )}
      {user.loggedIn && props.listType == "Yours" && (
        <i
          className={`setup-btn del-setup fa-times-circle fas`}
          onClick={() => props.onDel(props.setup)}
        />
      )}
    </div>
  );
}
