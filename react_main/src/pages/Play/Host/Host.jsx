import React, { useState, useEffect, useContext } from "react";
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
import { formatSpecifier } from "d3";
import AnonymousDeckSelector from "../AnonymousDecksSelector/AnonymousDeckSelector";

export default function Host(props) {
  const gameType = props.gameType;
  const selSetup = props.selSetup;
  const setSelSetup = props.setSelSetup;
  const formFields = props.formFields;
  const updateFormFields = props.updateFormFields;
  const onHostGame = props.onHostGame;

  const [listType, setListType] = useState("featured");
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [searchVal, setSearchVal] = useState("");
  const [setups, setSetups] = useState([]);

  const location = useLocation();
  const history = useHistory();
  const errorAlert = useErrorAlert();

  const user = useContext(UserContext);

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    if (params.get("setup")) {
      getSetupList("id", 1, params.get("setup"));

      axios
        .get(`/setup/${params.get("setup")}`)
        .then((res) => {
          res.data.name = filterProfanity(res.data.name, user.settings);
          setSelSetup(res.data);
        })
        .catch(errorAlert);
    } else getSetupList(listType, page);
  }, []);

  useEffect(() => {
    updateFormFields({
      ref: "setup",
      prop: "value",
      value: selSetup.name,
    });
  }, [selSetup]);

  function getSetupList(listType, page, query) {
    axios
      .get(
        `/setup/${camelCase(listType)}?gameType=${
          props.gameType
        }&page=${page}&query=${query || ""}`
      )
      .then((res) => {
        setListType(listType);
        setPage(page);
        setSetups(res.data.setups);
        setPageCount(res.data.pages);
      });
  }

  function onHostNavClick(listType) {
    setSearchVal("");
    getSetupList(listType, 1);
  }

  function onSearchInput(query) {
    setSearchVal(query);

    if (query.length) getSetupList("search", 1, query);
    else getSetupList("featured", 1);
  }

  function onPageNav(page) {
    var args = [listType, page];

    if (searchVal.length) args.push(searchVal);

    getSetupList(...args);
  }

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
        getSetupList(listType, page);
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
      sel={listType}
      onClick={() => onHostNavClick(label)}
      key={label}
    />
  ));

  function getFormFieldValue(ref) {
    for (let field of formFields) if (field.ref == ref) return field.value;
  }
  
  // TODO FLAG for development -> prod
  let deckSelectorEnabled = false;
  let anonGame = deckSelectorEnabled && getFormFieldValue("anonymousGame");

  return (
    <div className="span-panel main host">
      <div className="top-bar">
        {hostButtons}
        <SearchBar
          value={searchVal}
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
            listType={listType}
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
      <PageNav page={page} maxPage={pageCount} onNav={onPageNav} />
      {user.loggedIn && (
        <Form
          fields={formFields}
          onChange={updateFormFields}
          submitText="Host"
          onSubmit={onHostGame}
        />
      )}
      {user.loggedIn && anonGame && <AnonymousDeckSelector />}
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
