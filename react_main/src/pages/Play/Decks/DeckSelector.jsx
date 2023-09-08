import React, { useContext, useEffect, useState } from "react";
import "../../../css/host.css";
import "../../../css/deck.css";
import "../../../css/play.css";
import { TopBarLink } from "../Play";
import { useLocation } from "react-router-dom/cjs/react-router-dom";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useErrorAlert } from "../../../components/Alerts";
import { UserContext } from "../../../Contexts";
import axios from "axios";
import { ItemList, filterProfanity } from "../../../components/Basic";
import { PageNav, SearchBar } from "../../../components/Nav";
import { camelCase } from "../../../utils";
import AnonymousDeck from "../../../components/Deck";
import { SiteInfoContext } from "../../../Contexts";
import { Redirect } from "react-router-dom";

export default function DeckSelector() {
  const [listType, setListType] = useState("featured");
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [searchVal, setSearchVal] = useState("");
  const [decks, setDecks] = useState([]);
  const [selDeck, setSelDeck] = useState({});

  const location = useLocation();
  const history = useHistory();
  const errorAlert = useErrorAlert();

  const user = useContext(UserContext);

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    if (params.get("deck")) {
      getDeckList("id", 1, params.get("deck"));

      axios
        .get(`/deck/${params.get("deck")}`)
        .then((res) => {
          res.data.name = filterProfanity(res.data.name, user.settings);
          setSelDeck(res.data);
        })
        .catch(errorAlert);
    } else getDeckList(listType, page);
  }, []);

  function getDeckList(listType, page, query) {
    axios
      .get(`/deck/${camelCase(listType)}?&page=${page}&query=${query || ""}`)
      .then((res) => {
        setListType(listType);
        setPage(page);
        setDecks(res.data.decks);
        setPageCount(res.data.pages);
      });
  }

  function onHostNavClick(listType) {
    setSearchVal("");
    getDeckList(listType, 1);
  }

  function onSearchInput(query) {
    setSearchVal(query);

    if (query.length) getDeckList("search", 1, query);
    else getDeckList("featured", 1);
  }

  function onPageNav(page) {
    var args = [listType, page];

    if (searchVal.length) args.push(searchVal);

    getDeckList(...args);
  }

  function onSelectDeck(deck) {
    setSelDeck(deck);
    localStorage.setItem("hostOptions.anonymousDeck", deck.id);
  }

  function onEditDeck(deck) {
    history.push(`/play/createDeck?edit=${deck.id}`);
  }

  function onDelDeck(deck) {
    axios
      .post("/deck/delete", { id: deck.id })
      .then(() => {
        getDeckList(listType, page);
      })
      .catch(errorAlert);
  }

  const hostButtonLabels = ["Featured", "Yours"];
  const hostButtons = hostButtonLabels.map((label) => (
    <TopBarLink
      text={label}
      sel={listType}
      onClick={() => onHostNavClick(label)}
      key={label}
    />
  ));

  return (
    <div className="span-panel main host">
      <div className="top-bar">
        {hostButtons}
        <SearchBar
          value={searchVal}
          placeholder="Deck Name"
          onInput={onSearchInput}
        />
      </div>
      <ItemList
        items={decks}
        map={(deck) => {
          return (
            <DeckRow
              deck={deck}
              sel={selDeck}
              listType={listType}
              onSelect={onSelectDeck}
              onEdit={onEditDeck}
              onDel={onDelDeck}
              odd={decks.indexOf(deck) % 2 === 1}
              key={deck.id}
            />
          );
        }}
        empty="No decks"
      />
      <PageNav page={page} maxPage={pageCount} onNav={onPageNav} />
    </div>
  );
}

function DeckRow(props) {
  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const [redirect, setRedirect] = useState(false);

  let selIconFormat = "far";

  if (props.sel.id === props.deck.id) selIconFormat = "fas";

  if (redirect) return <Redirect to={redirect} />;

  return (
    <div className={`row ${props.odd ? "odd" : ""}`}>
      {/* {user.loggedIn && (
        <i
          className={`select-deck fa-circle ${selIconFormat}`}
          onClick={() => props.onSelect(props.deck)}
        />
      )} */}
      <div className="deck-wrapper">
        <AnonymousDeck deck={props.deck} />
      </div>
      <div className="deck-buttons-wrapper">
        {/*Create a button that lets a user host a game with the deck ID selected */}
        {user.loggedIn && (
          <i
            className={`deck-btn host-deck fa-play-circle fas`}
            onClick={() => {
              setRedirect(`/play/host?deck=${props.deck.id}`);
            }}
          />
        )}
        {/*Create a button that lets the user edit the deck*/}
        {user.loggedIn && props.listType === "Yours" && (
          <i
            className={`deck-btn edit-deck fa-pen-square fas`}
            onClick={() => props.onEdit(props.deck)}
          />
        )}
        {/*Create a button that lets a user copy the deck ID*/}
        {user.loggedIn && (
          <i
            className={`deck-btn copy-deck fa-copy fas`}
            onClick={() => {
              navigator.clipboard.writeText(props.deck.id);
              siteInfo.showAlert("Copied deck ID to clipboard", "success");
            }}
          />
        )}
        {/*Create a button that lets the user delete the deck*/}
        {user.loggedIn && props.listType === "Yours" && (
          <i
            className={`deck-btn del-deck fa-times-circle fas`}
            onClick={() => props.onDel(props.deck)}
          />
        )}
      </div>
    </div>
  );
}
