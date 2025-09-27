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

import CustomAppBar from "components/CustomAppBar";
import { NewLoading } from "pages/Welcome/NewLoading";

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

  const links = [
    {
      text: "Play",
      path: "/play",
      end: true,
    },
    {
      text: "Host",
      path: `/play/host`,
      hide: !user.loggedIn,
    },
    {
      text: "Create Setup",
      path: `/play/create`,
      hide: !user.loggedIn,
    },
    {
      text: "Decks",
      path: `/play/decks`,
      hide: !user.loggedIn,
    },
  ];

  useEffect(() => {
    localStorage.setItem("gameType", gameType);

    if (!inLobby && !params.get("edit") && params.get("game") !== gameType)
      navigate(location.pathname + `?game=${gameType}`);
  }, [location.pathname, gameType]);
  if (user.loaded && !user.loggedIn) return <Navigate to="/" />;

  function onFilterGameType(gameType) {
    setGameType(gameType);
  }

  const LobbyBrowser = lazy(() => import("./LobbyBrowser/LobbyBrowser"));
  const CreateSetup = lazy(() => import("./CreateSetup/CreateSetup"));
  const DeckSelector = lazy(() => import("./Decks/DeckSelector"));
  const CreateDecks = lazy(() => import("./Decks/CreateDeck"));
  const HostBrowser = lazy(() => import("./Host/HostBrowser"));

  return (
    <>
      <CustomAppBar links={links} />
      <div className="inner-content play">
        <Suspense fallback={<NewLoading />}>
          <Routes>
            <Route path="/" element={<LobbyBrowser />} />
            <Route path="host" element={<HostBrowser />} />
            <Route path="decks" element={<DeckSelector />} />
            <Route path="create" element={<CreateSetup />} />
            <Route path="createDeck" element={<CreateDecks />} />
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
