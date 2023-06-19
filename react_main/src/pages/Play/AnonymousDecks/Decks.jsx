import React, { useContext, useEffect, useState } from "react";
import "../../../css/host.css";
import { TopBarLink } from "../Play";
import { useLocation } from "react-router-dom/cjs/react-router-dom";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useErrorAlert } from "../../../components/Alerts";
import { UserContext } from "../../../Contexts";
import axios from "axios";
import { ItemList, filterProfanity } from "../../../components/Basic";
import { camelCase } from "../../../utils";
import { PageNav, SearchBar } from "../../../components/Nav";

export default function AnonymousDeckSelector(props) {
  const [listType, setListType] = useState("featured");
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [searchVal, setSearchVal] = useState("");
  //const [decks, setDecks] = useState([]);
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
    /*
    axios
      .get(
        `/deck/${camelCase(listType)}?&page=${page}&query=${query || ""}`
      )
      .then((res) => {
        setListType(listType);
        setPage(page);
        //setDecks(res.data.decks);
        setPageCount(res.data.pages);
      });
    */
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

  function onEditDeck(deck) {
    history.push(`/deck/create?edit=${deck.id}`);
  }

  function onDelDeck(deck) {
    axios
      .post("/deck/delete", { id: deck.id })
      .then(() => {
        getDeckList(listType, page);
      })
      .catch(errorAlert);
  }

  const hostButtonLabels = [
    "Featured",
    "Popular",
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

  const decks = [{"name": "egg","profiles":[
    {
      "name": "p1",
    },
    {
      "name": "p2"
    }
  ]},
  {"name": "bread","profiles":[
    {
      "name": "c1",
    },
    {
      "name": "c2"
    }
  ]}
]
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
        map={(deck) => (
          <Deck
            deck={deck}
            sel={selDeck}
            listType={listType}
            onSelect={setSelDeck}
            onEdit={onEditDeck}
            onDel={onDelDeck}
            odd={decks.indexOf(deck) % 2 == 1}
            key={deck.id}
          />
        )}
        empty="No decks"
      />
      <PageNav page={page} maxPage={pageCount} onNav={onPageNav} />
    </div>
  );
}

function Deck(props) {
  let deck = props.deck;
  let profiles = deck.profiles.map(p => <DeckProfile profile={p}/>)

  return <>
    <div className="deck-row">
      <div className="deck-name">
        {deck.name}
      </div>
      <div className="deck-profiles">
        {profiles}
      </div>
    </div>
  </>
}

function DeckProfile(props) {
  let profile = props.profile

  return <>
    <div className="deck-profile">
      <div className="profile-name">
        {profile.name}
      </div>
    </div>
  </>
}
