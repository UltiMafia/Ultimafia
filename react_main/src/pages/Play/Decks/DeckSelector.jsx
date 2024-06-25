import React, { useContext, useEffect, useState } from "react";
import { Container, Paper, IconButton, Box } from "@mui/material";
import { useTheme } from "@mui/styles";
import { TopBarLink } from "../Play";
import { useLocation, useHistory, Redirect } from "react-router-dom";
import { useErrorAlert } from "../../../components/Alerts";
import { UserContext, SiteInfoContext } from "../../../Contexts";
import axios from "axios";
import { ItemList, filterProfanity } from "../../../components/Basic";
import { PageNav, SearchBar } from "../../../components/Nav";
import { camelCase } from "../../../utils";
import AnonymousDeck from "../../../components/Deck";

export default function DeckSelector() {
  const [listType, setListType] = useState("featured");
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [searchVal, setSearchVal] = useState("");
  const [decks, setDecks] = useState([]);
  const [selDeck, setSelDeck] = useState({});

  const theme = useTheme();
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
    <Container className="span-panel main host">
      <Paper className="top-bar">
        {hostButtons}
        <SearchBar
          value={searchVal}
          placeholder="🔎 Deck Name"
          onInput={onSearchInput}
        />
      </Paper>
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
    </Container>
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
    <Box className={`row ${props.odd ? "odd" : ""}`}>
      <Box className="deck-wrapper">
        <AnonymousDeck deck={props.deck} />
      </Box>
      <Box className="deck-buttons-wrapper">
        {user.loggedIn && (
          <IconButton
            className="deck-btn host-deck"
            onClick={() => {
              setRedirect(`/play/host?deck=${props.deck.id}`);
            }}
          >
            <i className="fas fa-play-circle" />
          </IconButton>
        )}
        {user.loggedIn && props.listType === "Yours" && (
          <IconButton
            className="deck-btn edit-deck"
            onClick={() => props.onEdit(props.deck)}
          >
            <i className="fas fa-pen-square" />
          </IconButton>
        )}
        {user.loggedIn && (
          <IconButton
            className="deck-btn copy-deck"
            onClick={() => {
              navigator.clipboard.writeText(props.deck.id);
              siteInfo.showAlert("Copied deck ID to clipboard", "success");
            }}
          >
            <i className="fas fa-copy" />
          </IconButton>
        )}
        {user.loggedIn && props.listType === "Yours" && (
          <IconButton
            className="deck-btn del-deck"
            onClick={() => props.onDel(props.deck)}
          >
            <i className="fas fa-times-circle" />
          </IconButton>
        )}
      </Box>
    </Box>
  );
}