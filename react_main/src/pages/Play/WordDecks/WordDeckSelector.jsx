import React, { useContext, useEffect, useState } from "react";
import "css/buttons.css";
import "css/host.css";
import "css/deck.css";
import "css/play.css";
import { BotBarLink } from "../Play";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { useErrorAlert } from "../../../components/Alerts";
import { UserContext, SiteInfoContext } from "../../../Contexts";
import axios from "axios";
import { ItemList, filterProfanity } from "../../../components/Basic";
import { PageNav, SearchBar } from "../../../components/Nav";
import { camelCase } from "../../../utils";
import { Button, Typography } from "@mui/material";

export default function WordDeckSelector() {
  const [listType, setListType] = useState("featured");
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [searchVal, setSearchVal] = useState("");
  const [decks, setDecks] = useState([]);
  const [selDeck, setSelDeck] = useState({});
  const [slots, setSlots] = useState({ owned: 0, purchased: 0 });

  const location = useLocation();
  const navigate = useNavigate();
  const errorAlert = useErrorAlert();

  const user = useContext(UserContext);

  useEffect(() => {
    document.title = "Word Decks | UltiMafia";
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    if (params.get("deck")) {
      getDeckList("id", 1, params.get("deck"));

      axios
        .get(`/api/wordDeck/${params.get("deck")}`)
        .then((res) => {
          res.data.name = filterProfanity(res.data.name, user.settings);
          setSelDeck(res.data);
        })
        .catch(errorAlert);
    } else getDeckList(listType, page);
  }, []);

  useEffect(() => {
    if (!user.loggedIn) return;
    axios
      .get("/api/wordDeck/slots/info")
      .then((res) => setSlots(res.data))
      .catch(() => {});
  }, [user.loggedIn]);

  function getDeckList(listType, page, query) {
    axios
      .get(
        `/api/wordDeck/${camelCase(listType)}?&page=${page}&query=${
          query || ""
        }`
      )
      .then((res) => {
        setListType(listType);
        setPage(page);
        setDecks(res.data.decks);
        setPageCount(res.data.pages);
      })
      .catch(errorAlert);
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
    localStorage.setItem("hostOptions.wordDeck", deck.id);
  }

  function onEditDeck(deck) {
    navigate(`/play/createWordDeck?edit=${deck.id}`);
  }

  function onDelDeck(deck) {
    axios
      .post("/api/wordDeck/delete", { id: deck.id })
      .then(() => {
        getDeckList(listType, page);
      })
      .catch(errorAlert);
  }

  const hostButtonLabels = ["Featured", "Popular", "Yours"];
  const hostButtons = hostButtonLabels.map((label) => (
    <BotBarLink
      text={label}
      sel={listType}
      onClick={() => onHostNavClick(label)}
      key={label}
    />
  ));

  return (
    <div className="span-panel main host">
      <div className="bot-bar">
        {hostButtons}
        <SearchBar
          value={searchVal}
          placeholder="🔎 Word Deck Name"
          onInput={onSearchInput}
        />
        <Button href="/play/createWordDeck" sx={{ ml: "auto" }}>
          Create New Word Deck
        </Button>
      </div>
      {user.loggedIn && (
        <div
          className="deck-slots-info"
          style={{ padding: "8px 16px", display: "flex", alignItems: "center" }}
        >
          <Typography variant="body2">
            Slots: {slots.owned} / {slots.purchased}
          </Typography>
          <a
            href="/user/shop?buy=wordDeck"
            style={{ marginLeft: 12, fontSize: "0.85rem" }}
          >
            Buy more slots
          </a>
        </div>
      )}
      <ItemList
        items={decks}
        map={(deck) => {
          return (
            <WordDeckRow
              deck={deck}
              sel={selDeck}
              listType={listType}
              onSelect={onSelectDeck}
              onEdit={onEditDeck}
              onDel={onDelDeck}
              odd={decks.indexOf(deck) % 2 === 1}
              decks={decks}
              setDecks={setDecks}
              key={deck.id}
            />
          );
        }}
        empty="No word decks"
      />
      <PageNav page={page} maxPage={pageCount} onNav={onPageNav} />
    </div>
  );
}

function WordDeckRow(props) {
  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const [redirect, setRedirect] = useState(false);

  const deck = props.deck;
  const wordPreview = deck.wordPreview || [];
  const wordCount = deck.wordCount != null ? deck.wordCount : 0;
  const previewText = wordPreview.slice(0, 5).join(", ");

  if (redirect) return <Navigate to={redirect} />;

  return (
    <div className={`row ${props.odd ? "odd" : ""}`}>
      <div className="deck-wrapper">
        <div className="deck deck-listing">
          <div
            className={`deck-cover ${deck.coverPhoto ? "" : "no-cover"}`}
            style={
              deck.coverPhoto
                ? {
                    backgroundImage: `url(/uploads${deck.coverPhoto}?t=${siteInfo.cacheVal})`,
                  }
                : undefined
            }
          />
          <div className="deck-listing-info">
            <Typography className="deck-name">
              {filterProfanity(deck.name || "", user.settings)}
            </Typography>
            {deck.description ? (
              <Typography
                variant="body2"
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  opacity: 0.75,
                  fontStyle: "italic",
                }}
                title={deck.description}
              >
                {filterProfanity(deck.description, user.settings)}
              </Typography>
            ) : null}
            <div className="deck-preview-row">
              <Typography
                variant="body2"
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: 1,
                  marginRight: 8,
                  opacity: 0.85,
                }}
                title={previewText}
              >
                {previewText || <em>(no preview)</em>}
              </Typography>
              <span className="deck-profile-count">
                {wordCount} {wordCount === 1 ? "word" : "words"}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="deck-buttons-wrapper">
        {user.loggedIn && (
          <i
            className={`deck-btn host-deck fa-play-circle fas`}
            onClick={() => {
              setRedirect(`/play/host?wordDeck=${deck.id}`);
            }}
          />
        )}
        {user.loggedIn && props.listType === "Yours" && !deck.isDefault && (
          <i
            className={`deck-btn edit-deck fa-pen-square fas`}
            onClick={() => props.onEdit(deck)}
          />
        )}
        {user.loggedIn && (
          <i
            className={`deck-btn copy-deck fa-copy fas`}
            onClick={() => {
              navigator.clipboard.writeText(deck.id);
              siteInfo.showAlert("Copied deck ID to clipboard", "success");
            }}
          />
        )}
        {user.loggedIn && props.listType === "Yours" && !deck.isDefault && (
          <i
            className={`deck-btn del-deck fa-times-circle fas`}
            onClick={() => props.onDel(deck)}
          />
        )}
      </div>
    </div>
  );
}
