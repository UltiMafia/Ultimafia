import React, { useState, useContext, useEffect, Suspense, lazy } from "react";
import {
  Route,
  Routes,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { UserContext } from "../../Contexts";

import "css/play.css";

import { Loading } from "../../components/Loading";

// Route components must be created once, at module scope. Calling lazy() inside
// Play gives every route a new component type on each Play render, so changing
// the lobby query (?lobby=) or the game filter (?game=) unmounted and remounted
// the whole page and re-showed its loading spinner. See the same note in Main.
const LobbyBrowser = lazy(() => import("./LobbyBrowser/LobbyBrowser"));
const CreateSetup = lazy(() => import("./CreateSetup/CreateSetup"));
const DeckSelector = lazy(() => import("./Decks/DeckSelector"));
const CreateDecks = lazy(() => import("./Decks/CreateDeck"));
const WordDeckSelector = lazy(() => import("./WordDecks/WordDeckSelector"));
const CreateWordDeck = lazy(() => import("./WordDecks/CreateWordDeck"));
const HostBrowser = lazy(() => import("./Host/HostBrowser"));

export default function Play(props) {
  const defaultGameType = "Mafia";

  const user = useContext(UserContext);
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const inLobby = location.pathname === "/play";
  const [gameType, setGameType] = useState(
    params.get("game") || localStorage.getItem("gameType") || defaultGameType
  );

  useEffect(() => {
    localStorage.setItem("gameType", gameType);

    if (
      !inLobby &&
      !params.get("edit") &&
      !params.get("copy") &&
      params.get("game") !== gameType
    ) {
      const newParams = new URLSearchParams(location.search);
      newParams.set("game", gameType);
      navigate(location.pathname + "?" + newParams.toString());
    }
  }, [location.pathname, gameType]);
  // Allow logged-out users to access Play page

  function onFilterGameType(gameType) {
    setGameType(gameType);
  }

  return (
    <>
      <div className="inner-content play">
        <Suspense fallback={<Loading small />}>
          <Routes>
            <Route path="/" element={<LobbyBrowser />} />
            <Route path="host" element={<HostBrowser />} />
            <Route path="decks" element={<DeckSelector />} />
            <Route path="create" element={<CreateSetup />} />
            <Route path="createDeck" element={<CreateDecks />} />
            <Route path="wordDecks" element={<WordDeckSelector />} />
            <Route path="createWordDeck" element={<CreateWordDeck />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </div>
    </>
  );
}

export function BotBarLink(props) {
  const active = props.sel.toLowerCase() === props.text.toLowerCase();

  return (
    <div
      className={`top-link ${active ? "active" : ""}`}
      onClick={props.onClick}
    >
      {props.text}
    </div>
  );
}
